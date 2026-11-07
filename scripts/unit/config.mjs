export const scopes = ['api', 'web', 'contracts', 'prototype'];
export const metrics = ['lines', 'statements', 'functions', 'branches'];
export function assertRunMode(args, env = process.env) {
  if (
    (env.CI || env.GITHUB_ACTIONS) &&
    args.some((arg) => ['--measure', '--write-baseline', '--pre-unit'].includes(arg))
  )
    throw new Error('CI cannot run unit maintenance modes');
}
export const limits = Object.freeze({ files: 1500, bytes: 20 * 1024 * 1024, depth: 16 });
export const artifactLimits = Object.freeze({ total: 10 * 1024 * 1024, file: 2 * 1024 * 1024 });
export const providerVersions = Object.freeze({
  nyc: '18.0.0',
  'istanbul-lib-instrument': '6.0.3',
  'istanbul-lib-coverage': '3.2.2',
  'istanbul-lib-source-maps': '4.0.1',
});
export const zeroUnits = Object.freeze({
  api: [],
  web: [],
  contracts: [],
  prototype: [
    'apps/web/src/lib/task-prototype/index.ts',
    'apps/web/src/lib/task-prototype/types.ts',
  ],
});
export const webSuites = [
  'scripts/identity-logic.test.mjs',
  'scripts/identity-client.test.mjs',
  'scripts/workspace-logic.test.mjs',
  'scripts/project-task-logic.test.mjs',
  'scripts/project-task-client.test.mjs',
  'scripts/task-events-client.test.mjs',
];
export const compiler = Object.freeze({
  version: '6.0.3',
  web: { target: 'ES2023', module: 'ESNext', jsx: 'react-jsx', verbatimModuleSyntax: true },
  api: 'real apps/api/tsconfig.json tsc output; experimentalDecorators + emitDecoratorMetadata',
  contracts: 'real packages/contracts/tsconfig.json tsc with sourceMap + inlineSources',
});
