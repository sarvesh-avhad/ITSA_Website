import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, Loader2, Calendar, User, Activity, FileText, Filter, Eye, X, AlertTriangle, ShieldAlert, Info, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { SEO } from '@/components/seo';

const fetchAuditLogs = async (page: number, search: string, category: string, dateFilter: string, severity: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(search && { search }),
    ...(category && { category }),
    ...(dateFilter && { dateFilter }),
    ...(severity && { severity }),
  });
  const { data } = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
  return data;
};

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [severity, setSeverity] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['admin', 'audit-logs', page, search, category, dateFilter, severity],
    queryFn: () => fetchAuditLogs(page, search, category, dateFilter, severity),
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30"><ShieldAlert size={12}/> CRITICAL</span>;
      case 'WARNING': return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30"><AlertTriangle size={12}/> WARNING</span>;
      default: return <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30"><Info size={12}/> INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Audit Logs - Admin" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">Track and monitor all system activities and administrative actions.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-white/10 flex flex-col lg:flex-row gap-4 bg-white/[0.02]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Actor, Target, Action, Resource..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <option value="" className="bg-slate-900">All Categories</option>
              <option value="USER" className="bg-slate-900">User Actions</option>
              <option value="ROLE" className="bg-slate-900">Role Actions</option>
              <option value="PERMISSION" className="bg-slate-900">Permission Actions</option>
              <option value="EVENT" className="bg-slate-900">Event Actions</option>
              <option value="REGISTRATION" className="bg-slate-900">Registration Actions</option>
              <option value="GALLERY" className="bg-slate-900">Gallery Actions</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <option value="" className="bg-slate-900">All Time</option>
              <option value="TODAY" className="bg-slate-900">Today</option>
              <option value="LAST_7_DAYS" className="bg-slate-900">Last 7 Days</option>
              <option value="LAST_30_DAYS" className="bg-slate-900">Last 30 Days</option>
            </select>

            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <option value="" className="bg-slate-900">All Severities</option>
              <option value="INFO" className="bg-slate-900">Info</option>
              <option value="WARNING" className="bg-slate-900">Warning</option>
              <option value="CRITICAL" className="bg-slate-900">Critical</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><User size={14} /> Actor &rarr; Target</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Activity size={14} /> Action</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><FileText size={14} /> Resource</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Calendar size={14} /> Timestamp</div></th>
                <th className="px-6 py-4 font-medium text-right">Details</th>
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
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                data?.data?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          {log.actorName ? (
                            <>
                              <div className="font-medium text-white">{log.actorName}</div>
                              <div className="text-[10px] text-muted-foreground leading-tight">{log.actorEmail}</div>
                            </>
                          ) : (
                            <div className="text-muted-foreground italic">System</div>
                          )}
                        </div>
                        {log.targetUserName && (
                          <>
                            <ArrowRight className="w-4 h-4 text-white/20" />
                            <div>
                              <div className="font-medium text-white">{log.targetUserName}</div>
                              <div className="text-[10px] text-muted-foreground leading-tight">{log.targetUserEmail}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-xs font-semibold text-white/90 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                          {log.action}
                        </span>
                        {getSeverityBadge(log.severity)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{log.resource}</div>
                      {log.resourceId && <div className="font-mono text-[10px] text-muted-foreground mt-1 truncate max-w-[120px]">ID: {log.resourceId}</div>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && data?.meta && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground bg-white/[0.02]">
            <div>
              Showing {((data.meta.page - 1) * data.meta.limit) + 1} to {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total} logs
            </div>
            <div className="flex gap-2">
              <button 
                disabled={data.meta.page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={data.meta.page === data.meta.totalPages || data.meta.total === 0}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-white/10 shadow-2xl relative">
            <div className="sticky top-0 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                Audit Log Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Action</div>
                  <div className="font-mono text-sm text-white px-2 py-1 rounded bg-white/5 border border-white/10 inline-block">
                    {selectedLog.action}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Severity</div>
                  <div className="inline-block mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resource</div>
                  <div className="text-sm text-white font-medium">{selectedLog.resource}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timestamp</div>
                  <div className="text-sm text-white">{format(new Date(selectedLog.createdAt), 'PPpp')}</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resource ID</div>
                  <div className="text-sm font-mono text-white/70">{selectedLog.resourceId || 'N/A'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <User className="w-4 h-4 text-blue-400" /> Actor
                  </div>
                  {selectedLog.actorName ? (
                    <div>
                      <div className="text-sm text-white/90">{selectedLog.actorName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{selectedLog.actorEmail}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono break-all">ID: {selectedLog.actorId}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">System / Anonymous</div>
                  )}
                  {selectedLog.ipAddress && (
                    <div className="text-[10px] font-mono text-white/40 mt-2">IP: {selectedLog.ipAddress}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <User className="w-4 h-4 text-emerald-400" /> Target
                  </div>
                  {selectedLog.targetUserName ? (
                    <div>
                      <div className="text-sm text-white/90">{selectedLog.targetUserName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{selectedLog.targetUserEmail}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono break-all">ID: {selectedLog.targetUserId}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">N/A</div>
                  )}
                </div>
              </div>

              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" /> Payload Data
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.oldValue && (
                      <div className="space-y-2">
                        <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Old Value</div>
                        <pre className="bg-[#050508] p-3 rounded-lg border border-white/5 text-xs text-white/80 font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.oldValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValue && (
                      <div className={`space-y-2 ${!selectedLog.oldValue ? 'md:col-span-2' : ''}`}>
                        <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">New Value</div>
                        <pre className="bg-[#050508] p-3 rounded-lg border border-white/5 text-xs text-white/80 font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
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
