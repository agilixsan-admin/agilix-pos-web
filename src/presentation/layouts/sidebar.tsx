import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@domain/state/auth-store';
import { usePosSettings } from '@domain/hooks';

interface SubMenuItem {
  title: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
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
      { title: 'Order Type', path: '/settings/order-types', icon: ConciergeBell, permission: 'order_type:read', badge: 'Soon' },
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

  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: posSettings } = usePosSettings(currentOutlet?.id);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [posSettings?.billLogoUrl]);

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
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#101828] border-r border-slate-200 dark:border-slate-800/80 h-screen flex flex-col select-none transition-all duration-300 ease-in-out shrink-0
        lg:static lg:z-auto
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-[72px]' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800/80 ${
          isSidebarCollapsed ? 'lg:justify-center px-4' : 'justify-between px-5'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {posSettings?.billLogoUrl && !logoError ? (
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 p-1">
              <img
                src={posSettings.billLogoUrl}
                alt="Logo Bisnis"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-bold text-base shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] border border-blue-700 shrink-0">
              S
            </div>
          )}
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                SAJI
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium tracking-wide truncate">
                POS by Agilix
              </p>
            </div>
          )}
        </div>

        {/* Close button on mobile drawer */}
        <button
          onClick={closeMobileMenu}
          aria-label="Tutup Menu"
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {accessibleGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            {!isSidebarCollapsed || isMobileMenuOpen ? (
              <h2 className="px-3 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-400 uppercase truncate">
                {group.groupTitle}
              </h2>
            ) : (
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-1.5" />
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
                    className={`flex items-center rounded-xl text-xs font-medium transition-all group relative ${
                      isIconOnly
                        ? 'justify-center w-10 h-10 mx-auto'
                        : 'gap-3 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-800/50 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isIconOnly && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {!isIconOnly && item.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip on hover when desktop is in collapsed icon mode */}
                    {isIconOnly && (
                      <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none items-center gap-1.5">
                        {item.title}
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500 text-white uppercase">
                            {item.badge}
                          </span>
                        )}
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
      <div className="hidden lg:flex border-t border-slate-100 dark:border-slate-800/80 p-2.5">
        <button
          onClick={toggleSidebarCollapsed}
          title={isSidebarCollapsed ? 'Buka Penuh (Expand)' : 'Perkecil Menu (Collapse)'}
          className={`w-full flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-all active:scale-[0.98] cursor-pointer text-xs font-medium ${
            isSidebarCollapsed ? 'gap-0' : 'gap-2'
          }`}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
