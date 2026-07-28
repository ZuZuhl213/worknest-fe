import React, { useState } from 'react';
import Modal from '../../shared/components/modal';
import Button from '../../shared/components/button';
import Avatar from '../../shared/components/avatar';
import Badge from '../../shared/components/badge';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import type { WorkspaceMember, ProjectMember, ProjectRole, CurrentUser } from '../../types';

interface ProjectMembersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canManageMembers: boolean;
  currentUser: CurrentUser | null;
  workspaceMembers: WorkspaceMember[];
  projectMembers: ProjectMember[];
  onAddMember: (data: { email: string; role: ProjectRole }) => void;
  onUpdateRole: (data: { memberId: number; role: ProjectRole }) => void;
  onRemoveMember: (memberId: number) => void;
  isAddPending: boolean;
}

export const ProjectMembersPanel: React.FC<ProjectMembersPanelProps> = ({
  isOpen,
  onClose,
  canManageMembers,
  currentUser,
  workspaceMembers,
  projectMembers,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  isAddPending,
}) => {
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<ProjectRole>('MEMBER');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberEmail) return;
    onAddMember({ email: addMemberEmail, role: addMemberRole });
    setAddMemberEmail('');
    setAddMemberRole('MEMBER');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Members Management">
      <div className="flex flex-col gap-6 text-left">
        {canManageMembers && (
          <div className="flex flex-col gap-3 pb-4 border-b border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Workspace Member to Project
            </h3>
            <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label htmlFor="select-colleague" className="text-[10px] font-medium text-zinc-500">
                  Select Member
                </label>
                <select
                  id="select-colleague"
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choose a colleague --</option>
                  {workspaceMembers
                    .filter((wm) => !projectMembers.some((pm) => pm.user.id === wm.user.id))
                    .map((m) => (
                      <option key={m.user.id} value={m.user.email}>
                        {m.user.fullName} ({m.user.email})
                      </option>
                    ))}
                </select>
              </div>
              <div className="w-full sm:w-[120px] flex flex-col gap-1.5">
                <label htmlFor="select-project-role" className="text-[10px] font-medium text-zinc-500">
                  Project Role
                </label>
                <select
                  id="select-project-role"
                  value={addMemberRole}
                  onChange={(e) => setAddMemberRole(e.target.value as ProjectRole)}
                  className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="LEAD">LEAD</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <Button
                type="submit"
                size="sm"
                className="cursor-pointer shrink-0"
                isLoading={isAddPending}
                disabled={!addMemberEmail}
              >
                Add
              </Button>
            </form>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Active Project Members ({projectMembers.length})
          </h3>
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {projectMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg border border-zinc-100 bg-zinc-50/50"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Avatar name={member.user.fullName} size="sm" />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-zinc-900 truncate">
                      {member.user.fullName}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate">{member.user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {canManageMembers && member.user.id !== currentUser?.id ? (
                    <select
                      aria-label={`Role for ${member.user.fullName}`}
                      value={member.role}
                      onChange={(e) =>
                        onUpdateRole({ memberId: member.id, role: e.target.value as ProjectRole })
                      }
                      className="text-[10px] rounded border border-zinc-200 bg-white p-0.5 text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="LEAD">LEAD</option>
                      <option value="MEMBER">MEMBER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  ) : (
                    <Badge
                      variant={member.role === 'LEAD' ? 'secondary' : 'default'}
                      className="text-[9px] px-1.5 py-0.5"
                    >
                      {member.role}
                    </Badge>
                  )}

                  {canManageMembers && member.user.id !== currentUser?.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.user.fullName} from this project?`)) {
                          onRemoveMember(member.id);
                        }
                      }}
                      aria-label={`Remove ${member.user.fullName} from project`}
                      className="text-zinc-400 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {projectMembers.length === 0 && (
              <div className="text-center py-6 text-zinc-400 text-xs italic">
                No direct members. Workspace admins/owners have full access.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectMembersPanel;
