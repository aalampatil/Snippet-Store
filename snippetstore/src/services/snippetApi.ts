import { api } from "../../config/axiosApi";
import type { Category, CategoryPayload, Snippet, SnippetPayload } from "@/types/snippet";

type ApiResponse<T> = {
  data: T;
};

type ListResponse<T> = ApiResponse<T> & {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export async function fetchCategories() {
  const response = await api.get<ApiResponse<Category[]>>("/api/categories");
  return response.data.data;
}

export async function createCategory(payload: CategoryPayload) {
  const response = await api.post<ApiResponse<Category>>("/api/categories", payload);
  return response.data.data;
}

export async function deleteCategory(id: number) {
  await api.delete(`/api/categories/${id}`);
}

export async function fetchSnippets(filters?: { search?: string; categoryId?: number | null }) {
  const response = await api.get<ListResponse<Snippet[]>>("/api/snippets", {
    params: {
      search: filters?.search || undefined,
      categoryId: filters?.categoryId || undefined,
    },
  });
  return response.data.data;
}

export async function fetchSnippet(id: number) {
  const response = await api.get<ApiResponse<Snippet>>(`/api/snippets/${id}`);
  return response.data.data;
}

export async function createSnippet(payload: SnippetPayload) {
  const response = await api.post<ApiResponse<Snippet>>("/api/snippets", payload);
  return response.data.data;
}

export async function updateSnippet(id: number, payload: SnippetPayload) {
  const response = await api.put<ApiResponse<Snippet>>(`/api/snippets/${id}`, payload);
  return response.data.data;
}

export async function deleteSnippet(id: number) {
  await api.delete(`/api/snippets/${id}`);
}
