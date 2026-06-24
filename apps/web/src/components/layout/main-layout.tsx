import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Search, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalSearch } from './global-search';
import { HelmetProvider } from 'react-helmet-async';
import { useAuthStore } from '@/stores/auth.store';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Sponsors', href: '/sponsors' },
  { label: 'Contact', href: '/contact' },
];

export function MainLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col relative">
        {/* Global Video Background */}
        <div className="fixed inset-0 w-full h-full z-[-1] overflow-hidden bg-background">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          >
            <source src="/bg_video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* ========== GLASSMORPHISM NAVBAR ========== */}
        <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'glass-strong shadow-lg shadow-black/20' : 'bg-transparent'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 relative z-10 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <img src="/ITSA_logo.png" alt="ITSA Logo" className="w-8 h-8 object-contain relative z-10" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white leading-none">ITSA</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Dept. of IT</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300',
                  location.pathname === link.href
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
                {location.pathname === link.href && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/10"
                    layoutId="navbar-active"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors hidden sm:flex items-center gap-2"
              aria-label="Search"
            >
              <Search size={18} />
              <span className="text-sm font-medium border border-white/10 rounded px-1.5 py-0.5 text-[10px] bg-white/5">Ctrl K</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors sm:hidden"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-2">
                {['ADMIN', 'ITSA_MEMBER', 'SUPER_ADMIN'].includes(user.role) && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all duration-300"
                  >
                    <Shield size={16} />
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin Panel' : 
                     user.role === 'ADMIN' ? 'Admin Panel' :
                     user.role === 'ITSA_MEMBER' ? 'Member Panel' : 'Panel'}
                  </Link>
                )}
                <Link
                  to="/dashboard/registrations"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/20 transition-all duration-300"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400 transition-all duration-300 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 btn-glow"
              >
                Get Started
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="lg:hidden glass-strong border-t border-white/5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-6 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === link.href
                        ? 'bg-violet-600/10 text-violet-400'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="pt-4 mt-2 border-t border-white/10 space-y-2">
                  {isAuthenticated && user ? (
                    <>
                      {['ADMIN', 'ITSA_MEMBER', 'SUPER_ADMIN'].includes(user.role) && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
                        >
                          <Shield size={18} className="text-violet-400" />
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin Panel' : 
                           user.role === 'ADMIN' ? 'Admin Panel' :
                           user.role === 'ITSA_MEMBER' ? 'Member Panel' : 'Panel'}
                        </Link>
                      )}
                      <Link
                        to="/dashboard/registrations"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard size={18} className="text-violet-400" />
                        Student Dashboard
                      </Link>
                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth/login"
                      className="block w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ========== FOOTER ========== */}
      {!isHome && (
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm">
                  IT
                </div>
                <span className="text-lg font-bold gradient-text">ITSA Platform</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Information Technology Students Association — Empowering students through technology,
                innovation, and community.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Resources
              </h4>
              <ul className="space-y-3">
                <li><Link to="/certificates/verify" className="text-sm text-muted-foreground hover:text-white transition-colors">Verify Certificate</Link></li>
                <li><Link to="/announcements" className="text-sm text-muted-foreground hover:text-white transition-colors">Announcements</Link></li>
                <li><Link to="/auth/register" className="text-sm text-muted-foreground hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Contact
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>IT Department, Engineering College</li>
                <li>itsa@college.edu</li>
                <li>+91 98765 43210</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ITSA Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      )}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
    </HelmetProvider>
  );
}
