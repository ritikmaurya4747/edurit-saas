"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, type Paginated, type QueryParams } from "./client";

type QueryOpts<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">;

// GET a resource. Pass `path = null` to keep the query disabled (e.g. until a
// dropdown is chosen). The params object is part of the cache key.
// Key convention: first element is the domain ("students", "fees", ...) so
// mutations can invalidate a whole domain with ["students"].
export function useApiQuery<T>(key: QueryKey, path: string | null, params?: QueryParams, options?: QueryOpts<T>) {
  return useQuery<T, Error, T, QueryKey>({
    queryKey: [...key, params ?? {}],
    queryFn: () => api.get<T>(path as string, params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
    enabled: !!path && (options?.enabled ?? true),
  });
}

// GET a paginated list ({ data, meta }). Keeps the previous page visible while
// the next one loads.
export function usePaginatedQuery<T>(key: QueryKey, path: string | null, params?: QueryParams) {
  return useQuery<Paginated<T>, Error>({
    queryKey: [...key, params ?? {}],
    queryFn: () => api.page<T>(path as string, params),
    enabled: !!path,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

interface MutationOptions<TResult> {
  // Query key prefixes to refetch after success, e.g. [["students"], ["dashboard"]]
  invalidate?: QueryKey[];
  success?: string | ((result: TResult) => string);
  onSuccess?: (result: TResult) => void;
}

// Mutation with toast feedback and cache invalidation.
export function useApiMutation<TVars = void, TResult = unknown>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  options: MutationOptions<TResult> = {},
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, Error, TVars>({
    mutationFn,
    onSuccess: async (result) => {
      await Promise.all(
        (options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
      const message = typeof options.success === "function" ? options.success(result) : options.success;
      if (message) toast.success(message);
      options.onSuccess?.(result);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
    },
  });
}

export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
