import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Store,
  History,
  Coffee,
  Tags,
  Boxes,
  Wheat,
  Box,
  Truck,
  ShoppingBag,
  ClipboardCheck,
  SlidersHorizontal,
  TrendingUp,
  CircleDollarSign,
  ScrollText,
  Building2,
  LayoutGrid,
  ConciergeBell,
  Receipt,
  BadgePercent,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAccess } from '@domain/utils/hooks/use-access';

interface SubMenuItem {
  title: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
}

interface MenuGroup {
  groupTitle: string;
  items: SubMenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    groupTitle: 'TRANSAKSI',
    items: [
      { title: 'POS / Kasir', path: '/pos', icon: Store, permission: 'order:create' },
      { title: 'Riwayat Transaksi', path: '/transactions', icon: History, permission: 'order:read' },
    ],
  },
  {
    groupTitle: 'PRODUK',
    items: [
      { title: 'Produk', path: '/products', icon: Coffee, permission: 'product:read' },
      { title: 'Kategori', path: '/products/categories', icon: Tags, permission: 'category:read' },
    ],
  },
  {
    groupTitle: 'INVENTORI',
    items: [
      { title: 'Stok', path: '/inventory/stock', icon: Boxes, permission: 'stock:read' },
      { title: 'Bahan Baku', path: '/inventory/raw-materials', icon: Wheat, permission: 'material:read' },
      { title: 'Packaging', path: '/inventory/packaging', icon: Box, permission: 'packaging:read' },
      { title: 'Supplier', path: '/inventory/suppliers', icon: Truck, permission: 'supplier:read' },
      { title: 'Pembelian', path: '/inventory/purchases', icon: ShoppingBag, permission: 'purchase:read' },
      { title: 'Stock Opname', path: '/inventory/opname', icon: ClipboardCheck, permission: 'opname:read' },
      { title: 'Stock Adjustment', path: '/inventory/adjustments', icon: SlidersHorizontal, permission: 'adjustment:read' },
    ],
  },
  {
    groupTitle: 'LAPORAN',
    items: [
      { title: 'Penjualan', path: '/reports/sales', icon: TrendingUp, permission: 'report:sales' },
      { title: 'Profit', path: '/reports/profit', icon: CircleDollarSign, permission: 'report:profit' },
      { title: 'Inventory', path: '/reports/inventory', icon: ScrollText, permission: 'report:inventory' },
    ],
  },
  {
    groupTitle: 'PENGATURAN',
    items: [
      { title: 'Outlet', path: '/settings/outlets', icon: Building2, permission: 'outlet:read' },
      { title: 'Meja', path: '/settings/tables', icon: LayoutGrid, permission: 'table:read' },
      { title: 'Order Type', path: '/settings/order-types', icon: ConciergeBell, permission: 'order_type:read' },
      { title: 'Pajak & Biaya', path: '/settings/taxes', icon: Receipt, permission: 'tax:read' },
      { title: 'Diskon & Promo', path: '/settings/discounts', icon: BadgePercent, permission: 'discount:read' },
      { title: 'Printer Struk', path: '/settings/printers', icon: Printer, permission: 'printer:read' },
      { title: 'Role', path: '/settings/roles', icon: ShieldCheck, permission: 'role:read' },
      { title: 'User', path: '/settings/users', icon: Users, permission: 'user:read' },
      { title: 'Audit Log', path: '/settings/audit-logs', icon: ShieldAlert, permission: 'audit_log.read' },
    ],
  },
];

export const WithSidebar: React.FC = () => {
  const { hasAccess } = useAccess();
  const location = useLocation();

  // Filter groups: only keep items user has permission for, and remove empty groups
  const accessibleGroups = MENU_GROUPS.map((group) => {
    const accessibleItems = group.items.filter((item) => hasAccess(item.permission));
    return {
      ...group,
      items: accessibleItems,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0D5C53] flex items-center justify-center text-white font-bold text-lg shadow-sm">
          A
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight">Agilix POS</h1>
          <p className="text-[11px] text-slate-500 font-medium">Point of Sale System</p>
        </div>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {accessibleGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <h2 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {group.groupTitle}
            </h2>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/pos' && location.pathname.startsWith(`${item.path}/`));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#E6F4F1] text-[#0D5C53] font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#0D5C53]' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
