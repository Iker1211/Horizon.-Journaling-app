import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../dist/', import.meta.url);
await access(root); // Run npm run build first.
const files = await readdir(root, { recursive: true });
assert.ok(!files.includes('ux-preview.html'), 'The development review HTML must not ship.');
const markers = ['ux-synthetic-review', 'demo-entry-one', 'Revisión local · solo datos ficticios', 'axe-core', '.ux-lab'];
for (const file of files.filter(file => /\.(?:js|css|html)$/.test(file))) {
  const source = await readFile(join(root.pathname, file), 'utf8');
  for (const marker of markers) assert.ok(!source.includes(marker), `Development marker ${marker} was emitted in ${file}`);
}
console.log('Production boundary passed: no review page, synthetic fixtures, audit tool or lab styles emitted.');
