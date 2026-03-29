import crypto from 'crypto';

export type ExportProvenanceManifest = {
  schemaVersion: 'v1';
  generatedAt: string;
  appVersion: string;
  exportFiles: Array<{
    path: string;
    sha256: string;
    bytes: number;
    mime: string;
  }>;
};

export function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function buildProvenanceManifest(input: {
  appVersion: string;
  files: Array<{ path: string; mime: string; content: Buffer | string }>;
}): ExportProvenanceManifest {
  const exportFiles = input.files.map((f) => {
    const b = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content, 'utf8');
    return {
      path: f.path,
      sha256: sha256(b),
      bytes: b.byteLength,
      mime: f.mime,
    };
  });

  return {
    schemaVersion: 'v1',
    generatedAt: new Date().toISOString(),
    appVersion: input.appVersion,
    exportFiles,
  };
}
