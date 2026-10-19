import { AVATAR_CHARACTERS } from '../utils/avatarCharacters';
import { ANIMAL_RIGS, deformAnimalPoint } from '../utils/animalRig';
import type { PenguinMotionPose } from '../utils/penguinMotion';
import type { AvatarCharacterId } from '../types';

// The picker, fallback, and animated texture resolve the same catalog asset.
export function getAnimalPoster(characterId: AvatarCharacterId) {
  const character = AVATAR_CHARACTERS.find(character => character.id === characterId);
  if (!character) throw new Error('Compañero desconocido.');
  return character.src;
}
export type AnimalIllustration = { body: ImageBitmap | HTMLCanvasElement; eye: ImageBitmap | HTMLCanvasElement };
// Retain the two most recently chosen characters, rather than all five textures.
const cache = new Map<AvatarCharacterId, Promise<AnimalIllustration>>();

async function decodeSvg(svg: SVGElement) {
  svg.setAttribute('width', '800'); svg.setAttribute('height', '800');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.decoding = 'async'; image.src = url;
    await image.decode();
    // Rasterize the SVG filters once. Repainting the vector through every mesh
    // triangle would repeatedly run its gradients and blur filters on mobile.
    const bitmap = document.createElement('canvas'); bitmap.width = 800; bitmap.height = 800;
    const context = bitmap.getContext('2d', { alpha: true });
    if (!context) throw new Error('No se pudo preparar la ilustración.');
    context.drawImage(image, 0, 0, 800, 800);
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(bitmap); } catch { /* Older WebViews can still draw the raster canvas. */ }
    }
    return bitmap;
  } finally { URL.revokeObjectURL(url); }
}

/** Separate only the authored eye group so it can close, without redrawing it. */
export function loadAnimalIllustration(characterId: AvatarCharacterId): Promise<AnimalIllustration> {
  const existing = cache.get(characterId);
  if (existing) { cache.delete(characterId); cache.set(characterId, existing); return existing; }
  const pending = (async () => {
    const response = await fetch(getAnimalPoster(characterId));
    if (!response.ok) throw new Error('No se pudo cargar el compañero.');
    const document = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const original = document.documentElement as unknown as SVGElement;
    if (document.querySelector('parsererror') || original.getAttribute('data-figurine-id') !== characterId || !original.querySelector('#eye-line')) throw new Error('Ilustración incompleta.');
    const body = original.cloneNode(true) as SVGElement;
    body.querySelector('#eye-line')!.remove();
    const eye = original.cloneNode(true) as SVGElement;
    eye.querySelectorAll('#figurine-root > g:not(#eye-line)').forEach(group => group.remove());
    const [bodyImage, eyeImage] = await Promise.all([decodeSvg(body), decodeSvg(eye)]);
    return { body: bodyImage, eye: eyeImage };
  })().catch(error => { if (cache.get(characterId) === pending) cache.delete(characterId); throw error; });
  cache.set(characterId, pending);
  if (cache.size > 2) cache.delete(cache.keys().next().value!);
  return pending;
}

type Point = { x: number; y: number };
type Triangle = { a: number; b: number; c: number };

export function createAnimalIllustrationRenderer(canvas: HTMLCanvasElement, art: AnimalIllustration, characterId: AvatarCharacterId) {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return null;
  let width = 128, height = 112, density = 1, disposed = false;
  const rig = ANIMAL_RIGS[characterId];
  const [left, top, right, bottom] = rig.bounds;
  const vertices: Point[] = [], triangles: Triangle[] = [];
  const columns = 24, rows = 28;
  // One small alpha mask avoids drawing triangles outside the original silhouette.
  const maskCanvas = document.createElement('canvas'); maskCanvas.width = 400; maskCanvas.height = 400;
  const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
  maskContext?.drawImage(art.body, 0, 0, 400, 400);
  const alpha = maskContext?.getImageData(0, 0, 400, 400).data;
  for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
    vertices.push({ x: left + column * (right - left) / columns, y: top + row * (bottom - top) / rows });
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
    let occupied = !alpha;
    if (alpha) for (let y = Math.max(0, Math.floor(vertices[a].y)); !occupied && y <= Math.min(399, Math.ceil(vertices[d].y)); y++) {
      for (let x = Math.max(0, Math.floor(vertices[a].x)); x <= Math.min(399, Math.ceil(vertices[d].x)); x++) {
        if (alpha[(y * 400 + x) * 4 + 3]) { occupied = true; break; }
      }
    }
    if (occupied) triangles.push({ a, b, c: d }, { a, b: d, c });
  }

  const textureTriangle = (triangle: Triangle, points: Point[], overlap: number) => {
    const { a, b, c } = triangle;
    const s0 = vertices[a], s1 = vertices[b], s2 = vertices[c];
    const p0 = points[a], p1 = points[b], p2 = points[c];
    const denominator = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
    const aa = ((p1.x - p0.x) * (s2.y - s0.y) - (p2.x - p0.x) * (s1.y - s0.y)) / denominator;
    const bb = ((p1.y - p0.y) * (s2.y - s0.y) - (p2.y - p0.y) * (s1.y - s0.y)) / denominator;
    const cc = ((s1.x - s0.x) * (p2.x - p0.x) - (s2.x - s0.x) * (p1.x - p0.x)) / denominator;
    const dd = ((s1.x - s0.x) * (p2.y - p0.y) - (s2.x - s0.x) * (p1.y - p0.y)) / denominator;
    context.save(); context.beginPath();
    const cx = (p0.x + p1.x + p2.x) / 3, cy = (p0.y + p1.y + p2.y) / 3;
    for (const [index, point] of [p0, p1, p2].entries()) {
      const length = Math.hypot(point.x - cx, point.y - cy) || 1;
      const x = point.x + (point.x - cx) / length * overlap, y = point.y + (point.y - cy) / length * overlap;
      if (index) context.lineTo(x, y); else context.moveTo(x, y);
    }
    context.closePath(); context.clip();
    context.transform(aa, bb, cc, dd, p0.x - aa * s0.x - cc * s0.y, p0.y - bb * s0.x - dd * s0.y);
    // The clip overlaps its neighbor by a physical pixel. Sampling the complete
    // immutable texture prevents source-crop gutters from exposing a mesh grid.
    context.drawImage(art.body, 0, 0, 800, 800, 0, 0, 400, 400);
    context.restore();
  };
  return {
    resize(nextWidth: number, nextHeight: number, dpr = 1) {
      if (disposed) return;
      width = Math.max(1, Number.isFinite(nextWidth) ? nextWidth : 128);
      height = Math.max(1, Number.isFinite(nextHeight) ? nextHeight : 112);
      density = Math.max(1, Math.min(2, Number.isFinite(dpr) ? dpr : 1));
      canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    },
    render(pose: PenguinMotionPose) {
      if (disposed) return;
      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, width, height);
      const scale = Math.min(Math.max(1, height - 22) / rig.displayHeight, Math.max(1, width - 24) / (right - left)), ground = height - 9;
      context.save(); context.translate(width / 2 + pose.x, ground);
      context.scale(1 + Math.abs(pose.lean) * 0.5, 0.16);
      const shadow = context.createRadialGradient(0, 0, 0, 0, 0, scale * 100);
      shadow.addColorStop(0, 'rgba(27,43,62,.18)'); shadow.addColorStop(1, 'rgba(27,43,62,0)');
      context.fillStyle = shadow; context.beginPath(); context.arc(0, 0, scale * 100, 0, Math.PI * 2); context.fill(); context.restore();

      context.save(); context.translate(width / 2 + pose.x, ground + pose.y);
      context.scale(scale, scale); context.translate(0, rig.root[1] - rig.floor); context.rotate(pose.lean); context.translate(-rig.root[0], -rig.root[1]);
      const points = vertices.map(point => deformAnimalPoint(characterId, point.x, point.y, pose));
      for (const triangle of triangles) textureTriangle(triangle, points, 2 / (density * scale));
      const eye = deformAnimalPoint(characterId, rig.eye[0], rig.eye[1], pose);
      context.translate(eye.x, eye.y); context.rotate(pose.headTurn * rig.headRotationScale);
      context.scale(1, Math.max(0.07, 1 - pose.blink * 0.93));
      const [ex, ey, ew, eh] = rig.eyeCrop;
      context.drawImage(art.eye, ex * 2, ey * 2, ew * 2, eh * 2, ex - rig.eye[0], ey - rig.eye[1], ew, eh);
      context.restore();
    },
    dispose() { disposed = true; context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height); },
  };
}
