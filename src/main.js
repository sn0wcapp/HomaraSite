import * as THREE from 'three';

// Initialize the particle network background
function initBackgroundCanvas() {
  const canvas = document.getElementById('background-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Create particles
  const particleCount = 100;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  // Create layered depth distribution
  const layers = 5; // Number of depth layers
  const particlesPerLayer = Math.floor(particleCount / layers);

  for (let i = 0; i < particleCount; i++) {
    const layerIndex = Math.floor(i / particlesPerLayer);
    const layerZ = (layerIndex / (layers - 1)) * 16 - 8; // Spread from -8 to +8

    // X and Y positions - more concentrated in center layers
    const layerSpread = 18 - (Math.abs(layerIndex - 2) * 2); // Varies from 14 to 18
    positions[i * 3] = (Math.random() - 0.5) * layerSpread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * layerSpread;

    // Z position - fixed to layer with small random variation
    positions[i * 3 + 2] = layerZ + (Math.random() - 0.5) * 2;

    // Slower movement for background layers, faster for foreground
    const depthFactor = 0.5 + (layerIndex / (layers - 1)) * 0.5; // 0.5 to 1.0
    velocities.push({
      x: (Math.random() - 0.5) * 0.015 * depthFactor,
      y: (Math.random() - 0.5) * 0.015 * depthFactor,
      z: (Math.random() - 0.5) * 0.005 // Minimal Z movement to maintain layers
    });
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x808080,
    size: 3,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: false
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);

  // Create connections between particles
  const lineGeometry = new THREE.BufferGeometry();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x606060,
    transparent: true,
    opacity: 0.5,
    linewidth: 10
  });

  camera.position.z = 10;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update particle positions
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;

      // Wrap around screen edges with layer-aware boundaries
      const layerIndex = Math.floor(i / Math.floor(particleCount / 5));
      const layerSpread = 18 - (Math.abs(layerIndex - 2) * 2);
      const boundary = layerSpread / 2;

      if (positions[i * 3] > boundary) positions[i * 3] = -boundary;
      if (positions[i * 3] < -boundary) positions[i * 3] = boundary;
      if (positions[i * 3 + 1] > boundary) positions[i * 3 + 1] = -boundary;
      if (positions[i * 3 + 1] < -boundary) positions[i * 3 + 1] = boundary;

      // Keep Z within layer bounds
      const targetLayerZ = (layerIndex / 4) * 16 - 8;
      if (Math.abs(positions[i * 3 + 2] - targetLayerZ) > 2) {
        positions[i * 3 + 2] = targetLayerZ + (Math.random() - 0.5) * 2;
      }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Create dynamic connections with depth-aware logic
    const linePositions = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Adjust connection distance based on depth difference
        const depthDiff = Math.abs(dz);
        const connectionThreshold = depthDiff < 4 ? 6 : 4; // Closer connections within layers

        if (distance < connectionThreshold) {
          linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        }
      }
    }

    // Update line geometry
    scene.remove(scene.getObjectByName('connections'));
    if (linePositions.length > 0) {
      const newLineGeometry = new THREE.BufferGeometry();
      newLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const connections = new THREE.LineSegments(newLineGeometry, lineMaterial);
      connections.name = 'connections';
      scene.add(connections);
    }

    renderer.render(scene, camera);
  }

  // Handle window resize
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', handleResize);
  animate();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initBackgroundCanvas();
});
