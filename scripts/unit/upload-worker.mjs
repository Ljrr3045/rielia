import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { uploadWithClient } from './upload.mjs';

try {
  const root = fs.realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
  const { createArtifactClient } = await import('./tools/artifact-client.mjs');
  await uploadWithClient(root, createArtifactClient(), process.env);
} catch {
  console.error('Unit artifact upload failed');
  process.exitCode = 1;
}
