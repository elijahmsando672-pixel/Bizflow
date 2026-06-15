import { useState } from "react";
import "./Dashboard.css";

const menu = [
  {
    title: "Dashboard",
    icon: "📊",
    active: true,
  },
  {
    title: "Sales",
    icon: "🛒",
    children: ["New Sale (POS)", "Orders", "Quotations", "Returns", "Receipts"],
  },
  {
    title: "Payments",
    icon: "💳",
    children: ["Transactions", "Pending Payments", "Refunds", "Chargebacks", "Payment Methods"],
  },
  {
    title: "Inventory",
    icon: "📦",
    children: ["Products", "Stock Levels", "Categories", "Barcodes", "Stock Adjustments", "Transfers"],
  },
  {
    title: "Customers",
    icon: "👥",
    children: ["All Customers", "Segments", "Feedback", "Communications"],
  },
  {
    title: "Suppliers",
    icon: "🏭",
  },
  {
    title: "Finance",
    icon: "💰",
    children: ["Expenses", "Debtors", "Creditors", "Cash Flow", "Budget"],
  },
  {
    title: "Logistics",
    icon: "🚚",
    children: ["Deliveries", "Shipping", "Tracking"],
  },
  {
    title: "Reports",
    icon: "📈",
    children: ["Sales Report", "Inventory Report", "Profit & Loss", "Tax Summary"],
  },
  {
    title: "Multi-Shop",
    icon: "🏪",
    children: ["All Shops", "Transfers", "Branch Performance"],
  },
  {
    title: "System",
    icon: "⚙️",
    children: ["Users & Roles", "Settings", "Audit Log"],
  },
];

const kpis = [
  { label: "Revenue Today", value: "KSh 45,600", trend: "+15%", up: true },
  { label: "Orders", value: "156", trend: "+8%", up: true },
  { label: "Customers", value: "1,245", trend: "+22%", up: true },
  { label: "Pending Payments", value: "KSh 12,500", trend: "-5%", up: false },
];

const quickActions = [
  { label: "New Sale", icon: "🛒", color: "#3b82f6" },
  { label: "Add Item", icon: "📦", color: "#22c55e" },
  { label: "Customer", icon: "👥", color: "#a855f7" },
  { label: "Supplier", icon: "🏭", color: "#f59e0b" },
  { label: "Report", icon: "📈", color: "#ef4444" },
];

const recentOrders = [
  { id: "#1023", customer: "John Doe", amount: "KSh 4,500", status: "Paid", time: "2 min ago" },
  { id: "#1022", customer: "Mary Wanjiku", amount: "KSh 2,100", status: "Pending", time: "15 min ago" },
  { id: "#1021", customer: "David Kimani", amount: "KSh 7,800", status: "Paid", time: "1 hr ago" },
  { id: "#1020", customer: "Sarah Njoki", amount: "KSh 3,200", status: "Refund", time: "2 hr ago" },
  { id: "#1019", customer: "Peter Kamau", amount: "KSh 9,600", status: "Paid", time: "3 hr ago" },
];

const activities = [
  { text: "John created Order #1023", time: "2 mins ago", icon: "🛒" },
  { text: "Mary updated Inventory", time: "8 mins ago", icon: "📦" },
  { text: "Supplier Payment Completed", time: "20 mins ago", icon: "💳" },
  { text: "Branch Transfer Approved", time: "1 hr ago", icon: "🏪" },
  { text: "New Customer Registered", time: "2 hrs ago", icon: "👥" },
];

const chartData = [60, 90, 70, 100, 80, 65, 95, 75, 85, 70, 90, 80];

export default function Dashboard() {
  const [expanded, setExpanded] = useState({});

  const toggle = (title) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="dashboard">
      {/* ─── TOP NAVBAR ─── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">BizFlow</div>
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search orders, customers, products..." />
            <span className="search-hint">⌘K</span>
          </div>
        </div>
        <div className="topbar-right">
          <button className="topbar-icon-btn" aria-label="Notifications">🔔</button>
          <div className="topbar-user">
            <div className="topbar-avatar">E</div>
            <span className="topbar-name">Elijah</span>
          </div>
        </div>
      </header>

      <div className="body">
        {/* ─── SIDEBAR ─── */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {menu.map((item) => (
              <div key={item.title} className="sidebar-group">
                <button
                  className={`sidebar-item ${item.active ? "active" : ""}`}
                  onClick={() => item.children && toggle(item.title)}
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
                      <button key={child} className="sidebar-child">{child}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="main">
          {/* Greeting */}
          <div className="greeting">
            <div>
              <h1>Good Morning, Elijah 👋</h1>
              <p className="greeting-sub">Managing Main Shop</p>
            </div>
          </div>

          {/* KPI Cards */}
          <section className="kpi-section">
            {kpis.map((k) => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-label">{k.label}</span>
                  <span className={`kpi-trend ${k.up ? "up" : "down"}`}>{k.trend}</span>
                </div>
                <div className="kpi-value">{k.value}</div>
              </div>
            ))}
          </section>

          {/* Quick Actions */}
          <section className="qa-section">
            <div className="qa-header">
              <span className="qa-bolt">⚡</span> Quick Actions
            </div>
            <div className="qa-grid">
              {quickActions.map((a) => (
                <button key={a.label} className="qa-btn" style={{ "--accent": a.color }}>
                  <span className="qa-icon">{a.icon}</span>
                  <span className="qa-label">{a.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Chart + Activity */}
          <div className="columns">
            <section className="chart-section">
              <h2 className="section-title">Revenue Trend</h2>
              <div className="chart-bars">
                {chartData.map((h, i) => (
                  <div key={i} className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="chart-labels">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <span key={m} className="chart-label">{m}</span>
                ))}
              </div>
            </section>

            <section className="activity-section">
              <h2 className="section-title">📋 Activity Feed</h2>
              <div className="activity-list">
                {activities.map((a, i) => (
                  <div key={i} className="activity-item">
                    <span className="activity-icon">{a.icon}</span>
                    <div className="activity-body">
                      <p className="activity-text">{a.text}</p>
                      <span className="activity-time">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Recent Orders */}
          <section className="table-section">
            <div className="table-header">
              <h2 className="section-title">Recent Orders</h2>
              <button className="view-all">View All →</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-id">{o.id}</td>
                    <td>{o.customer}</td>
                    <td className="cell-amount">{o.amount}</td>
                    <td>
                      <span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span>
                    </td>
                    <td className="cell-time">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}
