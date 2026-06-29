import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import { format } from 'date-fns';
import { Check, CheckCircle2, AlertTriangle, Info, Bell, PartyPopper, ShieldAlert, UserCog, CalendarPlus, CalendarClock, CalendarOff, TicketCheck, XCircle, Ban, Award, Users, Megaphone, BellRing, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

const getIcon = (iconKey: string, type: string) => {
  const props = { size: 24, className: "shrink-0" };
  const typeColor = 
    type === 'SUCCESS' ? 'text-emerald-400' :
    type === 'WARNING' ? 'text-amber-400' :
    type === 'ERROR' ? 'text-rose-400' :
    'text-violet-400';

  const propsWithColor = { ...props, className: cn(props.className, typeColor) };

  switch (iconKey) {
    case 'party-popper': return <PartyPopper {...propsWithColor} />;
    case 'shield-alert': return <ShieldAlert {...propsWithColor} />;
    case 'user-cog': return <UserCog {...propsWithColor} />;
    case 'calendar-plus': return <CalendarPlus {...propsWithColor} />;
    case 'calendar-clock': return <CalendarClock {...propsWithColor} />;
    case 'calendar-off': return <CalendarOff {...propsWithColor} />;
    case 'ticket-check': return <TicketCheck {...propsWithColor} />;
    case 'check-circle': return <CheckCircle2 {...propsWithColor} />;
    case 'x-circle': return <XCircle {...propsWithColor} />;
    case 'ban': return <Ban {...propsWithColor} />;
    case 'award': return <Award {...propsWithColor} />;
    case 'users': return <Users {...propsWithColor} />;
    case 'megaphone': return <Megaphone {...propsWithColor} />;
    default: return <BellRing {...propsWithColor} />;
  }
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'history', page],
    queryFn: async () => {
      const res = await api.get(`/notifications?limit=${limit}&skip=${(page - 1) * limit}`);
      return res.data.data;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/read/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications', 'history', page], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => n.id === id ? { ...n, isRead: true } : n);
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'latest'] });
    }
  });

  const markAsUnread = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/unread/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications', 'history', page], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => n.id === id ? { ...n, isRead: false } : n);
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'latest'] });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications', 'history', page], (old: any) => {
        if (!old) return old;
        return old.filter((n: any) => n.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'latest'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const notifications = data || [];

  return (
    <>
      <Helmet>
        <title>Notifications | ITSA</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8 mt-16 sm:mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your latest alerts and announcements.</p>
          </div>
          
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10 text-white disabled:opacity-50"
          >
            <Check size={18} className="text-violet-400" />
            Mark all as read
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-4 glass rounded-3xl border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Bell size={32} className="text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              When you receive updates about events, your account, or general announcements, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "relative group flex gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                  !notification.isRead 
                    ? "bg-violet-950/20 border-violet-500/30 hover:border-violet-500/50" 
                    : "glass border-white/10 hover:bg-white/5"
                )}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                )}

                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                  !notification.isRead 
                    ? "bg-violet-900/30 border-violet-500/20 shadow-inner shadow-violet-500/10" 
                    : "bg-white/5 border-white/10"
                )}>
                  {getIcon(notification.iconKey, notification.type)}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 mb-2">
                    <h3 className={cn(
                      "text-base font-medium truncate",
                      !notification.isRead ? "text-white" : "text-gray-200"
                    )}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  
                  <p className={cn(
                    "text-sm leading-relaxed",
                    !notification.isRead ? "text-gray-300" : "text-muted-foreground"
                  )}>
                    {notification.message}
                  </p>
                  
                  {notification.actionLabel && (
                    <div className="mt-3 inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">
                      {notification.actionLabel} &rarr;
                    </div>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl">
                  {notification.isRead ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsUnread.mutate(notification.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                      title="Mark as unread"
                    >
                      <EyeOff size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead.mutate(notification.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                      title="Mark as read"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notification.id); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Pagination controls could go here if we fetch total count */}
            <div className="flex justify-between items-center pt-8">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={notifications.length < limit}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
