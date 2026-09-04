'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
// import { cn } from '../../../../packages/ui/src/utils/cn';

const queryClient = new QueryClient();
interface AuthProviderProps {
  children: ReactNode;
  className?: string;
}
const Provider = ({ children }: AuthProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <main className={cn('', className)}> */}
      {children}
      <Toaster position="top-right" reverseOrder={false} />
      {/* </main> */}
    </QueryClientProvider>
  )
}

export default Provider;