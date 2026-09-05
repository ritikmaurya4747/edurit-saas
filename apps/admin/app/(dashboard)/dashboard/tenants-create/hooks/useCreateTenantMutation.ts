import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenants } from "../_actions/createTenants";

const useCreateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTenants,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["school-tenants"] });
      }
    },
  });
};

export default useCreateTenantMutation;