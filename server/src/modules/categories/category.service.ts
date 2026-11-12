import { and, eq } from "drizzle-orm";
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

export async function seedDefaultCategories(userId: number, executor: Pick<typeof db, "insert"> = db) {
  await executor.insert(categories).values(defaultCategories.map((category) => ({ ...category, userId }))).onConflictDoNothing();
}

export async function listCategories(userId: number) {
  return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
}

export async function createCategory(userId: number, input: {
  name: string;
  description?: string | null;
  color?: string | null;
}) {
  const slug = slugify(input.name);
  const [category] = await db
    .insert(categories)
    .values({
      name: input.name,
      userId,
      slug,
      description: input.description || null,
      color: input.color || "#d4ff00",
    })
    .onConflictDoNothing()
    .returning();

  return category;
}

export async function deleteCategory(userId: number, id: number) {
  const [category] = await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId))).returning();
  return category;
}
