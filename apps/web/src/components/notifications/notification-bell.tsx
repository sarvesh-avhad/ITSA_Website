import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Megaphone, CalendarPlus, CalendarClock, CalendarOff, TicketCheck, CheckCircle2, XCircle, Ban, Award, Users, PartyPopper, ShieldAlert, UserCog, BellRing, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// Types
type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

interface Notification {
  id: string;
  title: string;
  message: string;
  iconKey: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

// Icon mapper
const getIcon = (iconKey: string, type: NotificationType) => {
  const props = { size: 18, className: "shrink-0" };
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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Queries
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: latestData } = useQuery({
    queryKey: ['notifications', 'latest'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/latest');
      return res.data;
    },
    enabled: isOpen, // Only fetch when opened
  });

  // Mutations
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/notifications/read/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications', 'latest'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n)
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications', 'latest'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: Notification) => ({ ...n, isRead: true }))
        };
      });
      queryClient.setQueryData(['notifications', 'unread-count'], { data: { count: 0 } });
    }
  });

  const unreadCount = unreadData?.data?.count || 0;
  const notifications: Notification[] = latestData?.data || [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right flex flex-col"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h3 className="font-semibold text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <Bell size={20} className="text-white/20" />
                  </div>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 relative group",
                        !notification.isRead ? "bg-violet-500/5" : ""
                      )}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                      )}
                      
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                        !notification.isRead ? "bg-violet-500/10 border-violet-500/20" : "bg-white/5 border-white/10"
                      )}>
                        {getIcon(notification.iconKey, notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            !notification.isRead ? "text-white" : "text-gray-200"
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs line-clamp-2 leading-relaxed",
                          !notification.isRead ? "text-gray-300" : "text-muted-foreground"
                        )}>
                          {notification.message}
                        </p>
                        
                        {notification.actionLabel && (
                          <div className="mt-2 inline-flex items-center text-xs font-medium text-violet-400 hover:text-violet-300">
                            {notification.actionLabel} &rarr;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-black/20 text-center">
              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
