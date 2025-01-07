import * as fs from 'fs/promises';
import * as path from 'path';

export async function setupTestFiles(tempDir: string, files: Record<string, any>) {
  for (const [type, fileInfo] of Object.entries(files)) {
    const filePath = path.join(tempDir, fileInfo.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fileInfo.content);
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export async function compareFiles(file1: string, file2: string): Promise<boolean> {
  const content1 = await fs.readFile(file1);
  const content2 = await fs.readFile(file2);
  return Buffer.compare(content1, content2) === 0;
} 