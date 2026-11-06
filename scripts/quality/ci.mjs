import { readFileSync } from 'node:fs';
import { checkCommits, verifyCommit } from './commits.mjs';
import { checkFormatting } from './format.mjs';
import { changedPaths, fail, git, isMain, repositoryRoot } from './git.mjs';
import { legacyCommit } from './policy.mjs';

export function eventRange(root, name, event, legacy = legacyCommit) {
  verifyCommit(root, legacy);
  let base;
  let head;
  if (name === 'pull_request') {
    base = verifyCommit(root, event.pull_request?.base?.sha);
    head = verifyCommit(root, event.pull_request?.head?.sha);
  } else if (name === 'push' && ['refs/heads/dev', 'refs/heads/main'].includes(event.ref)) {
    head = verifyCommit(root, event.after);
    base = event.before === '0'.repeat(40) ? legacy : verifyCommit(root, event.before);
  } else {
    throw new Error(`Unsupported quality CI event: ${name}`);
  }
  const formatBase = name === 'pull_request' ? git(root, ['merge-base', base, head]).trim() : base;
  return { base, head, formatBase };
}

export async function checkEvent(root, name, event, legacy = legacyCommit) {
  const { base, head, formatBase } = eventRange(root, name, event, legacy);
  checkCommits(root, base, head, legacy);
  await checkFormatting(root, changedPaths(root, formatBase, head));
}

if (isMain(import.meta.url)) {
  Promise.resolve()
    .then(() =>
      checkEvent(
        repositoryRoot(),
        process.env.GITHUB_EVENT_NAME,
        JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')),
      ),
    )
    .catch(fail);
}
