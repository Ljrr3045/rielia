import { checkStagedFiles } from './scripts/quality/checks.mjs';

export default {
  '*': { title: 'Check staged source without changing files', task: checkStagedFiles },
};
