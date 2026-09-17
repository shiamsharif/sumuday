import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'photo-source');
const destination = path.join(root, 'public', 'photos');
const manifestPath = path.join(root, 'content', 'photos.generated.json');
const metadataPath = path.join(root, 'content', 'photo-metadata.json');
const supported = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.tif', '.tiff']);
const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
await fs.mkdir(source, { recursive: true });
await fs.mkdir(destination, { recursive: true });

async function scan(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await scan(full));
    else if (entry.isFile() && !entry.name.startsWith('.')) found.push(full);
  }
  return found;
}
async function hashFile(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex').slice(0, 16);
}
const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const paths = (await scan(source)).sort((a, b) => {
  const first = path.relative(source, a);
  const second = path.relative(source, b);
  return naturalOrder.compare(first, second) || first.localeCompare(second, 'en');
});
const output = [];
const seen = new Set();
let skipped = 0;
for (const file of paths) {
  const relative = path.relative(source, file);
  if (!supported.has(path.extname(file).toLowerCase())) {
    console.warn(`SKIP unsupported: ${relative}`); skipped++; continue;
  }
  try {
    const id = await hashFile(file);
    if (seen.has(id)) { console.warn(`SKIP duplicate: ${relative}`); skipped++; continue; }
    seen.add(id);
    const image = sharp(file, { failOn: 'error' }).rotate();
    const original = await image.metadata();
    if (!original.width || !original.height) throw new Error('missing image dimensions');
    const displayName = `${id}.webp`;
    const thumbName = `${id}-thumb.webp`;
    // Fresh Sharp instances avoid carrying metadata into public output.
    const display = await sharp(file, { failOn: 'error' }).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 83, effort: 5 }).toFile(path.join(destination, displayName));
    await sharp(file, { failOn: 'error' }).rotate().resize({ width: 520, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toFile(path.join(destination, thumbName));
    const extra = metadata.photos?.[id] || {};
    output.push({ id, src: `/photos/${displayName}`, thumb: `/photos/${thumbName}`, width: display.width, height: display.height, ...extra });
    console.log(`OK   ${relative} -> ${id} (${display.width}x${display.height})`);
  } catch (error) { console.warn(`SKIP unreadable: ${relative} (${error.message})`); skipped++; }
}
await fs.writeFile(manifestPath, JSON.stringify(output, null, 2) + '\n');
const validFiles = new Set(output.flatMap(p => [path.basename(p.src), path.basename(p.thumb)]));
for (const name of await fs.readdir(destination)) {
  if (/^[a-f0-9]{16}(?:-thumb)?\.webp$/.test(name) && !validFiles.has(name)) await fs.unlink(path.join(destination, name));
}
console.log(`\nImported ${output.length} photo(s); skipped ${skipped}. Manifest: content/photos.generated.json`);
console.log('Edit content/photo-metadata.json for captions, albums, focal points, and featured/slideshow IDs, then rerun this script.');
