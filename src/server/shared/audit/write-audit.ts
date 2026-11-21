import { prisma } from '@/server/shared/database/prisma';

export async function writeAudit(actorId: string, action: string, resource: string) {
  try {
    await prisma.auditLog.create({ data: { actorId, action, resource } });
  } catch (error) {
    console.error('No se pudo guardar la bitácora.', error);
  }
}
