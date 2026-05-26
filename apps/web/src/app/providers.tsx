'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function AuthWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleAuthError = (e: CustomEvent) => {
      localStorage.removeItem('bizflow_token');
      router.push('/login');
    };

    window.addEventListener('auth:unauthorized', handleAuthError as EventListener);
    return () => window.removeEventListener('auth:unauthorized', handleAuthError as EventListener);
  }, [router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthWatcher>{children}</AuthWatcher>
    </QueryClientProvider>
  );
}
