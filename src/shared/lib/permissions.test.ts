import { describe, it, expect } from 'vitest';
import {
  canCreateTask,
  canAssignTask,
  canCommentOnProject,
  canManageProjectMembers,
  canEditTask,
  canDeleteTask,
} from './permissions';
import type { Project, Task } from '../../types';

describe('permissions helper matrix', () => {
  const dummyCreator = { id: 1, email: 'creator@test.com', fullName: 'Creator' };

  const leadProject: Project = {
    id: 1,
    workspaceId: 1,
    name: 'Lead Project',
    projectKey: 'LEAD',
    archived: false,
    myRole: 'LEAD',
    createdBy: dummyCreator,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    permissions: {
      canViewProject: true,
      canCreateTask: true,
      canAssignTask: true,
      canComment: true,
      canManageProject: true,
      canManageMembers: true,
    },
  };

  const memberProject: Project = {
    id: 2,
    workspaceId: 1,
    name: 'Member Project',
    projectKey: 'MEM',
    archived: false,
    myRole: 'MEMBER',
    createdBy: dummyCreator,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    permissions: {
      canViewProject: true,
      canCreateTask: true,
      canAssignTask: true,
      canComment: true,
      canManageProject: false,
      canManageMembers: false,
    },
  };

  const viewerProject: Project = {
    id: 3,
    workspaceId: 1,
    name: 'Viewer Project',
    projectKey: 'VIEW',
    archived: false,
    myRole: 'VIEWER',
    createdBy: dummyCreator,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    permissions: {
      canViewProject: true,
      canCreateTask: false,
      canAssignTask: false,
      canComment: true,
      canManageProject: false,
      canManageMembers: false,
    },
  };

  const dummyTask: Task = {
    id: 10,
    projectId: 1,
    taskNumber: 1,
    title: 'Test Task',
    status: 'TODO',
    priority: 'MEDIUM',
    reporter: { id: 100, email: 'reporter@test.com', fullName: 'Reporter' },
    assignee: { id: 200, email: 'assignee@test.com', fullName: 'Assignee' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('evaluates boolean project permission flags correctly', () => {
    expect(canCreateTask(leadProject)).toBe(true);
    expect(canCreateTask(viewerProject)).toBe(false);

    expect(canAssignTask(leadProject)).toBe(true);
    expect(canAssignTask(viewerProject)).toBe(false);

    expect(canCommentOnProject(leadProject)).toBe(true);
    expect(canCommentOnProject(viewerProject)).toBe(true);

    expect(canManageProjectMembers(leadProject)).toBe(true);
    expect(canManageProjectMembers(memberProject)).toBe(false);
  });

  describe('canEditTask', () => {
    it('allows LEAD to edit any task', () => {
      expect(canEditTask(leadProject, dummyTask, 999)).toBe(true);
    });

    it('allows MEMBER to edit if reporter or assignee', () => {
      expect(canEditTask(memberProject, dummyTask, 100)).toBe(true); // reporter
      expect(canEditTask(memberProject, dummyTask, 200)).toBe(true); // assignee
      expect(canEditTask(memberProject, dummyTask, 300)).toBe(false); // stranger
    });

    it('denies VIEWER from editing tasks', () => {
      expect(canEditTask(viewerProject, dummyTask, 100)).toBe(false);
    });
  });

  describe('canDeleteTask', () => {
    it('allows LEAD to delete any task', () => {
      expect(canDeleteTask(leadProject, dummyTask, 999)).toBe(true);
    });

    it('allows MEMBER to delete only if reporter', () => {
      expect(canDeleteTask(memberProject, dummyTask, 100)).toBe(true); // reporter
      expect(canDeleteTask(memberProject, dummyTask, 200)).toBe(false); // assignee only
    });

    it('denies VIEWER from deleting tasks', () => {
      expect(canDeleteTask(viewerProject, dummyTask, 100)).toBe(false);
    });
  });
});
