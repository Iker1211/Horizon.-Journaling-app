export const AVATAR_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const AVATAR_INPUT_MAX_BYTES = 10 * 1024 * 1024;
export const AVATAR_OUTPUT_MAX_BYTES = 1024 * 1024;
export const AVATAR_SIZE = 512;

export interface AvatarCrop {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function validateAvatarFile(file: File): void {
  if (!AVATAR_INPUT_TYPES.includes(file.type as (typeof AVATAR_INPUT_TYPES)[number])) {
    throw new Error('Elige una imagen JPEG, PNG o WebP.');
  }
  if (file.size > AVATAR_INPUT_MAX_BYTES) {
    throw new Error('La imagen original no puede superar 10 MB.');
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No pudimos procesar esta imagen.')), 'image/webp', quality);
  });
}

export async function processAvatar(file: File, crop: AvatarCrop): Promise<Blob> {
  validateAvatarFile(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('El archivo no contiene una imagen que Horizon pueda leer.');
  }

  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 50_000_000) {
      throw new Error('La imagen tiene dimensiones demasiado grandes.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Este dispositivo no puede procesar la imagen.');

    const zoom = Math.min(3, Math.max(1, crop.zoom));
    const baseScale = Math.max(AVATAR_SIZE / bitmap.width, AVATAR_SIZE / bitmap.height);
    const scale = baseScale * zoom;
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    const overflowX = Math.max(0, width - AVATAR_SIZE);
    const overflowY = Math.max(0, height - AVATAR_SIZE);
    const normalizedX = Math.min(1, Math.max(-1, crop.offsetX));
    const normalizedY = Math.min(1, Math.max(-1, crop.offsetY));
    const x = (AVATAR_SIZE - width) / 2 - normalizedX * overflowX / 2;
    const y = (AVATAR_SIZE - height) / 2 - normalizedY * overflowY / 2;

    context.fillStyle = '#fffaf0';
    context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, x, y, width, height);

    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= AVATAR_OUTPUT_MAX_BYTES) return blob;
    }
    throw new Error('No pudimos reducir la imagen por debajo de 1 MB.');
  } finally {
    bitmap.close();
  }
}
