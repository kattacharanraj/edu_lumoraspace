/* Minimal PNG decode/encode (8-bit, non-interlaced) + box resampling.
   Enough to turn the supplied logo into themed, transparent brand assets. */
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function decode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  let p = 8;
  let ihdr = null;
  const idat = [];
  let plte = null, trns = null;

  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    const data = buf.slice(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
        interlace: data[12],
      };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IEND') break;
    p += 12 + len;
  }

  if (!ihdr) throw new Error('no IHDR');
  if (ihdr.depth !== 8) throw new Error('only 8-bit supported, got ' + ihdr.depth);
  if (ihdr.interlace !== 0) throw new Error('interlaced png not supported');

  const ch = CHANNELS[ihdr.color];
  if (!ch) throw new Error('unsupported color type ' + ihdr.color);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width: w, height: h } = ihdr;
  const stride = w * ch;
  const out = Buffer.alloc(stride * h);

  let sp = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[sp++];
    const row = raw.slice(sp, sp + stride);
    sp += stride;
    const cur = out.slice(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.slice((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= ch ? prev[x - ch] : 0;
      let v = row[x];
      switch (filter) {
        case 0: break;
        case 1: v += a; break;
        case 2: v += b; break;
        case 3: v += (a + b) >> 1; break;
        case 4: {
          const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default: throw new Error('bad filter ' + filter);
      }
      cur[x] = v & 0xff;
    }
  }

  // normalise everything to RGBA
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    let r, g, bl, al = 255;
    if (ihdr.color === 6) { r = out[i * 4]; g = out[i * 4 + 1]; bl = out[i * 4 + 2]; al = out[i * 4 + 3]; }
    else if (ihdr.color === 2) { r = out[i * 3]; g = out[i * 3 + 1]; bl = out[i * 3 + 2]; }
    else if (ihdr.color === 0) { r = g = bl = out[i]; }
    else if (ihdr.color === 4) { r = g = bl = out[i * 2]; al = out[i * 2 + 1]; }
    else if (ihdr.color === 3) {
      const idx = out[i];
      r = plte[idx * 3]; g = plte[idx * 3 + 1]; bl = plte[idx * 3 + 2];
      al = trns && idx < trns.length ? trns[idx] : 255;
    }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = bl; rgba[i * 4 + 3] = al;
  }
  return { width: w, height: h, data: rgba };
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encode(img) {
  const { width: w, height: h, data } = img;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* Area-average resample. Premultiplies alpha so transparent pixels
   do not bleed their colour into the result. */
function resize(img, dw, dh) {
  const { width: sw, height: sh, data: src } = img;
  const out = Buffer.alloc(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const y0 = (y * sh) / dh, y1 = ((y + 1) * sh) / dh;
    const iy0 = Math.floor(y0), iy1 = Math.min(sh, Math.ceil(y1));
    for (let x = 0; x < dw; x++) {
      const x0 = (x * sw) / dw, x1 = ((x + 1) * sw) / dw;
      const ix0 = Math.floor(x0), ix1 = Math.min(sw, Math.ceil(x1));
      let r = 0, g = 0, b = 0, a = 0, wsum = 0;
      for (let sy = iy0; sy < iy1; sy++) {
        const cy = Math.min(y1, sy + 1) - Math.max(y0, sy);
        if (cy <= 0) continue;
        for (let sx = ix0; sx < ix1; sx++) {
          const cx = Math.min(x1, sx + 1) - Math.max(x0, sx);
          if (cx <= 0) continue;
          const wgt = cx * cy;
          const i = (sy * sw + sx) * 4;
          const al = src[i + 3] / 255;
          r += src[i] * al * wgt; g += src[i + 1] * al * wgt; b += src[i + 2] * al * wgt;
          a += src[i + 3] * wgt;
          wsum += wgt;
        }
      }
      const o = (y * dw + x) * 4;
      if (wsum > 0) {
        const av = a / wsum;
        const un = av > 0.5 ? av / 255 : 1;
        out[o] = Math.round(Math.min(255, r / wsum / un));
        out[o + 1] = Math.round(Math.min(255, g / wsum / un));
        out[o + 2] = Math.round(Math.min(255, b / wsum / un));
        out[o + 3] = Math.round(av);
      }
    }
  }
  return { width: dw, height: dh, data: out };
}

module.exports = { decode, encode, resize };
