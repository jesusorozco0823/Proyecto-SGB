import type { Service } from '@/lib/types';

export type ServiceDraft = {
  name: string;
  duration: number;
  price: number;
  description: string;
};

export interface CatalogRepository {
  listActive(): Promise<Service[]>;
  findActiveByIds(ids: string[]): Promise<Service[]>;
  create(input: ServiceDraft): Promise<Service>;
  update(id: string, input: ServiceDraft): Promise<Service>;
  deactivate(id: string): Promise<void>;
  hasAppointments(id: string): Promise<boolean>;
  delete(id: string): Promise<void>;
}
