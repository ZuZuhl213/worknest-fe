export const queryKeys = {
  workspaces: () => ['workspaces'] as const,
  workspace: (workspaceId?: number) => ['workspace', workspaceId] as const,
  workspaceMembers: (workspaceId?: number) => ['workspace-members', workspaceId] as const,
  projects: (workspaceId?: number) => ['projects', workspaceId] as const,
  project: (workspaceId?: number, projectId?: number) => ['project', workspaceId, projectId] as const,
  projectMembers: (workspaceId?: number, projectId?: number) => ['project-members', workspaceId, projectId] as const,
  tasks: (workspaceId?: number, projectId?: number, filters?: Record<string, unknown>) =>
    filters ? (['tasks', workspaceId, projectId, filters] as const) : (['tasks', workspaceId, projectId] as const),
  task: (workspaceId?: number, projectId?: number, taskId?: number) => ['task', workspaceId, projectId, taskId] as const,
  comments: (workspaceId?: number, projectId?: number, taskId?: number) => ['comments', workspaceId, projectId, taskId] as const,
  attachments: (taskId?: number) => ['attachments', taskId] as const,
  myTasks: (workspaceId?: number, userId?: number) => ['my-tasks', workspaceId, userId] as const,
  notifications: () => ['notifications'] as const,
  adminUsers: (filters: Record<string, unknown>) => ['admin-users', filters] as const,
  adminUser: (userId?: number) => ['admin-user', userId] as const,
  securityAuditLogs: (filters: Record<string, unknown>) => ['security-audit-logs', filters] as const,
};

export default queryKeys;
