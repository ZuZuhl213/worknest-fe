import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth-context';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const api = vi.hoisted(() => {
  let sessionVersion = 0;
  return {
    refresh: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    beginSession: vi.fn(() => ++sessionVersion),
    getSessionVersion: vi.fn(() => sessionVersion),
    setAccessToken: vi.fn((token: string | null, expectedSessionVersion?: number) => {
      if (expectedSessionVersion !== undefined && expectedSessionVersion !== sessionVersion) return false;
      if (token === null) sessionVersion += 1;
      return true;
    }),
  };
});

vi.mock('../../shared/api/client', () => ({
  default: { get: api.get, post: api.post },
  beginSession: api.beginSession,
  getSessionVersion: api.getSessionVersion,
  fetchCsrfToken: vi.fn(),
  refreshAccessToken: api.refresh,
  setAccessToken: api.setAccessToken,
}));

const AuthState = () => {
  const { isAuthenticated, isLoading, user, login } = useAuth();
  return <><output>{`${isAuthenticated}:${isLoading}:${user?.fullName ?? ''}`}</output><button onClick={() => void login('new@example.com', 'password')}>Login</button></>;
};

describe('AuthProvider', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not restore a session when logout happens during bootstrap', async () => {
    const currentUser = deferred<{ data: { id: number; fullName: string } }>();
    api.refresh.mockResolvedValue(undefined);
    api.get.mockReturnValue(currentUser.promise);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><AuthState /></AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/auth/me'));
    await act(async () => {
      window.dispatchEvent(new Event('auth-logout'));
      currentUser.resolve({ data: { id: 1, fullName: 'Test User' } });
      await currentUser.promise;
    });

    expect(screen.getByText('false:false:')).toBeInTheDocument();
  });

  it('finishes loading when refresh rejects without a session', async () => {
    api.refresh.mockRejectedValue(new Error('Unauthorized'));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><AuthState /></AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('false:false:')).toBeInTheDocument());
  });

  it('refreshes once when StrictMode re-runs effects', async () => {
    api.refresh.mockResolvedValue(undefined);
    api.get.mockResolvedValue({ data: { id: 1, fullName: 'Test User' } });

    render(
      <React.StrictMode>
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider><AuthState /></AuthProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );

    await waitFor(() => expect(screen.getByText('true:false:Test User')).toBeInTheDocument());
    expect(api.refresh).toHaveBeenCalledTimes(1);
  });

  it('does not let bootstrap overwrite a newer login', async () => {
    const bootstrapUser = deferred<{ data: { id: number; fullName: string } }>();
    const loginUser = deferred<{ data: { id: number; fullName: string } }>();
    api.refresh.mockResolvedValue(undefined);
    api.get.mockReturnValueOnce(bootstrapUser.promise).mockReturnValue(loginUser.promise);
    api.post.mockResolvedValue({ data: { accessToken: 'new-token' } });

    render(<QueryClientProvider client={new QueryClient()}><AuthProvider><AuthState /></AuthProvider></QueryClientProvider>);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    await act(async () => {
      bootstrapUser.resolve({ data: { id: 1, fullName: 'Bootstrap User' } });
      await bootstrapUser.promise;
    });

    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThan(1));
    await act(async () => {
      loginUser.resolve({ data: { id: 2, fullName: 'New User' } });
      await loginUser.promise;
    });

    expect(screen.getByText('true:false:New User')).toBeInTheDocument();
  });
});
