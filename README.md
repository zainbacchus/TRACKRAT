# TRACKRAT

A minimal, responsive single-page web app for the TRACKRAT brand.

## Features

- **Responsive Design**: Adapts seamlessly to all device sizes and orientations
- **Dynamic Aspect Ratio**: Automatically adjusts visual presentation based on viewport dimensions
- **Lightweight**: Single 20 KB HTML file with no external dependencies
- **Fast Loading**: Inline SVG and styles for instant rendering
- **Modern Stack**: HTML5, CSS3, SVG, and vanilla JavaScript

## Technology Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Document structure and semantic markup |
| CSS3 | Responsive styling with viewport units |
| SVG | Vector graphics for scalable brand visual |
| JavaScript | Dynamic aspect ratio management |
| Vercel | Static hosting and global CDN distribution |

## Project Structure

```
TRACKRAT/
├── index.html              # Main application file
├── vercel.json            # Deployment configuration
├── favicon.ico            # Browser icon (32-bit)
├── favicon-16x16.png      # Browser icon (16x16 PNG)
├── claude.md              # AI assistant documentation
└── README.md              # This file
```

## Quick Start

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TRACKRAT
   ```

2. Open in browser:
   ```bash
   # Simply open index.html in your browser
   open index.html
   # or use a local server
   python -m http.server 8000
   ```

3. Visit `http://localhost:8000` in your browser

### Deployment

The project is configured for automatic deployment on Vercel:

1. Push changes to the repository
2. Vercel automatically builds and deploys
3. Changes are live on the CDN within seconds

**Manual Deployment:**
- Upload `index.html` and favicon files to any static hosting service
- No build process required

## How It Works

### Responsive Behavior

The application uses JavaScript to detect viewport aspect ratio and adjust the SVG rendering:

- **Tall Screens** (aspect ratio < 16:9): Shows entire image with letterboxing
- **Wide Screens** (aspect ratio >= 16:9): Fills screen, may crop edges

### Browser Compatibility

Supports all modern browsers:
- Chrome/Edge 90+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Development

### Making Changes

All code is contained in `index.html`:

1. **Update Content**: Edit the SVG section (starting ~line 50)
2. **Modify Styles**: Edit the `<style>` section in the `<head>`
3. **Change Behavior**: Edit the JavaScript at the bottom of the file

### Testing

Test responsive behavior across different viewports:

```bash
# Desktop: Resize browser window to various sizes
# Mobile: Use browser DevTools device emulation
# Tablet: Test both portrait and landscape orientations
```

### Brand Colors

Primary brand color: `#FF4D1F` (orange)

## Performance

- **Load Time**: < 100ms
- **File Size**: ~20 KB
- **External Requests**: 0
- **JavaScript Size**: < 1 KB

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across different devices and browsers
5. Submit a pull request

