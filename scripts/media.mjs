// Готовит адаптивные картинки для статической сборки: без сервера next/image не оптимизирует сам.
// Вход: папка с исходниками (jpg/png). Выход: public/media/<имя>-<ширина>.{avif,webp} + манифест.
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

const [src = 'content-inbox-demo', out = 'public/media'] = process.argv.slice(2);
const WIDTHS = [640, 1080, 1600];
mkdirSync(out, { recursive: true });

const manifest = {};
for (const file of readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const name = parse(file).name;
  const img = sharp(join(src, file));
  const { width, height } = await img.metadata();
  const widths = WIDTHS.filter((w) => w <= width);
  for (const w of widths) {
    const resized = img.clone().resize({ width: w });
    await resized.clone().avif({ quality: 50 }).toFile(join(out, `${name}-${w}.avif`));
    await resized.clone().webp({ quality: 72 }).toFile(join(out, `${name}-${w}.webp`));
  }
  manifest[name] = { width, height, widths };
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(Object.keys(manifest).length, 'images');
