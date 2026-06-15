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

export default function DashboardHome() {
  return (
    <>
      <div className="greeting">
        <div>
          <h1>Good Morning, Elijah 👋</h1>
          <p className="greeting-sub">Managing Main Shop</p>
        </div>
      </div>

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

      <div className="columns">
        <section className="chart-section">
          <h2 className="section-title">Revenue Trend</h2>
          <div className="chart-bars">
            {chartData.map((h, i) => (
              <div key={i} className="chart-bar-wrap">
                <div className="chart-bar" style={{ height: `${h}%` }} />
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
    </>
  );
}
