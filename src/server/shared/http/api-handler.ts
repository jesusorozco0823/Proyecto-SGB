import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from '@/server/shared/errors/domain-error';
import { assertSameOrigin } from '@/server/shared/http/origin';

export type RouteContext = { params: Promise<Record<string, string>> };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiHandler(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      assertSameOrigin(request);
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DomainError('VALIDATION', 'El cuerpo de la petición no es JSON válido.');
  }
}

export async function routeParam(context: RouteContext, name: string): Promise<string> {
  const params = await context.params;
  const value = params[name];
  if (!value) {
    throw new DomainError('VALIDATION', 'Falta el identificador.');
  }
  return value;
}

function toErrorResponse(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: error.issues[0]?.message ?? 'Datos inválidos' } },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: 'INTERNAL', message: 'Ocurrió un error interno.' } },
    { status: 500 },
  );
}
