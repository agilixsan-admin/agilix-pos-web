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
    const normalize = (p: string) => p.replace(':', '.').toLowerCase();
    const reqNormalized = normalize(requiredPermission);

    // Map common aliases
    const aliases: Record<string, string[]> = {
      'material.read': ['inventory.read', 'inventory_item.read'],
      'material.create': ['inventory.create'],
      'stock.read': ['inventory.read', 'inventory_stock.read'],
      'category.read': ['product.read', 'category.read'],
      'order_type.read': ['order_type.read', 'settings.read'],
      'tax.read': ['tax.read', 'settings.read'],
      'discount.read': ['discount.read', 'settings.read'],
      'printer.read': ['printer.read', 'settings.read'],
    };

    const targetList = [reqNormalized, ...(aliases[reqNormalized] || [])];

    const hasPerm = user.permissions?.some((p) => targetList.includes(normalize(p)));
    const hasMenu = user.menuAccess?.some((m) => targetList.includes(normalize(m)));

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
