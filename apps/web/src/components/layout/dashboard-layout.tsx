import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  LogOut,
  Award,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelmetProvider } from 'react-helmet-async';

const sidebarLinks = [
  { label: 'My Profile', href: '/dashboard', icon: UserIcon },
  { label: 'My Registrations', href: '/dashboard/registrations', icon: Calendar },
  { label: 'My Certificates', href: '/dashboard/certificates', icon: Award },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardLayout() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background flex text-foreground">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-border bg-card/50 backdrop-blur-xl z-20">
          <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
            <Link to="/" className="flex items-center gap-2 relative z-10 group">
              <div className="relative w-8 h-8 flex items-center justify-center bg-violet-600/20 rounded-lg">
                <img src="/ITSA_logo.png" alt="ITSA Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-bold text-lg text-white">Student Hub</span>
            </Link>
          </div>

          <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            <div className="px-2 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dashboard Menu
            </div>
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href || (link.href !== '/dashboard' && location.pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-violet-600/20 text-violet-400'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={18} className={cn(isActive ? 'text-violet-400' : 'text-muted-foreground')} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-border shrink-0">
            <div className="glass-card rounded-xl p-3 mb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0 border border-violet-500/20 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-violet-400 font-bold text-xs">
                    {user.firstName[0]}{user.lastName?.[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            
            <Link to="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
              <LayoutDashboard size={18} />
              Back to Website
            </Link>
            <button
              onClick={() => logout()}
              className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-xl z-30 flex items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center">
              <img src="/ITSA_logo.png" alt="ITSA Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold text-lg text-white">Student Hub</span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-20 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full bg-background border-r border-border flex flex-col pt-16">
              <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                <div className="px-2 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Menu
                </div>
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href || (link.href !== '/dashboard' && location.pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-violet-600/20 text-violet-400'
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon size={18} className={cn(isActive ? 'text-violet-400' : 'text-muted-foreground')} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border shrink-0">
                <Link to="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  <LayoutDashboard size={18} />
                  Back to Website
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-64 flex flex-col min-h-screen pt-16 lg:pt-0">
          <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </HelmetProvider>
  );
}
