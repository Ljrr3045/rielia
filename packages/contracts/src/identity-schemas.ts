import { z } from 'zod';
import { denseArraySchema } from './dense-array-schema.js';

export const identityProviderSchema = z.enum(['google', 'github']);
// These projections intentionally discard extra keys, unlike workspace outputs.
export const identityConfigurationSchema = z.object({
  enabled: z.boolean(),
  providers: denseArraySchema(identityProviderSchema).transform((values) => [...new Set(values)]),
});
export const identitySessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
    }),
    session: z.object({
      id: z.string(),
      expiresAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
    }),
  })
  .nullable();
export type IdentityProvider = z.output<typeof identityProviderSchema>;
export type IdentityConfiguration = z.output<typeof identityConfigurationSchema>;
export type IdentitySession = NonNullable<z.output<typeof identitySessionSchema>>;
