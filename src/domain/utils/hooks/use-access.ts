import { useAuthStore } from '@domain/state/auth-store';

export const useAccess = () => {
  const user = useAuthStore((state) => state.user);

  const hasAccess = (requiredPermission?: string): boolean => {
    // If no permission is specified, grant access by default
    if (!requiredPermission) return true;
    if (!user) return false;

    // Super Admin / Owner bypass (Matching Backend PermissionGuard)
    if (
      user.isSuperAdmin === true ||
      user.roleName?.toUpperCase() === 'SUPER_ADMIN' ||
      user.roleName?.toUpperCase() === 'SUPER ADMIN' ||
      user.roleName?.toUpperCase() === 'OWNER' ||
      user.permissions?.includes('*') ||
      user.permissions?.includes('ALL') ||
      user.menuAccess?.includes('*')
    ) {
      return true;
    }

    // Check specific permission in user permissions array or menuAccess
    const hasPerm = user.permissions?.includes(requiredPermission);
    const hasMenu = user.menuAccess?.includes(requiredPermission);

    return !!(hasPerm || hasMenu);
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
