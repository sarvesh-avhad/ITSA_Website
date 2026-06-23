import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Mail, Search, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminContactsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts', page, filter],
    queryFn: async () => {
      const statusQuery = filter !== 'ALL' ? `&status=${filter}` : '';
      const res = await apiClient.get(`/contact?page=${page}&limit=12${statusQuery}`);
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/contact/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contact Queries</h1>
          <p className="text-muted-foreground">Manage messages from the contact us page.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status as any); setPage(1); }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap",
              filter === status 
                ? "bg-violet-600 text-white" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={32} className="animate-spin mb-4 text-violet-400" />
            <p>Loading messages...</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Mail size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No messages found</h3>
            <p className="text-muted-foreground">There are no contact messages matching your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.data.map((msg: any) => (
              <div key={msg.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", getStatusColor(msg.status))}>
                          {msg.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{msg.subject}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Mail size={14} /> {msg.name} ({msg.email})</span>
                        {msg.phone && <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md">{msg.phone}</span>}
                      </div>
                    </div>

                    <div className="bg-background rounded-xl p-4 text-sm text-muted-foreground whitespace-pre-wrap border border-border">
                      {msg.message}
                    </div>
                  </div>

                  <div className="w-full lg:w-48 shrink-0 flex flex-col gap-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Update Status</div>
                    <select
                      value={msg.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: msg.id, status: e.target.value })}
                      disabled={updateStatusMutation.isPending}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "w-10 h-10 rounded-xl font-bold transition-all",
                page === i + 1
                  ? "bg-violet-600 text-white"
                  : "glass text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
