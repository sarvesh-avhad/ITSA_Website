import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { 
  Search, Loader2, UserCheck, ChevronLeft, Trash2, 
  Users, CheckCircle2, AlertCircle, XCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRScanner } from '@/components/admin/qr-scanner';
import { ExportButton } from '@/components/ui/ExportButton';
import { getDisplayName, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { EventCertificatesManager } from '@/components/admin/certificates/EventCertificatesManager';

const fetchEventStats = async (eventId: string) => {
  const { data } = await apiClient.get(`/registrations/stats?eventId=${eventId}`);
  return data;
};

const fetchRegistrations = async (page: number, search: string, eventId: string) => {
  const { data } = await apiClient.get(`/registrations?page=${page}&limit=1000&search=${search}&eventId=${eventId}`);
  // Intentionally using limit=1000 for simplicity in tabs filtering in memory. 
  // For production with massive scale, this should be paginated correctly with tabs in the API.
  return data;
};

export default function EventRegistrationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'REGISTERED' | 'ATTENDEES' | 'CERTIFICATES'>('REGISTERED');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-event-stats', eventId],
    queryFn: () => fetchEventStats(eventId!),
    enabled: !!eventId,
  });

  const { data: regsData, isLoading: isLoadingRegs } = useQuery({
    queryKey: ['admin-registrations', eventId, search],
    queryFn: () => fetchRegistrations(1, search, eventId!),
    enabled: !!eventId,
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await apiClient.post(`/registrations/${id}/attendance`, {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance marked successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update attendance');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/registrations/${id}/admin`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Registration deleted securely.');
      setSelectedReg(null);
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete registration');
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const res = await apiClient.post(`/registrations/scan`, { qrCode, targetEventId: eventId });
      return res.data;
    },
    onSuccess: (data) => {
      setIsScannerOpen(false);
      toast.success(`Scanned successfully! Marked ${getDisplayName(data.data.user)} as attended.`);
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Invalid or already scanned QR code');
    }
  });

  const handleScanSuccess = (decodedText: string) => {
    scanMutation.mutate(decodedText);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this registration? This will soft delete the record and generate an audit log.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleMarkAttendance = (id: string, currentlyMarked: boolean) => {
    if (currentlyMarked) return;
    if (window.confirm("Confirm marking attendance? This action cannot be easily undone.")) {
      attendanceMutation.mutate({ id });
    }
  };

  const stats = statsData?.data || { total: 0, attendees: 0, remaining: 0, attendancePercentage: 0 };
  
  // Filter memory data based on active tab
  const registrationsList = regsData?.data || [];
  const displayData = registrationsList.filter((reg: any) => 
    activeTab === 'REGISTERED' ? !reg.attendanceMarked : reg.attendanceMarked
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/registrations" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
          <ChevronLeft size={20} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Event Registrations</h1>
          <p className="text-muted-foreground">Manage participants and mark attendance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">Total Registrations</div>
            <Users size={16} className="text-violet-400" />
          </div>
          <div className="text-3xl font-bold text-white">{isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : stats.total}</div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">Attendees</div>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">{isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : stats.attendees}</div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">Remaining</div>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">{isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : stats.remaining}</div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">Attendance %</div>
            <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{isLoadingStats ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : `${stats.attendancePercentage}%`}</div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('REGISTERED')}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all w-full sm:w-auto", activeTab === 'REGISTERED' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
            >
              Registered Participants
            </button>
            <button
              onClick={() => setActiveTab('ATTENDEES')}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all w-full sm:w-auto", activeTab === 'ATTENDEES' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
            >
              Attendees
            </button>
            <button
              onClick={() => setActiveTab('CERTIFICATES')}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all w-full sm:w-auto", activeTab === 'CERTIFICATES' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
            >
              Certificates
            </button>
          </div>

          {activeTab !== 'CERTIFICATES' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
              <ExportButton endpoint="/registrations/export" queryParams={{ search, eventId }} filename="event_registrations" />
              <button
                onClick={() => setIsScannerOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
              >
                Scan Pass
              </button>
            </div>
          )}
        </div>

        {activeTab === 'CERTIFICATES' ? (
          <EventCertificatesManager eventId={eventId as string} />
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Participant/Team</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                {activeTab === 'ATTENDEES' && <th className="px-6 py-4 font-medium">Marked By</th>}
                <th className="px-6 py-4 font-medium">Date Registered</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoadingRegs ? (
                <tr>
                  <td colSpan={activeTab === 'ATTENDEES' ? 5 : 4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'ATTENDEES' ? 5 : 4} className="px-6 py-12 text-center text-muted-foreground">
                    No {activeTab === 'REGISTERED' ? 'participants' : 'attendees'} found.
                  </td>
                </tr>
              ) : (
                displayData.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedReg(reg)}>
                      <div className="font-medium text-white truncate max-w-[200px]">
                        {reg.team?.name || getDisplayName(reg.user)}
                      </div>
                      <div className="text-xs text-muted-foreground">{reg.team ? 'Team Registration' : (reg.user?.prn || reg.user?.email)}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{reg.user?.phone || 'No phone'}</div>
                    </td>
                    {activeTab === 'ATTENDEES' && (
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {reg.attendanceMarkedBy ? getDisplayName(reg.attendanceMarkedBy) : 'System / QR'}
                        <div className="text-[10px] opacity-70">
                          {reg.attendanceAt && format(new Date(reg.attendanceAt), 'h:mm a, MMM d')}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-muted-foreground">
                      {reg.createdAt ? format(new Date(reg.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('EVENTS_MANAGE_REGISTRATIONS')) && (
                           <button 
                             onClick={() => handleDelete(reg.id)}
                             disabled={deleteMutation.isPending}
                             className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors" 
                             title="Delete Registration"
                           >
                             <Trash2 size={16} />
                           </button>
                        )}
                        <button 
                          onClick={() => handleMarkAttendance(reg.id, reg.attendanceMarked)}
                          disabled={reg.attendanceMarked || attendanceMutation.isPending}
                          className={cn(
                            "p-2 rounded-lg transition-colors flex items-center gap-1",
                            reg.attendanceMarked 
                              ? "text-emerald-400 bg-emerald-500/10 cursor-default"
                              : "text-muted-foreground hover:text-white hover:bg-white/5"
                          )} 
                        >
                          {reg.attendanceMarked ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span className="text-xs font-medium">Attended</span>
                            </>
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
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
              Point your camera at the participant's QR code.
              <br/>
              <span className="text-amber-400">Restricted strictly to this event.</span>
            </p>
          </div>
        </div>
      )}

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
                  <div className="text-sm text-muted-foreground mb-1">Attendance</div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", selectedReg.attendanceMarked ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-white/10 text-white/50 border-white/20")}>
                    {selectedReg.attendanceMarked ? 'ATTENDED' : 'NOT ATTENDED'}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Registered On</div>
                  <div className="text-white font-medium">{format(new Date(selectedReg.createdAt), 'MMM d, yyyy')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xl font-bold">
                  {getInitials(selectedReg.user?.firstName || '', selectedReg.user?.lastName || '')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{getDisplayName(selectedReg.user)}</h3>
                  <p className="text-sm text-muted-foreground">{selectedReg.user.email} • {selectedReg.user.prn || 'No PRN'}</p>
                </div>
              </div>

              {selectedReg.team && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Team Information</h4>
                  <div className="text-sm text-muted-foreground mb-4">
                    <span className="font-medium text-white">{selectedReg.team.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">L</span>
                      <span className="text-white">{getDisplayName(selectedReg.team.leader)}</span>
                    </div>
                    {selectedReg.team.members?.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm pl-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                        <span className="text-muted-foreground">{m.user ? getDisplayName(m.user) : m.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReg.formData && Object.keys(selectedReg.formData).length > 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-3">Form Data</h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries(selectedReg.formData).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <div className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="font-medium text-white">{value?.toString() || 'N/A'}</div>
                      </div>
                    ))}
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
