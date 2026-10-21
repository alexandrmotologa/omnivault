import { vault } from '../db/sqlite';

export async function createFullBackupBlob(): Promise<Blob> {
  const data = await vault.exportAll();
  const backupObject = {
    version: '1.0.0',
    app: 'omnivault',
    exported_at: new Date().toISOString(),
    ...data,
  };

  const jsonString = JSON.stringify(backupObject, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreFromJsonFile(file: File): Promise<{ importedCount: number }> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Check if it's Omnivore export format
  // Omnivore exports usually have an array of articles or an object with an `articles` property
  if (Array.isArray(data)) {
    return await vault.importAll({ articles: data });
  }

  return await vault.importAll(data);
}
