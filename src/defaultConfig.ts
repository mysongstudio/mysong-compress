import type { CompressionOptions } from "./types";

export const defaultCacheDir = 'node_modules/.astro/.mysong-compress';

export const defaultConfig: CompressionOptions = {
    cache: {
        enabled: true,
        cacheDir: defaultCacheDir
    },
    png: {
        compressionLevel: 9.0,
        palette: true
    },
    jpeg: {
        mozjpeg: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true
    },
    webp: {
        effort: 6.0
    },
    avif: {
        effort: 9.0,
        lossless: true
    },
    heif: {
        effort: 9.0,
        lossless: true
    },
    html: {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        continueOnParseError: true
    },
    js: {
        compress: true,
        mangle: true
    },
    svg: {
        multipass: true,
    },
    css: {}
};