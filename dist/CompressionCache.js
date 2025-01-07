import { createHash } from 'crypto';
import { mkdir, writeFile, readFile, stat } from 'fs/promises';
import { join } from 'path';
export class CompressionCacheManagerImpl {
    cacheDir;
    manifest;
    logger;
    constructor(astroDir, logger) {
        this.cacheDir = join(astroDir, '.compress-cache');
        this.manifest = { version: '1', entries: {} };
        this.logger = logger;
    }
    async initialize() {
        this.logger.debug('Initializing compression cache...');
        await mkdir(this.cacheDir, { recursive: true });
        try {
            const manifestPath = join(this.cacheDir, 'manifest.json');
            const content = await readFile(manifestPath, 'utf-8');
            this.manifest = JSON.parse(content);
            this.logger.debug('Loaded existing manifest.');
        }
        catch {
            this.logger.debug('No existing cache manifest found, using default empty one.');
            await this.saveManifest();
        }
    }
    async saveManifest() {
        const manifestPath = join(this.cacheDir, 'manifest.json');
        await writeFile(manifestPath, JSON.stringify(this.manifest, null, 2));
        this.logger.debug('Manifest saved.');
    }
    async getCachedFile(originalPath, sourceHash, settings) {
        this.logger.debug(`Retrieving cached file for: ${originalPath}`);
        const entry = this.manifest.entries[originalPath];
        if (!entry) {
            this.logger.debug('No cache entry found.');
            return null;
        }
        if (entry.sourceHash !== sourceHash) {
            this.logger.debug('Source hash mismatch.');
            return null;
        }
        if (JSON.stringify(entry.settings) !== JSON.stringify(settings)) {
            this.logger.debug('Settings mismatch.');
            return null;
        }
        try {
            await stat(entry.compressedPath);
            this.logger.debug('Cache hit, file exists.');
            return entry;
        }
        catch {
            this.logger.debug('Cached file does not exist, removing entry.');
            delete this.manifest.entries[originalPath];
            await this.saveManifest();
            return null;
        }
    }
    async saveToCache(originalPath, originalContent, compressedContent, settings) {
        this.logger.debug(`Saving to cache: ${originalPath}`);
        const sourceHash = createHash('sha256').update(originalContent).digest('hex');
        const ext = originalPath.split('.').pop() || '';
        const cachedFileName = `${sourceHash}.${ext}`;
        const cachedFilePath = join(this.cacheDir, cachedFileName);
        // Save compressed content
        await writeFile(cachedFilePath, compressedContent);
        this.logger.debug(`Compressed file saved: ${cachedFilePath}`);
        // Update manifest
        const entry = {
            sourceHash,
            compressedPath: cachedFilePath,
            timestamp: Date.now(),
            settings,
            size: {
                original: originalContent.length,
                compressed: compressedContent.length
            }
        };
        this.manifest.entries[originalPath] = entry;
        await this.saveManifest();
        this.logger.debug('Cache entry updated.');
    }
    async invalidateCache(pattern) {
        if (!pattern) {
            this.logger.debug('Invalidating entire cache.');
            this.manifest.entries = {};
        }
        else {
            this.logger.debug(`Invalidating cache with pattern: ${pattern}`);
            const regex = new RegExp(pattern);
            for (const path in this.manifest.entries) {
                if (regex.test(path)) {
                    delete this.manifest.entries[path];
                    this.logger.debug(`Cache entry invalidated: ${path}`);
                }
            }
        }
        await this.saveManifest();
        this.logger.debug('Cache invalidation complete.');
    }
}
