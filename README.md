# mysong-compress

A powerful compression integration for static assets in Astro. This package automatically optimizes and compresses various file types including images, HTML, JavaScript, CSS, and SVG files during the build process.

## Features

- 🖼️ Image optimization (PNG, JPEG, WebP, AVIF, HEIF)
- 📄 HTML minification
- 🔧 JavaScript/TypeScript minification
- 🎨 CSS/SCSS/SASS/LESS minification
- 📐 SVG optimization
- 💾 Caching system for faster builds
- ⚙️ Highly configurable compression settings

## Installation 

```bash
bash
npm install mysong-compress
```

## Usage

Add the integration to your `astro.config.mjs`:

```js
import mysongCompress from 'mysong-compress';

import { defineConfig } from 'astro';
import mysongCompress from 'mysong-compress';

export default defineConfig({
integrations: [
mysongCompress({
// optional configuration
})
]
});
```
	
## Configuration

You can customize the compression settings for different file types. Here's an example with all available options:

```js
mysongCompress({
    // PNG optimization options
    png: {
        compressionLevel: 9, // 0-9
        palette: true
    },
    // JPEG optimization options
    jpeg: {
        mozjpeg: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true
    },
    // WebP options
    webp: {
        effort: 6 // 0-6
    },
    // AVIF options
    avif: {
        effort: 9, // 0-9
        lossless: true
    },
    // HEIF options
    heif: {
        effort: 9, // 0-9
        lossless: true
    },
    // HTML minification options
    html: {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
    },
    // JavaScript minification options
    js: {
        compress: true,
        mangle: true
    },
    // SVG optimization options
    svg: {
        multipass: true
    }
})
```	

## Default Configuration

If no configuration is provided, the integration will use optimal default settings for each file type. You can override specific options while keeping the defaults for others.

## Caching

The integration includes a caching system that stores compressed versions of files to speed up subsequent builds. The cache is automatically invalidated when:

- Source files change
- Compression settings change
- Cache version changes

## File Types Supported

- Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.tiff`, `.avif`, `.heif`
- HTML: `.html`, `.htm`
- JavaScript: `.js`, `.ts`
- Stylesheets: `.css`, `.scss`, `.sass`, `.less`
- Vector Graphics: `.svg`

## License

ISC

## Author

Wladi Mitzel <mitzel@tawadi.de>

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you find a bug or want to request a new feature, please open an issue on GitHub.