import { Prisma } from '@prisma/client';

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function decimalToNumber(value: Prisma.Decimal | number | string): number {
  return Number(value);
}
