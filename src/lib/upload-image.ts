const CLOUD_NAME = /^[a-z0-9][a-z0-9_-]{0,60}$/i;
const MAX_URL = 500;
const MAX_SOURCE = 8 * 1024 * 1024;
const MAX_UPLOAD = 1024 * 1024;

export type ImageKind = 'avatar' | 'product';

export function cloudinaryConfig() {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ?? '';
  if (!CLOUD_NAME.test(cloud) || !CLOUD_NAME.test(preset)) return null;
  return { cloud, preset };
}

export function readUploadedUrl(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('No se pudo subir la foto.');
  }
  const body = payload as { secure_url?: unknown; error?: { message?: unknown } };
  if (body.error) {
    throw new Error(typeof body.error.message === 'string' ? body.error.message : 'No se pudo subir la foto.');
  }
  if (typeof body.secure_url !== 'string' || body.secure_url.length > MAX_URL) {
    throw new Error('La foto subida no es válida.');
  }
  let url: URL;
  try {
    url = new URL(body.secure_url);
  } catch {
    throw new Error('La foto subida no es válida.');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
    throw new Error('La foto subida no es válida.');
  }
  return url.toString();
}

async function shrink(file: File, edge: number): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('La foto debe ser JPG, PNG o WebP.');
  }
  if (file.size > MAX_SOURCE) {
    throw new Error('La foto pesa más de 8 MB.');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('No se pudo preparar la foto.');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob || blob.size > MAX_UPLOAD) {
    throw new Error('La foto sigue siendo muy pesada. Prueba con otra.');
  }
  return blob;
}

export async function uploadImage(file: File, kind: ImageKind): Promise<string> {
  const config = cloudinaryConfig();
  if (!config) {
    throw new Error('Falta configurar Cloudinary. Agrega el nombre de la nube y el preset en el entorno.');
  }
  const blob = await shrink(file, kind === 'avatar' ? 400 : 800);
  const body = new FormData();
  body.append('file', blob, 'foto.jpg');
  body.append('upload_preset', config.preset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`, { method: 'POST', body });
  const payload = await response.json().catch(() => null);
  return readUploadedUrl(payload);
}
