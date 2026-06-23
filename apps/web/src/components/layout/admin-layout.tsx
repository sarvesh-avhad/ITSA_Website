import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Calendar, Image as ImageIcon, FileText, Settings, Award, LogOut, Menu, X, Home, Mail, Megaphone, Star, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@itsa/shared';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from '@/components/seo';

const adminLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'My Permissions', href: '/admin/my-permissions', icon: ShieldCheck },
  { label: 'Users', href: '/admin/users', icon: Users, permission: PERMISSIONS.USERS_READ },
  { label: 'Events', href: '/admin/events', icon: Calendar, permission: [PERMISSIONS.EVENTS_CREATE, PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS] },
  { label: 'Registrations', href: '/admin/registrations', icon: FileText, permission: PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS },
  { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon, permission: [PERMISSIONS.GALLERY_CREATE, PERMISSIONS.GALLERY_UPLOAD] },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, permission: PERMISSIONS.ANNOUNCEMENTS_CREATE },
  { label: 'Sponsors', href: '/admin/sponsors', icon: Star, permission: PERMISSIONS.SPONSORS_CREATE },
  { label: 'Contacts', href: '/admin/contacts', icon: Mail, permission: PERMISSIONS.CMS_UPDATE },
  { label: 'Certificates', href: '/admin/certificates', icon: Award, permission: PERMISSIONS.CERTIFICATES_GENERATE },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText, permission: PERMISSIONS.AUDIT_LOGS_READ },
  { label: 'Settings', href: '/admin/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
];

export function AdminLayout() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated || !user || !['ADMIN', 'EVENT_COORDINATOR', 'ITSA_MEMBER', 'SUPER_ADMIN'].includes(user.role)) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background flex">
        <SEO title="Admin Dashboard" />
        
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Brand */}
          <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                IT
              </div>
              <span className="font-bold text-white tracking-tight">Admin Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
            {adminLinks.filter(link => {
              if (!link.permission) return true;
              if (Array.isArray(link.permission)) {
                return link.permission.some(p => useAuthStore.getState().hasPermission(p));
              }
              return useAuthStore.getState().hasPermission(link.permission);
            }).map((link) => {
              const isActive = location.pathname === link.href || (link.href !== '/admin' && location.pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group",
                    isActive 
                      ? "text-white bg-violet-600/20 border border-violet-500/20" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={18} className={cn("transition-colors", isActive ? "text-violet-400" : "group-hover:text-violet-400")} />
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-y-2 left-0 w-1 bg-violet-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 mb-2">
              <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-400 font-bold shrink-0 uppercase">
                {((user as any).firstName || 'U').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{((user as any).firstName || '')} {((user as any).lastName || '')}</div>
                <div className="text-[10px] text-violet-400 font-bold tracking-wider truncate">
                  {user.role.replace('_', ' ')}
                </div>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors mb-2"
            >
              <Home size={18} />
              Back to Website
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 glass border-b border-white/10 flex items-center px-4 sm:px-6 shrink-0 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5"
            >
              <Menu size={24} />
            </button>
            <div className="ml-auto font-bold text-white tracking-tight">Admin Panel</div>
          </header>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </HelmetProvider>
  );
}
