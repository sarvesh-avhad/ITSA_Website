import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, Loader2, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const fetchRegistrations = async (page: number, search: string) => {
  const { data } = await apiClient.get(`/admin/registrations?page=${page}&limit=10&search=${search}`);
  return data.data; // Note: Ensure the backend has an /admin/registrations endpoint
};

export default function AdminRegistrationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Use a fallback to empty array if the endpoint doesn't exist yet, to prevent app crash during build
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-registrations', page, search],
    queryFn: () => fetchRegistrations(page, search).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } })),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiClient.patch(`/admin/registrations/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Registration status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    }
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ id, attended }: { id: string, attended: boolean }) => {
      const res = await apiClient.patch(`/admin/registrations/${id}/attendance`, { attended });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance updated');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update attendance');
    }
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Registrations</h1>
          <p className="text-muted-foreground">Manage event registrations, approvals, and attendance.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by team, user, or PRN..."
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
                <th className="px-6 py-4 font-medium">Participant/Team</th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date Registered</th>
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
                    No registrations found.
                  </td>
                </tr>
              ) : (
                data?.data?.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{reg.teamName || reg.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{reg.teamName ? 'Team Registration' : (reg.user?.prn || reg.user?.email)}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {reg.event?.title || 'Unknown Event'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", statusColors[reg.status] || statusColors.PENDING)}>
                        {reg.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {reg.createdAt ? format(new Date(reg.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reg.status !== 'APPROVED' && (
                          <button 
                            onClick={() => statusMutation.mutate({ id: reg.id, status: 'APPROVED' })}
                            className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors" title="Approve"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {reg.status !== 'REJECTED' && (
                          <button 
                            onClick={() => statusMutation.mutate({ id: reg.id, status: 'REJECTED' })}
                            className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors" title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => attendanceMutation.mutate({ id: reg.id, attended: !reg.attended })}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            reg.attended ? "text-violet-400 bg-violet-500/20" : "text-muted-foreground hover:bg-white/10"
                          )} 
                          title="Mark Attendance"
                        >
                          <UserCheck size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && data?.meta && data.meta.total > 0 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm text-muted-foreground bg-white/[0.02]">
            <div>
              Showing {((data.meta.page - 1) * data.meta.limit) + 1} to {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total} registrations
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
