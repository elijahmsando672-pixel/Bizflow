import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../pages/Dashboard.css";
import logo from "../assets/logo.png";

const menu = [
  { title: "Dashboard", icon: "📊", path: "/app" },
  {
    title: "Sales", icon: "🛒",
    children: [
      { label: "New Sale (POS)", path: "/app/sales/pos" },
      { label: "Orders", path: "/app/sales/orders" },
      { label: "Quotations", path: "/app/sales/quotations" },
      { label: "Returns", path: "/app/sales/returns" },
      { label: "Receipts", path: "/app/sales/receipts" },
    ],
  },
  {
    title: "Payments", icon: "💳",
    children: [
      { label: "Transactions", path: "/app/payments/transactions" },
      { label: "Pending Payments", path: "/app/payments/pending" },
      { label: "Refunds", path: "/app/payments/refunds" },
      { label: "Chargebacks", path: "/app/payments/chargebacks" },
      { label: "Payment Methods", path: "/app/payments/methods" },
    ],
  },
  {
    title: "Inventory", icon: "📦",
    children: [
      { label: "Products", path: "/app/inventory/products" },
      { label: "Stock Levels", path: "/app/inventory/stock-levels" },
      { label: "Categories", path: "/app/inventory/categories" },
      { label: "Barcodes", path: "/app/inventory/barcodes" },
      { label: "Stock Adjustments", path: "/app/inventory/adjustments" },
      { label: "Transfers", path: "/app/inventory/transfers" },
    ],
  },
  {
    title: "Customers", icon: "👥",
    children: [
      { label: "All Customers", path: "/app/customers" },
      { label: "Segments", path: "/app/customers/segments" },
      { label: "Feedback", path: "/app/customers/feedback" },
      { label: "Communications", path: "/app/customers/communications" },
    ],
  },
  { title: "Suppliers", icon: "🏭", path: "/app/suppliers" },
  {
    title: "Finance", icon: "💰",
    children: [
      { label: "Expenses", path: "/app/finance/expenses" },
      { label: "Debtors", path: "/app/finance/debtors" },
      { label: "Creditors", path: "/app/finance/creditors" },
      { label: "Cash Flow", path: "/app/finance/cash-flow" },
      { label: "Budget", path: "/app/finance/budget" },
    ],
  },
  {
    title: "Logistics", icon: "🚚",
    children: [
      { label: "Deliveries", path: "/app/logistics/deliveries" },
      { label: "Shipping", path: "/app/logistics/shipping" },
      { label: "Tracking", path: "/app/logistics/tracking" },
    ],
  },
  {
    title: "Reports", icon: "📈",
    children: [
      { label: "Sales Report", path: "/app/reports/sales" },
      { label: "Inventory Report", path: "/app/reports/inventory" },
      { label: "Profit & Loss", path: "/app/reports/profit-loss" },
      { label: "Tax Summary", path: "/app/reports/tax" },
    ],
  },
  {
    title: "Multi-Shop", icon: "🏪",
    children: [
      { label: "All Shops", path: "/app/shops" },
      { label: "Transfers", path: "/app/shops/transfers" },
      { label: "Branch Performance", path: "/app/shops/performance" },
    ],
  },
  {
    title: "System", icon: "⚙️",
    children: [
      { label: "Users & Roles", path: "/app/system/users" },
      { label: "Settings", path: "/app/system/settings" },
      { label: "Audit Log", path: "/app/system/audit" },
    ],
  },
];

function isActive(item, currentPath) {
  if (item.path) {
    if (item.path === "/app") return currentPath === "/app";
    return currentPath.startsWith(item.path);
  }
  if (item.children) {
    return item.children.some((c) => currentPath.startsWith(c.path));
  }
  return false;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const [expanded, setExpanded] = useState(() => {
    const init = {};
    for (const item of menu) {
      if (item.children && item.children.some((c) => location.pathname.startsWith(c.path))) {
        init[item.title] = true;
      }
    }
    return init;
  });

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const item of menu) {
        if (item.children && item.children.some((c) => location.pathname.startsWith(c.path))) {
          next[item.title] = true;
        }
      }
      return next;
    });
  }, [location.pathname]);

  const toggle = (title) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleNav = (path) => {
    setSearchQuery("");
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/sales/orders`);
    }
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo" onClick={() => navigate("/app")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="BizFlow" style={{ height: 36, width: 36 }} />
            <span style={{ fontWeight: 800, fontSize: 22, color: "#f1f5f9" }}>BizFlow</span>
          </div>
          <form className="topbar-search" onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search orders, customers, products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="search-hint">⌘K</span>
          </form>
        </div>
        <div className="topbar-right">
          <button className="topbar-icon-btn" aria-label="Notifications">🔔</button>
          <div className="topbar-user">
            <div className="topbar-avatar">E</div>
            <span className="topbar-name">Elijah</span>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={handleLogout} style={{ color: "#f87171", border: "1px solid #334155", borderRadius: 8 }}>Logout</button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {menu.map((item) => (
              <div key={item.title} className="sidebar-group">
                <button
                  className={`sidebar-item ${isActive(item, location.pathname) ? "active" : ""}`}
                  onClick={() => {
                    if (item.path) {
                      handleNav(item.path);
                    } else {
                      toggle(item.title);
                    }
                  }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.title}</span>
                  {item.children && (
                    <span className={`sidebar-chevron ${expanded[item.title] ? "open" : ""}`}>▸</span>
                  )}
                </button>
                {item.children && expanded[item.title] && (
                  <div className="sidebar-children">
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        className={`sidebar-child ${location.pathname === child.path ? "active" : ""}`}
                        onClick={() => handleNav(child.path)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
