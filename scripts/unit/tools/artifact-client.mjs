import { DefaultArtifactClient } from '@actions/artifact';

// Standard ESM resolution stays inside this isolated, frozen tools install.
export const createArtifactClient = () => new DefaultArtifactClient();
