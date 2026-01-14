import * as fs from 'fs/promises';
import * as path from 'path';

type Data = Parameters<typeof fs.writeFile>[1];
export type TestFileConfig = { name: string, content: Data }

export async function setupTestFiles(tempDir: string, files: Record<string, TestFileConfig>) {
  await Promise.all(Object.values(files).map(fileInfo =>
    setupTestFile(tempDir, fileInfo)
  ));
}

export async function setupTestFile(tempDir: string, fileInfo: TestFileConfig) {
  await fs.mkdir(tempDir, { recursive: true });  
  const filePath = path.join(tempDir, fileInfo.name);
  await fs.writeFile(filePath, fileInfo.content);
  return filePath;
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