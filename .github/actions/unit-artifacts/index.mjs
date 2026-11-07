import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runArtifactAction } from '../../../scripts/unit/upload.mjs';

try {
  const root = fs.realpathSync(fileURLToPath(new URL('../../../', import.meta.url)));
  await runArtifactAction(root);
  console.log('Bounded unit artifact upload completed.');
} catch {
  console.error(
    'Bounded unit artifact upload failed. Runner capability, file validation or deadline was not satisfied.',
  );
  process.exitCode = 1;
}
