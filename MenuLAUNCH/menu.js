/**
 * Homara Menu System - JavaScript Functionality
 * 
 * Handles the three-state sidebar menu behavior:
 * 1. Collapsed (default) - Shows only icons
 * 2. Temporarily expanded (hover) - Shows full menu on hover
 * 3. Pinned expanded (click) - Keeps menu open until clicked again
 * 
 * Features:
 * - Smooth animations and transitions
 * - Search functionality
 * - Dynamic menu item generation
 * - Tooltip management
 * - Event handling for all interactive elements
 */

class HomaraMenu {
    /**
     * Initialize the menu system
     */
    constructor() {
        // DOM element references
        this.sidebar = document.getElementById('sidebar');
        this.menuIcon = document.getElementById('menuIcon');
        this.menuTooltip = document.getElementById('menuTooltip');
        this.menuItems = document.getElementById('menuItems');
        this.bottomMenuItems = document.getElementById('bottomMenuItems');
        this.searchInput = document.getElementById('searchInput');
        this.signupBtn = document.getElementById('signupBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.minimizeBtn = document.getElementById('minimizeBtn');
        this.pullTab = document.getElementById('pullTab');

        // Menu state tracking
        this.isExpanded = false;  // True when menu is pinned open
        this.isHovered = false;   // True when menu is temporarily expanded via hover
        this.isMinimized = false; // True when menu is minimized to thin sliver

        // Detect macOS for performance optimizations
        this.isMacOS = this.detectMacOS();
        
        // Menu configuration with your specified items
        this.menuConfig = [
            {
                text: 'Home',
                icon: 'image.png',
                iconType: 'png',
                action: () => this.handleMenuClick('home')
            },
            {
                text: 'Apply',
                icon: 'applyicon.PNG',
                iconType: 'png',
                action: () => this.handleMenuClick('apply')
            },
            {
                text: 'Build',
                icon: 'build-icon.svg',
                iconType: 'svg',
                action: () => this.handleMenuClick('build')
            },
            {
                text: 'Community Preview',
                icon: 'eye-icon.svg',
                iconType: 'svg',
                action: () => this.handleMenuClick('community-preview')
            },
            {
                text: 'Edit Your Point',
                icon: 'point-icon.svg',
                iconType: 'svg',
                action: () => this.handleMenuClick('edit-point')
            },
            {
                text: 'Point Management',
                icon: 'manage-icon.svg',
                iconType: 'svg',
                action: () => this.handleMenuClick('point-management')
            }
        ];

        // Menu items that appear below Point History section
        this.bottomMenuConfig = [
            {
                text: 'Settings & Help',
                icon: 'settingsicon.PNG',
                iconType: 'png',
                action: () => this.handleMenuClick('settings-help')
            }
        ];
        
        // Initialize the menu system
        this.init();
    }

    /**
     * Detect if the user is on macOS
     * @returns {boolean} - True if macOS is detected
     */
    detectMacOS() {
        return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
               navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    }

    /**
     * Apply macOS-specific optimizations
     */
    applyMacOSOptimizations() {
        if (this.isMacOS) {
            console.log('macOS detected - applying performance optimizations');

            // Add macOS-specific class to body for CSS targeting
            document.body.classList.add('macos');

            // Force hardware acceleration on key elements
            const elementsToOptimize = [
                this.sidebar,
                document.querySelector('.main-content'),
                ...document.querySelectorAll('.menu-item-text'),
                ...document.querySelectorAll('.search-container'),
                ...document.querySelectorAll('.auth-buttons')
            ];

            elementsToOptimize.forEach(element => {
                if (element) {
                    element.style.transform = 'translateZ(0)';
                    element.style.webkitTransform = 'translateZ(0)';
                    element.style.willChange = 'transform, opacity';
                }
            });

            // Use requestAnimationFrame for smoother transitions
            this.useRAFTransitions = true;
        }
    }
    
    /**
     * Initialize all menu functionality
     */
    init() {
        console.log('Initializing Homara Menu System...');

        // Apply macOS-specific optimizations if needed
        this.applyMacOSOptimizations();

        // Generate menu items
        this.generateMenuItems();

        // Attach event listeners
        this.attachEventListeners();

        // Set initial tooltip text
        this.updateTooltipText();

        console.log('Homara Menu System initialized successfully');
    }
    
    /**
     * Generate menu items from configuration
     */
    generateMenuItems() {
        // Clear existing menu items
        this.menuItems.innerHTML = '';
        this.bottomMenuItems.innerHTML = '';

        // Create main menu items
        this.menuConfig.forEach(item => {
            const menuItem = this.createMenuItem(item);
            this.menuItems.appendChild(menuItem);
        });

        // Create bottom menu items (View Controls, Settings & Help)
        this.bottomMenuConfig.forEach(item => {
            const menuItem = this.createMenuItem(item);
            this.bottomMenuItems.appendChild(menuItem);
        });
    }
    
    /**
     * Create a single menu item element
     * @param {Object} item - Menu item configuration
     * @returns {HTMLElement} - Menu item element
     */
    createMenuItem(item) {
        // Create menu item container
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.setAttribute('role', 'button');
        menuItem.setAttribute('tabindex', '0');
        
        // Create icon container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'menu-item-icon';

        // Create icon (SVG or PNG)
        if (item.iconType === 'png') {
            // Create PNG image element
            const icon = document.createElement('img');
            icon.src = `assets/${item.icon}`;
            icon.alt = `${item.text} icon`;
            icon.style.width = '20px';
            icon.style.height = '20px';
            icon.style.objectFit = 'contain';
            iconContainer.appendChild(icon);
        } else {
            // Create SVG icon
            const icon = document.createElement('div');
            icon.innerHTML = this.loadSVGIcon(item.icon);
            iconContainer.appendChild(icon);
        }
        
        // Create text element
        const textElement = document.createElement('span');
        textElement.className = 'menu-item-text';
        textElement.textContent = item.text;
        
        // Assemble menu item
        menuItem.appendChild(iconContainer);
        menuItem.appendChild(textElement);
        
        // Add click event listener
        menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.action();
        });
        
        // Add keyboard support
        menuItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.action();
            }
        });
        
        return menuItem;
    }
    
    /**
     * Load SVG icon content
     * @param {string} iconName - Name of the SVG icon file
     * @returns {string} - SVG content as string
     */
    loadSVGIcon(iconName) {
        // For simplicity, we'll use inline SVG content
        // In a production environment, you might want to load these dynamically
        const icons = {
            'home-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/></svg>',
            'flagship-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/><path d="M12 17L13.09 20.26L19 21L13.09 21.74L12 25L10.91 21.74L5 21L10.91 20.26L12 17Z" fill="currentColor"/></svg>',
            'build-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z" fill="currentColor"/></svg>',
            'eye-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z" fill="currentColor"/></svg>',
            'point-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/><path d="M8 12H16V14H8V12Z" fill="currentColor"/><path d="M8 16H13V18H8V16Z" fill="currentColor"/></svg>',
            'manage-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/><path d="M19 15H23L20.5 17.5L23 20H19L16.5 17.5L19 15Z" fill="currentColor"/><path d="M6.5 17.5L9 15H5L2 17.5L5 20H9L6.5 17.5Z" fill="currentColor"/></svg>',
            'controls-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17V19H9V17H3ZM3 5V7H13V5H3ZM13 21V19H21V17H13V15H11V21H13ZM7 9V11H3V13H7V15H9V9H7ZM21 13V11H11V13H21ZM15 9H17V7H21V5H17V3H15V9Z" fill="currentColor"/></svg>',
            'settings-icon.svg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12S19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.64 2.57 9.6 2.81L9.24 5.35C8.65 5.59 8.12 5.92 7.62 6.29L5.23 5.33C5.01 5.25 4.76 5.33 4.64 5.55L2.72 8.87C2.61 9.08 2.66 9.34 2.84 9.48L4.86 11.06C4.82 11.36 4.8 11.69 4.8 12S4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.64 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.4 21.19L14.76 18.65C15.35 18.41 15.88 18.09 16.38 17.71L18.77 18.67C18.99 18.75 19.24 18.67 19.36 18.45L21.28 15.13C21.39 14.93 21.34 14.66 21.16 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12S10.02 8.4 12 8.4S15.6 10.02 15.6 12S13.98 15.6 12 15.6Z" fill="currentColor"/></svg>'
        };
        
        return icons[iconName] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>';
    }
    
    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Hamburger menu icon click handler - toggles pinned state
        this.menuIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePinnedState();
        });
        
        // Sidebar hover effects - optimized for macOS
        this.sidebar.addEventListener('mouseenter', (e) => {
            // Only expand if not already pinned, not minimized, and not hovering over menu icon
            if (!this.isExpanded && !this.isMinimized && !e.target.closest('.menu-icon')) {
                this.isHovered = true;
                this.updateTooltipText();

                // Force immediate layout calculation on macOS for smoother animation
                if (this.isMacOS) {
                    this.sidebar.offsetWidth; // Trigger reflow
                }

                // Update profile icon visibility
                if (window.homaraAuth && window.homaraAuth.updateProfileIconVisibility) {
                    window.homaraAuth.updateProfileIconVisibility();
                }
            }
        });

        this.sidebar.addEventListener('mouseleave', (e) => {
            // Only collapse if not pinned and not minimized
            if (!this.isExpanded && !this.isMinimized) {
                this.isHovered = false;
                this.updateTooltipText();

                // Force immediate layout calculation on macOS for smoother animation
                if (this.isMacOS) {
                    this.sidebar.offsetWidth; // Trigger reflow
                }

                // Update profile icon visibility
                if (window.homaraAuth && window.homaraAuth.updateProfileIconVisibility) {
                    window.homaraAuth.updateProfileIconVisibility();
                }
            }
        });
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSearchSubmit(e.target.value);
            } else if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
        
        // Auth button handlers
        this.signupBtn.addEventListener('click', () => {
            this.handleAuthClick('signup');
        });
        
        this.loginBtn.addEventListener('click', () => {
            this.handleAuthClick('login');
        });
        
        // Point squares click handlers
        const pointSquares = document.querySelectorAll('.point-square');
        pointSquares.forEach((square, index) => {
            square.addEventListener('click', () => {
                this.handlePointSquareClick(index);
            });
        });

        // Minimize button handler
        this.minimizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.minimizeMenu();
        });

        // Pull tab handler
        this.pullTab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.restoreMenu();
        });
        
        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            // Toggle menu with Ctrl+M or Cmd+M
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.togglePinnedState();
            }
            
            // Focus search with Ctrl+F or Cmd+F when menu is open
            if ((e.ctrlKey || e.metaKey) && e.key === 'f' && (this.isExpanded || this.isHovered)) {
                e.preventDefault();
                this.searchInput.focus();
            }
        });
    }
    
    /**
     * Toggle the pinned state of the menu
     */
    togglePinnedState() {
        // Don't toggle if minimized
        if (this.isMinimized) {
            return;
        }

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            this.sidebar.classList.add('expanded');
            console.log('Menu pinned open');
        } else {
            this.sidebar.classList.remove('expanded');
            console.log('Menu collapsed');
        }

        this.updateTooltipText();

        // Update profile icon visibility
        if (window.homaraAuth && window.homaraAuth.updateProfileIconVisibility) {
            window.homaraAuth.updateProfileIconVisibility();
        }
    }

    /**
     * Minimize the menu to a thin sliver
     */
    minimizeMenu() {
        this.isMinimized = true;
        this.isExpanded = false;
        this.isHovered = false;

        this.sidebar.classList.remove('expanded');
        this.sidebar.classList.add('minimized');

        console.log('Menu minimized');
        this.updateTooltipText();
    }

    /**
     * Restore the menu from minimized state
     */
    restoreMenu() {
        this.isMinimized = false;
        this.sidebar.classList.remove('minimized');

        console.log('Menu restored');
        this.updateTooltipText();
    }
    
    /**
     * Update tooltip text based on current menu state
     */
    updateTooltipText() {
        if (this.isMinimized) {
            // State 4: Minimized - hide tooltip
            this.menuTooltip.textContent = '';
        } else if (this.isExpanded) {
            // State 3: Pinned open
            this.menuTooltip.textContent = 'Collapse menu';
        } else if (this.isHovered || this.sidebar.classList.contains('expanded')) {
            // State 2: Temporarily expanded
            this.menuTooltip.textContent = 'Keep menu expanded';
        } else {
            // State 1: Collapsed
            this.menuTooltip.textContent = 'Expand menu';
        }
    }
    
    /**
     * Handle menu item clicks
     * @param {string} action - The action identifier
     */
    handleMenuClick(action) {
        console.log(`Menu item clicked: ${action}`);

        // Handle navigation actions
        if (action === 'home') {
            // Navigate back to the main home page
            window.location.href = '../index.html';
            return;
        }

        // For other actions, show placeholder alerts
        const actionNames = {
            'home': 'Home',
            'apply': 'Apply',
            'build': 'Build',
            'community-preview': 'Community Preview',
            'edit-point': 'Edit Your Point',
            'point-management': 'Point Management',
            'view-controls': 'View Controls',
            'settings-help': 'Settings & Help'
        };

        alert(`Navigating to: ${actionNames[action] || action}`);
    }
    
    /**
     * Handle search input
     * @param {string} query - Search query
     */
    handleSearch(query) {
        console.log(`Search query: ${query}`);
        
        // Implement search functionality here
        // For now, we'll just filter menu items
        if (query.trim() === '') {
            this.showAllMenuItems();
        } else {
            this.filterMenuItems(query);
        }
    }
    
    /**
     * Handle search submission
     * @param {string} query - Search query
     */
    handleSearchSubmit(query) {
        console.log(`Search submitted: ${query}`);
        
        if (query.trim() !== '') {
            alert(`Searching for: ${query}`);
        }
    }
    
    /**
     * Clear search input and show all menu items
     */
    clearSearch() {
        this.searchInput.value = '';
        this.showAllMenuItems();
        console.log('Search cleared');
    }
    
    /**
     * Filter menu items based on search query
     * @param {string} query - Search query
     */
    filterMenuItems(query) {
        const mainMenuItems = this.menuItems.querySelectorAll('.menu-item');
        const bottomMenuItems = this.bottomMenuItems.querySelectorAll('.menu-item');
        const lowerQuery = query.toLowerCase();

        // Filter main menu items
        mainMenuItems.forEach(item => {
            const text = item.querySelector('.menu-item-text').textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        // Filter bottom menu items
        bottomMenuItems.forEach(item => {
            const text = item.querySelector('.menu-item-text').textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Show all menu items
     */
    showAllMenuItems() {
        const mainMenuItems = this.menuItems.querySelectorAll('.menu-item');
        const bottomMenuItems = this.bottomMenuItems.querySelectorAll('.menu-item');

        // Show all main menu items
        mainMenuItems.forEach(item => {
            item.style.display = 'flex';
        });

        // Show all bottom menu items
        bottomMenuItems.forEach(item => {
            item.style.display = 'flex';
        });
    }
    
    /**
     * Handle authentication button clicks
     * @param {string} type - 'signup' or 'login'
     */
    handleAuthClick(type) {
        console.log(`Auth button clicked: ${type}`);

        // Wait for auth system to be available
        if (window.homaraAuth) {
            if (type === 'signup') {
                window.homaraAuth.showSignupModal();
            } else if (type === 'login') {
                window.homaraAuth.showLoginModal();
            }
        } else {
            console.warn('Authentication system not yet initialized');
            // Fallback - try again in a moment
            setTimeout(() => {
                if (window.homaraAuth) {
                    if (type === 'signup') {
                        window.homaraAuth.showSignupModal();
                    } else if (type === 'login') {
                        window.homaraAuth.showLoginModal();
                    }
                } else {
                    alert('Authentication system is loading. Please try again in a moment.');
                }
            }, 500);
        }
    }
    
    /**
     * Handle point square clicks
     * @param {number} index - Index of the clicked square
     */
    handlePointSquareClick(index) {
        console.log(`Point square clicked: ${index}`);
        alert(`Point history item ${index + 1} clicked`);
    }
}

/**
 * Initialize the menu system when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the menu system
    window.homaraMenu = new HomaraMenu();
    
    console.log('Homara Menu System ready!');
});
