import { Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import { PosPage, OrdersPage, QuotationsPage, ReturnsPage, ReceiptsPage } from "./pages/SalesPages";
import { TransactionsPage, PendingPaymentsPage, RefundsPage, ChargebacksPage, PaymentMethodsPage } from "./pages/PaymentsPages";
import { ProductsPage, StockLevelsPage, CategoriesPage, BarcodesPage, AdjustmentsPage, InventoryTransfersPage } from "./pages/InventoryPages";
import { AllCustomersPage, SegmentsPage, FeedbackPage, CommunicationsPage } from "./pages/CustomersPages";
import SuppliersPage from "./pages/Suppliers";
import { ExpensesPage, DebtorsPage, CreditorsPage, CashFlowPage, BudgetPage } from "./pages/FinancePages";
import { DeliveriesPage, ShippingPage, TrackingPage } from "./pages/LogisticsPages";
import { SalesReportPage, InventoryReportPage, ProfitLossPage, TaxPage } from "./pages/ReportsPages";
import { AllShopsPage, ShopTransfersPage, BranchPerformancePage } from "./pages/ShopsPages";
import { UsersPage, SettingsPage, AuditLogPage } from "./pages/SystemPages";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#f8fafc", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 48, marginBottom: 16 }}>⚠️</h1>
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24 }}>An unexpected error occurred. Please try refreshing the page.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />

        {/* Sales */}
        <Route path="sales/pos" element={<PosPage />} />
        <Route path="sales/orders" element={<OrdersPage />} />
        <Route path="sales/quotations" element={<QuotationsPage />} />
        <Route path="sales/returns" element={<ReturnsPage />} />
        <Route path="sales/receipts" element={<ReceiptsPage />} />

        {/* Payments */}
        <Route path="payments/transactions" element={<TransactionsPage />} />
        <Route path="payments/pending" element={<PendingPaymentsPage />} />
        <Route path="payments/refunds" element={<RefundsPage />} />
        <Route path="payments/chargebacks" element={<ChargebacksPage />} />
        <Route path="payments/methods" element={<PaymentMethodsPage />} />

        {/* Inventory */}
        <Route path="inventory/products" element={<ProductsPage />} />
        <Route path="inventory/stock-levels" element={<StockLevelsPage />} />
        <Route path="inventory/categories" element={<CategoriesPage />} />
        <Route path="inventory/barcodes" element={<BarcodesPage />} />
        <Route path="inventory/adjustments" element={<AdjustmentsPage />} />
        <Route path="inventory/transfers" element={<InventoryTransfersPage />} />

        {/* Customers */}
        <Route path="customers" element={<AllCustomersPage />} />
        <Route path="customers/segments" element={<SegmentsPage />} />
        <Route path="customers/feedback" element={<FeedbackPage />} />
        <Route path="customers/communications" element={<CommunicationsPage />} />

        {/* Suppliers */}
        <Route path="suppliers" element={<SuppliersPage />} />

        {/* Finance */}
        <Route path="finance/expenses" element={<ExpensesPage />} />
        <Route path="finance/debtors" element={<DebtorsPage />} />
        <Route path="finance/creditors" element={<CreditorsPage />} />
        <Route path="finance/cash-flow" element={<CashFlowPage />} />
        <Route path="finance/budget" element={<BudgetPage />} />

        {/* Logistics */}
        <Route path="logistics/deliveries" element={<DeliveriesPage />} />
        <Route path="logistics/shipping" element={<ShippingPage />} />
        <Route path="logistics/tracking" element={<TrackingPage />} />

        {/* Reports */}
        <Route path="reports/sales" element={<SalesReportPage />} />
        <Route path="reports/inventory" element={<InventoryReportPage />} />
        <Route path="reports/profit-loss" element={<ProfitLossPage />} />
        <Route path="reports/tax" element={<TaxPage />} />

        {/* Multi-Shop */}
        <Route path="shops" element={<AllShopsPage />} />
        <Route path="shops/transfers" element={<ShopTransfersPage />} />
        <Route path="shops/performance" element={<BranchPerformancePage />} />

        {/* System */}
        <Route path="system/users" element={<UsersPage />} />
        <Route path="system/settings" element={<SettingsPage />} />
        <Route path="system/audit" element={<AuditLogPage />} />

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}
