const salesReport = {
  totalRevenue: 845600,
  totalOrders: 1256,
  avgOrderValue: 673,
  topProducts: [
    { name: "Kentucky Fried Chicken", units: 342, revenue: "KSh 153,900" },
    { name: "Beef Burger", units: 289, revenue: "KSh 101,150" },
    { name: "Coca Cola 500ml", units: 512, revenue: "KSh 30,720" },
    { name: "Chicken Burger", units: 198, revenue: "KSh 75,240" },
    { name: "French Fries Large", units: 267, revenue: "KSh 66,750" },
  ],
  monthlyData: [
    { month: "Jan", revenue: 620000, orders: 980 },
    { month: "Feb", revenue: 710000, orders: 1050 },
    { month: "Mar", revenue: 685000, orders: 1020 },
    { month: "Apr", revenue: 758000, orders: 1120 },
    { month: "May", revenue: 802000, orders: 1180 },
    { month: "Jun", revenue: 845600, orders: 1256 },
  ],
};

const inventoryReport = {
  totalItems: 12,
  totalValue: 62350,
  lowStock: 3,
  categories: [
    { name: "Beverages", items: 4, value: "KSh 18,800", stock: 495 },
    { name: "Fast Food", items: 5, value: "KSh 10,560", stock: 111 },
    { name: "Snacks", items: 3, value: "KSh 2,850", stock: 70 },
  ],
};

const profitLoss = {
  revenue: 845600,
  cogs: 462800,
  grossProfit: 382800,
  expenses: 202400,
  netProfit: 180400,
  margin: 21.3,
};

const taxSummary = {
  totalCollected: 135296,
  vatRate: 16,
  filings: [
    { period: "Jan 2026", amount: "KSh 99,200", status: "Filed", due: "2026-02-20", filed: "2026-02-15" },
    { period: "Feb 2026", amount: "KSh 113,600", status: "Filed", due: "2026-03-20", filed: "2026-03-18" },
    { period: "Mar 2026", amount: "KSh 109,600", status: "Filed", due: "2026-04-20", filed: "2026-04-19" },
    { period: "Apr 2026", amount: "KSh 121,280", status: "Filed", due: "2026-05-20", filed: "2026-05-16" },
    { period: "May 2026", amount: "KSh 128,320", status: "Pending", due: "2026-06-20", filed: "—" },
  ],
};

/* ─── SALES REPORT ─── */
export function SalesReportPage() {
  const maxRev = Math.max(...salesReport.monthlyData.map((m) => m.revenue));

  return (
    <>
      <div className="greeting"><div><h1>Sales Report</h1><p className="greeting-sub">Revenue & sales analytics</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Revenue</div><div className="value">KSh {salesReport.totalRevenue.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Total Orders</div><div className="value">{salesReport.totalOrders.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Avg Order Value</div><div className="value">KSh {salesReport.avgOrderValue.toLocaleString()}</div></div>
      </div>
      <div className="section-card">
        <div className="section-card-title">Monthly Revenue (H1 2026)</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 200 }}>
          {salesReport.monthlyData.map((m) => (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ height: `${(m.revenue / maxRev) * 100}%`, width: "100%", background: "linear-gradient(to top, #3b82f6, #60a5fa)", borderRadius: "4px 4px 0 0", minHeight: 8 }} />
              <span style={{ fontSize: 10, color: "#64748b" }}>{m.month}</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>KSh {(m.revenue / 1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
      </div>
      <div className="section-card">
        <div className="section-card-title">Top Selling Products</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #334155" }}>Product</th><th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #334155" }}>Units Sold</th><th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #334155" }}>Revenue</th></tr></thead>
          <tbody>{salesReport.topProducts.map((p) => (<tr key={p.name}><td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.name}</td><td style={{ padding: "10px 14px" }}>{p.units}</td><td style={{ padding: "10px 14px" }} className="cell-highlight">{p.revenue}</td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── INVENTORY REPORT ─── */
export function InventoryReportPage() {
  return (
    <>
      <div className="greeting"><div><h1>Inventory Report</h1><p className="greeting-sub">Stock & valuation reports</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Items</div><div className="value">{inventoryReport.totalItems}</div></div>
        <div className="summary-card"><div className="label">Inventory Value</div><div className="value">KSh {inventoryReport.totalValue.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label" style={{ color: "#f59e0b" }}>Low Stock Items</div><div className="value" style={{ color: "#f59e0b" }}>{inventoryReport.lowStock}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Category</th><th>Items</th><th>Value</th><th>Stock (units)</th></tr></thead>
          <tbody>{inventoryReport.categories.map((c) => (<tr key={c.name}><td style={{ fontWeight: 600 }}>{c.name}</td><td>{c.items}</td><td className="cell-highlight">{c.value}</td><td>{c.stock}</td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── PROFIT & LOSS ─── */
export function ProfitLossPage() {
  return (
    <>
      <div className="greeting"><div><h1>Profit & Loss</h1><p className="greeting-sub">Income statement</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label" style={{ color: "#22c55e" }}>Revenue</div><div className="value" style={{ color: "#22c55e" }}>KSh {profitLoss.revenue.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label" style={{ color: "#ef4444" }}>COGS</div><div className="value" style={{ color: "#ef4444" }}>KSh {profitLoss.cogs.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Gross Profit</div><div className="value">KSh {profitLoss.grossProfit.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Expenses</div><div className="value" style={{ color: "#ef4444" }}>KSh {profitLoss.expenses.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label" style={{ color: "#22c55e" }}>Net Profit</div><div className="value" style={{ color: "#22c55e" }}>KSh {profitLoss.netProfit.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Profit Margin</div><div className="value">{profitLoss.margin}%</div></div>
      </div>
      <div className="section-card">
        <div className="section-card-title">Income Statement</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #334155" }}>
            <span style={{ color: "#94a3b8" }}>Total Revenue</span>
            <span style={{ fontWeight: 600, color: "#22c55e" }}>KSh {profitLoss.revenue.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #334155" }}>
            <span style={{ color: "#94a3b8" }}>Cost of Goods Sold</span>
            <span style={{ fontWeight: 600, color: "#ef4444" }}>— KSh {profitLoss.cogs.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #334155", fontWeight: 600 }}>
            <span>Gross Profit</span>
            <span>KSh {profitLoss.grossProfit.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #334155" }}>
            <span style={{ color: "#94a3b8" }}>Operating Expenses</span>
            <span style={{ fontWeight: 600, color: "#ef4444" }}>— KSh {profitLoss.expenses.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: "#22c55e" }}>Net Profit</span>
            <span style={{ color: "#22c55e" }}>KSh {profitLoss.netProfit.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ color: "#94a3b8" }}>Profit Margin</span>
            <span style={{ fontWeight: 600 }}>{profitLoss.margin}%</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── TAX SUMMARY ─── */
export function TaxPage() {
  return (
    <>
      <div className="greeting"><div><h1>Tax Summary</h1><p className="greeting-sub">Tax liability overview</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">VAT Rate</div><div className="value">{taxSummary.vatRate}%</div></div>
        <div className="summary-card"><div className="label">Total Tax Collected</div><div className="value">{taxSummary.totalCollected.toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Period</th><th>Amount</th><th>Due Date</th><th>Filed Date</th><th>Status</th></tr></thead>
          <tbody>{taxSummary.filings.map((f) => (<tr key={f.period}>
            <td style={{ fontWeight: 600 }}>{f.period}</td>
            <td className="cell-highlight">{f.amount}</td>
            <td className="cell-mono">{f.due}</td>
            <td className="cell-mono">{f.filed}</td>
            <td><span className={`badge ${f.status.toLowerCase()}`}>{f.status}</span></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
