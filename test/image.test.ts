import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import mysongCompress from '../src/index';
import { setupTestFiles, getFileSize } from './helpers';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AstroIntegrationLogger } from 'astro';
import sharp from 'sharp';

describe('Image Compression', async () => {
  let tempDir: string;
  const CACHE_DIR = 'compress-image-test';

  // Create test images with more complex data to ensure compression is possible
  const TEST_IMAGES = {
    png: {
      path: 'test.png',
      content: await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
      .composite([{
        input: Buffer.from(new Array(1000 * 1000 * 4).fill(128)), // Add noise
        raw: {
          width: 1000,
          height: 1000,
          channels: 4
        },
        blend: 'overlay'
      }])
      .png({ compressionLevel: 1 }) // Start with low compression
      .toBuffer()
    },
    jpeg: {
      path: 'test.jpg',
      content: await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 0, g: 0, b: 255 }
        }
      })
      .composite([{
        input: Buffer.from(new Array(1000 * 1000 * 3).fill(128)), // Add noise
        raw: {
          width: 1000,
          height: 1000,
          channels: 3
        },
        blend: 'overlay'
      }])
      .jpeg({ quality: 100 }) // Start with high quality
      .toBuffer()
    },
    webp: {
      path: 'test.webp',
      content: await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 4,
          background: { r: 0, g: 255, b: 0, alpha: 1 }
        }
      })
      .composite([{
        input: Buffer.from(new Array(1000 * 1000 * 4).fill(128)), // Add noise
        raw: {
          width: 1000,
          height: 1000,
          channels: 4
        },
        blend: 'overlay'
      }])
      .webp({ quality: 100, effort: 0 }) // Start with high quality, low effort
      .toBuffer()
    }
  };

  // Create mock logger
  const mockLogger: AstroIntegrationLogger = {
    info: () => {},
    debug: () => {},
    warn: () => {},
    error: console.error,
    fork: () => mockLogger,
    label: 'mysong-compress',
    options: {
      level: 'info'
    }
  };

  beforeEach(async () => {
    // Create unique temp directory for this test suite
    tempDir = path.join(__dirname, 'fixtures', 'temp-image-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    // Set up test files
    await setupTestFiles(tempDir, TEST_IMAGES);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const mockBuildData = {
    pages: [{ pathname: '/index.html' }],
    routes: [],
    assets: new Map<string, URL[]>(),
  };

  async function runCompression(compress: ReturnType<typeof mysongCompress>) {
    // First run config hook
    await compress.hooks['astro:config:done']?.({
      config: {
        root: new URL(`file://${tempDir}`),
        srcDir: new URL(`file://${tempDir}`),
        outDir: new URL(`file://${tempDir}/dist`),
        publicDir: new URL(`file://${tempDir}/public`),
        base: '/',
        integrations: [],
        trailingSlash: 'never',
        server: { host: true, port: 3000, open: false },
        redirects: {},
        adapter: undefined,
        image: {
          service: { entrypoint: 'astro/assets/services/sharp', config: {} },
          domains: [],
          remotePatterns: []
        },
        markdown: {
          syntaxHighlight: 'shiki',
          shikiConfig: { langs: [], theme: 'github-dark', wrap: false },
          remarkPlugins: [],
          rehypePlugins: [],
          remarkRehype: {},
          gfm: true,
          smartypants: true,
        },
        vite: {},
        compressHTML: true,
        build: { 
          format: 'directory',
          client: new URL(`file://${tempDir}/dist/client`),
          server: new URL(`file://${tempDir}/dist/server`),
          assets: 'assets',
          serverEntry: 'entry.mjs',
          redirects: true,
          inlineStylesheets: 'auto',
          concurrency: 5
        },
        site: 'http://localhost:3000',
        style: { postcss: { options: {}, plugins: [] } },
        scopedStyleStrategy: 'attribute'
      },
      logger: mockLogger,
      updateConfig: (config) => config,
    });

    // Then run build hook
    await compress.hooks['astro:build:done']?.({
      ...mockBuildData,
      dir: new URL(`file://${tempDir}`),
      logger: mockLogger,
    });
  }

  test('should compress PNG images', async () => {
    const filePath = path.join(tempDir, TEST_IMAGES.png.path);
    const originalSize = await getFileSize(filePath);
    
    const compress = mysongCompress({
      png: {
        compressionLevel: 9,
        palette: true
      }
    });
    
    await runCompression(compress);

    const compressedSize = await getFileSize(filePath);
    
    // Verify compression
    expect(compressedSize).toBeLessThan(originalSize);
    
    // Verify image is still valid
    const metadata = await sharp(filePath).metadata();
    expect(metadata.width).toBe(1000);
    expect(metadata.height).toBe(1000);
    expect(metadata.format).toBe('png');
  });

  test('should compress JPEG images', async () => {
    const filePath = path.join(tempDir, TEST_IMAGES.jpeg.path);
    const originalSize = await getFileSize(filePath);
    
    const compress = mysongCompress({
      jpeg: {
        mozjpeg: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true
      }
    });
    
    await runCompression(compress);

    const compressedSize = await getFileSize(filePath);
    
    // Verify compression
    expect(compressedSize).toBeLessThan(originalSize);
    
    // Verify image is still valid
    const metadata = await sharp(filePath).metadata();
    expect(metadata.width).toBe(1000);
    expect(metadata.height).toBe(1000);
    expect(metadata.format).toBe('jpeg');
  });

  test('should compress WebP images', async () => {
    const filePath = path.join(tempDir, TEST_IMAGES.webp.path);
    const originalSize = await getFileSize(filePath);
    
    const compress = mysongCompress({
      webp: {
        effort: 6
      }
    });
    
    await runCompression(compress);

    const compressedSize = await getFileSize(filePath);
    
    // Verify compression
    expect(compressedSize).toBeLessThan(originalSize);
    
    // Verify image is still valid
    const metadata = await sharp(filePath).metadata();
    expect(metadata.width).toBe(1000);
    expect(metadata.height).toBe(1000);
    expect(metadata.format).toBe('webp');
  });

  test('should handle corrupt images gracefully', async () => {
    const corruptImage = {
      path: 'corrupt.png',
      content: Buffer.from('not a real image')
    };

    await setupTestFiles(tempDir, { corrupt: corruptImage });
    const filePath = path.join(tempDir, corruptImage.path);
    const originalContent = await fs.readFile(filePath);
    
    const compress = mysongCompress();
    
    // Should not throw error
    await runCompression(compress);

    // Original file should still exist and be unchanged
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
    
    const finalContent = await fs.readFile(filePath);
    expect(Buffer.compare(originalContent, finalContent)).toBe(0);
  });
}); 