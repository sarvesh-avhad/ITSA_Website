import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PermissionGuard } from '@/components/layout/permission-guard';
import { PERMISSIONS } from '@itsa/shared';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import HomePage from '@/app/routes/home';
import LoginPage from '@/app/routes/auth/login';
import RegisterPage from '@/app/routes/auth/register';
import ForgotPasswordPage from '@/app/routes/auth/forgot-password';
import ResetPasswordPage from '@/app/routes/auth/reset-password';
import EventsListingPage from '@/app/routes/events/index';
import EventDetailPage from '@/app/routes/events/[slug]';
import EventRegistrationPage from '@/app/routes/events/register';
import MyRegistrationsPage from '@/app/routes/dashboard/registrations';
import GalleryPage from '@/app/routes/gallery/index';
import AlbumDetailPage from '@/app/routes/gallery/[slug]';
import SponsorsPage from '@/app/routes/sponsors';
import AnnouncementsPage from '@/app/routes/announcements';
import AboutPage from '@/app/routes/about';
import ContactPage from '@/app/routes/contact';
import JoinItsaPage from '@/app/routes/join-itsa/index';
import AdminDashboardPage from '@/app/routes/admin/index';
import AdminUsersPage from '@/app/routes/admin/users';
import AdminEventsPage from '@/app/routes/admin/events';
import AdminRegistrationsPage from '@/app/routes/admin/registrations';
import AdminGalleryPage from '@/app/routes/admin/gallery';
import AdminContactsPage from '@/app/routes/admin/contacts';
import AdminAnnouncementsPage from '@/app/routes/admin/announcements';
import AdminSponsorsPage from '@/app/routes/admin/sponsors';
import AdminCertificatesPage from '@/app/routes/admin/certificates';
import AdminSettingsPage from '@/app/routes/admin/settings';
import AdminAuditLogsPage from '@/app/routes/admin/audit-logs';
import AdminMyPermissionsPage from '@/app/routes/admin/my-permissions';
import StudentDashboardPage from '@/app/routes/dashboard/index';
import StudentCertificatesPage from '@/app/routes/dashboard/certificates';
import StudentSettingsPage from '@/app/routes/dashboard/settings';
import CertificateVerifyPage from '@/app/routes/certificates/verify';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await apiClient.get('/auth/me');
        setUser(data.data);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // Periodic 60-second sync
    const intervalId = setInterval(() => {
      if (localStorage.getItem('accessToken')) {
        apiClient.get('/auth/me')
          .then(({ data }) => setUser(data.data))
          .catch(() => logout());
      }
    }, 60000);

    // Listen for 403 events to force immediate sync
    const handle403 = () => {
      if (localStorage.getItem('accessToken')) {
        apiClient.get('/auth/me')
          .then(({ data }) => setUser(data.data))
          .catch(() => logout());
      }
    };
    window.addEventListener('auth-403', handle403);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('auth-403', handle403);
    };
  }, [setUser, logout, setLoading]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <BrowserRouter>
        <Routes>
          {/* Public routes with main layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsListingPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route path="/events/:slug/register" element={<EventRegistrationPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/gallery/:slug" element={<AlbumDetailPage />} />
            <Route path="/sponsors" element={<SponsorsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/certificates/verify" element={<CertificateVerifyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/join-itsa" element={<JoinItsaPage />} />
          </Route>

          {/* Auth routes without main layout */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="registrations" element={<MyRegistrationsPage />} />
            <Route path="certificates" element={<StudentCertificatesPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="my-permissions" element={<AdminMyPermissionsPage />} />
            <Route path="users" element={<PermissionGuard permission={PERMISSIONS.USERS_READ}><AdminUsersPage /></PermissionGuard>} />
            <Route path="events" element={<PermissionGuard permission={[PERMISSIONS.EVENTS_CREATE, PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS]}><AdminEventsPage /></PermissionGuard>} />
            <Route path="registrations" element={<PermissionGuard permission={PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS}><AdminRegistrationsPage /></PermissionGuard>} />
            <Route path="gallery" element={<PermissionGuard permission={[PERMISSIONS.GALLERY_CREATE, PERMISSIONS.GALLERY_UPLOAD]}><AdminGalleryPage /></PermissionGuard>} />
            <Route path="contacts" element={<PermissionGuard permission={PERMISSIONS.CMS_UPDATE}><AdminContactsPage /></PermissionGuard>} />
            <Route path="announcements" element={<PermissionGuard permission={PERMISSIONS.ANNOUNCEMENTS_CREATE}><AdminAnnouncementsPage /></PermissionGuard>} />
            <Route path="sponsors" element={<PermissionGuard permission={PERMISSIONS.SPONSORS_CREATE}><AdminSponsorsPage /></PermissionGuard>} />
            <Route path="certificates" element={<PermissionGuard permission={PERMISSIONS.CERTIFICATES_GENERATE}><AdminCertificatesPage /></PermissionGuard>} />
            <Route path="audit-logs" element={<PermissionGuard permission={PERMISSIONS.AUDIT_LOGS_READ}><AdminAuditLogsPage /></PermissionGuard>} />
            <Route path="settings" element={<PermissionGuard permission={PERMISSIONS.SETTINGS_MANAGE}><AdminSettingsPage /></PermissionGuard>} />
            <Route path="*" element={<div className="p-8 text-center text-muted-foreground">This admin module is coming soon.</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthInitializer>
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: '#111118',
            border: '1px solid #27273a',
            color: '#fafafa',
          },
        }}
      />
    </QueryClientProvider>
  );
}






