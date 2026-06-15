import { useState } from "react";

const shopsData = [
  { id: 1, name: "Main Shop", location: "Nairobi, CBD", manager: "Elijah", sales: "KSh 545,600", orders: 756, stock: 1240, status: "Active", since: "2024-01-01" },
  { id: 2, name: "Branch A", location: "Mombasa, Nyali", manager: "Jane Wanjiku", sales: "KSh 324,800", orders: 423, stock: 680, status: "Active", since: "2024-06-15" },
  { id: 3, name: "Branch B", location: "Kisumu, Town", manager: "Paul Ochieng", sales: "KSh 198,200", orders: 267, stock: 450, status: "Active", since: "2025-01-20" },
  { id: 4, name: "Branch C (Coming Soon)", location: "Nakuru", manager: "—", sales: "KSh 0", orders: 0, stock: 0, status: "Inactive", since: "—" },
];

const shopTransfersData = [
  { id: "ST-001", from: "Main Shop", to: "Branch A", items: 3, value: "KSh 18,600", status: "Completed", date: "2026-06-15" },
  { id: "ST-002", from: "Main Shop", to: "Branch B", items: 2, value: "KSh 12,400", status: "In Transit", date: "2026-06-14" },
  { id: "ST-003", from: "Branch A", to: "Main Shop", items: 1, value: "KSh 5,200", status: "Pending", date: "2026-06-13" },
  { id: "ST-004", from: "Main Shop", to: "Branch A", items: 5, value: "KSh 24,800", status: "Completed", date: "2026-06-10" },
];

export function AllShopsPage() {
  return (
    <>
      <div className="greeting"><div><h1>All Shops</h1><p className="greeting-sub">Multi-branch management</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Active Branches</div><div className="value">{shopsData.filter((s) => s.status === "Active").length}</div></div>
        <div className="summary-card"><div className="label">Total Sales (All)</div><div className="value">KSh {shopsData.reduce((s, shop) => s + parseInt(shop.sales.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Shop</th><th>Location</th><th>Manager</th><th>Sales</th><th>Orders</th><th>Stock</th><th>Status</th><th>Since</th><th></th></tr></thead>
          <tbody>{shopsData.map((s) => (<tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{s.location}</td>
            <td>{s.manager}</td>
            <td className="cell-highlight">{s.sales}</td>
            <td>{s.orders}</td>
            <td>{s.stock}</td>
            <td><span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span></td>
            <td className="cell-mono">{s.since}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button><button className="btn-icon" title="Switch">🔀</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function ShopTransfersPage() {
  return (
    <>
      <div className="greeting"><div><h1>Branch Transfers</h1><p className="greeting-sub">Stock transfers between branches</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ New Transfer</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>From</th><th>To</th><th>Items</th><th>Value</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>{shopTransfersData.map((t) => (<tr key={t.id}>
            <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{t.id}</td>
            <td>{t.from}</td>
            <td>{t.to}</td>
            <td>{t.items}</td>
            <td className="cell-highlight">{t.value}</td>
            <td><span className={`badge ${t.status === "Completed" ? "completed" : t.status === "In Transit" ? "processing" : "pending"}`}>{t.status}</span></td>
            <td className="cell-mono">{t.date}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function BranchPerformancePage() {
  const maxSales = Math.max(...shopsData.filter((s) => s.status === "Active").map((s) => parseInt(s.sales.replace(/[^0-9]/g, ""))));

  return (
    <>
      <div className="greeting"><div><h1>Branch Performance</h1><p className="greeting-sub">Per-branch analytics</p></div></div>
      <div className="section-card">
        <div className="section-card-title">Sales Comparison</div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 200 }}>
          {shopsData.filter((s) => s.status === "Active").map((s) => {
            const sales = parseInt(s.sales.replace(/[^0-9]/g, ""));
            const h = (sales / maxSales) * 100;
            return (<div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: "60%", height: `${h}%`, background: "linear-gradient(to top, #3b82f6, #60a5fa)", borderRadius: "6px 6px 0 0", minHeight: 8 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{s.name.split(" ")[0]}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.sales}</span>
            </div>);
          })}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Branch</th><th>Sales</th><th>Orders</th><th>Avg Order</th><th>Stock</th></tr></thead>
          <tbody>{shopsData.filter((s) => s.status === "Active").map((s) => {
            const sales = parseInt(s.sales.replace(/[^0-9]/g, ""));
            const avg = s.orders > 0 ? Math.round(sales / s.orders) : 0;
            return (<tr key={s.id}><td style={{ fontWeight: 600 }}>{s.name}</td><td className="cell-highlight">{s.sales}</td><td>{s.orders}</td><td>KSh {avg.toLocaleString()}</td><td>{s.stock}</td></tr>);
          })}</tbody>
        </table>
      </div>
    </>
  );
}
