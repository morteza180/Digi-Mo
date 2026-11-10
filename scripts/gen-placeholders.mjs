import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const products = JSON.parse(readFileSync(path.join(root, 'public/data/products.json'), 'utf8'));
const outDir = path.join(root, 'public/images/products');
mkdirSync(outDir, { recursive: true });

const palette = {
  mobile: ['#1f3a6e', '#2bb3a3'],
  charger: ['#0f766e', '#f5a623'],
  powerbank: ['#7c2d12', '#f5a623'],
  headphone: ['#4c1d95', '#2bb3a3'],
  case: ['#334155', '#c0392b'],
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

for (const p of products) {
  const [c1, c2] = palette[p.category] ?? ['#1f3a6e', '#2bb3a3'];
  const model = p.slug.split('-').slice(1, 4).join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect x="260" y="140" width="280" height="520" rx="48" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="10"/>
  <text x="400" y="720" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#fff">${esc(p.brand.toUpperCase())}</text>
  <text x="400" y="765" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#fff" fill-opacity=".85">${esc(model)}</text>
</svg>`;
  writeFileSync(path.join(outDir, `${p.slug}.svg`), svg);
}
console.log(`✔ ${products.length} placeholder images generated`);
