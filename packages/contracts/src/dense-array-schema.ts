import { z } from 'zod';

/** JSON arrays are dense; do not let predicate-backed items silently skip holes. */
export function denseArraySchema<Item extends z.ZodType>(item: Item) {
  return z
    .custom<unknown[]>(
      (value) => Array.isArray(value) && Array.from(value.keys()).every((index) => index in value),
    )
    .pipe(z.array(item));
}
