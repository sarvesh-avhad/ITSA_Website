import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS, ROLE_BASE_PERMISSIONS, UserRole } from '@itsa/shared';
import { Shield, ShieldCheck, PlusCircle } from 'lucide-react';
import { SEO } from '@/components/seo';

export default function MyPermissions() {
  const { user } = useAuthStore();

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const basePermissions = ROLE_BASE_PERMISSIONS[user.role as UserRole] || [];
  const extraPermissions = user.permissions || [];

  const inheritedList = isSuperAdmin ? Object.values(PERMISSIONS) : basePermissions;
  
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
          <div className="text-sm text-white font-medium">Role</div>
          <div className="text-2xl font-bold text-violet-400 bg-violet-500/10 px-4 py-1 rounded-xl border border-violet-500/20 mt-1">
            {user.role.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-strong border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white">Inherited Permissions</h3>
          </div>
          <div className="p-5 flex-1 space-y-3">
            {inheritedList.length === 0 ? (
              <div className="text-muted-foreground text-sm">No inherited permissions.</div>
            ) : (
              inheritedList.map((perm) => (
                <div key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-white">
                    {Object.keys(PERMISSIONS).find(k => (PERMISSIONS as any)[k] === perm)?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || perm}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Only show Extra Permissions if NOT a Super Admin */}
        {!isSuperAdmin && (
          <div className="glass-strong border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <PlusCircle className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-white">Extra Permissions</h3>
            </div>
            <div className="p-5 flex-1 space-y-3">
              {extraPermissions.length === 0 ? (
                <div className="text-muted-foreground text-sm">No extra permissions granted.</div>
              ) : (
                extraPermissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="text-sm text-white">
                      {Object.keys(PERMISSIONS).find(k => (PERMISSIONS as any)[k] === perm)?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || perm}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
