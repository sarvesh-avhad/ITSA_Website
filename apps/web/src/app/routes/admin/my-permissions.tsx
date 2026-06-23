import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS, ROLE_BASE_PERMISSIONS, UserRole } from '@itsa/shared';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SEO } from '@/components/seo';

export default function MyPermissions() {
  const { user, hasPermission } = useAuthStore();

  if (!user) return null;

  // Group permissions logically
  const groups = [
    { name: 'Events Management', keys: ['EVENTS_CREATE', 'EVENTS_UPDATE', 'EVENTS_DELETE', 'EVENTS_MANAGE_REGISTRATIONS'] },
    { name: 'Gallery Management', keys: ['GALLERY_CREATE', 'GALLERY_UPDATE', 'GALLERY_DELETE', 'GALLERY_UPLOAD'] },
    { name: 'Sponsors & CMS', keys: ['SPONSORS_CREATE', 'SPONSORS_UPDATE', 'SPONSORS_DELETE', 'CMS_UPDATE', 'ANNOUNCEMENTS_CREATE', 'ANNOUNCEMENTS_UPDATE', 'ANNOUNCEMENTS_DELETE'] },
    { name: 'System Administration', keys: ['USERS_READ', 'USERS_UPDATE', 'USERS_MANAGE_ROLES', 'SETTINGS_MANAGE', 'AUDIT_LOGS_READ'] },
    { name: 'Certificates', keys: ['CERTIFICATES_GENERATE', 'CERTIFICATES_MANAGE'] }
  ];

  const basePermissions = ROLE_BASE_PERMISSIONS[user.role as UserRole] || [];

  return (
    <div className="p-6 lg:p-8 space-y-8 pb-32 lg:pb-8">
      <SEO title="My Permissions" />
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-violet-500" />
            My Permissions
          </h1>
          <p className="text-muted-foreground">Review your assigned role and active permissions.</p>
        </div>
        <div className="flex flex-col items-start md:items-end">
          <div className="text-sm text-white font-medium">Current Role</div>
          <div className="text-2xl font-bold text-violet-400 bg-violet-500/10 px-4 py-1 rounded-xl border border-violet-500/20 mt-1">
            {user.role.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.name} className="glass-strong border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-white/5 px-5 py-4 border-b border-white/10">
              <h3 className="font-bold text-white">{group.name}</h3>
            </div>
            <div className="p-5 flex-1 space-y-3">
              {group.keys.map((key) => {
                const permString = (PERMISSIONS as any)[key];
                const isSuperAdmin = user.role === 'SUPER_ADMIN';
                const hasBase = basePermissions.includes(permString);
                const hasOverride = user.permissions?.includes(permString);
                const hasIt = isSuperAdmin || hasBase || hasOverride;

                return (
                  <div key={key} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className={`text-sm ${hasIt ? 'text-white' : 'text-muted-foreground line-through opacity-50'}`}>
                      {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {hasIt ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-400/50 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
