import { BadRequestException, ConflictException } from '@nestjs/common';

/** Read structured codes only; driver messages/SQL/metadata never leave here. */
export function storageConstraintException(error: unknown): BadRequestException | ConflictException | undefined {
  const pending: unknown[] = [error];
  const seen = new Set<object>();
  const codes = new Set<string>();
  while (pending.length) {
    const item = pending.pop();
    if (typeof item !== 'object' || item === null || seen.has(item)) continue;
    seen.add(item);
    const record = item as Record<string, unknown>;
    for (const key of ['code', 'originalCode']) if (typeof record[key] === 'string') codes.add(record[key]);
    // Prisma 7's PG adapter retains SQLSTATE in meta.driverAdapterError.cause;
    // raw queries instead retain it in meta.code. Do not parse error messages.
    for (const key of ['cause', 'meta', 'driverAdapterError']) pending.push(record[key]);
  }
  if (['P2002', '23505'].some(code => codes.has(code))) return new ConflictException('Principal data already exists.');
  if (['P2000', 'P2003', 'P2004', 'P2011', '23502', '23503', '23514', '23001'].some(code => codes.has(code))) {
    return new BadRequestException('Principal data violates a storage constraint.');
  }
  return undefined;
}
