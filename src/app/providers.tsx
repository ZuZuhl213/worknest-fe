import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../features/auth/auth-context';
import { ToastProvider } from '../shared/components/toast';
import { ThemeProvider } from '../shared/theme/theme-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const providers = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

  return googleClientId
    ? <GoogleOAuthProvider clientId={googleClientId}>{providers}</GoogleOAuthProvider>
    : providers;
};
export default AppProviders;
