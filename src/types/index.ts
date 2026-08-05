export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type SystemRole = 'USER' | 'SYSTEM_ADMIN';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  systemRole: SystemRole;
  canCreateWorkspace: boolean;
}

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  isActive: boolean;
  systemRole: SystemRole;
  canCreateWorkspace: boolean;
  lastLoginAt?: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  systemRole: SystemRole;
  canCreateWorkspace: boolean;
  deactivatedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAuditLog {
  id: number;
  action: string;
  actor?: Pick<User, 'id' | 'email' | 'fullName'>;
  target?: Pick<User, 'id' | 'email' | 'fullName'>;
  outcome: string;
  createdAt: string;
}

export interface WorkspaceOwner {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  archived: boolean;
  owner: WorkspaceOwner;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberUser {
  id: number;
  email: string;
  fullName: string;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  user: WorkspaceMemberUser;
  role: WorkspaceRole;
  invitedBy?: WorkspaceMemberUser;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreator {
  id: number;
  email: string;
  fullName: string;
}

export type ProjectRole = 'LEAD' | 'MEMBER' | 'VIEWER';

export interface ProjectPermissions {
  canViewProject: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canComment: boolean;
  canManageProject: boolean;
  canManageMembers: boolean;
}

export interface Project {
  id: number;
  workspaceId: number;
  name: string;
  projectKey: string;
  description?: string;
  archived: boolean;
  myRole?: ProjectRole;
  permissions?: ProjectPermissions;
  createdBy: ProjectCreator;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  user: ProjectMemberUser;
  role: ProjectRole;
  addedBy?: ProjectMemberUser;
  joinedAt: string;
  createdAt: string;
}

export interface TaskUser {
  id: number;
  email: string;
  fullName: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  projectId: number;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TaskUser;
  reporter?: TaskUser;
  subtasks?: Subtask[];
  tags?: string[];
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTask extends Task {
  projectName: string;
  projectKey: string;
}

export interface TaskCommentAuthor {
  id: number;
  email: string;
  fullName: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  author: TaskCommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  url: string;
  uploadedBy: {
    id: number;
    email: string;
    fullName: string;
  };
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminOverview {
  totalAccounts: number;
  activeAccounts: number;
  disabledAccounts: number;
  emailVerifiedAccounts: number;
  recentUsers: User[];
}
