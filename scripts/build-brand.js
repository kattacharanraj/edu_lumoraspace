/* Regenerates the served brand assets from brand/logo-source.png.

   Run with:  npm run brand
   Outputs:   public/logo.png          transparent mark for header/footer
              public/favicon-32.png    rounded dark tile, browser tab
              public/favicon-180.png   square dark tile, apple-touch-icon
              public/favicon-512.png   rounded dark tile, large / PWA

   Written against a tiny built-in PNG codec (scripts/png.js) so the build
   needs no ImageMagick, ffmpeg or native image dependency. */
const fs = require('fs');
const path = require('path');
const { decode, encode, resize } = require('./png.js');

const PROJ = process.argv[2] || path.join(__dirname, '..');
const SRC = path.join(PROJ, 'brand', 'logo-source.png');
const OUT = path.join(PROJ, 'public');

const img = decode(fs.readFileSync(SRC));
const { width: W, height: H, data: D } = img;

/* ---- crop to the mark, keeping its soft glow ---- */
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (D[(y * W + x) * 4 + 3] > 6) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
}
const padX = Math.round((x1 - x0 + 1) * 0.04);
const padY = Math.round((y1 - y0 + 1) * 0.04);
x0 = Math.max(0, x0 - padX); x1 = Math.min(W - 1, x1 + padX);
y0 = Math.max(0, y0 - padY); y1 = Math.min(H - 1, y1 + padY);

const cw = x1 - x0 + 1, chh = y1 - y0 + 1;
const crop = { width: cw, height: chh, data: Buffer.alloc(cw * chh * 4) };
for (let y = 0; y < chh; y++) {
  D.copy(crop.data, y * cw * 4, ((y + y0) * W + x0) * 4, ((y + y0) * W + x0 + cw) * 4);
}
console.log('cropped mark: ' + cw + 'x' + chh + ' (aspect ' + (cw / chh).toFixed(3) + ')');

function write(name, buf) {
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('  ' + name.padEnd(22) + (buf.length / 1024).toFixed(1) + ' KB');
}

/* ---- 1. transparent logo for the header/footer ---- */
const logoH = 256;
const logoW = Math.max(1, Math.round((cw / chh) * logoH));
write('logo.png', encode(resize(crop, logoW, logoH)));

/* ---- 2. favicons: mark centred on a dark tile ---- */
const BG = [5, 5, 5];

function tile(size, { rounded, markFrac }) {
  const out = Buffer.alloc(size * size * 4);
  const r = rounded ? size * 0.22 : 0;

  // rounded-rect background with an anti-aliased edge
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let a = 255;
      if (r > 0) {
        const dx = Math.max(r - (x + 0.5), (x + 0.5) - (size - r), 0);
        const dy = Math.max(r - (y + 0.5), (y + 0.5) - (size - r), 0);
        if (dx > 0 && dy > 0) {
          const d = Math.sqrt(dx * dx + dy * dy);
          a = Math.round(255 * Math.max(0, Math.min(1, r - d + 0.5)));
        }
      }
      const o = (y * size + x) * 4;
      out[o] = BG[0]; out[o + 1] = BG[1]; out[o + 2] = BG[2]; out[o + 3] = a;
    }
  }

  // scale the mark to a fraction of the tile height, centre it
  const mh = Math.round(size * markFrac);
  const mw = Math.max(1, Math.round((cw / chh) * mh));
  const mark = resize(crop, mw, mh);
  const ox = Math.round((size - mw) / 2);
  const oy = Math.round((size - mh) / 2);

  for (let y = 0; y < mh; y++) {
    const ty = oy + y;
    if (ty < 0 || ty >= size) continue;
    for (let x = 0; x < mw; x++) {
      const tx = ox + x;
      if (tx < 0 || tx >= size) continue;
      const s = (y * mw + x) * 4;
      const sa = mark.data[s + 3] / 255;
      if (sa <= 0) continue;
      const o = (ty * size + tx) * 4;
      const da = out[o + 3] / 255;
      const na = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        out[o + c] = Math.round((mark.data[s + c] * sa + out[o + c] * da * (1 - sa)) / (na || 1));
      }
      out[o + 3] = Math.round(na * 255);
    }
  }
  return { width: size, height: size, data: out };
}

write('favicon-32.png', encode(tile(32, { rounded: true, markFrac: 0.80 })));
write('favicon-180.png', encode(tile(180, { rounded: false, markFrac: 0.72 })));
write('favicon-512.png', encode(tile(512, { rounded: true, markFrac: 0.72 })));

console.log('done');
