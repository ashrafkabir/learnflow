import fs from 'node:fs/promises';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/make-gallery.mjs <dir>');
  process.exit(1);
}

const absDir = path.resolve(dir);
const files = (await fs.readdir(absDir))
  .filter((f) => f.toLowerCase().endsWith('.png'))
  .sort();

const rows = files
  .map((f) => {
    const safe = encodeURIComponent(f).replace(/%2F/g, '/');
    return `
      <figure>
        <a href="${safe}"><img loading="lazy" src="${safe}" alt="${f}" /></a>
        <figcaption>${f}</figcaption>
      </figure>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LearnFlow Screenshots Gallery</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 16px; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
    figure { margin: 0; padding: 10px; border: 1px solid rgba(127,127,127,0.35); border-radius: 8px; background: rgba(127,127,127,0.06); }
    img { width: 100%; height: auto; border-radius: 6px; display: block; }
    figcaption { margin-top: 8px; font-size: 12px; opacity: 0.85; word-break: break-all; }
  </style>
</head>
<body>
  <h1>${path.basename(absDir)} (${files.length} images)</h1>
  <div class="grid">${rows}</div>
</body>
</html>`;

await fs.writeFile(path.join(absDir, 'index.html'), html, 'utf8');
console.log(`Wrote ${path.join(absDir, 'index.html')}`);
