import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Award, Search, Loader2, CheckCircle2, Download, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminCertificatesPage() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: async () => {
      const res = await apiClient.get('/events?limit=50');
      return res.data.data;
    },
  });

  const { data: registrations, isLoading: regsLoading } = useQuery({
    queryKey: ['event-registrations-for-certs', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const res = await apiClient.get(`/registrations/event/${selectedEvent}`);
      return res.data.data.filter((r: any) => r.status === 'ATTENDED' || r.status === 'CONFIRMED');
    },
    enabled: !!selectedEvent,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/certificates/generate', { eventId: selectedEvent });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations-for-certs', selectedEvent] });
      toast.success(`Generated ${data.data.count} certificates successfully!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to generate certificates');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Issue Certificates</h1>
          <p className="text-muted-foreground">Generate and manage certificates for event attendees.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <label className="block text-sm font-medium text-white mb-2">Select Event to Issue Certificates</label>
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" /> Loading events...
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full sm:max-w-md px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">-- Select an event --</option>
              {events?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.title} ({new Date(e.startDate).toLocaleDateString()})</option>
              ))}
            </select>
            
            {selectedEvent && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to generate certificates for all attendees? This cannot be undone.')) {
                    generateMutation.mutate();
                  }
                }}
                disabled={generateMutation.isPending || !registrations?.length}
                className="btn-glow px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {generateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} />}
                Generate Certificates
              </button>
            )}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Eligible Attendees</h2>
            <div className="px-3 py-1 bg-white/5 rounded-lg text-sm text-muted-foreground font-semibold">
              Total: {registrations?.length || 0}
            </div>
          </div>
          
          {regsLoading ? (
            <div className="p-12 flex justify-center text-muted-foreground">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : !registrations || registrations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No eligible attendees found for this event. Participants must be marked as ATTENDED.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="text-xs uppercase bg-white/5 text-white">
                  <tr>
                    <th className="px-6 py-4">Attendee</th>
                    <th className="px-6 py-4">PRN / Branch</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {registrations.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{reg.user.firstName} {reg.user.lastName}</div>
                        <div className="text-xs">{reg.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{reg.user.prn || 'N/A'}</div>
                        <div className="text-xs">{reg.user.branch || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold tracking-wider">
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {reg.certificateId ? (
                          <div className="flex items-center gap-2 text-violet-400">
                            <CheckCircle2 size={16} />
                            <span className="font-medium text-xs">Issued</span>
                          </div>
                        ) : (
                          <div className="text-yellow-500 text-xs font-medium">Pending</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
