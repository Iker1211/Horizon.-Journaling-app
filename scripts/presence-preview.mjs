import { createServer } from 'vite';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const fake = resolve(root, 'src/dev/presence-preview-client.ts');
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5190, strictPort: true }, plugins: [{
  name: 'isolated-presence-review', enforce: 'pre',
  resolveId(source, importer) {
    if (importer?.startsWith(resolve(root, 'src')) && /(?:^|\/)lib\/supabase(?:\.ts)?$/.test(source)) return fake;
  },
}] });
await server.listen();
console.log('Horizon presence review: http://127.0.0.1:5190/ux-preview.html?view=dashboard&character=penguin');
