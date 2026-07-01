import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { EventCertificatesManager } from '@/components/admin/certificates/EventCertificatesManager';

export default function AdminCertificatesPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: async () => {
      const res = await apiClient.get('/events?limit=50');
      return res.data.data;
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
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-96"
            >
              <option value="" className="bg-[#121212]">-- Select an Event --</option>
              {events?.map((e: any) => (
                <option key={e.id} value={e.id} className="bg-[#121212]">
                  {e.title} ({new Date(e.startDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventCertificatesManager eventId={selectedEvent} />
      )}
    </div>
  );
}
