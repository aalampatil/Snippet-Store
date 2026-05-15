export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Snippet = {
  id: number;
  title: string;
  note: string | null;
  content: string;
  language: string | null;
  project: string | null;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
};

export type SnippetPayload = {
  title: string;
  note: string | null;
  content: string;
  language: string | null;
  project: string | null;
  categoryId: number | null;
};

export type CategoryPayload = {
  name: string;
  description: string | null;
  color?: string | null;
};
