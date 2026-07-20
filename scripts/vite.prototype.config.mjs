import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = process.env.OMI_PROTOTYPE_DIR;

if (!root) {
  throw new Error('OMI_PROTOTYPE_DIR is required');
}

/** @type {import('vite').UserConfig} */
export default {
  root,
  publicDir: false,
  server: {
    host: '127.0.0.1',
    fs: { allow: [repoRoot] },
  },
};
