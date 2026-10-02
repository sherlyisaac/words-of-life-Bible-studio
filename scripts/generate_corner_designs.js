import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = path.resolve('public/backgrounds/corner-designs');
fs.mkdirSync(outDir, { recursive: true });

const pinkSvgPath = path.join(outDir, 'floral-butterflies-bees-pink.svg');
const vintageSvgPath = path.join(outDir, 'vintage-garden-frame-corner.svg');

const pinkPngPath = path.join(outDir, 'floral-butterflies-bees-pink.png');
const vintagePngPath = path.join(outDir, 'vintage-garden-frame-corner.png');

async function main() {
  const pinkSvg = fs.readFileSync(pinkSvgPath);
  await sharp(pinkSvg)
    .resize(1080, 1920)
    .png({ quality: 100 })
    .toFile(pinkPngPath);
  console.log('Successfully created:', pinkPngPath);

  const vintageSvg = fs.readFileSync(vintageSvgPath);
  await sharp(vintageSvg)
    .resize(1080, 1920)
    .png({ quality: 100 })
    .toFile(vintagePngPath);
  console.log('Successfully created:', vintagePngPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
