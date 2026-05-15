import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, snippets, type NewSnippet } from "../../db/schema.js";

export type SnippetInput = {
  title: string;
  note?: string | null;
  content: string;
  language?: string | null;
  project?: string | null;
  categoryId?: number | null;
};

export type SnippetListFilters = {
  search?: string;
  categoryId?: number;
  page: number;
  limit: number;
};

export async function listSnippets(filters: SnippetListFilters) {
  const conditions = [];
  const offset = (filters.page - 1) * filters.limit;

  if (filters.categoryId) {
    conditions.push(eq(snippets.categoryId, filters.categoryId));
  }

  if (filters.search) {
    const search = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(snippets.title, search),
        ilike(snippets.note, search),
        ilike(snippets.content, search),
        ilike(snippets.language, search),
        ilike(snippets.project, search),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: snippets.id,
      title: snippets.title,
      note: snippets.note,
      content: snippets.content,
      language: snippets.language,
      project: snippets.project,
      categoryId: snippets.categoryId,
      createdAt: snippets.createdAt,
      updatedAt: snippets.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        color: categories.color,
        description: categories.description,
      },
    })
    .from(snippets)
    .leftJoin(categories, eq(snippets.categoryId, categories.id))
    .where(where)
    .orderBy(desc(snippets.updatedAt))
    .limit(filters.limit)
    .offset(offset);

  const [totalRow] = await db.select({ total: count() }).from(snippets).where(where);

  return {
    data,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: totalRow?.total ?? 0,
    },
  };
}

export async function getSnippet(id: number) {
  const [snippet] = await db
    .select({
      id: snippets.id,
      title: snippets.title,
      note: snippets.note,
      content: snippets.content,
      language: snippets.language,
      project: snippets.project,
      categoryId: snippets.categoryId,
      createdAt: snippets.createdAt,
      updatedAt: snippets.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        color: categories.color,
        description: categories.description,
      },
    })
    .from(snippets)
    .leftJoin(categories, eq(snippets.categoryId, categories.id))
    .where(eq(snippets.id, id))
    .limit(1);

  return snippet;
}

export async function createSnippet(input: SnippetInput) {
  const [snippet] = await db
    .insert(snippets)
    .values(toSnippetValues(input))
    .returning();

  if (!snippet) {
    throw new Error("Snippet could not be created.");
  }

  return getSnippet(snippet.id);
}

export async function updateSnippet(id: number, input: SnippetInput) {
  const [snippet] = await db
    .update(snippets)
    .set({ ...toSnippetValues(input), updatedAt: new Date() })
    .where(eq(snippets.id, id))
    .returning();

  return snippet ? getSnippet(snippet.id) : undefined;
}

export async function deleteSnippet(id: number) {
  const [snippet] = await db.delete(snippets).where(eq(snippets.id, id)).returning();
  return snippet;
}

function toSnippetValues(input: SnippetInput): NewSnippet {
  return {
    title: input.title,
    note: input.note || null,
    content: input.content,
    language: input.language || null,
    project: input.project || null,
    categoryId: input.categoryId ?? null,
  };
}
