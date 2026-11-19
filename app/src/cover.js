// cover.js — the cover renderer.
//
// drawCoverGrid paints a full GTA-style poster onto any 2D canvas at any
// size: a multi-panel photo grid with black gutters, a gradient-map or
// poster-ink grade on every panel, one huge gradient title block with a
// neon script subtitle, and poster furniture (starburst badge, HEAT
// stars, barcode, ORIGINAL ribbon). exportCoverPNG renders the same art
// offscreen at the exact post size and hands back a PNG blob.
//
// The title block comes in four shapes: 'cell' (the title is one grid
// cell), 'band' (a full-width band, used for portrait / square re-flows),
// 'hero' (a full-width band whose title is stretched to sprawl across
// the whole width, like the top covers) and 'overlap' (the title floats
// over the panels). In overlap mode the letters sit on a dark scrim,
// and the script subtitle gets its own solid dark plate behind it —
// without that plate the subtitle can land on a bright, busy photo area
// and disappear, which is exactly what happens on the Tilted layout's
// lower panels.

import { gradePanelImage, drawCroppedPhoto } from './grades.js';

export const EXPORT_SIZES = {
  landscape: {
    w: 1920,
    h: 1080,
    label: '1920 × 1080',
  },
  portrait: {
    w: 1080,
    h: 1350,
    label: '1080 × 1350',
  },
  square: {
    w: 1080,
    h: 1080,
    label: '1080 × 1080',
  },
};

export const LAYOUTS = {
  chaos: 'Chaos Key-Art · tilted collage + title over photos',
  'hero-vice': 'Hero Vice · big-face hero + title band + strip',
  'vice-grid': 'Vice Grid · 9-panel poster',
  'hero-three': 'Hero + Three',
  tilted: 'Tilted Snapshots',
  'full-bleed': 'Full Bleed',
};

export const GRADES = {
  ink: 'Poster Ink',
  sunset: 'Sunset',
  neon: 'Neon Night',
  golden: 'Golden Hour',
};

const GUTTER = 10;

/**
 * Panel geometry for a layout at (w, h). Returns { panels, title, badge }:
 * panels are {x, y, w, h} rects (optionally `slant` for diagonal cuts or
 * `snap` for a rotated polaroid); title is the title-block rect plus a
 * `mode` ('cell' | 'band' | 'overlap'); badge is the starburst position.
 */
export function layoutPanels(w, h, layout) {
  const gap = GUTTER * (w / 1920);
  const tall = h >= w;
  const panels = [];

  // hero-vice: one LARGE hero panel (big face, about half the cover) on
  // the left, a 2-stack middle column and a 3-stack right column on top,
  // a WIDE title band across the full width (30% — the top covers'
  // title zone, not a 42% flat slab), and a thin bottom strip with palms
  // + tagline + fine print + barcode. The title sprawls across the band
  // like the top-2 covers; a press-quote pill straddles the panel/title
  // boundary and every panel carries a location/time caption chip.
  if (layout === 'hero-vice') {
    const bandH = 0.3 * h;
    const stripH = 0.075 * h;
    const topH = h - bandH - stripH - 4 * gap;
    const ty = gap + topH + gap;
    const stripY = ty + bandH + gap;
    const strip = {
      x: gap,
      y: stripY,
      w: w - 2 * gap,
      h: h - stripY - gap,
    };
    if (tall) {
      const hh = 0.6 * topH;
      panels.push({
        x: gap,
        y: gap,
        w: w - 2 * gap,
        h: hh,
      });
      const cw = (w - 4 * gap) / 3;
      const rh = topH - hh - gap;
      for (let c = 0; c < 3; c++) {
        panels.push({
          x: gap + c * (cw + gap),
          y: gap + hh + gap,
          w: cw,
          h: rh,
        });
      }
      return {
        panels,
        title: {
          x: gap,
          y: ty,
          w: w - 2 * gap,
          h: bandH,
          mode: 'hero',
        },
        strip,
        badge: {
          x: 76,
          y: 76,
        },
      };
    }
    const heroW = 0.46 * w - gap;
    const midW = 0.235 * w - gap;
    const rightW = 0.305 * w - 2 * gap;
    const midX = gap + heroW + gap;
    const rightX = midX + midW + gap;
    panels.push({
      x: gap,
      y: gap,
      w: heroW,
      h: topH,
    });
    const mh = (topH - gap) / 2;
    panels.push({
      x: midX,
      y: gap,
      w: midW,
      h: mh,
    });
    panels.push({
      x: midX,
      y: gap + mh + gap,
      w: midW,
      h: mh,
    });
    const rh = (topH - 2 * gap) / 3;
    for (let r = 0; r < 3; r++) {
      panels.push({
        x: rightX,
        y: gap + r * (rh + gap),
        w: rightW,
        h: rh,
      });
    }
    return {
      panels,
      title: {
        x: gap,
        y: ty,
        w: w - 2 * gap,
        h: bandH,
        mode: 'hero',
      },
      strip,
      badge: {
        x: gap + 64,
        y: gap + 64,
      },
    };
  }

  // chaos: the top-3 covers' key-art collage. Photos run the full height
  // BEHIND the title — the title crashes OVER them from about 50% down,
  // like do-tinh's SUNSET STATE / ahmadfdn's VICE STATE — there is no
  // title band. The hero panel's right edge is a diagonal (slant), one
  // mid panel and two right panels are rotated a few degrees, and the
  // starburst sits on a panel junction instead of a corner. `wanted` is
  // the top-right anchor of the fisherman panel for the WANTED pill.
  if (layout === 'chaos') {
    const stripH = 0.075 * h;
    const stripY = h - stripH - gap;
    const strip = {
      x: gap,
      y: stripY,
      w: w - 2 * gap,
      h: h - stripY - gap,
    };
    const title = {
      x: 0,
      y: 0.5 * h,
      w,
      h: h * (tall ? 0.34 : 0.38),
      mode: 'chaos',
    };
    if (tall) {
      const hh = 0.44 * h;
      panels.push({
        x: gap,
        y: gap,
        w: w - 2 * gap,
        h: hh,
        slant: 30,
      });
      const cw = (w - 4 * gap) / 3;
      // The row runs down to the photo bottom (0.88h) so photos fill
      // behind the title all the way to the strip — a short row left a
      // black scrim void under the title in portrait/square.
      const ry = gap + hh + gap;
      const rh = 0.88 * h - ry;
      panels.push({
        x: gap,
        y: ry,
        w: cw,
        h: rh,
        rot: -0.02,
      });
      panels.push({
        x: gap + cw + gap,
        y: ry,
        w: cw,
        h: rh,
      });
      panels.push({
        x: gap + 2 * (cw + gap),
        y: ry,
        w: cw,
        h: rh,
        rot: 0.025,
      });
      return {
        panels,
        title,
        strip,
        badge: {
          x: 0.66 * w,
          y: gap + hh + gap,
        },
        wanted: {
          x: gap + 3 * cw + 2 * gap,
          y: ry,
        },
      };
    }
    const photoBottom = 0.88 * h;
    const topH = photoBottom - gap;
    const heroW = 0.44 * w - gap;
    const midX = gap + heroW + gap;
    const midW = 0.24 * w - gap;
    const rightX = midX + midW + gap;
    const rightW = w - rightX - gap;
    panels.push({
      x: gap,
      y: gap,
      w: heroW,
      h: topH,
      slant: 36,
    });
    const mh = (topH - gap) / 2;
    panels.push({
      x: midX,
      y: gap,
      w: midW,
      h: mh,
      rot: 0.02,
    });
    panels.push({
      x: midX,
      y: gap + mh + gap,
      w: midW,
      h: mh,
      rot: -0.015,
    });
    const rh = (topH - 2 * gap) / 3;
    panels.push({
      x: rightX,
      y: gap,
      w: rightW,
      h: rh,
      rot: -0.03,
    });
    panels.push({
      x: rightX,
      y: gap + rh + gap,
      w: rightW,
      h: rh,
      rot: 0.025,
    });
    panels.push({
      x: rightX,
      y: gap + 2 * (rh + gap),
      w: rightW,
      h: rh,
      rot: -0.02,
    });
    return {
      panels,
      title,
      strip,
      // Starburst on the hero/mid-column junction up where no caption
      // chip lives (the old junction sat on the fisherman's chip), and
      // WANTED on the car panel's top-right — the fisherman panel's
      // top-right is under the ORIGINAL ribbon, which hid the pill.
      badge: {
        x: midX,
        y: 0.22 * topH,
      },
      wanted: {
        x: rightX + rightW,
        y: gap + rh + gap,
      },
    };
  }

  if (layout === 'vice-grid') {
    if (tall) {
      const cw = (w - 3 * gap) / 2;
      const rh = (0.62 * h - 4 * gap) / 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          panels.push({
            x: gap + c * (cw + gap),
            y: gap + r * (rh + gap),
            w: cw,
            h: rh,
          });
        }
      }
      const ty = gap + 3 * (rh + gap);
      return {
        panels,
        title: {
          x: gap,
          y: ty,
          w: w - 2 * gap,
          h: h - ty - gap,
          mode: 'band',
        },
        badge: {
          x: 76,
          y: 76,
        },
      };
    }
    const cw = (w - 4 * gap) / 3;
    const rh = (h - 4 * gap) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // centre cell is the title block
        panels.push({
          x: gap + c * (cw + gap),
          y: gap + r * (rh + gap),
          w: cw,
          h: rh,
        });
      }
    }
    return {
      panels,
      title: {
        x: gap + (cw + gap),
        y: gap + (rh + gap),
        w: cw,
        h: rh,
        mode: 'cell',
      },
      badge: {
        x: gap + 64,
        y: gap + 64,
      },
    };
  }

  if (layout === 'hero-three') {
    if (tall) {
      const hh = 0.44 * h;
      panels.push({
        x: gap,
        y: gap,
        w: w - 2 * gap,
        h: hh,
      });
      const cw = (w - 4 * gap) / 3;
      const rh = 0.2 * h;
      for (let c = 0; c < 3; c++) {
        panels.push({
          x: gap + c * (cw + gap),
          y: hh + 2 * gap,
          w: cw,
          h: rh,
        });
      }
      const ty = hh + rh + 3 * gap;
      return {
        panels,
        title: {
          x: gap,
          y: ty,
          w: w - 2 * gap,
          h: h - ty - gap,
          mode: 'band',
        },
        badge: {
          x: 76,
          y: 76,
        },
      };
    }
    const hw = 0.56 * w;
    panels.push({
      x: gap,
      y: gap,
      w: hw - gap,
      h: h - 2 * gap,
    });
    const rw = w - hw - 2 * gap;
    const rh = (h - 4 * gap) / 3;
    for (let r = 0; r < 3; r++) {
      panels.push({
        x: hw + gap,
        y: gap + r * (rh + gap),
        w: rw,
        h: rh,
      });
    }
    return {
      panels,
      title: {
        x: gap,
        y: 0.66 * h,
        w: w - 2 * gap,
        h: 0.34 * h - gap,
        mode: 'overlap',
      },
      badge: {
        x: 78,
        y: 54,
      },
    };
  }

  if (layout === 'tilted') {
    if (tall) {
      const hh = 0.4 * h;
      panels.push({
        x: gap,
        y: gap,
        w: w - 2 * gap,
        h: hh,
        slant: 40,
      });
      const cw = (w - 3 * gap) / 2;
      const rh = 0.24 * h;
      panels.push({
        x: gap,
        y: hh + 2 * gap,
        w: cw,
        h: rh,
        slant: -30,
      });
      panels.push({
        x: gap + cw + gap,
        y: hh + 2 * gap,
        w: cw,
        h: rh,
        slant: 30,
      });
      const ty = hh + rh + 3 * gap;
      return {
        panels,
        title: {
          x: gap,
          y: ty,
          w: w - 2 * gap,
          h: h - ty - gap,
          mode: 'band',
        },
        badge: {
          x: 76,
          y: 76,
        },
      };
    }
    const hw = 0.5 * w;
    panels.push({
      x: gap,
      y: gap,
      w: hw,
      h: 0.62 * h,
      slant: 46,
    });
    panels.push({
      x: hw + gap,
      y: gap,
      w: w - hw - 2 * gap,
      h: 0.62 * h,
      slant: -46,
    });
    const bw = (w - 4 * gap) / 3;
    for (let c = 0; c < 3; c++) {
      panels.push({
        x: gap + c * (bw + gap),
        y: 0.62 * h + gap,
        w: bw,
        h: 0.38 * h - 2 * gap,
        slant: c === 1 ? 0 : (c === 0 ? 26 : -26),
      });
    }
    return {
      panels,
      title: {
        x: 0.22 * w,
        y: 0.42 * h,
        w: 0.56 * w,
        h: 0.3 * h,
        mode: 'overlap',
      },
      badge: {
        x: gap + 64,
        y: gap + 64,
      },
    };
  }

  // full-bleed: one photo fills the frame, snapshots float on top.
  if (tall) {
    panels.push({
      x: 0,
      y: 0,
      w,
      h: 0.72 * h,
    });
    panels.push({
      x: gap,
      y: 0.52 * h,
      w: 0.42 * w,
      h: 0.2 * h,
      snap: true,
    });
    return {
      panels,
      title: {
        x: 0,
        y: 0.72 * h,
        w,
        h: 0.28 * h,
        mode: 'band',
      },
      badge: {
        x: 76,
        y: 76,
      },
    };
  }
  panels.push({
    x: 0,
    y: 0,
    w,
    h,
  });
  panels.push({
    x: 0.66 * w,
    y: 2 * gap,
    w: 0.3 * w,
    h: 0.34 * h,
    snap: true,
  });
  panels.push({
    x: 0.04 * w,
    y: 0.06 * h,
    w: 0.24 * w,
    h: 0.3 * h,
    snap: true,
  });
  return {
    panels,
    title: {
      x: 0,
      y: 0.6 * h,
      w,
      h: 0.4 * h,
      mode: 'overlap',
    },
    badge: {
      x: 0.5 * w,
      y: 60,
    },
  };
}

/** How many photo panels a layout has. */
export function panelCount(layout) {
  const counts = {
    chaos: 6,
    'vice-grid': 8,
    'hero-vice': 6,
    'hero-three': 4,
    tilted: 5,
    'full-bleed': 3,
  };
  return counts[layout] || 8;
}

/** The Anton size that fits `text` inside `maxW`, shrinking 2 px at a time. */
export function fitTitleFont(ctx, text, maxW, maxSize, family = 'Anton') {
  let size = maxSize;
  ctx.font = `${size}px ${family}, sans-serif`;
  while (20 < size && ctx.measureText(text).width > maxW) {
    size = size - 2;
    ctx.font = size + 'px ' + family + ', sans-serif';
  }
  return size;
}

/** A filled rounded-rectangle path (avoids any ctx.roundRect dependency). */
export function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(rad + x, y);
  ctx.lineTo(w + x - rad, y);
  ctx.quadraticCurveTo(w + x, y, w + x, rad + y);
  ctx.lineTo(w + x, h + y - rad);
  ctx.quadraticCurveTo(w + x, h + y, w + x - rad, h + y);
  ctx.lineTo(rad + x, h + y);
  ctx.quadraticCurveTo(x, h + y, x, h + y - rad);
  ctx.lineTo(x, rad + y);
  ctx.quadraticCurveTo(x, y, rad + x, y);
  ctx.closePath();
}

/** A spiky starburst badge (EST. 2026 / NEW) with two lines of text. */
export function drawStarburstBadge(ctx, cx, cy, r, line1, line2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 14;
  for (let i = 0; i < 2 * points; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? r : 0.78 * r;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.lineWidth = Math.max(2, 0.07 * r);
  ctx.strokeStyle = '#14041f';
  ctx.stroke();
  ctx.fillStyle = '#14041f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${0.42 * r}px Anton, sans-serif`;
  ctx.fillText(line1, 0, -0.16 * r);
  ctx.font = `${0.26 * r}px Anton, sans-serif`;
  ctx.fillText(line2, 0, 0.24 * r);
  ctx.restore();
}

/** Five HEAT stars, `heat` of them filled gold. */
export function drawHeatStars(ctx, cx, y, size, heat, fill = '#ffd23f', stroke = '#14041f') {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px sans-serif`;
  const step = 1.15 * size;
  const startX = cx - (4 * step) / 2;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < heat ? fill : 'rgba(255,255,255,0.28)';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, 0.06 * size);
    const px = startX + i * step;
    ctx.strokeText('★', px, y);
    ctx.fillText('★', px, y);
  }
  ctx.restore();
}

/** A fake barcode strip, seeded by the title so it is stable per cover. */
export function drawBarcode(ctx, x, y, w, h, seedText) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let seed = 7;
  for (const ch of seedText) seed = (31 * seed + ch.charCodeAt(0)) % 997;
  let bx = x + 0.04 * w;
  let s = seed;
  ctx.fillStyle = '#14041f';
  while (bx < x + 0.96 * w) {
    s = (16807 * s) % 2147483647;
    const bw = 1 + (s % 4) * (w / 220);
    if (s % 3 !== 0) ctx.fillRect(bx, y + 0.08 * h, bw, 0.72 * h);
    bx += bw + w / 220;
  }
  ctx.restore();
}

/** A simple palm silhouette: curved trunk plus drooping fronds. */
export function drawPalmSilhouette(ctx, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -60, 4, -110);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (-160 + 52 * i) * (Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(4, -110);
    ctx.quadraticCurveTo(
      4 + Math.cos(a) * 55, -110 + Math.sin(a) * 42,
      4 + Math.cos(a) * 88, -110 + Math.sin(a) * 78,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The title block: sunset-gradient panel, eyebrow, one huge gradient
 * title (auto-fit, black outline), neon script subtitle, tagline, HEAT
 * stars.
 *
 * In overlap mode the block floats over photos, so it paints a dark
 * scrim first and puts the script subtitle on its own solid dark plate —
 * the plate is what keeps the subtitle readable when it crosses a bright
 * or busy photo area (the Tilted layout's weak spot).
 */
export function drawTitleBlock(ctx, rect, state) {
  const { x, y, w, h } = rect;
  const mode = rect.mode || 'cell';
  ctx.save();
  if (mode === 'cell' || mode === 'band' || mode === 'hero') {
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    if (mode === 'hero') {
      // Deep magenta-purple at the top so the yellow title reads, warming
      // to pink, orange and amber at the bottom — the top-2 bands' shape.
      for (const [off, col] of [[0, '#8a1c63'], [0.35, '#ff2e7e'], [0.7, '#ff7a2f'], [1, '#ffb03a']]) {
        bg.addColorStop(off, col);
      }
    } else {
      for (const [off, col] of [[0, '#ff2e7e'], [0.45, '#ff7a2f'], [1, '#ffb03a']]) {
        bg.addColorStop(off, col);
      }
    }
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    // Small sun disc tucked in the top-right corner, clear of the
    // lettering — except in hero mode, where the sprawling title leaves
    // no clear spot.
    if (mode !== 'hero') {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(x + 0.84 * w, y + 0.2 * h, 0.13 * Math.min(w, h), 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    // Overlap: a scrim so the title stays readable over photos. Chaos
    // mode uses a MUCH lighter scrim than overlap — do-tinh's title sits
    // straight on bright photos with only its outline + shadow, and the
    // heavy scrim was drowning the lower panels in black.
    const scrim = ctx.createLinearGradient(x, y, x, y + h);
    if (mode === 'chaos') {
      for (const [off, col] of [[0, 'rgba(16,2,26,0)'], [0.3, 'rgba(16,2,26,0.18)'], [0.62, 'rgba(16,2,26,0.38)'], [1, 'rgba(16,2,26,0.55)']]) {
        scrim.addColorStop(off, col);
      }
    } else {
      for (const [off, col] of [[0, 'rgba(16,2,26,0.05)'], [0.3, 'rgba(16,2,26,0.5)'], [0.62, 'rgba(16,2,26,0.78)'], [1, 'rgba(16,2,26,0.9)']]) {
        scrim.addColorStop(off, col);
      }
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(x, y, w, h);
  }

  const cx = x + w / 2;
  const pad = 0.04 * w;
  const title = (state.title || 'PALM HEAT').toUpperCase();
  const subtitle = state.subtitle || '';
  const place = (state.place || 'CORAL BAY').toUpperCase();
  const tagline = (state.tagline || '').toUpperCase();

  // Eyebrow: WELCOME TO · PLACE. Skipped in hero and chaos mode — the
  // enlarged title (caps + outline + shadow) reaches up into the eyebrow
  // line and paints over it; #1/#2 run a bare title band too.
  if (mode !== 'hero' && mode !== 'chaos') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const browSize = Math.max(13, Math.min(0.045 * w, 0.11 * h));
    ctx.font = `${browSize}px Anton, sans-serif`;
    ctx.fillStyle = mode === 'overlap' ? '#ffd23f' : '#fff3c4';
    ctx.fillText(`★  WELCOME TO ${place}  ★`, cx, y + 0.12 * h);
  }

  // Main title — gradient fill, thick black outline, hard shadow.
  // (textAlign is set here, not in the eyebrow block above, because hero
  // mode skips the eyebrow — a one-word title must still centre.)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Hero and chaos mode: the title must SPRAWL across the band like the
  // top-2 covers, not sit in the middle — so it is sized tall, then
  // stretched horizontally (glyph scale, capped) with the remaining width
  // taken up by letter tracking. Short titles like PALM HEAT would
  // otherwise occupy only half the band. Chaos sprawls a touch wider
  // (0.88) and taller (0.72) than hero — its title crashes over photos.
  const maxTitle = mode === 'hero' ? 0.66 * h : mode === 'chaos' ? 0.72 * h : Math.min(0.52 * w, 0.52 * h);
  const size = fitTitleFont(ctx, title, w - 2 * pad, maxTitle);
  const ty = y + (mode === 'hero' ? 0.58 : mode === 'chaos' ? 0.52 : (subtitle ? 0.6 : 0.64)) * h;
  const grad = ctx.createLinearGradient(0, ty - size, 0, ty + 0.12 * size);
  for (const [off, col] of [[0, '#ffe14d'], [0.5, '#ff9a2f'], [1, '#ff2e7e']]) {
    grad.addColorStop(off, col);
  }
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * (mode === 'hero' ? 0.13 : 0.11));
  ctx.strokeStyle = '#14041f';
  // Hero and chaos mode: a magenta drop shadow behind the black outline,
  // the way the top covers' titles lift off the band (or off the photos).
  if (mode === 'hero' || mode === 'chaos') {
    // v5: deeper than v4 (0.55/0.10/0.06) — #1's title shadow sits
    // visibly deeper than ours; the title stays fully readable.
    ctx.shadowColor = 'rgba(255,46,126,0.8)';
    ctx.shadowBlur = 0.14 * size;
    ctx.shadowOffsetY = 0.08 * size;
  } else {
    ctx.shadowColor = 'rgba(20,4,31,0.65)';
    ctx.shadowBlur = 0.08 * size;
    ctx.shadowOffsetY = 0.05 * size;
  }
  let stretch = 1;
  let tracking = 0;
  if (mode === 'hero' || mode === 'chaos') {
    const natural = ctx.measureText(title).width;
    const target = w * (mode === 'chaos' ? 0.88 : 0.85);
    stretch = Math.min(1.15, target / Math.max(1, natural));
    tracking = Math.max(0, (target - natural * stretch) / Math.max(1, title.length - 1));
    ctx.save();
    ctx.translate(cx, 0);
    ctx.scale(stretch, 1);
    ctx.translate(-cx, 0);
    ctx.letterSpacing = `${tracking}px`;
  }
  // Hero and chaos mode with a multi-word title: draw word by word so the
  // gap between words is a controlled 2x tracking, not the space advance
  // plus tracking (which leaves a canyon between PALM and HEAT).
  if ((mode === 'hero' || mode === 'chaos') && title.includes(' ')) {
    const words = title.split(' ');
    const widths = words.map((wd) => ctx.measureText(wd).width);
    // Word gap is just the space advance plus a little tracking — the
    // 2x tracking gap left a canyon between PALM and HEAT; #2's
    // SUNSET HEIST sits tight, about a third of a letter wide.
    const wordGap = tracking + 0.1 * size;
    const totalW = widths.reduce((a, b) => a + b, 0) + wordGap * (words.length - 1);
    ctx.textAlign = 'left';
    let wx = cx - totalW / 2;
    for (let i = 0; i < words.length; i++) {
      ctx.strokeText(words[i], wx, ty);
      wx += widths[i] + wordGap;
    }
    ctx.fillStyle = grad;
    wx = cx - totalW / 2;
    for (let i = 0; i < words.length; i++) {
      ctx.fillText(words[i], wx, ty);
      wx += widths[i] + wordGap;
    }
    ctx.textAlign = 'center';
  } else {
    ctx.strokeText(title, cx, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, ty);
  }
  if (mode === 'hero' || mode === 'chaos') {
    ctx.restore();
    ctx.letterSpacing = '0px';
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Neon script subtitle — on a solid dark plate in overlap mode so it
  // never sits directly on a busy photo. Chaos mode skips the plate: its
  // subtitle sits on the dark end of the scrim like do-tinh's "Neon Tide",
  // white with a hot-pink glow.
  if (subtitle) {
    const subSize = mode === 'hero'
      ? Math.min(0.08 * w, 0.17 * h, 0.4 * size)
      : mode === 'chaos'
        ? Math.min(0.075 * w, 0.17 * h, 0.38 * size)
        : Math.min(0.085 * w, 0.17 * h, 0.42 * size);
    const subY = y + h * (mode === 'hero' ? 0.85 : mode === 'chaos' ? 0.8 : 0.8);
    ctx.font = `${subSize}px Pacifico, cursive`;
    if (mode === 'overlap') {
      const tw = Math.min(0.92 * w, ctx.measureText(subtitle).width + 1.1 * subSize);
      roundRectPath(ctx, cx - tw / 2, subY - 0.72 * subSize, tw, 1.15 * subSize, 0.32 * subSize);
      ctx.fillStyle = 'rgba(16,2,26,0.82)';
      ctx.fill();
    }
    ctx.fillStyle = mode === 'chaos' ? '#ff5da2' : '#ffffff';
    ctx.shadowColor = '#ff2e9e';
    ctx.shadowBlur = 0.5 * subSize;
    ctx.fillText(subtitle, cx, subY);
    ctx.shadowBlur = 0;
  }

  // Tagline + HEAT stars live in the bottom strip in hero and chaos mode
  // (the title zone is full — title + script fill it); other modes keep
  // them inside the block as before.
  if (mode !== 'hero' && mode !== 'chaos') {
    const tagY = y + h * (subtitle ? 0.9 : 0.85);
    if (tagline) {
      const tagSize = Math.max(11, Math.min(0.032 * w, 0.07 * h));
      ctx.font = `${tagSize}px Anton, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagline, cx, tagY);
    }
    // Gold stars vanish on the orange hero band, so the hero band gets
    // dark stars with a light outline instead.
    const starFill = '#ffd23f';
    const starStroke = '#14041f';
    drawHeatStars(ctx, cx, y + 0.965 * h, Math.max(12, 0.07 * h), state.heat ?? 5, starFill, starStroke);
  }
  ctx.restore();
}

// A thin bottom strip under the title band (hero mode): a magenta
// gradient with dark palm silhouettes, the tagline, fine print and a
// barcode — the furniture every top-5 cover carries at the foot.
export function drawBottomStrip(ctx, rect, state) {
  const { x, y, w, h } = rect;
  const s = w / 1920;
  ctx.save();
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  for (const [off, col] of [[0, '#ff2e7e'], [0.5, '#a01e68'], [1, '#ff2e7e']]) {
    bg.addColorStop(off, col);
  }
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  // Palm silhouettes, clipped to the strip so fronds bleed off its edge
  // the way the top covers' palm strips do.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const palmScale = (0.72 * h) / 110;
  drawPalmSilhouette(ctx, x + 0.02 * w, y + h - 2, palmScale, 'rgba(20,4,31,0.9)');
  drawPalmSilhouette(ctx, x + 0.055 * w, y + h - 2, 0.8 * palmScale, 'rgba(20,4,31,0.9)');
  drawPalmSilhouette(ctx, x + 0.09 * w, y + h - 2, 0.6 * palmScale, 'rgba(20,4,31,0.9)');
  drawPalmSilhouette(ctx, x + 0.885 * w, y + h - 2, 0.7 * palmScale, 'rgba(20,4,31,0.9)');
  ctx.restore();
  // Tagline, centred, with the fine print under it.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const tagSize = Math.max(12, 0.3 * h);
  ctx.font = `${tagSize}px Anton, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.tagline || '', x + 0.5 * w, y + 0.42 * h);
  const fineFull = 'PALM HEAT — A PALM HEAT COVER STUDIO PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND · LETTERING AND SEAL ORIGINAL';
  const fineShort = 'PALM HEAT — A PALM HEAT COVER STUDIO PICTURE · STARRING YOU';
  // The fine print must fit between the palms and the barcode: on narrow
  // covers (portrait/square) the full line overflows both edges, so use
  // the short line and shrink until it fits the middle 70% of the strip.
  let fineSize = Math.max(8, 0.14 * h);
  ctx.font = `${fineSize}px sans-serif`;
  let fine = fineFull;
  if (ctx.measureText(fine).width > 0.7 * w) fine = fineShort;
  while (fineSize > 7 && ctx.measureText(fine).width > 0.7 * w) {
    fineSize -= 1;
    ctx.font = `${fineSize}px sans-serif`;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText(fine, x + 0.5 * w, y + 0.78 * h);
  // Barcode, far right.
  const bw = 88 * s;
  const bh = 0.62 * h;
  const bx = x + w - bw - 10 * s;
  const by = y + (h - bh) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - 3 * s, by - 3 * s, bw + 6 * s, bh + 6 * s);
  ctx.fillStyle = '#14041f';
  let cursor = bx;
  let seed = 11;
  while (cursor < bx + bw - 2) {
    seed = (31 * seed + 7) % 97;
    const barW = 1 + (seed % 3) * 1.4;
    if (seed % 3 !== 0) ctx.fillRect(cursor, by, barW, bh);
    cursor += barW + 1.8;
  }
  ctx.restore();
}

// A small pill label right-aligned to `rightX`, top edge at `topY` —
// returns the pill's left edge so a second pill can sit beside it. The
// furniture the top-3 covers carry that v3 lacked: the cyan VOL. 06 chip
// and the pink COLLECTOR'S EDITION ribbon (#2/#3), and the dark WANTED
// pill with gold stars (#2/#3).
function drawPillRight(ctx, rightX, topY, text, bg, fg, fontSize, opts = {}) {
  ctx.save();
  ctx.font = `${fontSize}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = 0.75 * fontSize;
  const pw = tw + 2 * padX;
  const ph = 1.75 * fontSize;
  ctx.translate(rightX - 0.5 * pw, topY + 0.5 * ph);
  if (opts.rot) ctx.rotate(opts.rot);
  roundRectPath(ctx, -0.5 * pw, -0.5 * ph, pw, ph, opts.square ? Math.max(3, 0.15 * fontSize) : 0.5 * ph);
  ctx.fillStyle = bg;
  ctx.fill();
  if (opts.stroke) {
    ctx.lineWidth = Math.max(1.5, 0.09 * fontSize);
    ctx.strokeStyle = opts.stroke;
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0.05 * fontSize);
  ctx.restore();
  return rightX - pw;
}

// WANTED ★★★★★ pill on a photo panel's top-right corner (chaos mode),
// tilted a touch like a stuck-on label.
export function drawWantedPill(ctx, anchor, coverW) {
  const s = Math.max(0.5, coverW / 1920);
  const fs = Math.max(13, 24 * s);
  drawPillRight(ctx, anchor.x - 10 * s, anchor.y + 10 * s, 'WANTED ★★★★★', '#14041f', '#ffd23f', fs, { rot: -0.02, stroke: '#ffd23f' });
}

// VOL. 06 chip + COLLECTOR'S EDITION ribbon at the title zone's
// bottom-right (chaos mode), the way #2/#3 carry them.
export function drawVolCluster(ctx, titleRect, state) {
  const s = Math.max(0.5, titleRect.w / 1920);
  const fs = Math.max(13, 26 * s);
  const topY = titleRect.y + 0.86 * titleRect.h;
  const rightX = titleRect.x + titleRect.w - 0.025 * titleRect.w;
  const volLeft = drawPillRight(ctx, rightX, topY, 'VOL. 06', '#22d3ee', '#0b2a33', fs, { square: true });
  drawPillRight(ctx, volLeft - 12 * s, topY, "COLLECTOR'S EDITION", '#ff2e7e', '#ffffff', fs, { square: true });
}

// A press-quote pill straddling the panel/title boundary (hero mode) —
// the top covers' star-quote strip, condensed into a pill so it never
// covers a face. Wording is original, not copied from any top entry.
export function drawQuotePill(ctx, titleRect, state) {
  const cx = titleRect.x + titleRect.w / 2;
  const cy = titleRect.y;
  const s = titleRect.w / 1920;
  const stars = '★★★★★';
  const text = '‘THE CITY NEVER SLEEPS’ — THE CORAL HERALD';
  ctx.save();
  const fs = Math.max(12, 21 * s);
  ctx.font = `${fs}px Anton, sans-serif`;
  const starsW = ctx.measureText(stars).width;
  const textW = ctx.measureText(text).width;
  const gap = 10 * s;
  const padX = 18 * s;
  const pw = starsW + gap + textW + 2 * padX;
  const ph = 42 * s;
  roundRectPath(ctx, cx - 0.5 * pw, cy - 0.5 * ph, pw, ph, 0.5 * ph);
  ctx.fillStyle = '#14041f';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, 2 * s);
  ctx.strokeStyle = '#ffd23f';
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(stars, cx - 0.5 * pw + padX, cy);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx - 0.5 * pw + padX + starsW + gap, cy);
  ctx.restore();
}

// A small location/time chip in a panel's bottom-left corner — the
// caption chips every top-5 cover puts on its panels. Skips panels too
// narrow to hold the chip rather than clipping it.
export function drawPanelCaption(ctx, p, cap, coverW) {
  if (!cap) return;
  const s = Math.max(0.5, coverW / 1920);
  const padX = 10 * s;
  const padY = 7 * s;
  const placeSize = Math.max(11, 15 * s);
  const lineSize = Math.max(9, 11 * s);
  const line2 = `${cap.time} · ${cap.line}`;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${placeSize}px Anton, sans-serif`;
  const w1 = ctx.measureText(cap.place).width;
  ctx.font = `${lineSize}px sans-serif`;
  const w2 = ctx.measureText(line2).width;
  const bw = Math.max(w1, w2) + 2 * padX;
  const bh = 2 * padY + placeSize + 4 * s + lineSize;
  const bx = p.x + s * 8;
  const by = p.y + p.h - bh - s * 8;
  if (bw > p.w - 16 * s || bh > p.h - 16 * s) {
    ctx.restore();
    return;
  }
  roundRectPath(ctx, bx, by, bw, bh, 4 * s);
  ctx.fillStyle = 'rgba(12,2,20,0.85)';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${placeSize}px Anton, sans-serif`;
  ctx.fillText(cap.place, bx + padX, padY + by + placeSize);
  ctx.fillStyle = '#ffd7ef';
  ctx.font = `${lineSize}px sans-serif`;
  ctx.fillText(line2, bx + padX, padY + by + placeSize + 4 * s + lineSize);
  ctx.restore();
}

/**
 * Draws the whole cover onto `ctx` at the canvas's own size.
 * `state` carries layout, grade, texts, heat, assignments and photo
 * images; `photos` is the array of loaded images; assignments index
 * into it.
 */
export function drawCoverGrid(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#0d0214';
  ctx.fillRect(0, 0, w, h);
  const { panels, title, badge, strip, wanted } = layoutPanels(w, h, state.layout);
  const assigns = state.assignments[state.layout] || [];
  const graded = new Map();
  const gradeKey = (pi, pw, ph, crop) =>
    `${pi}|${pw}x${ph}|${crop.fx.toFixed(2)},${crop.fy.toFixed(2)},${crop.zoom.toFixed(2)}`;

  panels.forEach((p, i) => {
    const a0 = assigns[i] || { photo: 0, fx: 0.5, fy: 0.4, zoom: 1 };
    // v5: per-ratio override — one crop cannot serve both the tall
    // portrait row and the short square row. A face that escapes the
    // title in portrait can sit fully behind the letters in square
    // (the face is at the top of its photo, the letters cover the top
    // of the panel, and the crop cannot push it below them). `sq`
    // replaces photo/crop for the square render only; landscape and
    // portrait are untouched.
    const a = (w === h && a0.sq) ? { ...a0, ...a0.sq } : a0;
    const img = photos[a.photo] || photos[0];
    let g = null;
    if (img) {
      const key = gradeKey(a.photo, Math.round(p.w), Math.round(p.h), a);
      g = graded.get(key);
      if (!g) {
        // Grade at most ~760 px wide, then upscale — fast and smooth.
        const gradeCap = 760;
        const scale = Math.min(1, gradeCap / p.w);
        g = gradePanelImage(img, Math.max(2, scale * p.w), Math.max(2, scale * p.h), a, state.grade);
        graded.set(key, g);
      }
    }
    if (p.rot) {
      // Rotated photo card (chaos): clip to the panel rect in rotated
      // space and draw the graded image slightly oversized so the corners
      // stay covered after the rotation — the collage tilt of the top
      // covers. The black edge is stroked inside the same transform.
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.clip();
      if (g) ctx.drawImage(g, -0.53 * p.w, -0.53 * p.h, 1.06 * p.w, 1.06 * p.h);
      ctx.strokeStyle = '#0d0214';
      ctx.lineWidth = GUTTER * (w / 1920);
      ctx.strokeRect(-0.5 * p.w, -0.5 * p.h, p.w, p.h);
      ctx.restore();
    } else {
      ctx.save();
      if (p.slant) {
        // Diagonal panel: clip a parallelogram, draw the photo inside it.
        ctx.beginPath();
        ctx.moveTo(p.slant + p.x, p.y);
        ctx.lineTo(p.w + p.x, p.y);
        ctx.lineTo(p.w + p.x - p.slant, p.h + p.y);
        ctx.lineTo(p.x, p.h + p.y);
        ctx.closePath();
        ctx.clip();
      } else if (p.snap) {
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(-0.045);
        ctx.translate(-p.w / 2, -p.h / 2);
      }
      if (g) {
        const dx = p.snap ? -0.04 * p.w : 0;
        const dy = p.snap ? -0.04 * p.h : 0;
        const dw = (p.snap ? 1.08 : 1) * p.w;
        const dh = (p.snap ? 1.08 : 1) * p.h;
        if (p.snap) {
          // White polaroid border around the snapshot.
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-0.05 * p.w, -0.05 * p.h, 1.1 * p.w, 1.16 * p.h);
          ctx.drawImage(g, dx, dy, dw, dh);
        } else {
          ctx.drawImage(g, p.x, p.y, p.w, p.h);
        }
      }
      ctx.restore();
      // Black gutter edge per panel.
      ctx.save();
      ctx.strokeStyle = '#0d0214';
      ctx.lineWidth = GUTTER * (w / 1920);
      ctx.beginPath();
      ctx.rect(p.x, p.y, p.w, p.h);
      ctx.stroke();
      ctx.restore();
    }
    // Location/time caption chip in the panel's bottom-left corner
    // (hero mode + any layout that wants it; off when the editor toggles
    // captions off). In chaos mode a chip whose panel runs deep under
    // the title would sit under the dark scrim and turn muddy — the top
    // covers leave those panels clean — so skip it.
    const underTitle = state.layout === 'chaos' && p.y + p.h > title.y + 60;
    if (state.showCaptions !== false && !underTitle) {
      const cap = (state.captions || [])[a.photo]
        || { place: 'YOUR SHOT', time: 'TONIGHT', line: 'SHOT ON YOUR CAMERA' };
      drawPanelCaption(ctx, p, cap, w);
    }
  });

  // WANTED pill on the fisherman panel (chaos mode) — drawn on the photo,
  // before the title paints over the lower panels.
  if (state.layout === 'chaos' && wanted) drawWantedPill(ctx, wanted, w);

  drawTitleBlock(ctx, title, state);

  // Hero and chaos furniture: the bottom strip (palms + tagline + fine
  // print + barcode) and the press-quote pill on the panel/title
  // boundary. Chaos adds the VOL. 06 chip + COLLECTOR'S EDITION ribbon.
  // Other layouts keep the old barcode placement instead.
  if ((title.mode === 'hero' || title.mode === 'chaos') && strip) {
    drawBottomStrip(ctx, strip, state);
    drawQuotePill(ctx, title, state);
  }
  if (title.mode === 'chaos') drawVolCluster(ctx, title, state);

  // Poster furniture.
  const bs = Math.max(34, 0.038 * w);
  drawStarburstBadge(ctx, badge.x, badge.y, bs, 'EST.', '2026');
  if (state.showRibbon !== false) {
    ctx.save();
    const rw = 0.2 * w;
    const rh = Math.max(18, 0.035 * h);
    ctx.fillStyle = '#ff2e7e';
    ctx.fillRect(w - rw - GUTTER * (w / 1920), GUTTER * (w / 1920) + 0.02 * h, rw, rh);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(11, 0.42 * rh)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ORIGINAL · FAN MADE', w - 0.5 * rw - GUTTER * (w / 1920), GUTTER * (w / 1920) + 0.02 * h + 0.5 * rh);
    ctx.restore();
  }
  if (state.showBarcode !== false && title.mode !== 'cell' && title.mode !== 'hero') {
    drawBarcode(ctx, w - 0.09 * w - GUTTER, h - 0.075 * h, 0.09 * w, 0.055 * h, state.title || 'PALM HEAT');
  }
  return { panels, title, strip };
}

/** Renders the cover offscreen at an exact post size and returns a PNG blob. */
export function exportCoverPNG(state, photos, sizeKey) {
  return new Promise((resolve) => {
    const size = EXPORT_SIZES[sizeKey];
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    drawCoverGrid(canvas, state, photos);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
