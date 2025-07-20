import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Get path of specific file
 * @param {*} metaUrl 
 * @returns 
 */
export function getDirname(metaUrl) {
  const filename = fileURLToPath(metaUrl);
  return dirname(filename);
}