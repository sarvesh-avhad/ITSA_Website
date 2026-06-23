import { useAuthStore } from '@/stores/auth.store';
import { Mail, GraduationCap, MapPin, Phone, Building } from 'lucide-react';
import { SEO } from '@/components/seo';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-rise">
      <SEO title="My Profile | Student Hub" />
      
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-muted-foreground">View your personal details and academic information.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-violet-600/20 border-2 border-violet-500/20 mb-6 overflow-hidden flex items-center justify-center relative group">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-violet-400">
                  {user.firstName[0]}{user.lastName?.[0]}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-violet-400 font-medium mt-1">{user.role}</p>
            
            <div className="w-full h-px bg-border my-6" />
            
            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={18} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone size={18} className="shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.branch && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Building size={18} className="shrink-0" />
                  <span>{user.branch} Department</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details & Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Academic Details</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">PRN Number</p>
                <p className="font-semibold text-white">{user.prn || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Year of Study</p>
                <p className="font-semibold text-white">{user.year ? `Year ${user.year}` : 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-semibold text-white">{user.branch || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className="font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 border-l-4 border-l-violet-500 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <GraduationCap size={24} className="text-violet-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-2xl">0</h4>
                <p className="text-sm text-muted-foreground">Events Attended</p>
              </div>
            </div>
            
            <div className="glass-card rounded-3xl p-6 border-l-4 border-l-cyan-500 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                <MapPin size={24} className="text-cyan-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-2xl">0</h4>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
