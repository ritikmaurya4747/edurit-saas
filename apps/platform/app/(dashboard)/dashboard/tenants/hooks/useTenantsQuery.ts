import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import getTenants from "../action/getTenants";

const QUERY_KEY = ["school-tenants"];

const useTenantsQuery = () => {
  const queryClient = useQueryClient();
  const reset = useCallback(
    () => queryClient.resetQueries({ queryKey: QUERY_KEY, exact: true }),
    [queryClient],
  );
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getTenants();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 1000 * 5 * 60,
    refetchOnWindowFocus: false,
    retry: false,
    retryDelay: 500,
    retryOnMount: false,
  });
  return { ...query, reset };
};
export default useTenantsQuery;
