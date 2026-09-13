# Agilix POS Web (ERP & Point of Sale Frontend)

Modern, touch-first Point of Sale (POS) and Store Management ERP Frontend application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Zustand**.

---

## 🏗️ Architecture & Pattern (Clean Architecture)

Struktur codebase mengikuti standar **Clean Architecture** (berdasarkan referensi `eplant-monorepo/e-plantation-web/app12`):

```text
src/
├── model/                            # Layer 1: Data Models, Types, Interfaces & DTOs
│   ├── Auth.d.ts                     # User profile, outlet, tenant & token types
│   ├── Order.d.ts                    # Order, CartItem, PaymentPayload types
│   ├── Product.d.ts                  # Product, Category, Variant, RecipeItem types
│   ├── Inventory.d.ts                # RawMaterial, Packaging, Supplier, StockMovement
│   ├── Settings.d.ts                 # Tax, Discount, Printer, Role, User, AuditLog
│   └── ResponseType.d.ts             # Standard API Response envelope
│
├── domain/                           # Layer 2: Business Logic, Services & State
│   ├── services/                     # HTTP Axios Clients with dual-token & refresh
│   │   ├── auth-service.ts
│   │   ├── pos-service.ts
│   │   ├── product-service.ts
│   │   ├── inventory-service.ts
│   │   └── settings-service.ts
│   ├── state/                        # Global Persistent State (Zustand)
│   │   ├── auth-store.ts             # Session, permissions, active outlet, tenant lock
│   │   └── cart-store.ts             # Touchscreen POS cart, item modifiers, tables
│   └── utils/                        # RBAC access hooks & formatting helpers
│       └── hooks/use-access.ts       # Super Admin bypass & per-permission validator
│
├── presentation/                     # Layer 3: UI Presentation Layer
│   ├── screens/                      # Main Feature Screens (23 sub-menus)
│   │   ├── pos/                      # POS Cashier grid, touch Numpad, receipt modal
│   │   ├── transactions/             # Transaction history & active orders
│   │   ├── products/                 # Product list & Dedicated 6-Step Creation Wizard
│   │   ├── inventory/                # Stock, Raw Materials, Packaging, Suppliers, PO, Opname, Adjustments
│   │   ├── reports/                  # Sales, Profit, Inventory reports
│   │   ├── settings/                 # Outlets, Tables, Order Types, Taxes, Discounts, Printers, Roles, Users, Audit Logs
│   │   └── login/                    # Cashier login & outlet selector
│   └── utils/                        # Dynamic Layouts & Shells
│       ├── with-sidebar.tsx          # Dynamic 5-group RBAC Sidebar
│       ├── with-header.tsx           # Topbar with outlet switcher & shift status
│       ├── protected-route.tsx       # Route guard with permission checking
│       └── tenant-lock-screen.tsx    # Full-screen block when tenant is LOCKED by Console
│
└── pages/                            # Layer 4: Routing Entry Points
    └── Routes.tsx                    # Centralized React Router configuration
```

---

## 🌟 Key Features

1. **Dedicated 6-Step Full-Page Product Creation Wizard (`/products/create`)**:
   - **Step 1: Info Produk**: Basic info, SKU, kategori, satuan penjualan.
   - **Step 2: Varian & Opsi**: Manajemen varian (Ukuran/Rasa) dengan penyesuaian harga jual & HPP otomatis.
   - **Step 3: Resep & BOM**: Pemilihan bahan baku dari master inventori dengan kalkulator biaya bahan per porsi.
   - **Step 4: Packaging & Bahan Penolong**: Biaya kemasan (cup, lid, sedotan, bag).
   - **Step 5: Kalkulator Harga & COGS**: Perhitungan Total HPP, target margin %, rekomendasi harga jual & estimasi profit bersih.
   - **Step 6: Review & Publikasi**: Ringkasan lengkap sebelum terbit ke katalog POS.

2. **Touch-First POS Cashier**:
   - Visual catalog filter by category.
   - Dynamic variant picker & item notes.
   - Touchscreen virtual Numpad for Cash payments with instant preset buttons (Uang Pas, 20k, 50k, 100k).
   - Dynamic QRIS payment with polling status.
   - 58mm / 80mm thermal receipt auto-formatting & ESC/POS printer jobs.

3. **Dynamic RBAC & Super Admin Bypass**:
   - 5 Menu Groups with 23 Sub-menus.
   - Super Admin & Owner automatically have access to all menus (`isSuperAdmin === true`, `SUPER_ADMIN`, `OWNER`, `*`).
   - DOM exclusion for unauthorized menus.

4. **Multi-Tenant & Security**:
   - URL base prefix: `http://localhost:5173/app-erp/`.
   - Dual-token JWT with silent auto-refresh on 401.
   - Automatic detection of `TENANT_LOCKED` (403) from Agilix Console events.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Deep Teal `#0D5C53` & Mint Highlight `#E6F4F1`)
- **State Management**: Zustand (with `persist` middleware)
- **Data Fetching**: Axios + TanStack React Query
- **Icons**: Lucide React
- **Routing**: React Router v7 (with `basename="/app-erp"`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:4500/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173/app-erp/` in your browser.

### 4. Build for Production
```bash
npm run build
```
The production bundle will be generated in the `dist/` directory.
