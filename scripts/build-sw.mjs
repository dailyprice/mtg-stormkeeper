import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = 'dist';
async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.name !== 'sw.js') files.push(path);
  }
  return files.sort();
}

const files = await listFiles(root);
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(file));
const cacheName = `stormkeeper-${hash.digest('hex').slice(0, 12)}`;
const urls = ['/', ...files.map((file) => `/${relative(root, file)}`)];

await writeFile(join(root, 'sw.js'), `
const CACHE = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(urls)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key.startsWith('stormkeeper-') && key !== CACHE)
      .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    // Keep HTML and its hashed assets on the same version until all tabs close.
    if (request.mode === 'navigate') return (await cache.match('/')) || fetch(request);
    // These are public, same-origin static assets. Module/font requests may
    // send Origin while precaching doesn't; Vary: Origin must not miss them.
    return (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) || fetch(request);
  }));
});
`);
console.log(`Offline cache: ${files.length} files (${cacheName})`);
