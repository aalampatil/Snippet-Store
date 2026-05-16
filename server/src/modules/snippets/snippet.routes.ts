import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../middlewares/error-handler.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { idParamSchema, nullableTrimmedString, paginationQuerySchema } from "../../utils/validation.js";
import {
  createSnippet,
  deleteSnippet,
  getSnippetForUser,
  listSnippets,
  updateSnippet,
} from "./snippet.service.js";

export const snippetRouter = Router();
snippetRouter.use(requireAuth);

const snippetInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  note: nullableTrimmedString(5000),
  content: z.string().trim().min(1, "Snippet content is required.").max(200000),
  language: nullableTrimmedString(80),
  project: nullableTrimmedString(120),
  categoryId: z
    .union([z.coerce.number().int().positive(), z.null(), z.literal(""), z.undefined()])
    .transform((value) => (typeof value === "number" ? value : null)),
});

const listQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional().catch(undefined),
  categoryId: z.coerce.number().int().positive().optional().catch(undefined),
});

snippetRouter.get("/", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const query = listQuerySchema.parse(req.query);

  const filters = {
    page: query.page,
    limit: query.limit,
    ...(query.search ? { search: query.search } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
  };

  const result = await listSnippets(userId, filters);
  res.json(result);
}));

snippetRouter.get("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = idParamSchema.parse(req.params);

  const snippet = await getSnippetForUser(userId, id);
  if (!snippet) {
    throw new AppError("Snippet not found.", 404);
  }

  res.json({ data: snippet });
}));

snippetRouter.post("/", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const input = snippetInputSchema.parse(req.body);
  const snippet = await createSnippet(userId, input);
  res.status(201).json({ data: snippet });
}));

snippetRouter.put("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = idParamSchema.parse(req.params);
  const input = snippetInputSchema.parse(req.body);

  const snippet = await updateSnippet(userId, id, input);
  if (!snippet) {
    throw new AppError("Snippet not found.", 404);
  }

  res.json({ data: snippet });
}));

snippetRouter.delete("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = idParamSchema.parse(req.params);

  const snippet = await deleteSnippet(userId, id);
  if (!snippet) {
    throw new AppError("Snippet not found.", 404);
  }

  res.status(204).send();
}));
