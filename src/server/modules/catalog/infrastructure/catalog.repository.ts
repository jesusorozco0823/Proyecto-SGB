import type { PrismaClient, Service as PrismaService } from '@prisma/client';
import type { Service } from '@/lib/types';
import { decimalToNumber } from '@/server/shared/database/prisma-errors';
import type { CatalogRepository, ServiceDraft } from '@/server/modules/catalog/application/ports';

function toService(service: PrismaService): Service {
  return {
    id: service.id,
    name: service.name,
    duration: service.duration,
    price: decimalToNumber(service.price),
    description: service.description,
  };
}

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly db: PrismaClient) {}

  async listActive() {
    const services = await this.db.service.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return services.map(toService);
  }

  async findActiveByIds(ids: string[]) {
    const services = await this.db.service.findMany({ where: { id: { in: ids }, active: true } });
    return services.map(toService);
  }

  async create(input: ServiceDraft) {
    const service = await this.db.service.create({ data: input });
    return toService(service);
  }

  async update(id: string, input: ServiceDraft) {
    const service = await this.db.service.update({ where: { id }, data: input });
    return toService(service);
  }

  async deactivate(id: string) {
    await this.db.service.update({ where: { id }, data: { active: false } });
  }

  async hasAppointments(id: string) {
    const count = await this.db.appointmentService.count({ where: { serviceId: id } });
    return count > 0;
  }

  async delete(id: string) {
    await this.db.service.delete({ where: { id } });
  }
}
