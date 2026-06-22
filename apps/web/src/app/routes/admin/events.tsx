import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, Loader2, Edit, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const fetchAdminEvents = async (page: number, search: string) => {
  const { data } = await apiClient.get(`/events?page=${page}&limit=10&search=${search}`);
  return data.data; // Using public endpoint for now, ideally an admin specific one
};

export default function AdminEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', page, search],
    queryFn: () => fetchAdminEvents(page, search),
  });

  const statusColors: Record<string, string> = {
    UPCOMING: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ONGOING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    COMPLETED: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    DRAFT: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Events Management</h1>
          <p className="text-muted-foreground">Manage hackathons, workshops, and seminars.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-600/20 btn-glow">
          <Plus size={18} />
          Create Event
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Event Title</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Registrations</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No events found matching your criteria.
                  </td>
                </tr>
              ) : (
                data?.data?.map((event: any) => (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white line-clamp-1">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.category?.name || 'General'} • {event.eventType}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.startDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", statusColors[event.status] || statusColors.DRAFT)}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full" 
                            style={{ width: `${Math.min(((event.currentCount || 0) / (event.maxParticipants || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{event.currentCount || 0}/{event.maxParticipants || '∞'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && data?.meta && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm text-muted-foreground bg-white/[0.02]">
            <div>
              Showing {((data.meta.page - 1) * data.meta.limit) + 1} to {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total} events
            </div>
            <div className="flex gap-2">
              <button 
                disabled={data.meta.page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={data.meta.page === data.meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
