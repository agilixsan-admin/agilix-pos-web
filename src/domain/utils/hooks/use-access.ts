import { useAuthStore } from '@domain/state/auth-store';

export const useAccess = () => {
  const user = useAuthStore((state) => state.user);

  const hasAccess = (requiredPermission?: string): boolean => {
    // If no permission is specified, grant access by default
    if (!requiredPermission) return true;
    if (!user) return false;

    // Super Admin / Owner bypass
    if (user.roleName?.toUpperCase() === 'OWNER' || user.permissions?.includes('*') || user.permissions?.includes('ALL')) {
      return true;
    }

    // Check specific permission in user permissions array
    return user.permissions?.includes(requiredPermission) || false;
  };

  const hasAnyAccess = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((perm) => hasAccess(perm));
  };

  const hasAllAccess = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every((perm) => hasAccess(perm));
  };

  return {
    user,
    hasAccess,
    hasAnyAccess,
    hasAllAccess,
  };
};

