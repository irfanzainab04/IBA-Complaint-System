import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Category {
  id: string;
  label: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "electrical", label: "Electrical" },
  { id: "plumbing", label: "Plumbing" },
  { id: "it", label: "IT / Network" },
  { id: "lab_equipment", label: "Lab Equipment" },
  { id: "general", label: "General Maintenance" },
];

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) return DEFAULT_CATEGORIES;
  return res.json();
}

async function addCategory(label: string): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add category");
  }
  return res.json();
}

async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete category");
  }
}

export const CATEGORIES_QUERY_KEY = ["/api/categories"];

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
    placeholderData: DEFAULT_CATEGORIES,
  });
}

export function useAddCategory(options?: { onSuccess?: () => void; onError?: (msg: string) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      options?.onSuccess?.();
    },
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });
}

export function useDeleteCategory(options?: { onSuccess?: () => void; onError?: (msg: string) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      options?.onSuccess?.();
    },
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });
}
