import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, Loader2, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRScanner } from '@/components/admin/qr-scanner';
import { ExportButton } from '@/components/ui/ExportButton';
import { getDisplayName, getInitials } from '@/lib/utils';

const fetchRegistrations = async (page: number, search: string) => {
  const { data } = await apiClient.get(`/registrations?page=${page}&limit=10&search=${search}`);
  return data;
};

export default function AdminRegistrationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  
  // Use a fallback to empty array if the endpoint doesn't exist yet, to prevent app crash during build
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-registrations', page, search],
    queryFn: () => fetchRegistrations(page, search).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } })),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiClient.patch(`/registrations/${id}/status`, { status });
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
      const res = await apiClient.post(`/registrations/${id}/attendance`, { attended });
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

  const scanMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const res = await apiClient.post(`/registrations/scan`, { qrCode });
      return res.data;
    },
    onSuccess: (data) => {
      setIsScannerOpen(false);
      toast.success(`Scanned successfully! Marked ${getDisplayName(data.data.user)} as attended.`);
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Invalid or already scanned QR code');
    }
  });

  const handleScanSuccess = (decodedText: string) => {
    scanMutation.mutate(decodedText);
  };

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
        <div className="flex flex-col sm:flex-row gap-3">
          <ExportButton endpoint="/registrations/export" queryParams={{ search }} filename="all_registrations" />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium"
          >
            <Search size={18} />
            Scan QR Code
          </button>
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Scan Event Pass</h2>
              <button onClick={() => setIsScannerOpen(false)} className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            {scanMutation.isPending ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-muted-foreground">Verifying QR code...</p>
              </div>
            ) : (
              <QRScanner onScanSuccess={handleScanSuccess} />
            )}
            <p className="text-xs text-center text-muted-foreground mt-4">
              Point your camera at the participant's QR code to mark their attendance automatically.
            </p>
          </div>
        </div>
      )}

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
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedReg(reg)}>
                      <div className="font-medium text-white truncate max-w-[200px]">
                        {reg.team?.name || getDisplayName(reg.user)}
                      </div>
                      <div className="text-xs text-muted-foreground">{reg.team ? 'Team Registration' : (reg.user?.prn || reg.user?.email)}</div>
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

      {/* Registration Details Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Registration Details</h2>
                <p className="text-muted-foreground">{selectedReg.event?.title}</p>
              </div>
              <button onClick={() => setSelectedReg(null)} className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", statusColors[selectedReg.status] || statusColors.PENDING)}>
                    {selectedReg.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Attendance</div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", selectedReg.attendanceMarked ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-white/10 text-white/50 border-white/20")}>
                    {selectedReg.attendanceMarked ? 'ATTENDED' : 'PENDING'}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Registered On</div>
                  <div className="text-white font-medium">{format(new Date(selectedReg.createdAt), 'MMM d, yyyy')}</div>
                </div>
              </div>

              {selectedReg.team ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Team: {selectedReg.team.name}
                  </h3>
                  
                  {/* Leader */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">Team Leader</h4>
                      <span className="text-[10px] uppercase tracking-wider bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold">LEADER</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Name: <span className="text-white ml-1">{getDisplayName(selectedReg.team.leader)}</span></div>
                      <div className="text-muted-foreground">Email: <span className="text-white ml-1">{selectedReg.team.leader.email}</span></div>
                      <div className="text-muted-foreground">PRN: <span className="text-white ml-1">{selectedReg.team.leader.prn || 'N/A'}</span></div>
                      <div className="text-muted-foreground">Phone: <span className="text-white ml-1">{selectedReg.team.leader.phone || 'N/A'}</span></div>
                      <div className="text-muted-foreground">Branch: <span className="text-white ml-1">{selectedReg.team.leader.branch || 'N/A'}</span></div>
                      <div className="text-muted-foreground">Year: <span className="text-white ml-1">{selectedReg.team.leader.year || 'N/A'}</span></div>
                    </div>
                  </div>

                  {/* Members */}
                  {selectedReg.team.members?.map((member: any, idx: number) => (
                    <div key={member.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">Member {idx + 1}</h4>
                        {member.attendanceMarked && (
                          <span className="text-[10px] uppercase tracking-wider bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold">ATTENDED</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Name: <span className="text-white ml-1">{member.name}</span></div>
                        <div className="text-muted-foreground">Email: <span className="text-white ml-1">{member.email}</span></div>
                        <div className="text-muted-foreground">PRN: <span className="text-white ml-1">{member.prn || 'N/A'}</span></div>
                        <div className="text-muted-foreground">Phone: <span className="text-white ml-1">{member.phone || 'N/A'}</span></div>
                        <div className="text-muted-foreground">Branch: <span className="text-white ml-1">{member.branch || 'N/A'}</span></div>
                        <div className="text-muted-foreground">Year: <span className="text-white ml-1">{member.year || 'N/A'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Participant Details
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-white font-medium mb-1">Participant Details</div>
                    <div className="grid grid-cols-2 gap-y-3 text-sm mt-3">
                      <div className="text-muted-foreground">Name: <span className="text-white ml-1">{getDisplayName(selectedReg.user)}</span></div>
                      <div className="text-muted-foreground">Email: <span className="text-white ml-1">{selectedReg.user.email}</span></div>
                      <div className="text-muted-foreground">PRN: <span className="text-white ml-1">{selectedReg.user.prn || 'N/A'}</span></div>
                      <div className="text-muted-foreground">Phone: <span className="text-white ml-1">{selectedReg.user.phone || 'N/A'}</span></div>
                      <div className="text-muted-foreground">Branch: <span className="text-white ml-1">{selectedReg.user.branch || 'N/A'}</span></div>
                      <div className="text-muted-foreground">Year: <span className="text-white ml-1">{selectedReg.user.year || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
