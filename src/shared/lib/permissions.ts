import { Project, Task } from '../../types';

const isLead = (project?: Project) => project?.myRole === 'LEAD';
const isMember = (project?: Project) => project?.myRole === 'MEMBER';

export const canCreateTask = (project?: Project) =>
  Boolean(project?.permissions?.canCreateTask);

export const canAssignTask = (project?: Project) =>
  Boolean(project?.permissions?.canAssignTask);

export const canCommentOnProject = (project?: Project) =>
  Boolean(project?.permissions?.canComment);

export const canManageProjectMembers = (project?: Project) =>
  Boolean(project?.permissions?.canManageMembers);

export const canEditTask = (project: Project | undefined, task: Task | undefined, userId: number | undefined) => {
  if (!project?.permissions || !task || !userId || !project.permissions.canCreateTask) return false;
  if (isLead(project)) return true;
  if (!isMember(project)) return false;
  return task.reporter?.id === userId || task.assignee?.id === userId;
};

export const canDeleteTask = (project: Project | undefined, task: Task | undefined, userId: number | undefined) => {
  if (!project?.permissions || !task || !userId || !project.permissions.canCreateTask) return false;
  if (isLead(project)) return true;
  if (!isMember(project)) return false;
  return task.reporter?.id === userId;
};
