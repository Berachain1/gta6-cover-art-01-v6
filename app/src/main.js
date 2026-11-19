// main.js — wires up the Palm Heat Cover Studio editor.
//
// Photo picker and drag-drop, the built-in sample photos, layout and
// grade pickers, caption fields, per-panel crop and position (click a
// panel, drag to pan, scroll to zoom), undo / redo, and PNG export in
// all three post sizes. A `?shot=` query runs a fixed scene for
// screenshots instead (./shots.js).

import { drawCoverGrid, exportCoverPNG, EXPORT_SIZES, LAYOUTS, GRADES, layoutPanels, panelCount } from './cover.js';
import { runShot } from './shots.js';

const SAMPLE_PHOTOS = [
  {
    src: 'samples/woman.jpg',
    name: 'Woman · convertible',
  },
  {
    src: 'samples/fisherman.jpg',
    name: 'Fisherman · pier',
  },
  {
    src: 'samples/neon.jpg',
    name: 'Friends · neon street',
  },
  {
    src: 'samples/rooftop.jpg',
    name: 'Man · rooftop',
  },
  {
    src: 'samples/boulevard.jpg',
    name: 'Boulevard · kit',
  },
  {
    src: 'samples/pier.jpg',
    name: 'Pier · kit',
  },
  {
    src: 'samples/car.jpg',
    name: 'Orange car · deco street',
  },
  {
    src: 'samples/coast.jpg',
    name: 'Coast road · sunset',
  },
  {
    src: 'samples/sunset.jpg',
    name: 'Woman · sunset convertible',
  },
];

// Caption chips for the panels (place / time / line), one per sample
// photo — original wording, the location/time chips the top-5 covers
// carry on theirs.
const CAPTIONS = [
  {
    place: 'CORAL DRIVE',
    time: '6:47 PM',
    line: 'ENGINE RUNNING',
  },
  {
    place: 'PIER 26',
    time: '5:30 AM',
    line: 'FIRST CAST',
  },
  {
    place: 'NEON MILE',
    time: '11:50 PM',
    line: 'NO BRAKES',
  },
  {
    place: 'ROOFTOP 9',
    time: '8:30 PM',
    line: 'CITY LIGHTS',
  },
  {
    place: 'PALM ROW',
    time: '9:15 PM',
    line: 'AFTER DARK',
  },
  {
    place: 'TOWER 2',
    time: '6:10 PM',
    line: 'GOLDEN HOUR',
  },
  {
    place: 'DECO ROW',
    time: '7:05 PM',
    line: 'TOP DOWN',
  },
  {
    place: 'COAST ROAD',
    time: '6:58 PM',
    line: 'LAST LIGHT',
  },
  {
    place: 'CORAL DRIVE',
    time: '7:42 PM',
    line: 'GOLDEN HOUR',
  },
];

// Default crop per panel, per layout: { photo, fx, fy, zoom }. fx/fy is
// the focus point (0..1) inside the photo; zoom >= 1. The crops are
// picked so faces stay in frame and no panel shows an awkward
// body-part cut.
//
// hero-vice is MULTI-SUBJECT (v3): six different photos, one per panel —
// the top-5 covers' variety. Hero is the woman plus pink convertible
// with her face whole (x about 0.42, y about 0.32); the other panels
// are the rooftop man, the neon couple, the fisherman, the orange car
// and the coast road, each cropped so its subject stays in frame.
const DEFAULT_ASSIGNMENTS = {
  // chaos is the v4 default: the top-3 key-art collage. Same six photos
  // as hero-vice (woman hero, rooftop man, neon couple, fisherman,
  // orange car, coast road), each cropped so its subject stays in frame.
  // v5: hero is the SUNSET woman (photo 8, blazing sky — #1's glow was
  // the one gap no layout fix could close). The 3-panel row in portrait
  // and square runs P1 P2 P3, and the title crashes over the whole row —
  // a face in the LEFT column sits behind the "P" and can never escape
  // it, so the row is ordered face-free on the left: car (no face),
  // neon, rooftop (right column, where the fisherman's face already
  // escaped the "T"). Landscape is unaffected: P1 mid-top and P3
  // right-top both sit fully above the title, so car, rooftop and
  // fisherman all stay whole there. Square is the exception: its row is
  // short (0.44h), the title's letters cover the whole row top, and the
  // rooftop face — at the top of its photo — cannot be cropped below the
  // letters at any zoom (verified: zoom 1.35 only pushed the beard below
  // them). So P3 carries an `sq` override: the coast road (no face) in
  // square only. The override lives in cover.js (drawCoverGrid, w === h).
  chaos: [
    {
      photo: 8,
      fx: 0.42,
      fy: 0.32,
      zoom: 1.05,
    },
    {
      photo: 6,
      fx: 0.55,
      fy: 0.55,
      zoom: 1.15,
    },
    {
      photo: 2,
      fx: 0.55,
      fy: 0.42,
      zoom: 1.1,
    },
    {
      photo: 3,
      fx: 0.48,
      fy: 0.28,
      zoom: 1.0,
      sq: {
        photo: 7,
        fx: 0.45,
        fy: 0.55,
        zoom: 1.15,
      },
    },
    {
      photo: 1,
      fx: 0.48,
      fy: 0.3,
      zoom: 1.0,
    },
    {
      photo: 7,
      fx: 0.45,
      fy: 0.55,
      zoom: 1.15,
    },
  ],
  'hero-vice': [
    {
      photo: 0,
      fx: 0.42,
      fy: 0.32,
      zoom: 1.05,
    },
    {
      photo: 3,
      fx: 0.48,
      fy: 0.3,
      zoom: 1.15,
    },
    {
      photo: 2,
      fx: 0.55,
      fy: 0.42,
      zoom: 1.1,
    },
    {
      photo: 1,
      fx: 0.48,
      fy: 0.3,
      zoom: 1.0,
    },
    {
      photo: 6,
      fx: 0.55,
      fy: 0.55,
      zoom: 1.15,
    },
    {
      photo: 7,
      fx: 0.45,
      fy: 0.55,
      zoom: 1.15,
    },
  ],
  'vice-grid': [
    {
      photo: 0,
      fx: 0.5,
      fy: 0.32,
      zoom: 1.15,
    },
    {
      photo: 3,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.1,
    },
    {
      photo: 1,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.15,
    },
    {
      photo: 2,
      fx: 0.5,
      fy: 0.45,
      zoom: 1.05,
    },
    {
      photo: 6,
      fx: 0.55,
      fy: 0.55,
      zoom: 1.15,
    },
    {
      photo: 4,
      fx: 0.5,
      fy: 0.3,
      zoom: 1.25,
    },
    {
      photo: 7,
      fx: 0.45,
      fy: 0.55,
      zoom: 1.15,
    },
    {
      photo: 2,
      fx: 0.72,
      fy: 0.45,
      zoom: 1.4,
    },
  ],
  'hero-three': [
    {
      photo: 0,
      fx: 0.5,
      fy: 0.32,
      zoom: 1.05,
    },
    {
      photo: 2,
      fx: 0.5,
      fy: 0.45,
      zoom: 1.1,
    },
    {
      photo: 1,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.2,
    },
    {
      photo: 3,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.15,
    },
  ],
  tilted: [
    {
      photo: 0,
      fx: 0.5,
      fy: 0.32,
      zoom: 1.1,
    },
    {
      photo: 1,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.15,
    },
    {
      photo: 2,
      fx: 0.5,
      fy: 0.45,
      zoom: 1.1,
    },
    {
      photo: 3,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.2,
    },
    {
      photo: 6,
      fx: 0.55,
      fy: 0.55,
      zoom: 1.1,
    },
  ],
  'full-bleed': [
    {
      photo: 0,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.05,
    },
    {
      photo: 2,
      fx: 0.5,
      fy: 0.45,
      zoom: 1.1,
    },
    {
      photo: 1,
      fx: 0.5,
      fy: 0.35,
      zoom: 1.2,
    },
  ],
};

/** A fresh default state (screenshot scenes start from this as well). */
export function defaultState() {
  return {
    layout: 'chaos',
    grade: 'sunset',
    title: 'PALM HEAT',
    subtitle: 'where the sun never sets',
    place: 'CORAL BAY',
    tagline: 'EVERY STREET HAS A STORY',
    heat: 5,
    onePhoto: false,
    showRibbon: true,
    showBarcode: true,
    showCaptions: true,
    captions: CAPTIONS.map((cap) => ({ ...cap })),
    size: 'landscape',
    assignments: JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS)),
    selectedPanel: 0,
  };
}

export const state = defaultState();
export const photos = []; // loaded Image elements; index matches photoLabels
const photoLabels = SAMPLE_PHOTOS.map((p) => p.name);

/** Loads one image, resolving once it is drawable. */
export function loadImage(url) {
  return new Promise((ok, fail) => {
    const image = new Image();
    image.onload = () => ok(image);
    image.onerror = () => fail(new Error(`could not load ${url}`));
    image.src = url;
  });
}

/** Loads every sample photo; resolves once all are drawable. */
export async function loadSamplePhotos() {
  photos.length = 0;
  for (const sample of SAMPLE_PHOTOS) photos.push(await loadImage(sample.src));
  return photos;
}

const canvas = document.querySelector('#cover');
const status = document.querySelector('#status');
let undoHistory = [];
let redoHistory = [];
let lastPanels = [];

/** Serialises the editable part of the state for undo / redo. */
function snapshotState() {
  const { selectedPanel, ...editable } = state;
  return JSON.stringify(editable);
}

function pushUndo() {
  undoHistory.push(snapshotState());
  if (40 < undoHistory.length) undoHistory.shift();
  redoHistory = [];
  updateUndoButtons();
}

function applySnapshot(json) {
  Object.assign(state, JSON.parse(json));
  syncControls();
  renderPreview();
}

export function undo() {
  if (0 === undoHistory.length) return;
  redoHistory.push(snapshotState());
  applySnapshot(undoHistory.pop());
  updateUndoButtons();
}

export function redo() {
  if (0 === redoHistory.length) return;
  undoHistory.push(snapshotState());
  applySnapshot(redoHistory.pop());
  updateUndoButtons();
}

function updateUndoButtons() {
  const u = document.querySelector('#undo');
  const r = document.querySelector('#redo');
  if (u) u.disabled = 0 === undoHistory.length;
  if (r) r.disabled = 0 === redoHistory.length;
}

/** Redraws the live preview at the selected post size. */
export function renderPreview() {
  const postSize = EXPORT_SIZES[state.size];
  canvas.width = postSize.w;
  canvas.height = postSize.h;
  canvas.style.aspectRatio = `${postSize.w} / ${postSize.h}`;
  const drawn = drawCoverGrid(canvas, state, photos);
  lastPanels = drawn.panels;
  drawSelection();
  status.textContent = `Preview · ${postSize.label} · ${LAYOUTS[state.layout]} · ${GRADES[state.grade]}`;
}

/** Outlines the selected panel on the preview canvas. */
function drawSelection() {
  const ctx = canvas.getContext('2d');
  const p = lastPanels[state.selectedPanel];
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = Math.max(canvas.width / 480, 3);
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(2 + p.x, 2 + p.y, p.w - 4, p.h - 4);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd23f';
  ctx.font = `bold ${Math.max(canvas.width / 64, 16)}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`PANEL ${state.selectedPanel + 1}`, 14 + p.x, Math.max(22, canvas.width / 48) + p.y);
  ctx.restore();
}

/**
 * Fills every panel of every layout with one photo (the #2 trick: one
 * face, many crops, so the cover stays consistent).
 */
export function fillAllWithPhoto(photoIndex) {
  pushUndo();
  const cropXs = [0.5, 0.3, 0.7, 0.5, 0.25, 0.75, 0.5, 0.35];
  const cropYs = [0.32, 0.45, 0.4, 0.3, 0.5, 0.42, 0.6, 0.35];
  for (const layoutName of Object.keys(state.assignments)) {
    state.assignments[layoutName] = state.assignments[layoutName].map((assign, idx) => ({
      ...assign,
      photo: photoIndex,
      fx: cropXs[idx % 8],
      fy: cropYs[idx % 8],
      zoom: 1.25,
    }));
  }
  renderPreview();
}

/** Puts a photo into the selected panel (or all panels, in one-photo mode). */
export function assignPhotoToSelected(photoIndex) {
  pushUndo();
  const assignList = state.assignments[state.layout];
  if (assignList[state.selectedPanel]) assignList[state.selectedPanel].photo = photoIndex;
  if (state.onePhoto) fillAllWithPhoto(photoIndex);
  else renderPreview();
  renderPhotoStrip();
}

/** Cycles the selected panel to the next photo. */
export function cyclePanelPhoto() {
  const assignList = state.assignments[state.layout];
  const current = assignList[state.selectedPanel];
  if (!current) return;
  assignPhotoToSelected((1 + current.photo) % photos.length);
}

function syncControls() {
  const setField = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  setField('title', state.title);
  setField('subtitle', state.subtitle);
  setField('place', state.place);
  setField('tagline', state.tagline);
  document.querySelectorAll('#layout-pick button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grade-pick button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#size-pick button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.querySelectorAll('#heat-pick button').forEach((b, i) => {
    b.classList.toggle('active', i < state.heat);
  });
  const one = document.querySelector('#one-photo');
  if (one) one.checked = state.onePhoto;
  const cap = document.querySelector('#captions');
  if (cap) cap.checked = state.showCaptions !== false;
  const zoomSlider = document.getElementById('zoom');
  const current = (state.assignments[state.layout] || [])[state.selectedPanel];
  if (zoomSlider && current) zoomSlider.value = current.zoom;
  renderPhotoStrip();
}

/** The photo strip: samples plus uploads; click to fill the selected panel. */
function renderPhotoStrip() {
  const strip = document.querySelector('#photo-strip');
  if (!strip) return;
  strip.innerHTML = '';
  photos.forEach((image, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = photoLabels[i] || ('Photo ' + (i + 1));
    const thumb = document.createElement('img');
    thumb.src = image.src;
    thumb.alt = b.title;
    b.appendChild(thumb);
    const current = (state.assignments[state.layout] || [])[state.selectedPanel];
    if (current && i === current.photo) b.classList.add('in-use');
    b.addEventListener('click', () => { assignPhotoToSelected(i); });
    strip.appendChild(b);
  });
}

/** Downloads a blob as a file. */
function downloadBlob(blob, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

/** Exports the current cover at one post size. */
export async function exportPNG(sizeKey) {
  const blob = await exportCoverPNG(state, photos, sizeKey);
  const postSize = EXPORT_SIZES[sizeKey];
  downloadBlob(blob, `palm-heat-cover-${postSize.w}x${postSize.h}.png`);
  status.textContent = `Saved palm-heat-cover-${postSize.w}x${postSize.h}.png`;
}

/** Exports all three post sizes, one PNG each. */
export async function exportAllSizes() {
  for (const sizeKey of Object.keys(EXPORT_SIZES)) {
    // eslint-disable-next-line no-await-in-loop
    await exportPNG(sizeKey);
  }
  status.textContent = 'All 3 sizes saved: 1920 × 1080, 1080 × 1350, 1080 × 1080';
}

/** Adds user files as photos (read locally only — never uploaded). */
export async function addUserFiles(fileList) {
  for (const file of fileList) {
    if (false === file.type.startsWith('image/')) continue;
    // eslint-disable-next-line no-await-in-loop
    const image = await loadImage(URL.createObjectURL(file));
    photos.push(image);
    photoLabels.push(file.name);
  }
  renderPhotoStrip();
  renderPreview();
}

/** Maps a click on the preview canvas to a panel index (topmost first). */
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = canvas.width * ((clientX - rect.left) / rect.width);
  const y = canvas.height * ((clientY - rect.top) / rect.height);
  for (let i = lastPanels.length - 1; i >= 0; i -= 1) {
    const p = lastPanels[i];
    if (p.x <= x && p.x + p.w >= x && p.y <= y && p.y + p.h >= y) return i;
  }
  return -1;
}

/** Wires every control in the editor shell to the state. */
function bindEditor() {
  document.getElementById('photo').addEventListener('change', (ev) => {
    addUserFiles([...ev.target.files]);
    ev.target.value = '';
  });
  const drop = document.getElementById('dropzone');
  drop.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (ev) => {
    ev.preventDefault();
    drop.classList.remove('over');
    addUserFiles([...ev.dataTransfer.files]);
  });
  document.querySelectorAll('#layout-pick button').forEach((b) => {
    b.addEventListener('click', () => {
      pushUndo();
      state.layout = b.dataset.layout;
      state.selectedPanel = 0;
      syncControls();
      renderPreview();
    });
  });
  document.querySelectorAll('#grade-pick button').forEach((b) => {
    b.addEventListener('click', () => {
      pushUndo();
      state.grade = b.dataset.grade;
      syncControls();
      renderPreview();
    });
  });
  document.querySelectorAll('#size-pick button').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      syncControls();
      renderPreview();
    });
  });
  document.querySelectorAll('#heat-pick button').forEach((b, i) => {
    b.addEventListener('click', () => {
      pushUndo();
      state.heat = i + 1;
      syncControls();
      renderPreview();
    });
  });
  for (const fieldId of ['title', 'subtitle', 'place', 'tagline']) {
    document.getElementById(fieldId).addEventListener('input', (ev) => {
      state[fieldId] = ev.target.value;
      renderPreview();
    });
    document.getElementById(fieldId).addEventListener('change', pushUndo);
  }
  document.getElementById('one-photo').addEventListener('change', (ev) => {
    pushUndo();
    state.onePhoto = ev.target.checked;
    if (state.onePhoto) {
      const a = (state.assignments[state.layout] || [])[state.selectedPanel];
      if (a) fillAllWithPhoto(a.photo);
    } else renderPreview();
  });
  document.getElementById('captions').addEventListener('change', (ev) => {
    pushUndo();
    state.showCaptions = ev.target.checked;
    renderPreview();
  });
  document.getElementById('cycle-photo').addEventListener('click', cyclePanelPhoto);
  document.getElementById('zoom').addEventListener('input', (ev) => {
    const a = (state.assignments[state.layout] || [])[state.selectedPanel];
    if (a) {
      a.zoom = Number(ev.target.value);
      renderPreview();
    }
  });
  document.getElementById('zoom').addEventListener('change', pushUndo);
  document.getElementById('export').addEventListener('click', () => exportPNG(state.size));
  document.getElementById('export-all').addEventListener('click', exportAllSizes);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);

  // Click a panel to select it; drag on it to pan its crop; wheel to zoom.
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const i = panelAt(ev.clientX, ev.clientY);
    if (i < 0) return;
    state.selectedPanel = i;
    const a = (state.assignments[state.layout] || [])[i];
    drag = { x: ev.clientX, y: ev.clientY, fx: a.fx, fy: a.fy };
    canvas.setPointerCapture(ev.pointerId);
    renderPreview();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const a = (state.assignments[state.layout] || [])[state.selectedPanel];
    const rect = canvas.getBoundingClientRect();
    const p = lastPanels[state.selectedPanel];
    if (!a || !p) return;
    const dx = (canvas.width / p.w) * ((ev.clientX - drag.x) / rect.width);
    const dy = (canvas.height / p.h) * ((ev.clientY - drag.y) / rect.height);
    a.fx = Math.max(0, Math.min(drag.fx - dx, 1));
    a.fy = Math.max(0, Math.min(drag.fy - dy, 1));
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag) {
      pushUndo();
      drag = null;
    }
  });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const a = (state.assignments[state.layout] || [])[state.selectedPanel];
    if (!a) return;
    const factor = 0 > ev.deltaY ? 1.08 : 0.93;
    a.zoom = Math.max(1, Math.min(3, factor * a.zoom));
    const zoomInput = document.getElementById('zoom');
    if (zoomInput) zoomInput.value = a.zoom;
    renderPreview();
  }, { passive: false });
  document.addEventListener('keydown', (ev) => {
    const mod = ev.ctrlKey || ev.metaKey;
    const key = ev.key.toLowerCase();
    if (mod && key === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      undo();
    }
    if (mod && (key === 'y' || (key === 'z' && ev.shiftKey))) {
      ev.preventDefault();
      redo();
    }
  });
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, { state, photos, loadSamplePhotos, loadImage, renderPreview, canvas, bindEditor, syncControls });
} else {
  await document.fonts.ready;
  await document.fonts.load('100px Anton');
  await document.fonts.load('40px Pacifico');
  await loadSamplePhotos();
  bindEditor();
  syncControls();
  renderPreview();
}
