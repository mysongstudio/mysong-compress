import { describe, test, expect } from 'vitest';
import { fileURLToPath } from 'url';
import * as path from 'path';

describe('URL to Path Conversion', () => {
  test('should correctly convert Unix-style file URLs to paths', () => {
    const unixUrl = new URL('file:///home/user/project/dist');
    const filePath = fileURLToPath(unixUrl);
    
    // Should not have double slashes or double drive letters
    expect(filePath).toBe('/home/user/project/dist');
    expect(filePath).not.toContain('//home');
  });

  test('should correctly handle Windows-style file URLs', () => {
    // On Unix, this will still convert properly
    const winUrl = new URL('file:///C:/Users/test/project/dist');
    const filePath = fileURLToPath(winUrl);
    
    // Should not have double drive letters like C:\C:\
    expect(filePath).not.toMatch(/C:\\C:\\/);
    expect(filePath).not.toMatch(/C:\/C:\//);
    
    // On Unix this will be /C:/Users/test/project/dist
    // On Windows this will be C:\Users\test\project\dist
    expect(filePath).toBeTruthy();
  });

  test('should work with path.join after fileURLToPath', () => {
    const baseUrl = new URL('file:///home/user/project');
    const basePath = fileURLToPath(baseUrl);
    const subPath = path.join(basePath, 'node_modules', '.astro', '.cache');
    
    // Should create valid path without duplicates
    expect(subPath).toContain('node_modules');
    expect(subPath).toContain('.astro');
    expect(subPath).not.toContain('//');
  });

  test('should handle URL with trailing slash', () => {
    const urlWithSlash = new URL('file:///home/user/project/');
    const urlWithoutSlash = new URL('file:///home/user/project');
    
    const pathWithSlash = fileURLToPath(urlWithSlash);
    const pathWithoutSlash = fileURLToPath(urlWithoutSlash);
    
    // Both should work (trailing slash in URL doesn't affect file path)
    expect(pathWithSlash).toBeTruthy();
    expect(pathWithoutSlash).toBeTruthy();
  });

  test('should construct relative URLs correctly', () => {
    const baseUrl = new URL('file:///home/user/project/');
    const subUrl = new URL('subdir/', baseUrl);
    
    expect(subUrl.href).toBe('file:///home/user/project/subdir/');
    
    const subPath = fileURLToPath(subUrl);
    expect(subPath).toContain('subdir');
    expect(subPath).not.toContain('//');
  });
}); 
