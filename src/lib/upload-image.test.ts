import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudinaryConfig, readUploadedUrl } from './upload-image';

const good = 'https://res.cloudinary.com/sgb/image/upload/v1/sgb/foto.jpg';

test('acepta la URL https que devuelve Cloudinary', () => {
  assert.equal(readUploadedUrl({ secure_url: good }), good);
});

test('rechaza una URL que no es de Cloudinary', () => {
  assert.throws(() => readUploadedUrl({ secure_url: 'https://example.com/foto.jpg' }), /no es válida/);
  assert.throws(() => readUploadedUrl({ secure_url: 'http://res.cloudinary.com/sgb/foto.jpg' }), /no es válida/);
  assert.throws(() => readUploadedUrl({ secure_url: `${good}?${'a'.repeat(500)}` }), /no es válida/);
});

test('muestra el error que devuelve Cloudinary', () => {
  assert.throws(() => readUploadedUrl({ error: { message: 'Upload preset not found' } }), /Upload preset not found/);
});

test('sin nombre de nube ni preset el cargue queda apagado', () => {
  const previousCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const previousPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  assert.equal(cloudinaryConfig(), null);
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'mi-nube';
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'sgb_publico';
  assert.deepEqual(cloudinaryConfig(), { cloud: 'mi-nube', preset: 'sgb_publico' });
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'https://mala';
  assert.equal(cloudinaryConfig(), null);
  if (previousCloud === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  else process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = previousCloud;
  if (previousPreset === undefined) delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  else process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = previousPreset;
});
