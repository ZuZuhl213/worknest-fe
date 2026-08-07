import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import DashboardLayout from './dashboard-layout';

vi.mock('../../features/auth/auth-context', () => ({
  useAuth: () => ({
    user: { fullName: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('../components/toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../components/command-palette', () => ({ default: () => null }));
vi.mock('../theme/theme-toggle', () => ({ default: () => null }));

describe('DashboardLayout', () => {
  it('shows a collapse control only while the sidebar is expanded', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/workspaces/1/dashboard']}>
        <Routes>
          <Route path="/workspaces/:workspaceId/dashboard" element={<DashboardLayout />}>
            <Route index element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const collapseButton = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(collapseButton).not.toHaveTextContent('Collapse sidebar');
    expect(collapseButton.parentElement).toHaveClass('border-b');
    await user.click(collapseButton);

    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();

    const sidebar = screen.getByRole('complementary');
    const header = sidebar.firstElementChild;
    await user.click(header!);

    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();

    await user.click(sidebar.querySelector('nav')!);

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });
});
