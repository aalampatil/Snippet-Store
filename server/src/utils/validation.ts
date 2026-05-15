import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export function nullableTrimmedString(max: number) {
  return z
    .union([z.string().trim().max(max), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));
}
