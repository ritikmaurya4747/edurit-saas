"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser session (useState keeps it stable across renders).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: false, staleTime: 30_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "13px" } }} />
    </QueryClientProvider>
  );
}
