const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'frontend', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="#07090F"/>
  <circle cx="256" cy="256" r="174" fill="url(#g)" opacity="0.18"/>
  <path d="M180 332V180l136 76-136 76z" fill="url(#g)"/>
  <circle cx="256" cy="256" r="212" fill="none" stroke="#F4F7FF" stroke-opacity="0.12" stroke-width="12"/>
</svg>`;

for (const size of sizes) {
  fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.png`), svg(size));
}
