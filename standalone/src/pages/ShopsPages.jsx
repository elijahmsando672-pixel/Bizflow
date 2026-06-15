import { useState } from "react";
import Modal from "../components/Modal";

const shopsData = [
  { id: 1, name: "Main Shop", location: "Nairobi, CBD", manager: "Elijah", sales: "KSh 545,600", orders: 756, stock: 1240, status: "Active", since: "2024-01-01" },
  { id: 2, name: "Branch A", location: "Mombasa, Nyali", manager: "Jane Wanjiku", sales: "KSh 324,800", orders: 423, stock: 680, status: "Active", since: "2024-06-15" },
  { id: 3, name: "Branch B", location: "Kisumu, Town", manager: "Paul Ochieng", sales: "KSh 198,200", orders: 267, stock: 450, status: "Active", since: "2025-01-20" },
  { id: 4, name: "Branch C (Coming Soon)", location: "Nakuru", manager: "—", sales: "KSh 0", orders: 0, stock: 0, status: "Inactive", since: "—" },
];

const initialTransfersData = [
  { id: "ST-001", from: "Main Shop", to: "Branch A", items: 3, value: "KSh 18,600", status: "Completed", date: "2026-06-15" },
  { id: "ST-002", from: "Main Shop", to: "Branch B", items: 2, value: "KSh 12,400", status: "In Transit", date: "2026-06-14" },
  { id: "ST-003", from: "Branch A", to: "Main Shop", items: 1, value: "KSh 5,200", status: "Pending", date: "2026-06-13" },
  { id: "ST-004", from: "Main Shop", to: "Branch A", items: 5, value: "KSh 24,800", status: "Completed", date: "2026-06-10" },
];

export function AllShopsPage() {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [switchNotif, setSwitchNotif] = useState(null);

  const handleView = (shop) => {
    setSelectedShop(shop);
    setShowViewModal(true);
  };

  const handleSwitch = (shop) => {
    setSwitchNotif(`Switching to ${shop.name}`);
    setTimeout(() => setSwitchNotif(null), 3000);
  };

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
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => handleView(s)}>👁</button><button className="btn-icon" title="Switch" onClick={() => handleSwitch(s)}>🔀</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showViewModal && selectedShop && (
        <Modal title={selectedShop.name} onClose={() => setShowViewModal(false)}>
          <div className="form-group">
            <label className="form-label">Location</label>
            <div>{selectedShop.location}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Manager</label>
            <div>{selectedShop.manager}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Sales</label>
            <div className="cell-highlight">{selectedShop.sales}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Orders</label>
            <div>{selectedShop.orders}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Stock</label>
            <div>{selectedShop.stock}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div><span className={`badge ${selectedShop.status.toLowerCase()}`}>{selectedShop.status}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Since</label>
            <div className="cell-mono">{selectedShop.since}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(false)}>Close</button>
          </div>
        </Modal>
      )}

      {switchNotif && (
        <div className="toast">{switchNotif}</div>
      )}
    </>
  );
}

export function ShopTransfersPage() {
  const [transfers, setTransfers] = useState(initialTransfersData);
  const activeShops = shopsData.filter((s) => s.status === "Active").map((s) => s.name);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [newTransfer, setNewTransfer] = useState({ from: "", to: "", items: "", value: "" });

  const handleNewTransfer = () => {
    const idNum = transfers.length + 1;
    const entry = {
      id: `ST-${String(idNum).padStart(3, "0")}`,
      from: newTransfer.from,
      to: newTransfer.to,
      items: parseInt(newTransfer.items) || 0,
      value: `KSh ${parseInt(newTransfer.value).toLocaleString() || 0}`,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
    };
    setTransfers([...transfers, entry]);
    setShowNewModal(false);
    setNewTransfer({ from: "", to: "", items: "", value: "" });
  };

  const handleView = (t) => {
    setSelectedTransfer(t);
    setShowViewModal(true);
  };

  return (
    <>
      <div className="greeting"><div><h1>Branch Transfers</h1><p className="greeting-sub">Stock transfers between branches</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary" onClick={() => setShowNewModal(true)}>+ New Transfer</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>From</th><th>To</th><th>Items</th><th>Value</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>{transfers.map((t) => (<tr key={t.id}>
            <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{t.id}</td>
            <td>{t.from}</td>
            <td>{t.to}</td>
            <td>{t.items}</td>
            <td className="cell-highlight">{t.value}</td>
            <td><span className={`badge ${t.status === "Completed" ? "completed" : t.status === "In Transit" ? "processing" : "pending"}`}>{t.status}</span></td>
            <td className="cell-mono">{t.date}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => handleView(t)}>👁</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showNewModal && (
        <Modal title="New Transfer" onClose={() => setShowNewModal(false)}>
          <div className="form-group">
            <label className="form-label">From Shop</label>
            <select className="form-select" value={newTransfer.from} onChange={(e) => setNewTransfer({ ...newTransfer, from: e.target.value })}>
              <option value="">Select shop</option>
              {activeShops.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To Shop</label>
            <select className="form-select" value={newTransfer.to} onChange={(e) => setNewTransfer({ ...newTransfer, to: e.target.value })}>
              <option value="">Select shop</option>
              {activeShops.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Items Count</label>
              <input className="form-input" type="number" value={newTransfer.items} onChange={(e) => setNewTransfer({ ...newTransfer, items: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Value (KSh)</label>
              <input className="form-input" type="number" value={newTransfer.value} onChange={(e) => setNewTransfer({ ...newTransfer, value: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleNewTransfer}>Create Transfer</button>
          </div>
        </Modal>
      )}

      {showViewModal && selectedTransfer && (
        <Modal title={`Transfer ${selectedTransfer.id}`} onClose={() => setShowViewModal(false)}>
          <div className="form-group">
            <label className="form-label">From</label>
            <div>{selectedTransfer.from}</div>
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <div>{selectedTransfer.to}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Items</label>
            <div>{selectedTransfer.items}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Value</label>
            <div className="cell-highlight">{selectedTransfer.value}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div><span className={`badge ${selectedTransfer.status === "Completed" ? "completed" : selectedTransfer.status === "In Transit" ? "processing" : "pending"}`}>{selectedTransfer.status}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <div className="cell-mono">{selectedTransfer.date}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(false)}>Close</button>
          </div>
        </Modal>
      )}
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
