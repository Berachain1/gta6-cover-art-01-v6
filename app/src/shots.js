// shots.js — fixed scenes for the screenshots, selected by `?shot=`:
//
//   ?shot=cover[&layout=..&grade=..&title=..&size=landscape|portrait|square]
//       just the exported cover, edge to edge — the same drawing the
//       app exports as a PNG, at the post size
//   ?shot=editor — the editor itself in the browser, samples loaded
//
// Once a scene has painted it sets window.__shotReady, so a headless
// screenshot can wait on that flag rather than guessing a delay.

import { drawCoverGrid } from './cover.js';

const SHOT_SIZES = {
  landscape: [1920, 1080],
  portrait: [1080, 1350],
  square: [1080, 1080],
};

// Query keys that map straight onto state fields, in order.
const QUERY_KEYS = ['layout', 'grade', 'title', 'size'];

/** Copies the recognised ?key=value pairs from the URL into state. */
function applyParams(params, state) {
  for (const key of QUERY_KEYS) {
    const value = params.get(key);
    if (value !== null && value !== '') state[key] = value;
  }
  const subtitle = params.get('subtitle');
  if (null !== subtitle) state.subtitle = subtitle;
}

/** Draws the cover scene onto the page canvas at the post size. */
async function runCoverScene(params, ctx) {
  document.body.classList.add('shot-cover');
  applyParams(params, ctx.state);
  await document.fonts.ready;
  // fonts.ready can settle before Anton/Pacifico have even started
  // loading (nothing on the page uses them until the canvas does), and
  // a draw that measures with the fallback font comes out small — so
  // load both faces explicitly before anything is measured or drawn.
  await document.fonts.load('100px Anton');
  await document.fonts.load('40px Pacifico');
  await ctx.loadSamplePhotos();
  const wantedSize = ctx.state.size || 'landscape';
  const size = SHOT_SIZES[wantedSize] || SHOT_SIZES.landscape;
  ctx.canvas.width = size[0];
  ctx.canvas.height = size[1];
  drawCoverGrid(ctx.canvas, ctx.state, ctx.photos);
  document.title = 'READY';
  window.__shotReady = true;
}

/** Draws the editor scene: controls wired, preview painted. */
async function runEditorScene(params, ctx) {
  applyParams(params, ctx.state);
  await document.fonts.ready;
  // Same explicit load as the cover scene: fonts.ready alone can settle
  // before the faces have started loading, and the preview measures its
  // title with whatever font is there.
  await document.fonts.load('100px Anton');
  await document.fonts.load('40px Pacifico');
  await ctx.loadSamplePhotos();
  ctx.bindEditor();
  ctx.syncControls();
  ctx.renderPreview();
  document.title = 'READY';
  window.__shotReady = true;
}

// Portrait and square are the cover scene with the size preset.
const COVER_SHOTS = { cover: null, portrait: 'portrait', square: 'square' };

export async function runShot(shot, params, ctx) {
  if (Object.hasOwn(COVER_SHOTS, shot)) {
    const sizePreset = COVER_SHOTS[shot];
    if (sizePreset) ctx.state.size = sizePreset;
    await runCoverScene(params, ctx);
    return;
  }
  if (shot === 'editor') {
    await runEditorScene(params, ctx);
    return;
  }
  window.__shotReady = true;
}
