import { z } from 'zod';
import { isRecord } from '@rielia/contracts';

// A replay only needs its current summary selector, not the stale summary DTO.
export const workspaceReceiptReferenceSchema = z
  .custom<Record<string, unknown>>(isRecord)
  .pipe(z.object({ id: z.string().min(1) }));
