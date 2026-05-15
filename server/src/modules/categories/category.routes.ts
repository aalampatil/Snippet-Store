import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../middlewares/error-handler.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { idParamSchema, nullableTrimmedString } from "../../utils/validation.js";
import { createCategory, deleteCategory, listCategories } from "./category.service.js";

export const categoryRouter = Router();

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(80),
  description: nullableTrimmedString(1000),
  color: nullableTrimmedString(20),
});

categoryRouter.get("/", asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.json({ data: categories });
}));

categoryRouter.post("/", asyncHandler(async (req, res) => {
  const input = createCategorySchema.parse(req.body);

  try {
    const category = await createCategory(input);
    res.status(201).json({ data: category });
  } catch {
    throw new AppError("A category with that name already exists.", 409);
  }
}));

categoryRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);

  const category = await deleteCategory(id);
  if (!category) {
    throw new AppError("Category not found.", 404);
  }

  res.status(204).send();
}));
