'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { CookieAuthProvider } from '@/hooks/useCookieAuth';
import AnonymousRegistrationModal from '@/components/features/auth/AnonymousRegistrationModal';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分間は新鮮なデータとして扱う
            gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CookieAuthProvider>
        {children}
        <AnonymousRegistrationModal />
      </CookieAuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}