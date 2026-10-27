import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const forbidden = new Set(['express', '@nestjs/platform-express', '@types/express', '@types/express-serve-static-core']);

// Follow actual Node resolution, including installed optional peers. Merely
// deleting a manifest entry misses pnpm's retained peer bindings.
export function assertBackendClosure(directory, { deployed = false } = {}) {
  const visited = new Set();
  const names = new Set();
  function inspect(directory, root = false) {
    const current = realpathSync(directory);
    if (visited.has(current)) return;
    visited.add(current);
    const manifest = JSON.parse(readFileSync(join(current, 'package.json'), 'utf8'));
    assert(!forbidden.has(manifest.name), `Forbidden backend package: ${manifest.name}`);
    names.add(`${manifest.name}@${manifest.version}`);
    const required = manifest.dependencies ?? {};
    const dependencies = new Set(Object.keys({ ...required, ...manifest.optionalDependencies,
      ...(root ? {} : manifest.peerDependencies) }));
    const require = createRequire(join(current, 'package.json'));
    for (const name of dependencies) {
      const dependency = require.resolve.paths(name)?.map(path => join(path, name))
        .find(path => existsSync(join(path, 'package.json')));
      if (dependency) inspect(dependency);
      else assert(!Object.hasOwn(required, name), `Missing required backend package: ${name}`);
    }
  }
  inspect(resolve(directory), true);
  if (deployed) {
    // A deployed store must also contain no orphan/ghost Express package.
    const scanned = new Set();
    function scan(path) {
      const real = realpathSync(path);
      if (!statSync(real).isDirectory()) return;
      if (scanned.has(real)) return;
      scanned.add(real);
      const manifest = join(real, 'package.json');
      if (existsSync(manifest)) {
        const { name } = JSON.parse(readFileSync(manifest, 'utf8'));
        assert(!forbidden.has(name), `Forbidden deployed package: ${name}`);
      }
      for (const entry of readdirSync(real, { withFileTypes: true })) {
        if (entry.isDirectory() || entry.isSymbolicLink()) {
          const child = join(real, entry.name);
          // Package-bin links point to files, not package directories.
          if (entry.name !== '.bin') scan(child);
        }
      }
    }
    scan(join(resolve(directory), 'node_modules'));
  }
  assert([...names].some(name => name === '@nestjs/platform-node@12.3.2'), 'Node adapter missing');
  console.log(`Backend closure verified: ${names.size} resolved packages; no Express${deployed ? ' in deployed store' : ''}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assertBackendClosure(process.argv[2] ?? 'apps/api', { deployed: process.argv.includes('--deployed') });
}
