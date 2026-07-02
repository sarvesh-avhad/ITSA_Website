import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { Loader2, Search, Download, ExternalLink, Activity, AlertCircle, FileText, CalendarDays } from 'lucide-react';
import { SEO } from '@/components/seo';
import { format } from 'date-fns';

export default function AdminGeneratedCertificatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const eventId = searchParams.get('eventId') || '';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // We should also fetch events for the filter dropdown
  const { data: events = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data } = await apiClient.get('/events?limit=100');
      return data.data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-certificates', eventId, debouncedSearch, page],
    queryFn: async () => {
      let url = `/certificates/admin/all?page=${page}&limit=12`;
      if (eventId) url += `&eventId=${eventId}`;
      if (debouncedSearch) url += `&search=${debouncedSearch}`;
      
      const { data: res } = await apiClient.get(url);
      return res.data;
    }
  });

  const certificates = data?.certificates || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      <SEO title="Generated Certificates | Admin" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Generated Certificates</h1>
          <p className="text-muted-foreground">View and search all generated certificates across events.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by Name, PRN, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          
          <select 
            value={eventId}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              if (e.target.value) newParams.set('eventId', e.target.value);
              else newParams.delete('eventId');
              setSearchParams(newParams);
              setPage(1);
            }}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 [&>option]:bg-zinc-900"
          >
            <option value="">All Events</option>
            {events.map((ev: any) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          {eventId && (
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/certificates/export/${eventId}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Participant</th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium">Certificate ID</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No certificates found.
                  </td>
                </tr>
              ) : (
                certificates.map((cert: any) => (
                  <tr key={cert.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{cert.user.firstName} {cert.user.lastName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{cert.user.email} • {cert.user.prn || 'No PRN'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground flex items-center gap-1.5 line-clamp-1">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        {cert.event.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">
                        {cert.template.type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded inline-block border text-foreground/80">
                        {cert.certificateNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(cert.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cert.status === 'REVOKED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <AlertCircle className="w-3.5 h-3.5" /> Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <Activity className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/verify/certificate/${cert.certificateNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                          title="View Verification Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <a
                          href={cert.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded-md text-sm hover:bg-muted/50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 border rounded-md text-sm hover:bg-muted/50 disabled:opacity-50"
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
