# Claude.md - TRACKRAT Project Guide

This document provides context about the TRACKRAT project for AI assistants like Claude.

## Project Overview

TRACKRAT is a single-page web application that serves as a brand showcase website. It features a responsive, full-screen SVG-based design with dynamic aspect ratio handling.

## Architecture

**Type:** Static Single-Page Application (SPA)
**Deployment:** Vercel (serverless static hosting)
**Size:** ~20 KB main file (extremely lightweight)

## File Structure

```
TRACKRAT/
├── index.html              # Main application (all-in-one: HTML, CSS, JS, SVG)
├── vercel.json            # Vercel deployment configuration
├── favicon.ico            # 32-bit favicon
├── favicon-16x16.png      # 16x16 PNG icon
├── claude.md              # This file - AI assistant guide
└── README.md              # User-facing documentation
```

## Technology Stack

- **HTML5:** Semantic markup with inline styles and scripts
- **CSS3:** Responsive design using viewport units (100dvh), flexbox patterns
- **SVG:** Inline vector graphics for the main visual (1920x1080 base resolution)
- **Vanilla JavaScript:** ES6 for dynamic aspect ratio management
- **Vercel:** Static hosting with CDN distribution

## Key Features

1. **Responsive Full-Screen Design**
   - No scrollbars, fills entire viewport
   - Adaptive aspect ratio handling for all device types
   - Supports both portrait and landscape orientations

2. **SVG-Based Visual**
   - Self-contained inline SVG (no external dependencies)
   - Dynamic scaling with viewport coverage
   - Aspect ratio detection (< 16:9 uses contain, >= 16:9 uses cover)

3. **Minimal Dependencies**
   - Zero external resources
   - Single HTML file contains everything
   - No build process required

## Development Guidelines

### Making Changes

1. **HTML/CSS/JS Changes:**
   - Edit `index.html` directly
   - Test responsive behavior across different viewport sizes
   - Verify SVG rendering on mobile and desktop

2. **SVG Modifications:**
   - SVG is inline in `index.html` starting around line ~50
   - Base resolution: 1920x1080 (16:9 aspect ratio)
   - Uses `preserveAspectRatio` attribute for scaling control

3. **Deployment:**
   - Push changes to the repository
   - Vercel automatically deploys from git
   - Configuration in `vercel.json` handles routing

### Testing Checklist

- [ ] Test on mobile (portrait and landscape)
- [ ] Test on tablet
- [ ] Test on desktop (various window sizes)
- [ ] Verify aspect ratio handling (< 16:9 and >= 16:9)
- [ ] Check favicon rendering
- [ ] Validate HTML/CSS/JS syntax

## Code Patterns

### Aspect Ratio Handler (JavaScript)

```javascript
(function() {
    function updateAspectRatio() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const svg = document.querySelector('svg');
        if (svg) {
            svg.setAttribute('preserveAspectRatio',
                aspectRatio < 1.777 ? 'xMidYMid meet' : 'xMidYMid slice'
            );
        }
    }
    // Event listeners...
})();
```

**Logic:**
- Calculates viewport aspect ratio (width/height)
- For tall devices (< 16:9): uses `meet` mode (contain - shows entire image)
- For wide devices (>= 16:9): uses `slice` mode (cover - fills screen, may crop)

### Vercel Configuration

```json
{
  "version": 2,
  "builds": [{"src": "**", "use": "@vercel/static"}],
  "routes": [
    {"src": "/favicon.ico", "dest": "/favicon.ico"},
    {"src": "/(.*)", "dest": "/index.html"}
  ]
}
```

**Routes:**
1. Direct pass-through for favicons
2. Fallback to index.html for all other requests (SPA behavior)

## Common Tasks

### Update Brand Colors

The orange brand color is `#FF4D1F`. To change:
1. Update SVG fill/stroke attributes
2. Update CSS background color
3. Keep consistent across all elements

### Modify Text Content

SVG text is in the inline SVG section of `index.html`:
- Look for `<text>` elements
- Consider font size, positioning, and alignment
- Test rendering after changes

### Change Layout

CSS styling is in the `<style>` section:
- Body: full-screen positioning, zero margins
- SVG container: viewport-based sizing (100vw, 100dvh)
- Consider mobile-first responsive design

## Deployment

**Vercel Deployment:**
- Automatic on git push
- No build step required (static files)
- Global CDN distribution
- HTTPS enabled by default

**Manual Deployment:**
- Can host on any static file server
- No server-side processing needed
- Single file (index.html) can run standalone

## Browser Compatibility

**Required Features:**
- SVG support
- ES6 JavaScript (arrow functions, const/let)
- CSS viewport units (dvh, vw)
- Modern event listeners

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

**Metrics:**
- Load time: < 100ms (single 20 KB file)
- Rendering: Instant (inline content, no external requests)
- JavaScript: Minimal (< 1 KB)
- Lighthouse score potential: 95+

## Maintenance Notes

- No dependencies to update (no package.json)
- No security vulnerabilities (static content only)
- Git history shows regular updates to index.html
- Keep favicons up-to-date with brand changes

## AI Assistant Tips

When helping with this project:
1. All functionality is in `index.html` - read this file first
2. This is a presentation/marketing site, not an application
3. Preserve the responsive behavior when making changes
4. Test suggestions across different viewport sizes
5. Keep the minimal, self-contained nature of the project
6. Respect the brand identity (colors, typography, layout)

## Resources

- **Repository:** zainbacchus/TRACKRAT
- **Branch:** claude/add-documentation-011CUYxjrH4PbU6YayHiddke
- **Recent Activity:** Regular updates to index.html
- **Main Branch:** (check git for current main branch name)
