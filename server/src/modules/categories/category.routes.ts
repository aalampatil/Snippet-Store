import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../middlewares/error-handler.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { idParamSchema, nullableTrimmedString } from "../../utils/validation.js";
import { createCategory, deleteCategory, listCategories } from "./category.service.js";

export const categoryRouter = Router();
categoryRouter.use(requireAuth);

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(80),
  description: nullableTrimmedString(1000),
  color: nullableTrimmedString(20),
});

categoryRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await listCategories(req.user!.id);
    res.json({ data: categories });
  }),
);

categoryRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createCategorySchema.parse(req.body);

    const category = await createCategory(req.user!.id, input);
    if (!category) throw new AppError("A category with that name already exists.", 409);
    res.status(201).json({ data: category });
  }),
);

categoryRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);

    const category = await deleteCategory(req.user!.id, id);
    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    res.status(204).send();
  }),
);
