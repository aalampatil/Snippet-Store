import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 255 }).notNull().unique(),
    passwordHash: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

export const categories = pgTable(
  "categories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 80 }).notNull().unique(),
    slug: varchar({ length: 100 }).notNull().unique(),
    description: text(),
    color: varchar({ length: 20 }).notNull().default("#d4ff00"),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("categories_name_idx").on(table.name)],
);

export const snippets = pgTable(
  "snippets",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 160 }).notNull(),
    note: text(),
    content: text().notNull(),
    language: varchar({ length: 80 }),
    project: varchar({ length: 120 }),
    userId: integer().references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer().references(() => categories.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("snippets_category_id_idx").on(table.categoryId),
    index("snippets_user_id_idx").on(table.userId),
    index("snippets_updated_at_idx").on(table.updatedAt),
    index("snippets_title_idx").on(table.title),
    index("snippets_language_idx").on(table.language),
    index("snippets_project_idx").on(table.project),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;
