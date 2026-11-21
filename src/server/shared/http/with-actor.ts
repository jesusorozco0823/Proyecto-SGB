import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, type RouteContext } from '@/server/shared/http/api-handler';
import { attachSession } from '@/server/shared/auth/session-cookie';
import type { Actor } from '@/server/shared/auth/actor';
import { renewSession, requireActor } from '@/server/modules/auth';

const RENEW_WITHIN_MS = 12 * 60 * 60 * 1000;

export function withActor(
  handler: (actor: Actor, request: NextRequest, context: RouteContext) => Promise<NextResponse>,
) {
  return apiHandler(async (request, context) => {
    const gate = await requireActor();
    const response = await handler(gate.actor, request, context);
    if (gate.expiresAt.getTime() - Date.now() < RENEW_WITHIN_MS) {
      const token = await renewSession(gate.sessionId, gate.actor.id);
      attachSession(response, token);
    }
    return response;
  });
}
