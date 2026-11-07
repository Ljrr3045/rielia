import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const config = JSON.parse(readFileSync(new URL('./mirror-paths.json', import.meta.url), 'utf8'));
const mirror = `${config.mirror}/`;
const original = `${config.root}/`;
if (!Array.isArray(config.inputs)) throw new Error('Missing maintained mirror input inventory');
const maintained = new Set(config.inputs.map((file) => resolve(config.root, file)));
registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = specifier;
    if (
      context.parentURL?.startsWith(pathToFileURL(mirror).href) &&
      /^(\.|\/|file:)/.test(specifier)
    ) {
      const candidate = new URL(specifier, context.parentURL);
      const name = fileURLToPath(candidate);
      if (name.startsWith(mirror) && /\.tsx?$/.test(name))
        target = pathToFileURL(name.replace(/\.tsx?$/, '.js')).href;
      else if (name.startsWith(mirror) && !existsSync(name) && existsSync(`${name}.js`))
        target = pathToFileURL(`${name}.js`).href;
    }
    const result = nextResolve(target, context);
    if (result.url.startsWith('file:')) {
      const name = fileURLToPath(result.url);
      if (
        name.startsWith(original) &&
        !name.startsWith(mirror) &&
        (maintained.has(name) ||
          /apps\/(web\/src|api\/(src|dist))\//.test(name.slice(original.length)))
      ) {
        throw new Error('Application source escaped the instrumented mirror');
      }
      if (name.startsWith(mirror) && /\.tsx?$/.test(name))
        throw new Error('Uncompiled source in unit mirror');
      if (
        config.scope === 'contracts' &&
        name.startsWith(resolve(config.root, 'packages/contracts/dist') + '/')
      )
        throw new Error('Shared source escaped instrumented mirror');
    }
    return result;
  },
});
