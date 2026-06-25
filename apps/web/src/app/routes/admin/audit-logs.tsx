import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, Loader2, Calendar, User, Activity, FileText, Filter, Eye, X, AlertTriangle, ShieldAlert, Info, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { SEO } from '@/components/seo';
import { ExportButton } from '@/components/ui/ExportButton';

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

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getTargetName = (log: any) => {
    if (log.targetUserName) return log.targetUserName;
    
    // Attempt to extract from newValue or oldValue
    const payload = log.newValue || log.oldValue;
    if (payload) {
      if (payload.eventName) return payload.eventName;
      if (payload.title) return payload.title;
      if (payload.name) return payload.name;
      if (payload.albumName) return payload.albumName;
      if (payload.teamName) return payload.teamName;
    }
    
    return null;
  };

  const generateLogDescription = (log: any) => {
    const actor = log.actorName || 'System';
    const target = getTargetName(log) || log.resourceId || 'a resource';
    
    switch (log.action) {
      case 'ROLE_CHANGED':
        const oldRole = log.oldValue?.role || 'User';
        const newRole = log.newValue?.role || 'User';
        return `${actor} changed the role of ${target} from ${oldRole} to ${newRole}.`;
      case 'USER_SUSPENDED':
        return `${actor} suspended ${target}.`;
      case 'PASSWORD_RESET_REQUESTED':
        return `Password reset requested for ${target}.`;
      case 'REGISTRATION_CREATED':
        return `${actor} successfully registered for ${target}.`;
      case 'TEAM_REGISTRATION_CREATED':
        return `${actor} created team registration for ${target}.`;
      case 'ALBUM_CREATED':
        return `Gallery album "${target}" was created.`;
      case 'SPONSOR_CREATED':
        return `Sponsor "${target}" was added.`;
      case 'ANNOUNCEMENT_CREATED':
        return `Announcement "${target}" was published.`;
      case 'MEDIA_UPLOADED':
        return `${actor} uploaded media to "${target}".`;
      default:
        const actionStr = formatActionName(log.action).toLowerCase();
        return `${actor} performed ${actionStr} on ${target}.`;
    }
  };

  const PayloadDiff = ({ log }: { log: any }) => {
    const oldVal = log.oldValue || {};
    const newVal = log.newValue || {};
    
    // Collect all unique keys that changed
    const keys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)])).filter(key => {
      // Don't show unchanged fields
      return JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key]);
    });

    if (keys.length === 0) return null;

    const formatValue = (val: any) => {
      if (val === undefined || val === null) return 'None';
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
        try { return format(new Date(val), 'PPp'); } catch (e) { return val; }
      }
      if (typeof val === 'string' && val.match(/^[A-Z_]+$/)) {
        return val.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      }
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    return (
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" /> Changed Fields
        </h3>
        <div className="grid gap-3">
          {keys.map(key => {
            // Complex objects inside payload are hard to diff simply, fallback to JSON for that key
            if ((oldVal[key] && typeof oldVal[key] === 'object') || (newVal[key] && typeof newVal[key] === 'object')) {
              return (
                <div key={key} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{key}</div>
                  <div className="grid grid-cols-2 gap-4">
                    {oldVal[key] !== undefined && (
                      <div>
                        <div className="text-[10px] text-rose-400 font-semibold uppercase mb-1">Old Value</div>
                        <pre className="bg-[#050508] p-2 rounded border border-white/5 text-xs text-white/80 font-mono overflow-x-auto">
                          {JSON.stringify(oldVal[key], null, 2)}
                        </pre>
                      </div>
                    )}
                    {newVal[key] !== undefined && (
                      <div className={oldVal[key] === undefined ? 'col-span-2' : ''}>
                        <div className="text-[10px] text-emerald-400 font-semibold uppercase mb-1">New Value</div>
                        <pre className="bg-[#050508] p-2 rounded border border-white/5 text-xs text-white/80 font-mono overflow-x-auto">
                          {JSON.stringify(newVal[key], null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="w-1/4 text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="flex-1 flex items-center gap-3">
                  {oldVal[key] !== undefined && (
                    <div className="flex-1 px-3 py-1.5 bg-rose-500/10 text-rose-200 border border-rose-500/20 rounded text-sm break-all">
                      {formatValue(oldVal[key])}
                    </div>
                  )}
                  {oldVal[key] !== undefined && newVal[key] !== undefined && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  {newVal[key] !== undefined && (
                    <div className="flex-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 rounded text-sm break-all">
                      {formatValue(newVal[key])}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
              <option value="USERS" className="bg-slate-900">Users</option>
              <option value="AUTH" className="bg-slate-900">Authentication</option>
              <option value="EVENTS" className="bg-slate-900">Events</option>
              <option value="REGISTRATIONS" className="bg-slate-900">Registrations</option>
              <option value="GALLERY" className="bg-slate-900">Gallery</option>
              <option value="ANNOUNCEMENTS" className="bg-slate-900">Announcements</option>
              <option value="SPONSORS" className="bg-slate-900">Sponsors</option>
              <option value="CERTIFICATES" className="bg-slate-900">Certificates</option>
              <option value="SETTINGS" className="bg-slate-900">Settings</option>
              <option value="SYSTEM" className="bg-slate-900">System</option>
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
            <ExportButton endpoint="/admin/audit-logs/export" queryParams={{ search, category, dateFilter, severity }} filename="audit_logs" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><User size={14} /> Actor &rarr; Target</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-2"><Activity size={14} /> Action</div></th>
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
                        {getTargetName(log) ? (
                          <>
                            <ArrowRight className="w-4 h-4 text-white/20" />
                            <div>
                              <div className="font-medium text-white">{getTargetName(log)}</div>
                              {log.targetUserEmail && <div className="text-[10px] text-muted-foreground leading-tight">{log.targetUserEmail}</div>}
                            </div>
                          </>
                        ) : log.targetUserName ? (
                          <>
                            <ArrowRight className="w-4 h-4 text-white/20" />
                            <div>
                              <div className="font-medium text-white">{log.targetUserName}</div>
                              <div className="text-[10px] text-muted-foreground leading-tight">{log.targetUserEmail}</div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="font-mono text-[11px] font-medium text-white/90 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                          {formatActionName(log.action)}
                        </span>
                        {getSeverityBadge(log.severity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <div className="text-white font-medium mb-0.5">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </div>
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
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-100 flex gap-3 items-start">
                <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{generateLogDescription(selectedLog)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Action</div>
                  <div className="font-mono text-sm text-white px-2 py-1 rounded bg-white/5 border border-white/10 inline-block">
                    {formatActionName(selectedLog.action)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Severity</div>
                  <div className="inline-block mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timestamp</div>
                  <div className="text-sm text-white">{format(new Date(selectedLog.createdAt), 'PPpp')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resource ID</div>
                  <div className="text-sm font-mono text-white/70 truncate" title={selectedLog.resourceId}>{selectedLog.resourceId || 'N/A'}</div>
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
                  {getTargetName(selectedLog) ? (
                    <div>
                      <div className="text-sm text-white/90">{getTargetName(selectedLog)}</div>
                      {selectedLog.targetUserEmail && <div className="text-xs text-muted-foreground font-mono">{selectedLog.targetUserEmail}</div>}
                      {selectedLog.targetUserId && <div className="text-[10px] text-muted-foreground mt-1 font-mono break-all">ID: {selectedLog.targetUserId}</div>}
                    </div>
                  ) : selectedLog.targetUserName ? (
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
                <>
                  <PayloadDiff log={selectedLog} />
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify({ oldValue: selectedLog.oldValue, newValue: selectedLog.newValue }, null, 2))}
                      className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5" /> Copy JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
