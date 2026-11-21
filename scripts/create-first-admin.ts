import { existsSync, readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const FILE = '.env.produccion';

export function readEnvFile(text: string) {
  const values: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export function productionDatabaseHost(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL de .env.produccion no se puede leer.');
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL de .env.produccion tiene que empezar por postgresql://');
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
    throw new Error('Esa dirección es la base de tu computador. Este comando no la toca.');
  }
  return host;
}

async function main() {
  if (!existsSync(FILE)) {
    throw new Error('No existe .env.produccion. Cópialo desde .env.produccion.example. No uses el .env de desarrollo.');
  }
  const env = readEnvFile(readFileSync(FILE, 'utf8'));
  const url = env.DATABASE_URL ?? '';
  const host = productionDatabaseHost(url);
  const documentNumber = (env.ADMIN_DOCUMENT ?? '').trim();
  const displayName = (env.ADMIN_DISPLAY_NAME ?? '').trim();
  const password = env.ADMIN_PASSWORD ?? '';
  const phone = (env.ADMIN_PHONE ?? '').trim();

  if (!/^\d{6,20}$/.test(documentNumber)) {
    throw new Error('ADMIN_DOCUMENT debe tener entre 6 y 20 dígitos, sin puntos ni espacios.');
  }
  if (displayName.length < 3) {
    throw new Error('ADMIN_DISPLAY_NAME necesita al menos 3 letras.');
  }
  if (password.length < 10 || password.toLowerCase() === 'password') {
    throw new Error('ADMIN_PASSWORD necesita al menos 10 caracteres y no puede ser password.');
  }

  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const existing = await prisma.user.findUnique({ where: { documentNumber }, select: { id: true } });
    if (existing) {
      console.log(`El documento ${documentNumber} ya existe en ${host}. No cambié nada.`);
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        displayName,
        documentNumber,
        passwordHash,
        role: 'superadmin',
        phone: phone || null,
        avatarUrl: 'https://placehold.co/100x100.png',
        preferences: [],
      },
    });
    console.log(`Listo. Superadministrador creado en ${host}. Entra con el documento ${documentNumber}.`);
  } finally {
    await prisma.$disconnect();
  }
}

const entry = process.argv[1]?.replace(/\\/g, '/');
if (entry?.endsWith('scripts/create-first-admin.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'No se pudo crear el administrador.');
    process.exit(1);
  });
}
