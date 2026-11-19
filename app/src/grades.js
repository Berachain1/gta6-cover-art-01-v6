// grades.js — the colour grades painted onto cover panels.
//
// A grade is a gradient map: a pixel's brightness picks a colour off the
// grade's palette, and that colour is blended back toward the pixel it
// came from, so a photo keeps its own identity instead of going flat.
// Poster Ink stacks a comic-book pass on top: a handful of flat
// posterised levels, halftone dots, film grain and a vignette. It all
// runs on plain 2D canvas pixels, so it works on any photo — samples,
// phone shots, anything — with no network and no library.
//
// The ink palette is warm in the mid-tones on purpose. Skin lives in
// the middle of the brightness range, and a magenta-heavy map turns
// faces purple; the ink stops below push mids toward coral-orange
// instead, and warmSkinTones() adds a small red lift and blue cut in
// that same band before posterising, so faces stay warm while shadows
// keep their violet depth.

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Palette stops per grade: [brightness 0..1, red, green, blue]. */
export const GRADE_PALETTES = {
  sunset: [
    [
      0.0,
      26,
      8,
      46,
    ],
    [
      0.28,
      100,
      40,
      70,
    ],
    [
      0.55,
      220,
      130,
      80,
    ],
    [
      0.78,
      250,
      160,
      90,
    ],
    [
      1.0,
      255,
      210,
      63,
    ],
  ],
  neon: [
    [
      0.0,
      10,
      8,
      48,
    ],
    [
      0.3,
      74,
      20,
      120,
    ],
    [
      0.55,
      168,
      38,
      150,
    ],
    [
      0.78,
      255,
      64,
      160,
    ],
    [
      1.0,
      64,
      224,
      208,
    ],
  ],
  golden: [
    [
      0.0,
      40,
      20,
      8,
    ],
    [
      0.3,
      122,
      62,
      18,
    ],
    [
      0.55,
      214,
      122,
      32,
    ],
    [
      0.8,
      255,
      176,
      64,
    ],
    [
      1.0,
      255,
      236,
      160,
    ],
  ],
  // Warm mids by design: coral-orange at 0.55 rather than magenta-pink,
  // so skin in the poster-ink pass reads sun-warmed instead of purple.
  ink: [
    [
      0.0,
      22,
      6,
      38,
    ],
    [
      0.3,
      132,
      38,
      62,
    ],
    [
      0.55,
      224,
      72,
      84,
    ],
    [
      0.78,
      255,
      138,
      58,
    ],
    [
      1.0,
      255,
      214,
      92,
    ],
  ],
};

/**
 * One lookup table per channel for `grade`. `strength` 0..1 sets how far
 * the mapped colour replaces the original pixel (1 = full gradient map).
 */
export function buildGradeLUT(grade, strength = 0.62) {
  const ramp = GRADE_PALETTES[grade] || GRADE_PALETTES.sunset;
  const table = { r: new Uint8Array(256), g: new Uint8Array(256), b: new Uint8Array(256) };
  for (let level = 0; 256 > level; level++) {
    const t = level / 255;
    let low = ramp[0];
    let high = ramp[ramp.length - 1];
    for (let s = 0; ramp.length - 1 > s; s++) {
      if (ramp[s][0] <= t && ramp[s + 1][0] >= t) {
        low = ramp[s];
        high = ramp[s + 1];
        break;
      }
    }
    const span = high[0] - low[0];
    const f = 0 === span ? 0 : (t - low[0]) / span;
    const blend = (channel) => {
      const mapped = (high[channel] - low[channel]) * f + low[channel];
      return Math.round((mapped - level) * strength + level);
    };
    table.r[level] = blend(1);
    table.g[level] = blend(2);
    table.b[level] = blend(3);
  }
  return table;
}

/** Pushes every pixel through the grade LUT, keyed by brightness. */
export function applyGradientGrade(imageData, grade, strength) {
  const table = buildGradeLUT(grade, strength);
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
    px[i] = table.r[lum];
    px[i + 1] = table.g[lum];
    px[i + 2] = table.b[lum];
  }
  return imageData;
}

/**
 * Warms the skin band: pixels whose brightness sits in the middle range
 * get a red lift and a blue cut, fading to nothing at the band edges.
 * This runs before posterising so the poster-ink grade keeps faces warm
 * rather than pushing them toward violet. `amount` 0..1; 0.5 is gentle.
 */
export function warmSkinTones(imageData, amount = 0.5) {
  const px = imageData.data;
  const lift = 14 * amount;
  const cut = 12 * amount;
  for (let i = 0; i < px.length; i += 4) {
    const lum = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
    if (70 > lum || 215 < lum) continue;
    // Triangle weight: full effect near brightness 140, none at the edges.
    const w = 140 > lum ? (lum - 70) / 70 : (215 - lum) / 75;
    px[i] = clampByte(lift * w + px[i]);
    px[i + 2] = clampByte(px[i + 2] - w * cut);
  }
  return imageData;
}

/**
 * Warms the bright end: pixels brighter than `floor` get a red/orange
 * lift that grows with brightness, so skies and highlights glow sunset
 * instead of staying pale blue-white. Only the sunset grade uses it.
 */
export function warmHighlights(imageData, amount = 0.5, floor = 175) {
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + px[i + 2] * 0.114;
    if (floor >= lum) continue;
    const w = amount * ((lum - floor) / (255 - floor));
    px[i] = clampByte(px[i] + w * 26);
    px[i + 1] = clampByte(px[i + 1] + w * 8);
    px[i + 2] = clampByte(px[i + 2] - w * 14);
  }
  return imageData;
}

/** Flattens each channel to `levels` even steps — the comic-ink feel. */
export function posterizeImageData(imageData, levels = 5) {
  const px = imageData.data;
  const quantStep = 255 / (levels - 1);
  for (let i = 0; i < px.length; i += 4) {
    px[i] = Math.round(Math.round(px[i] / quantStep) * quantStep);
    px[i + 1] = Math.round(Math.round(px[i + 1] / quantStep) * quantStep);
    px[i + 2] = Math.round(Math.round(px[i + 2] / quantStep) * quantStep);
  }
  return imageData;
}

/** Pushes colours away from grey in place (1 leaves them unchanged). */
export function saturateImageData(imageData, factor = 1.25) {
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = px[i] * 0.299 + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    for (let c = 0; 3 > c; c++) {
      px[i + c] = clampByte((px[i + c] - lum) * factor + lum);
    }
  }
  return imageData;
}
let halftoneTile = null;
/** A reusable tile of print dots, denser toward one corner of a cell. */
export function makeHalftonePattern(tile = 96) {
  if (halftoneTile) return halftoneTile;
  const c = document.createElement('canvas');
  c.width = tile;
  c.height = tile;
  const x = c.getContext('2d');
  const cell = 12;
  for (let gy = 0; tile / cell > gy; gy++) {
    for (let gx = 0; tile / cell > gx; gx++) {
      const r = 1 + 1.1 * ((gx + gy) % 4);
      x.fillStyle = 'rgba(20,4,32,0.55)';
      x.beginPath();
      x.arc(cell * gx + 0.5 * cell, cell * gy + 0.5 * cell, r, 0, 2 * Math.PI);
      x.fill();
    }
  }
  halftoneTile = c;
  return c;
}

/** Lays halftone dots over a panel at low opacity. */
export function applyHalftone(ctx, w, h, alpha = 0.16) {
  const pattern = ctx.createPattern(makeHalftonePattern(), 'repeat');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

let grainTile = null;
/** A reusable tile of neutral film grain, built once. */
export function makeGrainCanvas(tile = 160) {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = tile;
  c.height = tile;
  const x = c.getContext('2d');
  const img = x.createImageData(tile, tile);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 40) + 118 - 20;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

/** Dusts film grain over a panel with an overlay blend. */
export function applyGrain(ctx, w, h, alpha = 0.07) {
  const pattern = ctx.createPattern(makeGrainCanvas(), 'repeat');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkens a panel's corners so it reads like a printed poster. */
export function applyVignette(ctx, w, h, strength = 0.28) {
  const g = ctx.createRadialGradient(
    0.5 * w, 0.5 * h, 0.32 * Math.min(w, h),
    0.5 * w, 0.5 * h, 0.72 * Math.max(w, h),
  );
  for (const [off, col] of [[0, 'rgba(10,2,20,0)'], [1, `rgba(10,2,20,${strength})`]]) {
    g.addColorStop(off, col);
  }
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Grades one photo panel and returns the graded canvas. `crop` is
 * {fx, fy, zoom} — the focus point (0..1) and zoom (>= 1). The grade runs
 * at most ~760 px wide and is upscaled on draw, which keeps the pixel
 * loops fast without visible loss at post sizes.
 */
export function gradePanelImage(img, panelW, panelH, crop, grade) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(panelW));
  c.height = Math.max(2, Math.round(panelH));
  const panelCtx = c.getContext('2d');
  drawCroppedPhoto(panelCtx, img, 0, 0, panelW, panelH, crop);
  const data = panelCtx.getImageData(0, 0, c.width, c.height);
  if (grade === 'ink') {
    saturateImageData(data, 1.2);
    applyGradientGrade(data, 'ink', 0.42);
    warmSkinTones(data, 0.8);
    posterizeImageData(data, 6);
  } else if (grade === 'neon') {
    saturateImageData(data, 1.3);
    applyGradientGrade(data, 'neon', 0.6);
  } else if (grade === 'golden') {
    applyGradientGrade(data, 'golden', 0.58);
  } else {
    // Sunset (the default): photographic, NOT a gradient map. The map
    // swaps every pixel's hue for a brightness-derived tint (its LUT
    // is keyed on brightness alone), so at any strength it turns the
    // pink car cream and the sea grey. A saturation lift plus warm mids
    // keeps each photo's own colour and gives the warm sunset feel the
    // top covers have. The highlight lift is what makes skies glow
    // orange like #1's instead of staying pale — it only touches the
    // bright end, so mid-tone skin is untouched.
    saturateImageData(data, 1.18);
    warmSkinTones(data, 0.6);
    warmHighlights(data, 0.55);
  }
  panelCtx.putImageData(data, 0, 0);
  if ('ink' === grade) applyHalftone(panelCtx, c.width, c.height, 0.12);
  applyGrain(panelCtx, c.width, c.height, 'ink' !== grade ? 0.06 : 0.09);
  applyVignette(panelCtx, c.width, c.height, 'ink' !== grade ? 0.18 : 0.3);
  return c;
}

/**
 * Cover-fits `img` into the rect (destX, destY, w, h) on `ctx`, panning
 * toward the focus point and zooming in. The crop never shows empty space.
 */
export function drawCroppedPhoto(ctx, img, destX, destY, w, h, crop = {}) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const focusX = crop.fx ?? 0.5;
  const focusY = crop.fy ?? 0.4;
  const zoomFactor = Math.max(1, crop.zoom ?? 1);
  const base = zoomFactor * Math.max(w / iw, h / ih);
  const srcW = w / base;
  const srcH = h / base;
  const sx = Math.max(0, Math.min(iw - srcW, focusX * iw - 0.5 * srcW));
  const sy = Math.max(0, Math.min(ih - srcH, focusY * ih - 0.5 * srcH));
  ctx.drawImage(img, sx, sy, srcW, srcH, destX, destY, w, h);
}
