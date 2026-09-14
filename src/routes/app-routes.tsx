import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@presentation/layouts';
import { ProtectedRoute } from '@presentation/guards';
import { LoadingState } from '@presentation/components/ui';

// Lazy Loaded Screens for Optimized Code-Splitting
const LoginScreen = lazy(() =>
  import('@presentation/screens/login/login-screen').then((m) => ({ default: m.LoginScreen }))
);
const PosScreen = lazy(() =>
  import('@presentation/screens/pos/pos-screen').then((m) => ({ default: m.PosScreen }))
);
const TransactionsScreen = lazy(() =>
  import('@presentation/screens/transactions/transactions-screen').then((m) => ({
    default: m.TransactionsScreen,
  }))
);
const ProductsScreen = lazy(() =>
  import('@presentation/screens/products/products-screen').then((m) => ({
    default: m.ProductsScreen,
  }))
);
const ProductCreateWizardScreen = lazy(() =>
  import('@presentation/screens/products/product-create-wizard-screen').then((m) => ({
    default: m.ProductCreateWizardScreen,
  }))
);
const CategoriesScreen = lazy(() =>
  import('@presentation/screens/products/categories-screen').then((m) => ({
    default: m.CategoriesScreen,
  }))
);

// Inventory Screens
const StockScreen = lazy(() =>
  import('@presentation/screens/inventory/stock-screen').then((m) => ({ default: m.StockScreen }))
);
const StockDetailScreen = lazy(() =>
  import('@presentation/screens/inventory/stock-detail-screen').then((m) => ({
    default: m.StockDetailScreen,
  }))
);
const RawMaterialsScreen = lazy(() =>
  import('@presentation/screens/inventory/raw-materials-screen').then((m) => ({
    default: m.RawMaterialsScreen,
  }))
);
const RawMaterialCreateScreen = lazy(() =>
  import('@presentation/screens/inventory/raw-material-create-screen').then((m) => ({
    default: m.RawMaterialCreateScreen,
  }))
);
const RawMaterialDetailScreen = lazy(() =>
  import('@presentation/screens/inventory/raw-material-detail-screen').then((m) => ({
    default: m.RawMaterialDetailScreen,
  }))
);
const RawMaterialEditScreen = lazy(() =>
  import('@presentation/screens/inventory/raw-material-edit-screen').then((m) => ({
    default: m.RawMaterialEditScreen,
  }))
);
const PackagingScreen = lazy(() =>
  import('@presentation/screens/inventory/packaging-screen').then((m) => ({
    default: m.PackagingScreen,
  }))
);
const PackagingCreateScreen = lazy(() =>
  import('@presentation/screens/inventory/packaging-create-screen').then((m) => ({
    default: m.PackagingCreateScreen,
  }))
);
const PackagingDetailScreen = lazy(() =>
  import('@presentation/screens/inventory/packaging-detail-screen').then((m) => ({
    default: m.PackagingDetailScreen,
  }))
);
const PackagingEditScreen = lazy(() =>
  import('@presentation/screens/inventory/packaging-edit-screen').then((m) => ({
    default: m.PackagingEditScreen,
  }))
);
const SuppliersScreen = lazy(() =>
  import('@presentation/screens/inventory/suppliers-screen').then((m) => ({
    default: m.SuppliersScreen,
  }))
);
const SupplierCreateScreen = lazy(() =>
  import('@presentation/screens/inventory/supplier-create-screen').then((m) => ({
    default: m.SupplierCreateScreen,
  }))
);
const SupplierDetailScreen = lazy(() =>
  import('@presentation/screens/inventory/supplier-detail-screen').then((m) => ({
    default: m.SupplierDetailScreen,
  }))
);
const SupplierEditScreen = lazy(() =>
  import('@presentation/screens/inventory/supplier-edit-screen').then((m) => ({
    default: m.SupplierEditScreen,
  }))
);
const PurchasesScreen = lazy(() =>
  import('@presentation/screens/inventory/purchases-screen').then((m) => ({
    default: m.PurchasesScreen,
  }))
);
const PurchaseCreateScreen = lazy(() =>
  import('@presentation/screens/inventory/purchase-create-screen').then((m) => ({
    default: m.PurchaseCreateScreen,
  }))
);
const PurchaseDetailScreen = lazy(() =>
  import('@presentation/screens/inventory/purchase-detail-screen').then((m) => ({
    default: m.PurchaseDetailScreen,
  }))
);
const PurchaseEditScreen = lazy(() =>
  import('@presentation/screens/inventory/purchase-edit-screen').then((m) => ({
    default: m.PurchaseEditScreen,
  }))
);
const OpnameScreen = lazy(() =>
  import('@presentation/screens/inventory/opname-screen').then((m) => ({ default: m.OpnameScreen }))
);
const OpnameCreateScreen = lazy(() =>
  import('@presentation/screens/inventory/opname-create-screen').then((m) => ({
    default: m.OpnameCreateScreen,
  }))
);
const OpnameDetailScreen = lazy(() =>
  import('@presentation/screens/inventory/opname-detail-screen').then((m) => ({
    default: m.OpnameDetailScreen,
  }))
);
const OpnameCountScreen = lazy(() =>
  import('@presentation/screens/inventory/opname-count-screen').then((m) => ({
    default: m.OpnameCountScreen,
  }))
);
const OpnameReviewScreen = lazy(() =>
  import('@presentation/screens/inventory/opname-review-screen').then((m) => ({
    default: m.OpnameReviewScreen,
  }))
);
const AdjustmentsScreen = lazy(() =>
  import('@presentation/screens/inventory/adjustments-screen').then((m) => ({
    default: m.AdjustmentsScreen,
  }))
);

// Reports Screens
const SalesReportScreen = lazy(() =>
  import('@presentation/screens/reports/sales-report-screen').then((m) => ({
    default: m.SalesReportScreen,
  }))
);
const ProfitReportScreen = lazy(() =>
  import('@presentation/screens/reports/profit-report-screen').then((m) => ({
    default: m.ProfitReportScreen,
  }))
);
const InventoryReportScreen = lazy(() =>
  import('@presentation/screens/reports/inventory-report-screen').then((m) => ({
    default: m.InventoryReportScreen,
  }))
);

// Settings Screens
const OutletsScreen = lazy(() =>
  import('@presentation/screens/settings/outlets-screen').then((m) => ({
    default: m.OutletsScreen,
  }))
);
const TablesScreen = lazy(() =>
  import('@presentation/screens/settings/tables-screen').then((m) => ({ default: m.TablesScreen }))
);
const OrderTypesScreen = lazy(() =>
  import('@presentation/screens/settings/order-types-screen').then((m) => ({
    default: m.OrderTypesScreen,
  }))
);
const TaxesScreen = lazy(() =>
  import('@presentation/screens/settings/taxes-screen').then((m) => ({ default: m.TaxesScreen }))
);
const DiscountsScreen = lazy(() =>
  import('@presentation/screens/settings/discounts-screen').then((m) => ({
    default: m.DiscountsScreen,
  }))
);
const PrintersScreen = lazy(() =>
  import('@presentation/screens/settings/printers-screen').then((m) => ({
    default: m.PrintersScreen,
  }))
);
const RolesScreen = lazy(() =>
  import('@presentation/screens/settings/roles-screen').then((m) => ({ default: m.RolesScreen }))
);
const UsersScreen = lazy(() =>
  import('@presentation/screens/settings/users-screen').then((m) => ({ default: m.UsersScreen }))
);
const AuditLogsScreen = lazy(() =>
  import('@presentation/screens/settings/audit-logs-screen').then((m) => ({
    default: m.AuditLogsScreen,
  }))
);

const SuspenseLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState message="Memuat halaman..." />}>{children}</Suspense>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState message="Menyiapkan aplikasi..." />}>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginScreen />} />

        {/* Protected Layout Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Redirect to POS */}
          <Route index element={<Navigate to="/pos" replace />} />

          {/* 1. TRANSAKSI */}
          <Route
            path="pos"
            element={
              <ProtectedRoute requiredPermission="order:create">
                <SuspenseLoader>
                  <PosScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="transactions"
            element={
              <ProtectedRoute requiredPermission="order:read">
                <SuspenseLoader>
                  <TransactionsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />

          {/* 2. PRODUK */}
          <Route
            path="products"
            element={
              <ProtectedRoute requiredPermission="product:read">
                <SuspenseLoader>
                  <ProductsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="products/create"
            element={
              <ProtectedRoute requiredPermission="product:create">
                <SuspenseLoader>
                  <ProductCreateWizardScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="products/categories"
            element={
              <ProtectedRoute requiredPermission="category:read">
                <SuspenseLoader>
                  <CategoriesScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />

          {/* 3. INVENTORI */}
          <Route
            path="inventory/stock"
            element={
              <ProtectedRoute requiredPermission="stock:read">
                <SuspenseLoader>
                  <StockScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stock/:id"
            element={
              <ProtectedRoute requiredPermission="stock:read">
                <SuspenseLoader>
                  <StockDetailScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/raw-materials"
            element={
              <ProtectedRoute requiredPermission="material:read">
                <SuspenseLoader>
                  <RawMaterialsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/raw-materials/create"
            element={
              <ProtectedRoute requiredPermission="material:create">
                <SuspenseLoader>
                  <RawMaterialCreateScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/raw-materials/:id"
            element={
              <ProtectedRoute requiredPermission="material:read">
                <SuspenseLoader>
                  <RawMaterialDetailScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/raw-materials/:id/edit"
            element={
              <ProtectedRoute requiredPermission="material:update">
                <SuspenseLoader>
                  <RawMaterialEditScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/packaging"
            element={
              <ProtectedRoute requiredPermission="packaging:read">
                <SuspenseLoader>
                  <PackagingScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/packaging/create"
            element={
              <ProtectedRoute requiredPermission="packaging:create">
                <SuspenseLoader>
                  <PackagingCreateScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/packaging/:id"
            element={
              <ProtectedRoute requiredPermission="packaging:read">
                <SuspenseLoader>
                  <PackagingDetailScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/packaging/:id/edit"
            element={
              <ProtectedRoute requiredPermission="packaging:update">
                <SuspenseLoader>
                  <PackagingEditScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/suppliers"
            element={
              <ProtectedRoute requiredPermission="supplier:read">
                <SuspenseLoader>
                  <SuppliersScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/suppliers/create"
            element={
              <ProtectedRoute requiredPermission="supplier:create">
                <SuspenseLoader>
                  <SupplierCreateScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/suppliers/:id"
            element={
              <ProtectedRoute requiredPermission="supplier:read">
                <SuspenseLoader>
                  <SupplierDetailScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/suppliers/:id/edit"
            element={
              <ProtectedRoute requiredPermission="supplier:update">
                <SuspenseLoader>
                  <SupplierEditScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/purchases"
            element={
              <ProtectedRoute requiredPermission="purchase:read">
                <SuspenseLoader>
                  <PurchasesScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/purchases/create"
            element={
              <ProtectedRoute requiredPermission="purchase:create">
                <SuspenseLoader>
                  <PurchaseCreateScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/purchases/:id"
            element={
              <ProtectedRoute requiredPermission="purchase:read">
                <SuspenseLoader>
                  <PurchaseDetailScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/purchases/:id/edit"
            element={
              <ProtectedRoute requiredPermission="purchase:update">
                <SuspenseLoader>
                  <PurchaseEditScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/opname"
            element={
              <ProtectedRoute requiredPermission="opname:read">
                <SuspenseLoader>
                  <OpnameScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/opname/create"
            element={
              <ProtectedRoute requiredPermission="opname:create">
                <SuspenseLoader>
                  <OpnameCreateScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/opname/:id"
            element={
              <ProtectedRoute requiredPermission="opname:read">
                <SuspenseLoader>
                  <OpnameDetailScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/opname/:id/count"
            element={
              <ProtectedRoute requiredPermission="opname:update">
                <SuspenseLoader>
                  <OpnameCountScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/opname/:id/review"
            element={
              <ProtectedRoute requiredPermission="opname:update">
                <SuspenseLoader>
                  <OpnameReviewScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/adjustments"
            element={
              <ProtectedRoute requiredPermission="adjustment:read">
                <SuspenseLoader>
                  <AdjustmentsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />

          {/* 4. LAPORAN */}
          <Route
            path="reports/sales"
            element={
              <ProtectedRoute requiredPermission="report:sales">
                <SuspenseLoader>
                  <SalesReportScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/profit"
            element={
              <ProtectedRoute requiredPermission="report:profit">
                <SuspenseLoader>
                  <ProfitReportScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/inventory"
            element={
              <ProtectedRoute requiredPermission="report:inventory">
                <SuspenseLoader>
                  <InventoryReportScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />

          {/* 5. PENGATURAN */}
          <Route
            path="settings/outlets"
            element={
              <ProtectedRoute requiredPermission="outlet:read">
                <SuspenseLoader>
                  <OutletsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/tables"
            element={
              <ProtectedRoute requiredPermission="table:read">
                <SuspenseLoader>
                  <TablesScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/order-types"
            element={
              <ProtectedRoute requiredPermission="order_type:read">
                <SuspenseLoader>
                  <OrderTypesScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/taxes"
            element={
              <ProtectedRoute requiredPermission="tax:read">
                <SuspenseLoader>
                  <TaxesScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/discounts"
            element={
              <ProtectedRoute requiredPermission="discount:read">
                <SuspenseLoader>
                  <DiscountsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/printers"
            element={
              <ProtectedRoute requiredPermission="printer:read">
                <SuspenseLoader>
                  <PrintersScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/roles"
            element={
              <ProtectedRoute requiredPermission="role:read">
                <SuspenseLoader>
                  <RolesScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/users"
            element={
              <ProtectedRoute requiredPermission="user:read">
                <SuspenseLoader>
                  <UsersScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/audit-logs"
            element={
              <ProtectedRoute requiredPermission="audit_log.read">
                <SuspenseLoader>
                  <AuditLogsScreen />
                </SuspenseLoader>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </Suspense>
  );
};

