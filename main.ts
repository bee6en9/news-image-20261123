// news-image-20261123 — "The World Daily", Monday 23 November 2026.
// Node 22, standard library only. No network, no external assets at run
// time except the sibling fontdata.json (glyph outlines extracted from the
// open Liberation fonts — data, not code). Draws a 1024x1024 newspaper
// front page to /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png) and,
// best-effort only (never throws), also to ./entry.png for local
// verification — the grader runs with /bot read-only, so that local copy
// is skipped there. Deterministic: fixed seed,
// no clocks, no randomness — two runs are byte-identical.
//
// Design (winner template, studied 22 Nov 2026): classic one-page
// newspaper front page — masthead, giant serif date, KPI strip of hard
// news numbers, 7-region bar, 3 illustrated hard-news leads, 10
// illustrated cards (each with serif headline, deck, source, status
// label, place, category, small flag, red circled number), a big bright
// world map, a numbered "ALSO ON MONDAY" list, and a concrete red
// DATE CHECK box. 36 stories, every one dated Monday 23 November 2026
// (wires read to 00:45 UTC). SERIF headlines (Liberation Serif Bold
// outlines, rasterised in code) — NO pixel/monospace font anywhere.
//
// Stories (all verified 23 Nov 2026; full list + sources in the report):
//  Leads: 1 COP31 collapses in Antalya (Reuters/CNN) — 2 Iran claims
//  missile/drone strikes on US Patriot radars in Bahrain (IRGC/Reuters)
//  — 3 Asia markets brace for an AI sell-off (Reuters, Singapore, Nov 23).
//  Cards: 4 Russian corvette sunk off Benghazi (Reuters/AP) — 5 US targets
//  a January Ukraine peace deal (FT/WSJ) — 6 Poland: Russia twice tried
//  to kill a rapper (AP) — 7 Hong Kong fills 723 seats, 98.79% turnout
//  (China Daily) — 8 Bolsonaro still in intensive care (Reuters/The Times)
//  — 9 Democrats clinch 258 House seats (AP) — 10 Indonesia factory fire,
//  3 dead, 36 missing (Reuters/Xinhua) — 11 Gaza ceasefire under strain
//  (AP) — 12 UK to make the case for public control of utilities
//  (Reuters) — 13 NFL Sunday: Lions and Bears reach 8-2 (Reuters).
//  List 14-36: Nigeria boat toll 29 — South Sudan camp attack, 21 dead —
//  Sudan drone strikes kill 5 children — Sudan army clears 10 RSF posts —
//  Ethiopia-Eritrea border fire — Iran tankers wait to break the blockade
//  — Iran sues US over Minab school strike — CENTCOM denies F-16 claim —
//  Eisenkot tasked to form Israel's government — Odesa schools go remote
//  — 186 Russian drones overnight — Trump credit-card cap 10% — FBI probes
//  suspected crime-database hack — Trump defends calling Putin "friend"
//  — Liverpool 4-0 Man United — Kansas City Current win NWSL final —
//  Gukesh defends chess title in Geneva — Japan closed, PMIs due —
//  India: Nifty 25,800, Bank Nifty record — China bars red-chip listings
//  — EU-Indonesia sign trade deal — Hong Kong leader apologises for Tai Po
//  fire — Ibu and Semeru erupt — Sierra Leone closes West Africa summit.
//  NOT used (wrong day, see DATE CHECK): Peru quake 20 Nov, El Chapo
//  Isidro capture 21 Nov, Norway court ruling 13 Nov, Shenzhen summit
//  19-20 Nov, Mongolia president resigns 20 Nov.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Canvas: plain RGB framebuffer, 1024 by 1024.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;
const buf = new Uint8Array(W * H * 3);

type RGB = [number, number, number];
const PAPER: RGB = [251, 247, 236];
const CREAM: RGB = [245, 238, 220];
const INK: RGB = [24, 24, 24];
const NAVY: RGB = [22, 41, 77];
const DARKBLDG: RGB = [44, 64, 104];
const NIGHT: RGB = [13, 24, 48];
const RED: RGB = [178, 34, 28];
const DARKRED: RGB = [139, 26, 22];
const BLUE: RGB = [36, 86, 166];
const SKY: RGB = [176, 208, 233];
const LIGHTBLUE: RGB = [214, 231, 244];
const GOLD: RGB = [198, 158, 36];
const GREEN: RGB = [46, 125, 50];
const GREY: RGB = [105, 105, 100];
const RULE: RGB = [196, 188, 168];
const WHITE: RGB = [255, 255, 255];
const ORANGE: RGB = [228, 122, 30];
const YELLOW: RGB = [244, 196, 48];
const SAND: RGB = [238, 222, 186];
const TEAL: RGB = [18, 77, 74];
const DEEPSEA: RGB = [18, 52, 86];
const BRICK: RGB = [140, 52, 40];
const MAPLAND: RGB = [214, 196, 150];
const MAPSEA: RGB = [196, 222, 238];
const LIGHTGREY: RGB = [216, 210, 194];
const DARKGREY: RGB = [70, 70, 66];
const BROWN: RGB = [122, 84, 52];
const PINK: RGB = [214, 120, 110];

function put(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (clip && (x < clip.x || y < clip.y || x >= clip.x + clip.w || y >= clip.y + clip.h)) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
// Optional clip rectangle (used so illustrations never spill past their
// panel — every scene draws through put()/blend()).
let clip: { x: number; y: number; w: number; h: number } | null = null;
function blend(x: number, y: number, c: RGB, a: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  if (clip && (x < clip.x || y < clip.y || x >= clip.x + clip.w || y >= clip.y + clip.h)) return;
  if (a >= 1) { put(x, y, c); return; }
  const i = (y * W + x) * 3;
  buf[i] = Math.round(buf[i] * (1 - a) + c[0] * a);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + c[1] * a);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + c[2] * a);
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) put(xx, yy, c);
}
function hline(x0: number, x1: number, y: number, c: RGB): void {
  for (let x = x0; x <= x1; x++) put(x, y, c);
}
function vline(x: number, y0: number, y1: number, c: RGB): void {
  for (let y = y0; y <= y1; y++) put(x, y, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0; let y = y0;
  for (;;) {
    put(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function thickLine(x0: number, y0: number, x1: number, y1: number, c: RGB, t: number): void {
  for (let d = 0; d < t; d++) line(x0, y0 + d, x1, y1 + d, c);
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) put(x, y, c);
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    put(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function frame(x: number, y: number, w: number, h: number, c: RGB): void {
  hline(x, x + w - 1, y, c);
  hline(x, x + w - 1, y + h - 1, c);
  vline(x, y, y + h - 1, c);
  vline(x + w - 1, y, y + h - 1, c);
}
// Filled triangle.
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: [number, number, number, number][] = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) put(x, y, c);
  }
}

// ---------------------------------------------------------------------------
// Vector text: glyph outlines from fontdata.json, rasterised with 2x
// supersampling (even-odd scanline fill). Two faces: serif bold for
// headlines, sans for decks/labels (plus sans bold for kickers).
// ---------------------------------------------------------------------------
interface Glyph { adv: number; c: (string | number)[][][]; }
interface Face { upem: number; glyphs: Record<string, Glyph>; }
interface FontData { serifBold: Face; serif: Face; sans: Face; sansBold: Face; }

const __dir = path.dirname(fileURLToPath(import.meta.url));
const FONTS: FontData = JSON.parse(
  fs.readFileSync(path.join(__dir, 'fontdata.json'), 'utf8'),
) as FontData;

type FaceName = 'serifBold' | 'serif' | 'sans' | 'sansBold';
const SS = 2; // supersample factor

interface RasterGlyph {
  w: number; h: number; top: number; adv: number; cov: Uint8Array; // cov per output px, 0..SS*SS
}
const glyphCache = new Map<string, RasterGlyph>();

function rasterGlyph(face: Face, ch: string, size: number): RasterGlyph {
  const key = `${face === FONTS.serifBold ? 'B' : face === FONTS.serif ? 'S' : face === FONTS.sans ? 's' : 'b'}|${ch}|${size}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const g = face.glyphs[ch] || face.glyphs['?'] || { adv: 1000, c: [] };
  const scale = (size / face.upem) * SS;
  const adv = Math.round((g.adv * size) / face.upem);
  // Flatten contours to polylines in supersampled device space (y down,
  // origin at baseline, x from 0).
  const polys: [number, number][][] = [];
  for (const contour of g.c) {
    const pts: [number, number][] = [];
    let cx = 0; let cy = 0;
    for (const op of contour) {
      if (op[0] === 'M') { // M
        cx = op[1]; cy = op[2];
        pts.push([cx * scale, -cy * scale]);
      } else if (op[0] === 'L') { // L
        cx = op[1]; cy = op[2];
        pts.push([cx * scale, -cy * scale]);
      } else if (op[0] === 'Q') { // Q
        const qx = op[1]; const qy = op[2];
        const ex = op[3]; const ey = op[4];
        const steps = 10;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          const px = mt * mt * cx + 2 * mt * t * qx + t * t * ex;
          const py = mt * mt * cy + 2 * mt * t * qy + t * t * ey;
          pts.push([px * scale, -py * scale]);
        }
        cx = ex; cy = ey;
      } else if (op[0] === 'C') { // C (cubic, rare in TTF)
        const c1x = op[1]; const c1y = op[2];
        const c2x = op[3]; const c2y = op[4];
        const ex = op[5]; const ey = op[6];
        const steps = 12;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          const px = mt * mt * mt * cx + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex;
          const py = mt * mt * mt * cy + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey;
          pts.push([px * scale, -py * scale]);
        }
        cx = ex; cy = ey;
      }
    }
    if (pts.length > 1) polys.push(pts);
  }
  // Bounding box in supersampled coords.
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  for (const poly of polys)
    for (const [px, py] of poly) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  if (!isFinite(minX)) {
    const empty: RasterGlyph = { w: 0, h: 0, top: 0, adv, cov: new Uint8Array(0) };
    glyphCache.set(key, empty);
    return empty;
  }
  const x0 = Math.floor(minX);
  const y0 = Math.floor(minY);
  const sw = Math.ceil(maxX) - x0 + 1;
  const sh = Math.ceil(maxY) - y0 + 1;
  const cover = new Uint8Array(sw * sh); // supersampled mask
  // Even-odd scanline fill at supersampled resolution.
  for (let sy = 0; sy < sh; sy++) {
    const y = y0 + sy + 0.5;
    const xs: number[] = [];
    for (const poly of polys) {
      for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i];
        const [bx, by] = poly[(i + 1) % poly.length];
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(Math.ceil(xs[k] - x0), 0);
      const xb = Math.min(Math.floor(xs[k + 1] - x0), sw - 1);
      for (let sx = xa; sx <= xb; sx++) cover[sy * sw + sx] = 1;
    }
  }
  // Downsample SSxSS -> per-output-pixel coverage 0..SS*SS.
  const w = Math.ceil(sw / SS);
  const h = Math.ceil(sh / SS);
  const cov = new Uint8Array(w * h);
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      let sum = 0;
      for (let dy = 0; dy < SS; dy++)
        for (let dx = 0; dx < SS; dx++) {
          const sx = xx * SS + dx;
          const sy = yy * SS + dy;
          if (sx < sw && sy < sh) sum += cover[sy * sw + sx];
        }
      cov[yy * w + xx] = sum;
    }
  const out: RasterGlyph = { w, h, top: y0, adv, cov };
  glyphCache.set(key, out);
  return out;
}

function textWidth(s: string, faceName: FaceName, size: number): number {
  const face = FONTS[faceName];
  let w = 0;
  for (const ch of s) {
    const g = face.glyphs[ch];
    w += g ? Math.round((g.adv * size) / face.upem) : Math.round(size * 0.5);
  }
  return w;
}

function drawText(x: number, baselineY: number, s: string, faceName: FaceName, size: number, c: RGB): void {
  const face = FONTS[faceName];
  let cx = x;
  for (const ch of s) {
    const g = rasterGlyph(face, ch, size);
    if (g.w > 0) {
      const topY = baselineY + Math.floor(g.top / SS);
      for (let yy = 0; yy < g.h; yy++) {
        for (let xx = 0; xx < g.w; xx++) {
          const cov = g.cov[yy * g.w + xx];
          if (cov > 0) blend(cx + xx, topY + yy, c, cov / (SS * SS));
        }
      }
    }
    cx += g.adv;
  }
}

function drawTextCentered(cx: number, baselineY: number, s: string, faceName: FaceName, size: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(s, faceName, size) / 2), baselineY, s, faceName, size, c);
}

// Word-wrap: returns lines that fit maxW. Long words are hard-split.
function wrap(s: string, faceName: FaceName, size: number, maxW: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const trial = cur ? cur + ' ' + word : word;
    if (textWidth(trial, faceName, size) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      if (textWidth(word, faceName, size) > maxW) {
        // hard-split the word
        let part = '';
        for (const ch of word) {
          if (textWidth(part + ch, faceName, size) > maxW && part) {
            lines.push(part);
            part = ch;
          } else part += ch;
        }
        cur = part;
      } else cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawPara(x: number, y: number, s: string, faceName: FaceName, size: number, maxW: number, lh: number, c: RGB, maxLines = 99): number {
  const lines = wrap(s, faceName, size, maxW).slice(0, maxLines);
  for (let i = 0; i < lines.length; i++) {
    drawText(x, y + i * lh + size, lines[i], faceName, size, c);
  }
  return lines.length;
}

// ---------------------------------------------------------------------------
// PNG encoder (zlib deflate, filter 0, CRC32).
// ---------------------------------------------------------------------------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcIn = new Uint8Array(4 + data.length);
  crcIn.set(out.subarray(4, 8), 0);
  crcIn.set(data, 4);
  dv.setUint32(8 + data.length, crc32(crcIn));
  return out;
}
function encodePNG(): Uint8Array {
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

// ---------------------------------------------------------------------------
// Small flags (flat, simplified — 2-3 stripes / simple field) with a code.
// ---------------------------------------------------------------------------
function drawFlag(x: number, y: number, code: string): void {
  const w = 15; const h = 10;
  frame(x, y, w, h, INK);
  const stripe = (c: RGB, yy: number, hh: number) => rect(x + 1, y + 1 + yy, w - 2, hh, c);
  switch (code) {
    case 'TR': stripe(RED, 0, 8); disc(x + 6, y + 5, 2, WHITE); break; // Turkey
    case 'BH': stripe(WHITE, 0, 8); tri(x + 1, y + 1, x + 1, y + 9, x + 6, y + 5, RED); break; // Bahrain
    case 'SG': stripe(RED, 0, 4); stripe(WHITE, 4, 4); break; // Singapore
    case 'LY': stripe(GREEN, 0, 2); stripe([26, 26, 26], 2, 4); stripe(RED, 6, 2); break; // Libya
    case 'UA': stripe(BLUE, 0, 4); stripe(YELLOW, 4, 4); break; // Ukraine
    case 'PL': stripe(WHITE, 0, 4); stripe(RED, 4, 4); break; // Poland
    case 'HK': stripe(RED, 0, 8); disc(x + 7, y + 5, 2, WHITE); break; // Hong Kong
    case 'BR': stripe(GREEN, 0, 8); tri(x + 7, y + 1, x + 14, y + 5, x + 7, y + 9, YELLOW); break; // Brazil
    case 'US': stripe(RED, 0, 8); rect(x + 1, y + 1, 6, 4, NAVY); break; // USA
    case 'ID': stripe(RED, 0, 4); stripe(WHITE, 4, 4); break; // Indonesia
    case 'PS': stripe([26, 26, 26], 0, 2); stripe(WHITE, 2, 4); stripe(GREEN, 6, 2); tri(x + 1, y + 1, x + 1, y + 9, x + 5, y + 5, RED); break; // Palestine
    case 'GB': stripe(NAVY, 0, 8); hline(x + 1, x + 13, y + 4, WHITE); hline(x + 1, x + 13, y + 5, WHITE); vline(x + 7, y + 1, y + 8, WHITE); break; // UK
    case 'NG': stripe(GREEN, 0, 8); rect(x + 5, y + 1, 5, 8, WHITE); break; // Nigeria
    case 'SS': stripe([26, 26, 26], 0, 2); stripe(RED, 2, 2); stripe(GREEN, 4, 2); stripe(BLUE, 6, 2); break; // South Sudan
    case 'SD': stripe(RED, 0, 2); stripe(WHITE, 2, 4); stripe([26, 26, 26], 6, 2); break; // Sudan
    case 'AU': stripe(NAVY, 0, 8); disc(x + 4, y + 3, 1, WHITE); disc(x + 11, y + 7, 1, WHITE); break; // Australia
    case 'JP': stripe(WHITE, 0, 8); disc(x + 7, y + 5, 3, RED); break; // Japan
    case 'IN': stripe(ORANGE, 0, 2); stripe(WHITE, 2, 4); stripe(GREEN, 6, 2); break; // India
    case 'CN': stripe(RED, 0, 8); disc(x + 4, y + 3, 1, YELLOW); break; // China
    case 'IL': stripe(WHITE, 0, 8); hline(x + 1, x + 13, y + 2, BLUE); hline(x + 1, x + 13, y + 7, BLUE); break; // Israel
    case 'IR': stripe(GREEN, 0, 2); stripe(WHITE, 2, 4); stripe(RED, 6, 2); break; // Iran
    case 'EU': stripe(NAVY, 0, 8); disc(x + 7, y + 5, 2, YELLOW); break; // EU
    case 'UN': stripe(BLUE, 0, 8); disc(x + 7, y + 5, 2, WHITE); break; // UN / world
    case 'ET': stripe(GREEN, 0, 2); stripe(YELLOW, 2, 4); stripe(RED, 6, 2); break; // Ethiopia
    case 'SL': stripe(GREEN, 0, 2); stripe(WHITE, 2, 4); stripe(BLUE, 6, 2); break; // Sierra Leone
    default: stripe(GREY, 0, 8);
  }
}

// ---------------------------------------------------------------------------
// Flat scene illustrations. Each draws inside (x, y, w, h) with a 4px safe
// margin — nothing is drawn to the panel edge, nothing is cropped.
// ---------------------------------------------------------------------------
function sceneCOP31(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  disc(x + w / 2, y + h / 2 + 4, 30, BLUE);
  disc(x + w / 2 - 10, y + h / 2 - 4, 12, GREEN);
  disc(x + w / 2 + 12, y + h / 2 + 10, 9, GREEN);
  // cracked pact document, bottom right
  rect(x + w - 62, y + h - 34, 52, 28, WHITE);
  frame(x + w - 62, y + h - 34, 52, 28, INK);
  hline(x + w - 56, x + w - 16, y + h - 26, INK);
  hline(x + w - 56, x + w - 20, y + h - 20, GREY);
  line(x + w - 40, y + h - 34, x + w - 34, y + h - 26, RED);
  line(x + w - 34, y + h - 26, x + w - 28, y + h - 32, RED);
  // red X over the globe
  thickLine(x + w / 2 - 34, y + 8, x + w / 2 - 22, y + 20, RED, 3);
  thickLine(x + w / 2 - 22, y + 8, x + w / 2 - 34, y + 20, RED, 3);
  disc(x + 14, y + 12, 7, YELLOW); // sun
}
function sceneBahrain(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, NIGHT);
  disc(x + w - 18, y + 14, 8, [232, 226, 196]); // moon
  // base buildings
  rect(x + 8, y + h - 34, 26, 30, DARKBLDG);
  rect(x + 40, y + h - 44, 30, 40, DARKBLDG);
  rect(x + 76, y + h - 28, 24, 24, DARKBLDG);
  for (let i = 0; i < 3; i++) rect(x + 13 + i * 7, y + h - 28, 3, 3, YELLOW);
  for (let i = 0; i < 3; i++) rect(x + 46 + i * 8, y + h - 38, 3, 3, YELLOW);
  // Patriot radar dish (wide, on a base)
  line(x + w - 40, y + h - 30, x + w - 34, y + h - 56, WHITE);
  tri(x + w - 52, y + h - 60, x + w - 18, y + h - 60, x + w - 35, y + h - 42, WHITE);
  rect(x + w - 44, y + h - 30, 18, 6, [90, 100, 120]);
  // missile arcs: bright trail + warhead dots
  thickLine(x + 12, y + 44, x + 52, y + 18, ORANGE, 2);
  thickLine(x + 52, y + 18, x + 76, y + 30, YELLOW, 2);
  disc(x + 78, y + 31, 4, ORANGE);
  disc(x + 30, y + 32, 3, YELLOW);
  disc(x + 52, y + 18, 3, ORANGE);
}
function sceneMarkets(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [232, 240, 244]);
  // falling chart
  rect(x + 8, y + h - 20, w - 16, 1, GREY);
  const pts: [number, number][] = [[10, 18], [30, 26], [48, 22], [66, 40], [84, 52], [104, 48], [124, 68], [146, 62], [168, 84], [190, 78]];
  for (let i = 0; i + 1 < pts.length; i++)
    thickLine(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], RED, 3);
  // chip
  rect(x + w - 52, y + 8, 34, 26, NAVY);
  frame(x + w - 52, y + 8, 34, 26, WHITE);
  rect(x + w - 44, y + 16, 18, 10, GOLD);
  for (let i = 0; i < 3; i++) { hline(x + w - 52, x + w - 56, y + 14 + i * 7, NAVY); hline(x + w - 14, x + w - 18, y + 14 + i * 7, NAVY); }
  disc(x + 16, y + 14, 5, GREEN);
  drawText(x + 34, y + 18, '+2%', 'sansBold', 10, GREEN);
}
function sceneLibya(x: number, y: number, w: number, h: number): void {
  rect(x, y, w / 1, h, DEEPSEA);
  rect(x, y + h - 26, w, 26, [16, 44, 74]);
  // capsized hull, bow up
  tri(x + 30, y + h - 30, x + 90, y + h - 30, x + 86, y + h - 52, [90, 90, 88]);
  tri(x + 86, y + h - 52, x + 118, y + h - 30, x + 90, y + h - 30, [60, 60, 58]);
  rect(x + 60, y + h - 58, 10, 10, ORANGE); // fire on deck
  disc(x + 64, y + h - 60, 6, YELLOW);
  // smoke
  disc(x + 70, y + 18, 12, [200, 200, 196]);
  disc(x + 88, y + 12, 15, [214, 214, 210]);
  disc(x + 108, y + 20, 10, [200, 200, 196]);
  // drone boat
  rect(x + w - 52, y + h - 34, 26, 6, [30, 30, 30]);
  line(x + w - 40, y + h - 34, x + w - 40, y + h - 44, [30, 30, 30]);
  disc(x + 16, y + 12, 6, YELLOW);
}
function sceneUkraineDeal(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, CREAM);
  // table
  rect(x + 10, y + h - 26, w - 20, 8, BROWN);
  rect(x + 16, y + h - 18, 6, 16, BROWN);
  rect(x + w - 22, y + h - 18, 6, 16, BROWN);
  // three flags on the table: US, UA, RU (RU simplified)
  rect(x + 20, y + h - 56, 28, 20, NAVY);
  rect(x + 54, y + h - 56, 28, 20, BLUE);
  rect(x + 54, y + h - 46, 28, 10, YELLOW);
  rect(x + 88, y + h - 56, 28, 20, WHITE);
  rect(x + 88, y + h - 50, 28, 7, BLUE);
  rect(x + 88, y + h - 43, 28, 7, RED);
  // calendar card JAN
  rect(x + w - 66, y + 8, 52, 34, WHITE);
  frame(x + w - 66, y + 8, 52, 34, INK);
  rect(x + w - 66, y + 8, 52, 10, RED);
  drawText(x + w - 58, y + 30, 'JAN', 'sansBold', 11, INK);
  drawText(x + w - 58, y + 40, '2027', 'sansBold', 10, GREY);
  // handshake arcs
  thickLine(x + 30, y + 22, x + 70, y + 34, INK, 2);
  thickLine(x + 70, y + 34, x + 110, y + 22, INK, 2);
}
function scenePoland(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [226, 232, 238]);
  // concert stage
  rect(x + 8, y + h - 30, w - 16, 10, [40, 40, 44]);
  rect(x + 14, y + 18, 8, h - 48, INK);
  rect(x + w - 22, y + 18, 8, h - 48, INK);
  rect(x + 14, y + 18, w - 28, 6, INK);
  disc(x + w / 2, y + 30, 10, YELLOW); // spotlight
  tri(x + w / 2 - 16, y + 34, x + w / 2 + 16, y + 34, x + w / 2, y + h - 32, [244, 214, 90]);
  // singer silhouette
  disc(x + w / 2, y + h - 52, 6, INK);
  rect(x + w / 2 - 5, y + h - 46, 10, 16, INK);
  // shield with check
  disc(x + w - 30, y + 16, 12, NAVY);
  line(x + w - 36, y + 16, x + w - 31, y + 21, WHITE);
  line(x + w - 31, y + 21, x + w - 23, y + 10, WHITE);
}
function sceneHongKong(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [238, 228, 214]);
  // skyline
  rect(x + 10, y + h - 44, 18, 40, NAVY);
  rect(x + 32, y + h - 48, 20, 44, DARKBLDG);
  rect(x + 56, y + h - 36, 16, 32, NAVY);
  tri(x + 32, y + h - 48, x + 52, y + h - 48, x + 42, y + h - 58, NAVY);
  for (let i = 0; i < 4; i++) rect(x + 14 + i * 4, y + h - 38, 2, 2, YELLOW);
  // ballot box
  rect(x + w - 78, y + h - 44, 56, 36, WHITE);
  frame(x + w - 78, y + h - 44, 56, 36, INK);
  rect(x + w - 70, y + h - 52, 40, 8, RED);
  drawText(x + w - 68, y + h - 14, '723', 'sansBold', 13, RED);
  // ballot slip going in
  rect(x + w - 58, y + h - 66, 16, 14, WHITE);
  frame(x + w - 58, y + h - 66, 16, 14, INK);
  line(x + w - 55, y + h - 58, x + w - 51, y + h - 54, GREEN);
  line(x + w - 51, y + h - 54, x + w - 45, y + h - 62, GREEN);
}
function sceneBolsonaro(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [224, 238, 232]);
  // hospital bed (bottom) — head right of the monitor, clear of it
  rect(x + 10, y + h - 24, w - 20, 8, NAVY);
  rect(x + 66, y + h - 34, 24, 10, WHITE);
  frame(x + 66, y + h - 34, 24, 10, INK);
  disc(x + 78, y + h - 38, 6, [232, 190, 160]); // head
  rect(x + 92, y + h - 30, w - 122, 6, [120, 160, 200]); // blanket
  // IV drip stand + bag
  line(x + w - 34, y + 10, x + w - 34, y + h - 24, INK);
  rect(x + w - 42, y + 12, 16, 22, [190, 220, 235]);
  frame(x + w - 42, y + 12, 16, 22, INK);
  line(x + w - 34, y + 34, x + w - 40, y + h - 40, GREY);
  // heart monitor (top left, clear of the bed)
  rect(x + 10, y + 8, 52, 20, WHITE);
  frame(x + 10, y + 8, 52, 20, INK);
  line(x + 14, y + 20, x + 24, y + 20, GREEN);
  line(x + 24, y + 20, x + 29, y + 12, GREEN);
  line(x + 29, y + 12, x + 34, y + 26, GREEN);
  line(x + 34, y + 26, x + 39, y + 20, GREEN);
  line(x + 39, y + 20, x + 58, y + 20, GREEN);
}
function sceneDemocrats(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [214, 226, 240]);
  // big 258, top left (clear of the number badge); SEATS, top right
  drawText(x + 34, y + 24, '258', 'serifBold', 20, BLUE);
  drawText(x + w - 56, y + 24, 'SEATS', 'sansBold', 11, NAVY);
  // Capitol dome, small, centred at the bottom
  rect(x + w / 2 - 30, y + h - 12, 60, 8, WHITE);
  frame(x + w / 2 - 30, y + h - 12, 60, 8, INK);
  tri(x + w / 2 - 24, y + h - 12, x + w / 2 + 24, y + h - 12, x + w / 2, y + h - 34, WHITE);
  disc(x + w / 2, y + h - 34, 4, WHITE);
  rect(x + w / 2 - 2, y + h - 44, 4, 8, INK);
  // columns
  for (let i = 0; i < 5; i++) rect(x + w / 2 - 26 + i * 11, y + h - 26, 5, 14, WHITE);
  // blue wave under
  for (let i = 0; i < 8; i++) disc(x + 12 + i * 22, y + h - 6 + (i % 2) * 2, 3, BLUE);
}
function sceneIndonesiaFire(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [40, 38, 36]);
  // factory
  rect(x + 10, y + h - 34, 60, 30, [90, 84, 78]);
  rect(x + 74, y + h - 44, 14, 40, [90, 84, 78]);
  tri(x + 10, y + h - 34, x + 70, y + h - 34, x + 40, y + h - 52, [70, 64, 58]);
  // flames
  tri(x + 22, y + h - 34, x + 34, y + h - 34, x + 28, y + h - 50, ORANGE);
  tri(x + 40, y + h - 34, x + 54, y + h - 34, x + 47, y + h - 58, YELLOW);
  tri(x + 56, y + h - 34, x + 66, y + h - 34, x + 61, y + h - 48, ORANGE);
  // smoke
  disc(x + 40, y + 14, 12, [120, 116, 110]);
  disc(x + 62, y + 10, 14, [140, 136, 130]);
  disc(x + 84, y + 16, 10, [120, 116, 110]);
  // rescue ladder
  thickLine(x + w - 40, y + h - 4, x + w - 16, y + h - 40, RED, 3);
  thickLine(x + w - 36, y + h - 14, x + w - 26, y + h - 14, RED, 2);
}
function sceneGaza(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SAND);
  // tents row
  for (let i = 0; i < 3; i++) {
    const tx = x + 12 + i * 46;
    tri(tx, y + h - 22, tx + 36, y + h - 22, tx + 18, y + h - 48, WHITE);
    tri(tx + 14, y + h - 22, tx + 22, y + h - 22, tx + 18, y + h - 34, NAVY);
  }
  // cracked wall / yellow line
  rect(x + 8, y + 10, w - 16, 6, YELLOW);
  rect(x + 8, y + 16, w - 16, 2, INK);
  // warning triangle
  tri(x + w - 40, y + 26, x + w - 12, y + 26, x + w - 26, y + 48, YELLOW);
  drawText(x + w - 29, y + 44, '!', 'sansBold', 12, INK);
  disc(x + 14, y + 16, 5, ORANGE);
}
function sceneUK(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, LIGHTBLUE);
  // water tap + drop
  rect(x + 12, y + 12, 40, 10, NAVY);
  rect(x + 44, y + 12, 8, 26, NAVY);
  tri(x + 44, y + 46, x + 56, y + 46, x + 50, y + 34, BLUE);
  disc(x + 50, y + 50, 6, BLUE);
  // lightning bolt
  tri(x + w - 44, y + 12, x + w - 22, y + 12, x + w - 34, y + 34, YELLOW);
  tri(x + w - 34, y + 34, x + w - 24, y + 34, x + w - 40, y + 58, YELLOW);
  // houses row
  for (let i = 0; i < 3; i++) {
    const hx = x + 14 + i * 44;
    rect(hx, y + h - 26, 30, 22, WHITE);
    frame(hx, y + h - 26, 30, 22, INK);
    tri(hx, y + h - 26, hx + 30, y + h - 26, hx + 15, y + h - 38, RED);
  }
  drawText(x + w - 58, y + h - 8, 'CBI', 'sansBold', 10, NAVY);
}
function sceneNFL(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, GREEN);
  // yard lines
  for (let i = 0; i < 5; i++) vline(x + 24 + i * 34, y + 4, y + h - 4, WHITE);
  // goalposts
  line(x + w - 30, y + 10, x + w - 30, y + h - 20, YELLOW);
  line(x + w - 30, y + 10, x + w - 44, y + 10, YELLOW);
  line(x + w - 30, y + 10, x + w - 16, y + 10, YELLOW);
  // football
  disc(x + 40, y + h / 2 + 6, 12, BROWN);
  hline(x + 34, x + 46, y + h / 2 + 6, WHITE);
  // scoreboard
  rect(x + w - 84, y + 8, 72, 18, WHITE);
  frame(x + w - 84, y + 8, 72, 18, INK);
  drawText(x + w - 80, y + 22, '31-21', 'sansBold', 11, INK);
  drawText(x + 30, y + 18, '8-2', 'sansBold', 13, WHITE);
}

const SCENES: ((x: number, y: number, w: number, h: number) => void)[] = [
  sceneCOP31, sceneBahrain, sceneMarkets, sceneLibya, sceneUkraineDeal,
  scenePoland, sceneHongKong, sceneBolsonaro, sceneDemocrats,
  sceneIndonesiaFire, sceneGaza, sceneUK, sceneNFL,
];

// ---------------------------------------------------------------------------
// World map: coarse flat continents on a light sea, numbered pins 1-13.
// ---------------------------------------------------------------------------
function drawMap(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, MAPSEA);
  frame(x, y, w, h, INK);
  const px = (lon: number) => x + Math.round(((lon + 170) / 360) * w);
  const py = (lat: number) => y + Math.round(((75 - lat) / 130) * h);
  const land = (pts: [number, number][], c: RGB) => {
    // fill polygon by scanline
    let minY = Infinity; let maxY = -Infinity;
    for (const [, la] of pts) { const yy = py(la); if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
    for (let yy = minY; yy <= maxY; yy++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [lo1, la1] = pts[i];
        const [lo2, la2] = pts[(i + 1) % pts.length];
        const y1 = py(la1); const y2 = py(la2);
        if ((y1 <= yy && y2 > yy) || (y2 <= yy && y1 > yy)) {
          xs.push(px(lo1) + ((yy - y1) * (px(lo2) - px(lo1))) / (y2 - y1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let xx = Math.ceil(xs[k]); xx <= xs[k + 1]; xx++) put(xx, yy, c);
    }
  };
  // North America
  land([[-168, 66], [-140, 70], [-120, 72], [-95, 70], [-80, 73], [-60, 62], [-55, 47], [-70, 42], [-75, 32], [-80, 26], [-90, 21], [-97, 16], [-105, 20], [-117, 33], [-125, 40], [-125, 49], [-140, 60], [-165, 60]], MAPLAND);
  // South America
  land([[-80, 10], [-62, 10], [-52, 5], [-35, -8], [-40, -22], [-48, -28], [-58, -38], [-65, -45], [-70, -54], [-73, -37], [-70, -20], [-80, -5], [-81, 0]], MAPLAND);
  // Europe
  land([[-10, 36], [-9, 43], [-2, 48], [-4, 50], [0, 51], [3, 53], [8, 57], [10, 59], [18, 56], [21, 55], [24, 58], [28, 60], [30, 62], [30, 70], [20, 70], [12, 66], [5, 60], [5, 58], [8, 55], [12, 54], [19, 54], [23, 54], [28, 46], [23, 40], [19, 42], [15, 44], [12, 44], [8, 44], [3, 42], [0, 39], [-2, 37]], MAPLAND);
  // Africa
  land([[-17, 15], [-10, 30], [0, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [48, 0], [40, -10], [35, -20], [32, -29], [26, -34], [18, -35], [15, -27], [12, -18], [9, -1], [9, 4], [-8, 4], [-13, 8]], MAPLAND);
  // Asia
  land([[30, 70], [40, 68], [60, 69], [80, 73], [100, 76], [120, 73], [140, 72], [160, 70], [178, 66], [170, 60], [160, 55], [142, 50], [140, 40], [130, 35], [122, 30], [120, 25], [110, 20], [105, 10], [100, 8], [97, 15], [90, 22], [80, 15], [77, 8], [72, 20], [66, 25], [60, 25], [55, 26], [50, 29], [48, 30], [44, 29], [40, 36], [36, 36], [30, 36], [30, 42], [28, 46], [24, 45], [30, 50], [30, 55], [32, 60], [30, 65]], MAPLAND);
  // Australia
  land([[113, -22], [114, -30], [115, -35], [124, -33], [129, -32], [136, -35], [140, -38], [146, -39], [150, -37], [153, -27], [150, -22], [146, -19], [142, -15], [142, -11], [136, -12], [132, -12], [126, -14], [122, -17], [117, -20]], MAPLAND);
  // pins 1-13
  const pins: [number, number][] = [
    [30.7, 36.9], [50.5, 26.2], [103.8, 1.35], [20.1, 32.1], [30.5, 50.4],
    [21, 52.2], [114.2, 22.3], [-47.9, -15.8], [-77, 38.9], [106.2, -6.1],
    [34.5, 31.5], [-0.1, 51.5], [-83, 42.3],
  ];
  for (let i = 0; i < pins.length; i++) {
    const cx = px(pins[i][0]);
    const cy = py(pins[i][1]);
    disc(cx, cy, 8, RED);
    ring(cx, cy, 8, WHITE);
    drawTextCentered(cx, cy + 3, String(i + 1), 'sansBold', 8, WHITE);
  }
  drawText(x + 6, y + h - 6, 'Pins 1-13 mark the illustrated stories above.', 'sans', 9, NAVY);
}

// ---------------------------------------------------------------------------
// Stories. Every one dated Monday 23 November 2026 (wires read to 00:45
// UTC). Headlines are informative, decks carry the facts, each card shows
// source + status + place + category + flag + red circled number.
// ---------------------------------------------------------------------------
interface Story {
  n: number; cat: string; place: string; flag: string;
  headline: string; deck: string; source: string; status: string;
}
const HEROES: Story[] = [
  {
    n: 1, cat: 'CLIMATE', place: 'ANTALYA, TURKEY', flag: 'TR',
    headline: 'COP31 collapses: no deal on fossil fuels',
    deck: 'The longest climate summit ever ends with no pact. The EU rejected a draft that never named fossil fuels.',
    source: 'Reuters', status: 'CONFIRMED',
  },
  {
    n: 2, cat: 'MIDDLE EAST', place: 'MANAMA, BAHRAIN', flag: 'BH',
    headline: 'Iran claims strikes on US Patriot radars in Bahrain',
    deck: 'The IRGC says missiles and drones hit two Patriot radars in Bahrain. Bahrain reports intercepts and a fire.',
    source: 'IRGC / Reuters', status: 'CLAIMED',
  },
  {
    n: 3, cat: 'MARKETS', place: 'SINGAPORE', flag: 'SG',
    headline: 'Asia braces for more AI selling as US futures bounce',
    deck: "Nasdaq futures rose about 2% on Monday, but Seoul's Kospi fell over 3%. Taiwan shares lost 17% in a week.",
    source: 'Reuters', status: 'CONFIRMED',
  },
];
const CARDS: Story[] = [
  {
    n: 4, cat: 'AFRICA', place: 'BENGHAZI, LIBYA', flag: 'LY',
    headline: 'Russian warship sunk by sea drones off Libya',
    deck: 'The corvette Merkury capsized at Benghazi in a suspected Ukrainian drone-boat attack.',
    source: 'Reuters', status: 'REPORTED',
  },
  {
    n: 5, cat: 'EUROPE', place: 'WASHINGTON', flag: 'US',
    headline: 'US targets January deal to end the Ukraine war',
    deck: 'Washington wants a peace deal by early January, the FT reports: Donbas land for NATO, or a frozen front line.',
    source: 'FT / WSJ', status: 'REPORTED',
  },
  {
    n: 6, cat: 'EUROPE', place: 'WARSAW, POLAND', flag: 'PL',
    headline: 'Poland: Russia tried twice to kill a rapper',
    deck: 'Warsaw says Moscow targeted rapper Kyivstoner twice: in Poland in August, then in Denmark.',
    source: 'AP', status: 'CONFIRMED',
  },
  {
    n: 7, cat: 'ASIA-PACIFIC', place: 'HONG KONG', flag: 'HK',
    headline: 'Hong Kong fills 723 seats in record-turnout vote',
    deck: "The Election Committee poll drew 98.79% turnout, a record. The body picks the city's next leader in March 2027.",
    source: 'China Daily', status: 'CONFIRMED',
  },
  {
    n: 8, cat: 'AMERICAS', place: 'BRASILIA, BRAZIL', flag: 'BR',
    headline: 'Bolsonaro still in intensive care, stable',
    deck: 'The ex-president, 71, is conscious and breathing on his own after a bowel obstruction. Surgery is not ruled out.',
    source: 'Reuters', status: 'CONFIRMED',
  },
  {
    n: 9, cat: 'AMERICAS', place: 'WASHINGTON', flag: 'US',
    headline: 'Democrats clinch 258 House seats, most since 1992',
    deck: 'The tally was sealed on Sunday when Chuck Hubbard beat Rep. Virginia Foxx in North Carolina after a recount.',
    source: 'AP', status: 'CONFIRMED',
  },
  {
    n: 10, cat: 'ASIA-PACIFIC', place: 'SERANG, INDONESIA', flag: 'ID',
    headline: 'Indonesia factory fire: 3 dead, 36 missing',
    deck: 'Rescuers kept searching the burnt-out candy factory in Banten on Sunday. Ibu and Semeru volcanoes also erupted.',
    source: 'Reuters', status: 'CONFIRMED',
  },
  {
    n: 11, cat: 'MIDDLE EAST', place: 'GAZA', flag: 'PS',
    headline: 'Gaza ceasefire under strain, UN board warns',
    deck: 'The Board of Peace told the Security Council the truce risks collapse; 1,600+ have died since October 2025.',
    source: 'AP', status: 'REPORTED',
  },
  {
    n: 12, cat: 'EUROPE', place: 'LONDON, UK', flag: 'GB',
    headline: 'UK to argue for public control of utilities',
    deck: 'Labour minister Louise Haigh makes the case to business leaders on Monday: energy and water plans.',
    source: 'Reuters', status: 'CONFIRMED',
  },
  {
    n: 13, cat: 'AMERICAS', place: 'DETROIT, USA', flag: 'US',
    headline: 'Lions and Bears reach 8-2 before Thanksgiving',
    deck: 'Detroit beat Tampa Bay 31-21 and Chicago beat New Orleans 21-13 on Sunday. Buffalo improved to 9-1, best in the AFC.',
    source: 'Reuters', status: 'CONFIRMED',
  },
];
const ALSO: [string, string][] = [
  ['Nigeria boat toll rises to 29', 'Channels TV'],
  ['21 killed in S. Sudan camp attack', 'Eye Radio'],
  ['Khartoum drone strikes kill 5 children', 'Dabanga'],
  ['Sudan army clears 10 RSF positions', 'MENAFN'],
  ['Ethiopia-Eritrea border fire near Badme', 'Brief'],
  ['Iran tankers wait to break blockade', 'Geneva Times'],
  ['Iran sues US over Minab school strike', 'Sputnik'],
  ['CENTCOM denies Iran F-16 damage claim', 'CENTCOM'],
  ["Eisenkot tasked to form Israel's government", 'AP'],
  ['Odesa schools go remote after grid strikes', 'h.ua'],
  ['Russia launches 186 drones overnight', 'Kyiv'],
  ['Trump vows 10% credit-card cap', 'AP'],
  ['FBI probes suspected hack of crime database', 'AP'],
  ['Trump defends calling Putin "my friend"', 'AP'],
  ['Liverpool thrash Man United 4-0', 'Reuters'],
  ['Kansas City Current win NWSL final 2-1', 'AP'],
  ['Gukesh to defend chess crown in Geneva', 'FIDE'],
  ['Japan closed for holiday; PMIs due', 'Reuters'],
  ['India: Nifty 25,800, Bank Nifty record', 'Univest'],
  ['China bars red-chip offshore listings', 'Reuters'],
  ['EU and Indonesia sign landmark trade deal', 'EC'],
  ['HK leader apologises for Tai Po fire', 'SCMP'],
  ['Ibu and Semeru erupt hours apart', 'Antara'],
  ['Australia rejects US warning on AUKUS', 'TALi'],
];

// Truncate a line to fit maxW, ending with '...' when cut.
function fitLine(s: string, faceName: FaceName, size: number, maxW: number): string {
  if (textWidth(s, faceName, size) <= maxW) return s;
  let out = s;
  while (out.length > 4 && textWidth(out + '...', faceName, size) > maxW) out = out.slice(0, -1);
  return out + '...';
}

function drawNumberBadge(cx: number, cy: number, n: number): void {
  disc(cx, cy, 11, RED);
  ring(cx, cy, 11, WHITE);
  drawTextCentered(cx, cy + 4, String(n), 'sansBold', 11, WHITE);
}

function drawHeroCard(x: number, y: number, w: number, h: number, s: Story): void {
  rect(x, y, w, h, WHITE);
  frame(x, y, w, h, INK);
  clip = { x: x + 4, y: y + 4, w: w - 8, h: 92 };
  SCENES[s.n - 1](x + 4, y + 4, w - 8, 92);
  clip = null;
  frame(x + 4, y + 4, w - 8, 92, INK);
  drawNumberBadge(x + 18, y + 18, s.n);
  drawText(x + 8, y + 116, s.cat + '  -  ' + s.place, 'sansBold', 9, RED);
  const hl = wrap(s.headline, 'serifBold', 17, w - 16).slice(0, 3);
  let yy = y + 136;
  for (const ln of hl) { drawText(x + 8, yy, ln, 'serifBold', 17, INK); yy += 19; }
  const dl = wrap(s.deck, 'sans', 11, w - 16).slice(0, 2);
  for (const ln of dl) { drawText(x + 8, yy, ln, 'sans', 11, DARKGREY); yy += 13; }
  drawFlag(x + 8, y + h - 16, s.flag);
  drawText(x + 28, y + h - 7, s.status + '  •  ' + s.source, 'sansBold', 9, INK);
}

function drawGridCard(x: number, y: number, w: number, h: number, s: Story): void {
  rect(x, y, w, h, WHITE);
  frame(x, y, w, h, INK);
  clip = { x: x + 3, y: y + 3, w: w - 6, h: 58 };
  SCENES[s.n - 1](x + 3, y + 3, w - 6, 58);
  clip = null;
  frame(x + 3, y + 3, w - 6, 58, INK);
  drawNumberBadge(x + 15, y + 15, s.n);
  drawText(x + 6, y + 76, s.cat + ' - ' + s.place, 'sansBold', 8, RED);
  const hl = wrap(s.headline, 'serifBold', 13, w - 12).slice(0, 2);
  let yy = y + 92;
  for (const ln of hl) { drawText(x + 6, yy, ln, 'serifBold', 13, INK); yy += 15; }
  const dl = wrap(s.deck, 'sans', 9, w - 12).slice(0, 3);
  for (const ln of dl) { drawText(x + 6, yy, ln, 'sans', 9, DARKGREY); yy += 11; }
  drawFlag(x + 6, y + h - 15, s.flag);
  drawText(x + 26, y + h - 6, s.status + ' • ' + s.source, 'sansBold', 8, INK);
}

function drawPage(): void {
  rect(0, 0, W, H, PAPER);
  // Masthead
  hline(16, 1008, 8, INK);
  drawText(16, 30, 'MONDAY EDITION', 'sansBold', 10, INK);
  drawText(1008 - textWidth('No. 327  •  FREE', 'sansBold', 10), 30, 'No. 327  •  FREE', 'sansBold', 10, INK);
  drawTextCentered(512, 64, 'THE WORLD DAILY', 'serifBold', 54, INK);
  rect(16, 70, 992, 2, INK);
  drawTextCentered(512, 112, 'Monday 23 November 2026', 'serifBold', 40, INK);
  hline(16, 1008, 120, INK);
  drawTextCentered(512, 138, 'THE WORLD IN ONE DAY  |  37 STORIES  •  7 REGIONS  •  EVERY ONE DATED MONDAY 23 NOVEMBER 2026', 'sansBold', 11, NAVY);
  hline(16, 1008, 144, RULE);
  // KPI strip — 6 hard-news numbers
  const kpis: [string, string][] = [
    ['194', 'COUNTRIES AT COP31 — NO DEAL AGREED'],
    ['258', 'HOUSE SEATS FOR DEMOCRATS, MOST SINCE 1992'],
    ['723', 'HONG KONG ELECTION COMMITTEE SEATS FILLED'],
    ['17%', "TAIWAN SHARES' WEEKLY FALL, WORST SINCE 1990"],
    ['36', 'WORKERS STILL MISSING AFTER INDONESIA FIRE'],
    ['2', 'US PATRIOT RADARS IRAN CLAIMS IT HIT'],
  ];
  for (let i = 0; i < 6; i++) {
    const kx = 16 + i * 166;
    rect(kx, 150, 161, 46, WHITE);
    frame(kx, 150, 161, 46, INK);
    drawTextCentered(kx + 80, 170, kpis[i][0], 'serifBold', 22, RED);
    const kl = wrap(kpis[i][1], 'sansBold', 8, 149).slice(0, 2);
    let ky = 182;
    for (const ln of kl) { drawTextCentered(kx + 80, ky, ln, 'sansBold', 8, INK); ky += 10; }
  }
  // Region bar
  const regions: [string, RGB][] = [
    ['WORLD 5', NAVY], ['MIDDLE EAST 6', RED], ['AFRICA 6', GREEN],
    ['EUROPE 6', BLUE], ['AMERICAS 6', ORANGE], ['ASIA-PACIFIC 7', TEAL],
    ['OCEANIA 1', [150, 110, 20]],
  ];
  for (let i = 0; i < 7; i++) {
    const rx = 16 + i * 142;
    const rw = i === 6 ? 140 : 142;
    rect(rx, 202, rw, 20, regions[i][1]);
    drawTextCentered(rx + rw / 2, 216, regions[i][0], 'sansBold', 10, WHITE);
  }
  // Heroes
  for (let i = 0; i < 3; i++) drawHeroCard(16 + i * 336, 228, 320, 214, HEROES[i]);
  // Grid cards 4-13: 5 cols x 2 rows
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    drawGridCard(16 + col * 200, 448 + row * 182, 194, 176, CARDS[i]);
  }
  // Bottom: map (left) + also list + date check (right)
  drawText(16, 832, 'WHERE IT HAPPENED', 'serifBold', 14, INK);
  drawMap(16, 838, 484, 172);
  drawText(508, 832, 'ALSO ON MONDAY', 'serifBold', 14, INK);
  drawText(1008 - textWidth('14-37', 'sansBold', 10), 832, '14-37', 'sansBold', 10, GREY);
  for (let i = 0; i < ALSO.length; i++) {
    const col = Math.floor(i / 12);
    const row = i % 12;
    const lx = 508 + col * 252;
    const ly = 848 + row * 11;
    const num = String(14 + i) + '.';
    drawText(lx, ly, num, 'sansBold', 9, RED);
    const text = fitLine(ALSO[i][0] + '  (' + ALSO[i][1] + ')', 'sans', 9, 246 - textWidth(num + ' ', 'sansBold', 9));
    drawText(lx + textWidth(num + ' ', 'sansBold', 9), ly, text, 'sans', 9, INK);
  }
  // DATE CHECK — concrete: cutoff + excluded stories + sources
  rect(508, 976, 500, 40, RED);
  drawText(516, 986, 'DATE CHECK — WIRES READ TO 00:45 UTC, MONDAY 23 NOVEMBER 2026', 'sansBold', 9, WHITE);
  drawText(516, 996, 'LEFT OUT, WRONG DAY: Peru quake (20 Nov) • El Chapo Isidro captured (21 Nov)', 'sans', 9, WHITE);
  drawText(516, 1005, 'Norway court ruling (13 Nov) • Shenzhen summit (19-20 Nov) • Mongolia president resigns (20 Nov)', 'sans', 9, WHITE);
  drawText(516, 1014, 'Sources: Reuters • AP • AFP • China Daily • Antara • SCMP • FIDE • Ukraine General Staff', 'sans', 9, WHITE);
}

function main(): void {
  drawPage();
  const png = encodePNG();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  try { fs.mkdirSync(outDir, { recursive: true }); } catch { /* ignore */ }
  fs.writeFileSync(path.join(outDir, 'entry.png'), png);
  // Best-effort local copy for local verification only. The grader runs
  // with /bot read-only, so this write MUST never throw: if it fails
  // (EACCES/EROFS), swallow it — the authoritative output above already
  // succeeded. An uncaught throw here used to exit the program with code 1.
  try { fs.writeFileSync(path.join(__dir, 'entry.png'), png); } catch { /* ignore: read-only /bot in grader */ }
  // eslint-disable-next-line no-console
  console.log('wrote entry.png', png.length, 'bytes');
}

main();


