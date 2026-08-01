import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorMessage } from '../../shared/api/client';
import { queryKeys } from '../../shared/api/query-keys';
import { Notification } from '../../types';
import { useToast } from '../../shared/components/toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../shared/components/card';
import Button from '../../shared/components/button';
import EmptyState from '../../shared/components/empty-state';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';

export const NotificationsFeed: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: queryKeys.notifications(),
    queryFn: () => apiClient.get('/api/notifications').then((res) => res.data),
  });

  // Mark single read mutation
  const readMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiClient.patch<Notification>(`/api/notifications/${notificationId}/read`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      toast('Notification marked as read', 'success');
    },
    onError: (error: unknown) => {
      toast(getApiErrorMessage(error, 'Failed to update notification'), 'error');
    },
  });

  // Mark all as read mutation
  const readAllMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.read);
      const promises = unread.map((n) => apiClient.patch(`/api/notifications/${n.id}/read`));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      toast('All notifications marked as read', 'success');
    },
    onError: () => {
      toast('Failed to mark all notifications as read', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Title Header */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-slate-100">Notifications Feed</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">Keep track of updates, task assignments, and mentions.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => readAllMutation.mutate()}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs cursor-pointer font-medium"
            isLoading={readAllMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 border-b border-zinc-100 dark:border-slate-800 p-5">
          <Bell className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-pulse" aria-hidden="true" />
          <CardTitle className="text-sm font-semibold text-zinc-950 dark:text-slate-100">
            Inbox ({unreadCount} Unread)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-left">
          <div className="divide-y divide-zinc-200 dark:divide-slate-800">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors flex gap-4 items-start ${
                  !notif.read ? 'bg-indigo-50/10 dark:bg-indigo-950/30 border-l-2 border-indigo-500' : 'bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex-1 flex flex-col gap-1 text-left">
                  <h4 className={`text-xs font-semibold ${!notif.read ? 'text-zinc-900 dark:text-slate-100' : 'text-zinc-700 dark:text-slate-300'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 font-normal">{notif.content}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400 dark:text-slate-400 font-medium">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {new Date(notif.createdAt).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>

                {!notif.read && (
                  <Button
                    onClick={() => readMutation.mutate(notif.id)}
                    variant="ghost"
                    size="sm"
                    aria-label="Mark notification as read"
                    className="p-1.5 h-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50 cursor-pointer shrink-0"
                    isLoading={readMutation.isPending && readMutation.variables === notif.id}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon={Bell}
                  title="Your inbox is clean"
                  description="No notifications logged in this workspace yet."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsFeed;
