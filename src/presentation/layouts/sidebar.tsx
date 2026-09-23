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
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  Layers,
  BookOpen,
  Clock,
  FileSpreadsheet,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react';
import { useAccess } from '@domain/hooks/use-access';
import { useUiStore } from '@domain/state/ui-store';

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
      { title: 'Stock Opname', path: '/inventory/opname', icon: ClipboardCheck, permission: 'stock_opname:read' },
      { title: 'Stock Adjustment', path: '/inventory/adjustments', icon: SlidersHorizontal, permission: 'inventory:adjust' },
    ],
  },
  {
    groupTitle: 'KEUANGAN',
    items: [
      { title: 'Kas & Bank', path: '/finance/accounts', icon: Wallet, permission: 'finance.account.read' },
      { title: 'Biaya Operasional', path: '/finance/expenses', icon: ReceiptText, permission: 'finance.expense.read' },
      { title: 'Aset Tetap', path: '/finance/assets', icon: Layers, permission: 'finance.asset.read' },
      { title: 'Buku Besar & COA', path: '/finance/general-ledger', icon: BookOpen, permission: 'finance.journal.read' },
    ],
  },
  {
    groupTitle: 'LAPORAN',
    items: [
      { title: 'Penjualan', path: '/reports/sales', icon: TrendingUp, permission: 'report:read' },
      { title: 'Rekonsiliasi Shift', path: '/reports/shifts', icon: Clock, permission: 'report.shift.read' },
      { title: 'Laporan Keuangan', path: '/reports/financial', icon: FileSpreadsheet, permission: 'report.financial.read' },
      { title: 'Profit', path: '/reports/profit', icon: CircleDollarSign, permission: 'report:read' },
      { title: 'Inventory', path: '/reports/inventory', icon: ScrollText, permission: 'report:read' },
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

export const Sidebar: React.FC = () => {
  const { hasAccess } = useAccess();
  const location = useLocation();
  const {
    isSidebarCollapsed,
    isMobileMenuOpen,
    closeMobileMenu,
    toggleSidebarCollapsed,
  } = useUiStore();

  // Filter groups: only keep items user has permission for, and remove empty groups
  const accessibleGroups = MENU_GROUPS.map((group) => {
    const accessibleItems = group.items.filter((item) => hasAccess(item.permission));
    return {
      ...group,
      items: accessibleItems,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 h-screen flex flex-col select-none transition-all duration-300 ease-in-out shrink-0
        lg:static lg:z-auto
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-[72px]' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 ${
          isSidebarCollapsed ? 'lg:justify-center px-4' : 'justify-between px-5'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#0D5C53] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            A
          </div>
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight truncate">
                Agilix POS
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Point of Sale System
              </p>
            </div>
          )}
        </div>

        {/* Close button on mobile drawer */}
        <button
          onClick={closeMobileMenu}
          aria-label="Tutup Menu"
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
        {accessibleGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            {!isSidebarCollapsed || isMobileMenuOpen ? (
              <h2 className="px-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase truncate">
                {group.groupTitle}
              </h2>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1.5" />
            )}
            <div className="space-y-0.5 pt-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/pos' && location.pathname.startsWith(`${item.path}/`));

                const isIconOnly = isSidebarCollapsed && !isMobileMenuOpen;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      closeMobileMenu();
                    }}
                    title={isIconOnly ? item.title : undefined}
                    className={`flex items-center rounded-lg text-sm font-medium transition-all group relative ${
                      isIconOnly
                        ? 'justify-center w-11 h-11 mx-auto'
                        : 'gap-3 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#E6F4F1] text-[#0D5C53] font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#0D5C53]' : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    />
                    {!isIconOnly && (
                      <span className="truncate">{item.title}</span>
                    )}

                    {/* Tooltip on hover when desktop is in collapsed icon mode */}
                    {isIconOnly && (
                      <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none items-center">
                        {item.title}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer with Desktop Collapse / Expand Toggle */}
      <div className="hidden lg:flex border-t border-slate-100 p-2.5">
        <button
          onClick={toggleSidebarCollapsed}
          title={isSidebarCollapsed ? 'Buka Penuh (Expand)' : 'Perkecil Menu (Collapse)'}
          className={`w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-[#0D5C53] hover:bg-teal-50 transition-colors cursor-pointer text-xs font-medium ${
            isSidebarCollapsed ? 'gap-0' : 'gap-2'
          }`}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#0D5C53]" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Ciutkan Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
