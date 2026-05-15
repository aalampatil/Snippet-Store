import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, type NewCategory } from "../../db/schema.js";
import { slugify } from "./category.utils.js";

const defaultCategories: NewCategory[] = [
  {
    name: "Code Snippet",
    slug: "code-snippet",
    description: "Reusable functions, components, scripts, and examples.",
    color: "#d4ff00",
  },
  {
    name: "Command Snippet",
    slug: "command-snippet",
    description: "Terminal commands and command sequences.",
    color: "#98f5ff",
  },
  {
    name: "Config",
    slug: "config",
    description: "Project setup, environment, and configuration notes.",
    color: "#ffcf5a",
  },
  {
    name: "Note",
    slug: "note",
    description: "Short technical notes and reminders.",
    color: "#f0f0f0",
  },
];

export async function seedDefaultCategories() {
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length > 0) {
    return;
  }

  await db.insert(categories).values(defaultCategories);
}

export async function listCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(input: {
  name: string;
  description?: string | null;
  color?: string | null;
}) {
  const slug = slugify(input.name);
  const [category] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug,
      description: input.description || null,
      color: input.color || "#d4ff00",
    })
    .returning();

  return category;
}

export async function deleteCategory(id: number) {
  const [category] = await db.delete(categories).where(eq(categories.id, id)).returning();
  return category;
}
