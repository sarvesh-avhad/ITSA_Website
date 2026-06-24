import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface PermissionGuardProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: string;
}

export function PermissionGuard({ permission, children, fallback = '/admin' }: PermissionGuardProps) {
  const { hasPermission } = useAuthStore();

  const isAllowed = Array.isArray(permission)
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission);

  if (!isAllowed) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
