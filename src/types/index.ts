export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceOwner {
  id: number;
  email: string;
  fullName: string;
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
  role: Role;
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

export interface Project {
  id: number;
  workspaceId: number;
  name: string;
  projectKey: string;
  description?: string;
  archived: boolean;
  createdBy: ProjectCreator;
  createdAt: string;
  updatedAt: string;
}

export interface TaskUser {
  id: number;
  email: string;
  fullName: string;
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
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
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
