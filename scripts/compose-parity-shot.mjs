import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = process.env.SCREENSHOT_DIR;
if (!dir) {
  console.error('Missing SCREENSHOT_DIR');
  process.exit(1);
}

const left = path.resolve(dir, '_action-chips-conversation.png');
const right = path.resolve(dir, '_action-chips-lesson.png');
const out = path.resolve(dir, 'action-chips-parity.png');

if (!fs.existsSync(left) || !fs.existsSync(right)) {
  console.error('Missing input screenshots:', {
    left: fs.existsSync(left),
    right: fs.existsSync(right),
  });
  process.exit(1);
}

const a = sharp(left);
const b = sharp(right);
const [ma, mb] = await Promise.all([a.metadata(), b.metadata()]);

const widthA = ma.width || 0;
const widthB = mb.width || 0;
const height = Math.max(ma.height || 0, mb.height || 0);

const bufA = await a
  .extend({
    top: 0,
    bottom: height - (ma.height || 0),
    left: 0,
    right: 0,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toBuffer();
const bufB = await b
  .extend({
    top: 0,
    bottom: height - (mb.height || 0),
    left: 0,
    right: 0,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: widthA + widthB,
    height,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([
    { input: bufA, left: 0, top: 0 },
    { input: bufB, left: widthA, top: 0 },
  ])
  .png()
  .toFile(out);

console.log('✓ wrote', out);
