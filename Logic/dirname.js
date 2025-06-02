import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function getDirname(metaUrl) {
  const filename = fileURLToPath(metaUrl);
  return dirname(filename);
}