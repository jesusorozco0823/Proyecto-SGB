import type { Actor } from '@/server/shared/auth/actor';
import { assertRole } from '@/server/shared/auth/authorize';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { CatalogRepository, ServiceDraft } from '@/server/modules/catalog/application/ports';

export class CatalogService {
  constructor(private readonly catalog: CatalogRepository) {}

  list(actor: Actor) {
    assertRole(actor, ['client', 'admin', 'barber', 'superadmin']);
    return this.catalog.listActive();
  }

  create(actor: Actor, input: ServiceDraft) {
    assertRole(actor, ['admin']);
    return this.catalog.create(input);
  }

  async update(actor: Actor, id: string, input: ServiceDraft) {
    assertRole(actor, ['admin']);
    return this.catalog.update(id, input);
  }

  async remove(actor: Actor, id: string) {
    assertRole(actor, ['admin']);
    if (await this.catalog.hasAppointments(id)) {
      await this.catalog.deactivate(id);
      return;
    }
    try {
      await this.catalog.delete(id);
    } catch {
      throw new DomainError('NOT_FOUND', 'No encontramos ese servicio.');
    }
  }
}
