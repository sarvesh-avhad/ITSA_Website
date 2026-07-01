import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, CalendarDays, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const fetchEventsSummary = async () => {
  const { data } = await apiClient.get('/registrations/events-summary');
  return data;
};

export default function AdminRegistrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events-summary'],
    queryFn: () => fetchEventsSummary().catch(() => ({ data: [] })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Registration Management</h1>
        <p className="text-muted-foreground">Select an event below to manage its registrations and mark attendance.</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-1">No Events Found</h3>
          <p className="text-muted-foreground text-sm">Create an event first to start receiving registrations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data?.data?.map((event: any) => {
            const total = event._count?.registrations || 0;
            const attendees = event.attendeesCount || 0;
            const percentage = total > 0 ? Math.round((attendees / total) * 100) : 0;

            return (
              <Link
                key={event.id}
                to={`/admin/registrations/${event.id}`}
                className="group block h-full"
              >
                <div className="glass-card rounded-2xl border border-white/5 p-6 hover:border-violet-500/50 hover:bg-white/[0.04] transition-all relative overflow-hidden h-full flex flex-col">
                  {/* Subtle gradient background based on status */}
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[64px] -z-10 rounded-full ${
                    event.status === 'PUBLISHED' ? 'bg-emerald-500/10' : 
                    event.status === 'COMPLETED' ? 'bg-violet-500/10' : 'bg-white/5'
                  }`} />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1 mb-2">
                        {event.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          event.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          event.status === 'COMPLETED' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' :
                          'bg-white/10 text-muted-foreground border-white/10'
                        }`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays size={12} />
                          {format(new Date(event.startDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-white/5">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Users size={12} />
                        Total Registered
                      </div>
                      <div className="text-2xl font-bold text-white">{total}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        Attendees ({percentage}%)
                      </div>
                      <div className="text-2xl font-bold text-emerald-400">{attendees}</div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
