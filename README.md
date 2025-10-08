# Homara Website

A simple static website for the Homara creative community platform.

## 🚀 Running the Website

Since this is now a static website, you have several options:

### Option 1: Simple HTTP Server (Recommended)
```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx http-server

# Using PHP (if installed)
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: Live Server Extension
If using VS Code, install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

### Option 3: Direct File Opening
You can open `index.html` directly in your browser, but some features (like fonts) may not work due to CORS restrictions.

## 📁 Project Structure

```
HomaraSite/
├── index.html          # Main HTML file
├── src/
│   ├── index.css       # All styles
│   └── main.js         # JavaScript (Three.js animations)
├── assets/
│   ├── fonts/          # Custom fonts
│   └── images/         # Images and logos
└── MenuLAUNCH/         # Separate menu interface
```

## 🎨 Features

- **Animated particle background** using Three.js
- **Light/Dark mode toggle** with smooth transitions
- **Custom fonts** (BraunLinear, Speran1315, NDOT47)
- **Scroll-triggered animations** for content sections
- **Responsive design** with utility-first CSS
- **No build tools required** - pure HTML/CSS/JS

## 🔧 Technical Details

- **Three.js**: Loaded via CDN for 3D particle animations
- **Custom CSS**: Utility-first approach similar to Tailwind
- **Vanilla JavaScript**: No frameworks or build tools
- **Static hosting ready**: Can be deployed to any static host

## 🌐 Deployment

This site can be deployed to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Surge.sh
- Any web server

Just upload all files and point to `index.html` as the entry point.
