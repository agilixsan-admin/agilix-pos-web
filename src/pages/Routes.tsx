import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@presentation/utils/app-layout';
import { ProtectedRoute } from '@presentation/utils/protected-route';

// Screens
import { LoginScreen } from '@presentation/screens/login/login-screen';
import { PosScreen } from '@presentation/screens/pos/pos-screen';
import { TransactionsScreen } from '@presentation/screens/transactions/transactions-screen';
import { ProductsScreen } from '@presentation/screens/products/products-screen';
import { ProductCreateWizardScreen } from '@presentation/screens/products/product-create-wizard-screen';
import { CategoriesScreen } from '@presentation/screens/products/categories-screen';
import { StockScreen } from '@presentation/screens/inventory/stock-screen';
import { RawMaterialsScreen } from '@presentation/screens/inventory/raw-materials-screen';
import { PackagingScreen } from '@presentation/screens/inventory/packaging-screen';
import { SuppliersScreen } from '@presentation/screens/inventory/suppliers-screen';
import { PurchasesScreen } from '@presentation/screens/inventory/purchases-screen';
import { OpnameScreen } from '@presentation/screens/inventory/opname-screen';
import { AdjustmentsScreen } from '@presentation/screens/inventory/adjustments-screen';
import { SalesReportScreen } from '@presentation/screens/reports/sales-report-screen';
import { ProfitReportScreen } from '@presentation/screens/reports/profit-report-screen';
import { InventoryReportScreen } from '@presentation/screens/reports/inventory-report-screen';
import { OutletsScreen } from '@presentation/screens/settings/outlets-screen';
import { TablesScreen } from '@presentation/screens/settings/tables-screen';
import { OrderTypesScreen } from '@presentation/screens/settings/order-types-screen';
import { TaxesScreen } from '@presentation/screens/settings/taxes-screen';
import { DiscountsScreen } from '@presentation/screens/settings/discounts-screen';
import { PrintersScreen } from '@presentation/screens/settings/printers-screen';
import { RolesScreen } from '@presentation/screens/settings/roles-screen';
import { UsersScreen } from '@presentation/screens/settings/users-screen';
import { AuditLogsScreen } from '@presentation/screens/settings/audit-logs-screen';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginScreen />} />

      {/* Protected Routes inside AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Index redirects to POS */}
        <Route index element={<Navigate to="/pos" replace />} />

        {/* 1. TRANSAKSI */}
        <Route
          path="pos"
          element={
            <ProtectedRoute requiredPermission="order:create">
              <PosScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <ProtectedRoute requiredPermission="order:read">
              <TransactionsScreen />
            </ProtectedRoute>
          }
        />

        {/* 2. PRODUK */}
        <Route
          path="products"
          element={
            <ProtectedRoute requiredPermission="product:read">
              <ProductsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/create"
          element={
            <ProtectedRoute requiredPermission="product:create">
              <ProductCreateWizardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/categories"
          element={
            <ProtectedRoute requiredPermission="category:read">
              <CategoriesScreen />
            </ProtectedRoute>
          }
        />

        {/* 3. INVENTORI */}
        <Route
          path="inventory/stock"
          element={
            <ProtectedRoute requiredPermission="stock:read">
              <StockScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/raw-materials"
          element={
            <ProtectedRoute requiredPermission="material:read">
              <RawMaterialsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/packaging"
          element={
            <ProtectedRoute requiredPermission="packaging:read">
              <PackagingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/suppliers"
          element={
            <ProtectedRoute requiredPermission="supplier:read">
              <SuppliersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/purchases"
          element={
            <ProtectedRoute requiredPermission="purchase:read">
              <PurchasesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/opname"
          element={
            <ProtectedRoute requiredPermission="opname:read">
              <OpnameScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/adjustments"
          element={
            <ProtectedRoute requiredPermission="adjustment:read">
              <AdjustmentsScreen />
            </ProtectedRoute>
          }
        />

        {/* 4. LAPORAN */}
        <Route
          path="reports/sales"
          element={
            <ProtectedRoute requiredPermission="report:sales">
              <SalesReportScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/profit"
          element={
            <ProtectedRoute requiredPermission="report:profit">
              <ProfitReportScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/inventory"
          element={
            <ProtectedRoute requiredPermission="report:inventory">
              <InventoryReportScreen />
            </ProtectedRoute>
          }
        />

        {/* 5. PENGATURAN */}
        <Route
          path="settings/outlets"
          element={
            <ProtectedRoute requiredPermission="outlet:read">
              <OutletsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/tables"
          element={
            <ProtectedRoute requiredPermission="table:read">
              <TablesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/order-types"
          element={
            <ProtectedRoute requiredPermission="order_type:read">
              <OrderTypesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/taxes"
          element={
            <ProtectedRoute requiredPermission="tax:read">
              <TaxesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/discounts"
          element={
            <ProtectedRoute requiredPermission="discount:read">
              <DiscountsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/printers"
          element={
            <ProtectedRoute requiredPermission="printer:read">
              <PrintersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/roles"
          element={
            <ProtectedRoute requiredPermission="role:read">
              <RolesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/users"
          element={
            <ProtectedRoute requiredPermission="user:read">
              <UsersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/audit-logs"
          element={
            <ProtectedRoute requiredPermission="audit_log.read">
              <AuditLogsScreen />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
};
