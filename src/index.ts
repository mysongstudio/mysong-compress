import type { AstroIntegration, AstroConfig, AstroIntegrationLogger } from 'astro';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { minify } from 'html-minifier-terser';
import { minify as terserMinify } from 'terser';
import { optimize } from 'svgo';
import * as csso from 'csso';
import { CompressionCacheManagerImpl } from './CompressionCache.js';
import { createHash } from 'crypto';



export default function mysongCompress(): AstroIntegration {

    let config: AstroConfig;
    let candidates: string[] = [];
    let originalSizeTotal = 0;
    let newSizeTotal = 0;
    let processedFiles = 0;
    let skippedFiles = 0;  
    let cacheHits = 0;
    let cacheManager: CompressionCacheManagerImpl;

    async function traverseDirectory(directory: URL, logger: AstroIntegrationLogger) {
        const files = fs.readdirSync(directory.pathname, { withFileTypes: true });
        for (const file of files) {
            if (file.isDirectory()) {
                await traverseDirectory(new URL(path.join(directory.href, file.name)), logger);
            }
            else {
                const filePath = path.join(directory.pathname, file.name);
                logger.debug(filePath);
                candidates.push(filePath);
            }
        }
    }

    async function processFile(filePath: string, logger: AstroIntegrationLogger): Promise<{ processed: boolean, originalSize: number, newSize: number, reason: string }> {
        logger.debug("Processing " + filePath);
        
        const originalSize = fs.statSync(filePath).size;
        let newSize = 0;
        let processed = false;
        let reason = '';

        if (/\.(jpe?g|png|webp|tiff?|avif|heif)$/i.test(filePath)) {
            let pipeline = sharp(filePath);
            const format = (await pipeline.metadata()).format;
            logger.debug("Format: " + format);
            switch (format) {
                case "png":
                    pipeline = pipeline.png({ compressionLevel: 9.0, palette: true });
                    break;
                case "jpeg":
                    pipeline = pipeline.jpeg({ mozjpeg: true, trellisQuantisation: true, overshootDeringing: true, optimizeScans: true, });
                    break;
                case "webp":
                    pipeline = pipeline.webp({ effort: 6.0 });
                    break;
                case "avif":
                    pipeline = pipeline.avif({  effort: 9.0, lossless: true });
                    break;
                case "heif":
                    pipeline = pipeline.heif({ effort: 9.0, lossless: true });
                    break;
                default:
                    reason = "unknown format";
                    break;
            }
            const compressedFile = await pipeline.toBuffer();
            newSize = compressedFile.length;
            if (newSize < originalSize) {
                fs.writeFileSync(filePath, compressedFile);
                originalSizeTotal += originalSize;
                newSizeTotal += newSize;
                processed = true;
            } else {
                reason = "compressed size is greater than original size";
            }
        } else if (/\.(html|htm)$/i.test(filePath)) {
            const htmlContent = fs.readFileSync(filePath, 'utf-8');
            
            const minifiedHtml = await minify(htmlContent, {
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
            });

            if (minifiedHtml.length < originalSize) {   
                fs.writeFileSync(filePath, minifiedHtml);
                newSize = fs.statSync(filePath).size;
                processed = true;
                originalSizeTotal += originalSize;
                newSizeTotal += newSize;
            } else {
                reason = "minified size is greater than original size";
            }
        } else if (/\.(js|ts)$/i.test(filePath)) {
            const jsContent = fs.readFileSync(filePath, 'utf-8');

            const minifiedJs = await terserMinify(jsContent, {
                compress: true,
                mangle: true,
            });

            if (minifiedJs.code) {
                if (minifiedJs.code.length < originalSize) {    
                    fs.writeFileSync(filePath, minifiedJs.code);
                    const newSize = fs.statSync(filePath).size;
                    originalSizeTotal += originalSize;
                    newSizeTotal += newSize;
                    processed = true;
                } else {
                    reason = "minified size is greater than original size";
                }
            } else {
                logger.error(`Failed to minify ${filePath}`);
            }
        } else if (/\.(svg)$/i.test(filePath)) {
            const svgContent = fs.readFileSync(filePath, 'utf-8');

            const optimizedSvg = optimize(svgContent, {
                path: filePath,
                multipass: true,
            });

            if (optimizedSvg.data) {
                if (optimizedSvg.data.length < originalSize) {
                    fs.writeFileSync(filePath, optimizedSvg.data);
                    const newSize = fs.statSync(filePath).size;
                    originalSizeTotal += originalSize;
                    newSizeTotal += newSize;
                    processed = true;
                } else {
                    reason = "optimized size is greater than original size";
                }
            } else {
                logger.error(`Failed to optimize ${filePath}`);
            }
        } else if (/\.(css|scss|sass|less)$/i.test(filePath)) {
            const originalSize = fs.statSync(filePath).size;
            const cssContent = fs.readFileSync(filePath, 'utf-8');

            const minifiedCss = csso.minify(cssContent).css;

            if (minifiedCss) {
                if (minifiedCss.length < originalSize) {
                    fs.writeFileSync(filePath, minifiedCss);
                    newSize = fs.statSync(filePath).size;
                    originalSizeTotal += originalSize;
                    newSizeTotal += newSize;
                    processed = true;
                } else {
                    reason = "minified size is greater than original size";
                }
            } else {
                logger.error(`Failed to minify ${filePath}`);
            }
        } else {
            logger.info("skipping " + filePath);
        }

        if (processed) {
            logger.info(`Processed ${filePath} - Original size: ${originalSize} bytes, New size: ${newSize} bytes`);
        }   else {
            logger.info(`Skipping ${filePath} - ${reason}`);
        }

        return { processed, originalSize, newSize, reason };
    }

    
    return {
        name: 'mysong-compress',
        hooks: {
            'astro:config:done': async ({config: cfg, logger}) => {
                logger.info('mysong-compress started');
                config = cfg;

                cacheManager = new CompressionCacheManagerImpl(path.join(cfg.root.pathname, '.astro'), logger);
                await cacheManager.initialize();

                logger.info(JSON.stringify(config));
            },
            'astro:build:done': async ({assets, dir, logger}) => {
                logger.info('mysong-compress build done');
                logger.info(JSON.stringify(assets));
                logger.info(JSON.stringify(dir));

                await traverseDirectory(dir, logger);

                for (const candidate of candidates) {
                    const originalContent = fs.readFileSync(candidate);
                    const sourceHash = createHash('sha256').update(originalContent).digest('hex');
                    const cachedFile = await cacheManager.getCachedFile(candidate, sourceHash, {});

                    if (cachedFile) {
                        logger.info(`Using cached version for ${candidate}`);
                        const compressedContent = fs.readFileSync(cachedFile.compressedPath);
                        fs.writeFileSync(candidate, compressedContent);
                        originalSizeTotal += cachedFile.size.original;
                        newSizeTotal += cachedFile.size.compressed;
                        cacheHits++;
                        continue;
                    }

                    logger.info(`No cached version found for ${candidate}, processing...`);

                    let result = await processFile(candidate, logger);

                    if (result.processed) {
                        const compressedContent = fs.readFileSync(candidate);
                        await cacheManager.saveToCache(candidate, originalContent, compressedContent, {});
                        processedFiles++;
                    } else {
                        skippedFiles++;
                    }
                }

                logger.info(`Original size: ${originalSizeTotal} bytes`);
                logger.info(`Compressed size: ${newSizeTotal} bytes`);
                logger.info(`Compression ratio: ${originalSizeTotal / newSizeTotal}`);
                logger.info(`Processed files: ${processedFiles}`);
                logger.info(`Skipped files: ${skippedFiles}`);
                logger.info(`Cache hits: ${cacheHits}`);
            },
        },
    };
}

