import type { Actor } from '@/server/shared/auth/actor';
import { StatsService } from '@/server/modules/stats/application/stats.service';

export class StatsController {
  constructor(private readonly stats: StatsService) {}

  forActor(actor: Actor) {
    return this.stats.forActor(actor);
  }
}
