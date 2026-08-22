/* Canvas-authored surfaces for the library shelf.
 *
 * The books on this shelf have real covers — scans of the printed editions —
 * so nothing here draws a cover for them. What this module makes is everything
 * the scan does not carry: the cloth weave that catches the raking light, the
 * paper of the page block, the ruled fore-edge, and the case a video wears
 * when it stands next to a book.
 *
 * The weave, page-edge and contact-shadow routines follow ThreeUI's Bookshelf
 * renderer closely; the palettes and the video case are this house's.
 */

import * as THREE from 'three';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/* A small deterministic PRNG so a volume's grain, fibre and page ruling are
   the same on every load and on every machine. A book that reshuffles its own
   paper each refresh is a screensaver, not an object. */
function hashSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function configure(texture, { color = true, anisotropy = 8 } = {}) {
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function canvas2d(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return { element, ctx: element.getContext('2d') };
}

/* ---- Cloth ----
   A woven height field turned into a normal map and a roughness map. Two sine
   families crossing at slightly different periods give warp and weft; a third,
   much slower, keeps the weave from tiling visibly. This is what makes a cover
   read as bound cloth rather than as coloured plastic under the rake light. */
export function makeClothSurfaceMaps(volume) {
  const size = 256;
  const heightField = new Float32Array(size * size);
  const normal = canvas2d(size, size);
  const roughness = canvas2d(size, size);
  const normalImage = normal.ctx.createImageData(size, size);
  const roughnessImage = roughness.ctx.createImageData(size, size);
  const phase = (volume.seed % 19) * 0.23;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const warp = Math.sin((x + phase) * Math.PI * 0.52);
      const weft = Math.sin((y - phase) * Math.PI * 0.41);
      const cross = Math.sin((x + y + phase) * Math.PI * 0.19);
      heightField[y * size + x] = 0.5 + warp * 0.18 + weft * 0.15 + cross * 0.045;
    }
  }

  const sample = (x, y) => heightField[(((y + size) % size) * size) + ((x + size) % size)];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      const pixel = index * 4;
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * 1.5;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * 1.5;
      const length = Math.hypot(dx, dy, 1);
      normalImage.data[pixel] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 3] = 255;

      const value = Math.round(188 + heightField[index] * 56);
      roughnessImage.data[pixel] = value;
      roughnessImage.data[pixel + 1] = value;
      roughnessImage.data[pixel + 2] = value;
      roughnessImage.data[pixel + 3] = 255;
    }
  }

  normal.ctx.putImageData(normalImage, 0, 0);
  roughness.ctx.putImageData(roughnessImage, 0, 0);

  const weave = (element) => {
    const texture = new THREE.CanvasTexture(element);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 8);
    return configure(texture, { color: false, anisotropy: 12 });
  };

  return { normal: weave(normal.element), roughness: weave(roughness.element) };
}

/* ---- The video case ----
   A book gets its cover from the printer. A video has only a YouTube still, so
   its case is authored here: hedge-green cloth, the still inset as a tipped-in
   plate with a warm border, and the title stamped in gold foil beneath it.

   The plate is drawn at the thumbnail's own 16:9 and centred, so a landscape
   still never gets stretched to fill an upright case. */
export function makeVideoCoverTexture(volume, thumbnail) {
  const width = 768;
  const height = 1152;
  const { element, ctx } = canvas2d(width, height);
  const random = seededRandom(hashSeed(volume.id) + volume.seed);

  ctx.fillStyle = volume.color;
  ctx.fillRect(0, 0, width, height);

  /* A vertical wash so the case is lit from above like everything else in the
     room, and a darker gutter at the binding edge. */
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, 'rgba(255,255,255,0.14)');
  wash.addColorStop(0.45, 'rgba(255,255,255,0.03)');
  wash.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  const gutter = ctx.createLinearGradient(0, 0, width * 0.16, 0);
  gutter.addColorStop(0, 'rgba(0,0,0,0.3)');
  gutter.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, width * 0.16, height);

  /* Cloth fibre. Sparse, low-alpha strokes — the normal map does the lighting,
     this only keeps the colour from reading as flat fill. */
  for (let index = 0; index < 2600; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const light = random() > 0.5;
    ctx.strokeStyle = light ? 'rgba(255,247,224,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() > 0.5 ? 4 : 0), y + (random() > 0.5 ? 0 : 4));
    ctx.stroke();
  }

  /* The tipped-in plate. */
  const plateInset = width * 0.1;
  const plateWidth = width - plateInset * 2;
  const plateHeight = plateWidth * (9 / 16);
  const plateTop = height * 0.16;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#efe6d4';
  ctx.fillRect(plateInset - 9, plateTop - 9, plateWidth + 18, plateHeight + 18);
  ctx.restore();

  if (thumbnail) {
    ctx.drawImage(thumbnail, plateInset, plateTop, plateWidth, plateHeight);
  } else {
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(plateInset, plateTop, plateWidth, plateHeight);
  }

  /* A hairline inside the plate edge, the same light edge every raised surface
     in this system carries. */
  ctx.strokeStyle = 'rgba(43,33,24,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(plateInset, plateTop, plateWidth, plateHeight);

  /* Foil rules above and below the title block. */
  const titleTop = plateTop + plateHeight + height * 0.075;
  ctx.fillStyle = volume.foil;
  ctx.fillRect(plateInset, titleTop - 34, plateWidth, 3);

  /* Georgia at display sizes is the serif that names things in this system.
     Persian titles need a face that actually has the glyphs, so the stack
     falls through to whatever the device carries for Arabic script. */
  const persian = volume.titleLang === 'fa';
  const face = persian
    ? "'Vazirmatn', 'Noto Naskh Arabic', 'Tahoma', serif"
    : "Georgia, 'Times New Roman', serif";
  /* Sized to be read at shelf distance, not in close-up. At 54px these titles
     were a gold smudge until the volume was taken down, which defeats the
     point of standing them face-out. */
  const titleSize = volume.title.length > 26 ? 62 : 76;

  ctx.fillStyle = volume.foil;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.direction = persian ? 'rtl' : 'ltr';
  ctx.font = `700 ${titleSize}px ${face}`;

  const words = volume.title.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > plateWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, 4).forEach((text, index) => {
    ctx.fillText(text, width * 0.5, titleTop + index * (titleSize * 1.22));
  });

  /* The mark at the foot: this is a Therapy House edition. */
  ctx.font = "800 22px system-ui, 'Segoe UI', sans-serif";
  ctx.direction = 'ltr';
  ctx.fillStyle = 'rgba(255,247,224,0.62)';
  ctx.letterSpacing = '5px';
  ctx.fillText('THERAPY HOUSE', width * 0.5, height - 92);

  return configure(new THREE.CanvasTexture(element));
}

/* The spine. A book on a shelf is seen edge-on more often than face-on, and a
   blank spine is the tell that an object was made for one camera angle. */
export function makeSpineTexture(volume) {
  const width = 256;
  const height = 1152;
  const { element, ctx } = canvas2d(width, height);

  ctx.fillStyle = volume.color;
  ctx.fillRect(0, 0, width, height);

  const shade = ctx.createLinearGradient(0, 0, width, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.26)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  shade.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = volume.foil;
  ctx.fillRect(width * 0.28, height * 0.08, width * 0.44, 3);
  ctx.fillRect(width * 0.28, height * 0.92, width * 0.44, 3);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(Math.PI * 0.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = volume.foil;
  const persian = volume.titleLang === 'fa';
  ctx.font = persian
    ? "700 62px 'Vazirmatn', 'Noto Naskh Arabic', Tahoma, serif"
    : "700 66px Georgia, 'Times New Roman', serif";
  const label = volume.title.length > 30 ? `${volume.title.slice(0, 29)}…` : volume.title;
  ctx.fillText(label, 0, 0);
  ctx.restore();

  return configure(new THREE.CanvasTexture(element));
}

/* ---- Paper ----
   The page block a book opens onto, and the ruled fore-edge it shows while
   closed. Warm off-white with fibre; never a flat white, which on a lamplit
   shelf reads as a lit screen wedged between the boards. */
export function makePaperTexture(volume) {
  const { element, ctx } = canvas2d(1024, 1024);
  const random = seededRandom(hashSeed(`${volume.id}-paper`) + volume.seed);

  ctx.fillStyle = '#f2ebdc';
  ctx.fillRect(0, 0, 1024, 1024);

  const wash = ctx.createLinearGradient(0, 0, 1024, 1024);
  wash.addColorStop(0, 'rgba(255,252,244,0.85)');
  wash.addColorStop(0.6, 'rgba(238,229,213,0.5)');
  wash.addColorStop(1, 'rgba(222,210,188,0.55)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let index = 0; index < 5200; index += 1) {
    const x = random() * 1024;
    const y = random() * 1024;
    ctx.fillStyle = random() > 0.5 ? 'rgba(120,102,78,0.05)' : 'rgba(255,255,255,0.07)';
    ctx.fillRect(x, y, 1 + random() * 2, 1);
  }

  return configure(new THREE.CanvasTexture(element));
}

export function makePageEdgeTexture(volume, { foreEdge = true } = {}) {
  const width = foreEdge ? 256 : 1024;
  const height = foreEdge ? 1024 : 256;
  const { element, ctx } = canvas2d(width, height);
  const random = seededRandom(hashSeed(`${volume.id}-edge`) + volume.seed);

  ctx.fillStyle = '#dcd5c7';
  ctx.fillRect(0, 0, width, height);

  /* One stroke per leaf. Roughly one page in thirty is a signature fold and
     sits darker — that irregularity is the whole reason the edge reads as
     paper rather than as a striped texture. */
  const step = foreEdge ? 2 : 1.35;
  const span = foreEdge ? width : height;
  for (let offset = 0; offset < span; offset += step) {
    const shade = Math.round(106 + random() * 74);
    const signature = random() > 0.965;
    ctx.strokeStyle = `rgba(${shade},${shade - 3},${shade - 9},${
      signature ? 0.34 : 0.13 + random() * 0.13
    })`;
    ctx.lineWidth = signature ? 1.6 : 1;
    ctx.beginPath();
    if (foreEdge) {
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, height);
    } else {
      ctx.moveTo(0, offset);
      ctx.lineTo(width, offset);
    }
    ctx.stroke();
  }

  return configure(new THREE.CanvasTexture(element));
}

/* The soft ellipse under each volume where it meets the board. Cheaper than a
   shadow map at this scale and, unlike one, it never flickers as the carousel
   damps into place. */
let sharedContactShadow = null;
export function makeContactShadowTexture() {
  if (sharedContactShadow) return sharedContactShadow;
  const { element, ctx } = canvas2d(512, 128);
  const gradient = ctx.createRadialGradient(256, 64, 10, 256, 64, 254);
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.38, 'rgba(255,255,255,0.62)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 128);
  sharedContactShadow = configure(new THREE.CanvasTexture(element), {
    color: false,
    anisotropy: 8,
  });
  return sharedContactShadow;
}

/* Walnut for the board and the uprights, matching the library room's own
   joinery rather than the reference's near-black shelf. */
export function makeWalnutTexture({ dark = false } = {}) {
  const { element, ctx } = canvas2d(1024, 256);
  const random = seededRandom(dark ? 90210 : 31337);
  const base = dark ? '#2a170f' : '#4a2b1d';

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 256);

  for (let index = 0; index < 190; index += 1) {
    const y = random() * 256;
    const amplitude = 2 + random() * 7;
    const light = random() > 0.62;
    ctx.strokeStyle = light
      ? `rgba(196,148,104,${0.05 + random() * 0.09})`
      : `rgba(24,12,6,${0.08 + random() * 0.14})`;
    ctx.lineWidth = 0.6 + random() * 2.4;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 24) {
      const wave = Math.sin((x / 1024) * Math.PI * (1.4 + random() * 0.2)) * amplitude;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(element);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return configure(texture, { anisotropy: 8 });
}

export { clamp01, hashSeed, seededRandom, configure };
