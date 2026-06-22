import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QrCode, Calendar, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function MyRegistrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      const res = await apiClient.get('/registrations/my');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">My Registrations</h1>
          <p className="text-muted-foreground">Manage your event registrations and access your entry QR codes.</p>
        </div>

        {data?.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No registrations yet</h2>
            <p className="text-muted-foreground mb-6">You haven't registered for any events yet. Explore upcoming events and join the fun!</p>
            <Link to="/events" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.map((reg: any) => (
              <div key={reg.id} className="glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                {/* Event Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold border",
                      reg.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      reg.status === 'PENDING' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {reg.status}
                    </span>
                    {reg.teamId && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-border text-white flex items-center gap-1.5">
                        <Users size={12} /> Team: {reg.team?.name}
                      </span>
                    )}
                  </div>

                  <Link to={`/events/${reg.event.slug}`} className="block">
                    <h2 className="text-2xl font-bold text-white hover:text-violet-400 transition-colors">{reg.event.title}</h2>
                  </Link>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-violet-400" />
                      <span>{new Date(reg.event.startDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-cyan-400" />
                      <span>{reg.event.venue || 'TBA'}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                {reg.status === 'APPROVED' && reg.qrCode && (
                  <div className="w-full md:w-auto shrink-0 bg-white p-4 rounded-xl flex flex-col items-center">
                    {/* Placeholder for QR Code since generating data URL requires library, we display the raw ID or an image from API. For now, a mock box */}
                    <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-lg border border-gray-300">
                      <QrCode size={48} className="text-gray-400" />
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 mt-2 tracking-widest uppercase">
                      {reg.qrCode}
                    </div>
                    <div className="text-xs font-semibold text-gray-900 mt-1">Show at entry</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
