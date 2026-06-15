import { useState } from "react";

const productsInventory = [
  { id: 1, name: "Coca Cola 500ml", sku: "BVR-001", category: "Beverages", price: 60, cost: 40, stock: 120, min: 20, unit: "pcs" },
  { id: 2, name: "Fanta Orange 500ml", sku: "BVR-002", category: "Beverages", price: 60, cost: 40, stock: 90, min: 20, unit: "pcs" },
  { id: 3, name: "Sprite 500ml", sku: "BVR-003", category: "Beverages", price: 60, cost: 40, stock: 85, min: 20, unit: "pcs" },
  { id: 4, name: "Kentucky Fried Chicken", sku: "FOD-001", category: "Fast Food", price: 450, cost: 280, stock: 30, min: 10, unit: "pcs" },
  { id: 5, name: "Beef Burger", sku: "FOD-002", category: "Fast Food", price: 350, cost: 210, stock: 25, min: 10, unit: "pcs" },
  { id: 6, name: "Chicken Burger", sku: "FOD-003", category: "Fast Food", price: 380, cost: 230, stock: 20, min: 10, unit: "pcs" },
  { id: 7, name: "French Fries Large", sku: "FOD-004", category: "Fast Food", price: 250, cost: 120, stock: 8, min: 15, unit: "pcs" },
  { id: 8, name: "Mineral Water 1L", sku: "BVR-004", category: "Beverages", price: 80, cost: 45, stock: 200, min: 50, unit: "pcs" },
  { id: 9, name: "Chocolate Cake Slice", sku: "SNS-001", category: "Snacks", price: 180, cost: 100, stock: 15, min: 10, unit: "pcs" },
  { id: 10, name: "Samosa (4 pcs)", sku: "SNS-002", category: "Snacks", price: 120, cost: 60, stock: 50, min: 20, unit: "pkt" },
  { id: 11, name: "Mandazi (2 pcs)", sku: "SNS-003", category: "Snacks", price: 60, cost: 30, stock: 5, min: 15, unit: "pkt" },
  { id: 12, name: "Chapati & Beans", sku: "FOD-005", category: "Fast Food", price: 150, cost: 80, stock: 28, min: 10, unit: "pcs" },
];

const categoriesData = [
  { id: 1, name: "Beverages", slug: "beverages", products: 4, totalStock: 495, status: "Active" },
  { id: 2, name: "Fast Food", slug: "fast-food", products: 5, totalStock: 111, status: "Active" },
  { id: 3, name: "Snacks", slug: "snacks", products: 3, totalStock: 70, status: "Active" },
  { id: 4, name: "Dairy", slug: "dairy", products: 0, totalStock: 0, status: "Inactive" },
];

const barcodesData = [
  { id: 1, name: "Coca Cola 500ml", sku: "BVR-001", barcode: "8901234567890", type: "EAN-13" },
  { id: 2, name: "Fanta Orange 500ml", sku: "BVR-002", barcode: "8901234567891", type: "EAN-13" },
  { id: 3, name: "Sprite 500ml", sku: "BVR-003", barcode: "8901234567892", type: "EAN-13" },
  { id: 4, name: "Mineral Water 1L", sku: "BVR-004", barcode: "8901234567893", type: "EAN-13" },
  { id: 5, name: "Samosa (4 pcs)", sku: "SNS-002", barcode: "8901234567894", type: "EAN-13" },
];

const adjustmentsData = [
  { id: "ADJ-001", product: "Coca Cola 500ml", sku: "BVR-001", type: "Addition", qty: 50, reason: "Stock Restock", by: "John Kamau", date: "2026-06-15" },
  { id: "ADJ-002", product: "French Fries Large", sku: "FOD-004", type: "Reduction", qty: -3, reason: "Spoilage", by: "Mary Wanjiku", date: "2026-06-14" },
  { id: "ADJ-003", product: "Mandazi (2 pcs)", sku: "SNS-003", type: "Reduction", qty: -2, reason: "Expired", by: "Peter Ochieng", date: "2026-06-13" },
  { id: "ADJ-004", product: "Beef Burger", sku: "FOD-002", type: "Addition", qty: 30, reason: "New Delivery", by: "John Kamau", date: "2026-06-12" },
];

const transfersData = [
  { id: "TRF-001", from: "Main Shop", to: "Branch A", product: "Coca Cola 500ml", qty: 30, status: "Completed", date: "2026-06-15", by: "Elijah" },
  { id: "TRF-002", from: "Main Shop", to: "Branch B", product: "Beef Burger", qty: 15, status: "In Transit", date: "2026-06-14", by: "Elijah" },
  { id: "TRF-003", from: "Branch A", to: "Main Shop", product: "Samosa (4 pcs)", qty: 10, status: "Pending", date: "2026-06-13", by: "Branch Manager" },
];

/* ─── PRODUCTS ─── */
export function ProductsPage() {
  const [search, setSearch] = useState("");
  const filtered = productsInventory.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const totalValue = productsInventory.reduce((s, p) => s + p.cost * p.stock, 0);
  const lowStock = productsInventory.filter((p) => p.stock <= p.min);

  return (
    <>
      <div className="greeting"><div><h1>Products</h1><p className="greeting-sub">Product catalog & inventory</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Products</div><div className="value">{productsInventory.length}</div></div>
        <div className="summary-card"><div className="label">Inventory Value</div><div className="value">KSh {totalValue.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Low Stock Alerts</div><div className="value" style={{ color: "#f59e0b" }}>{lowStock.length}</div></div>
        <div className="summary-card"><div className="label">Total Units</div><div className="value">{productsInventory.reduce((s, p) => s + p.stock, 0)}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-ghost">📥 Import</button>
          <button className="btn btn-primary">+ Add Product</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Min</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((p) => {
            const isLow = p.stock <= p.min;
            return (<tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td className="cell-mono">{p.sku}</td>
              <td>{p.category}</td>
              <td>KSh {p.price}</td>
              <td>KSh {p.cost}</td>
              <td><span style={{ color: isLow ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>{p.stock}</span> {p.unit}</td>
              <td>{p.min}</td>
              <td><span className={`badge ${isLow ? "pending" : "completed"}`}>{isLow ? "Low Stock" : "In Stock"}</span></td>
              <td><div className="cell-actions"><button className="btn-icon" title="Edit">✏️</button><button className="btn-icon" title="Delete">🗑</button></div></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── STOCK LEVELS ─── */
export function StockLevelsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Stock Levels</h1><p className="greeting-sub">Real-time inventory counts</p></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Min Stock</th><th>Max Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>{productsInventory.map((p) => {
            const isLow = p.stock <= p.min;
            const max = p.min * 5;
            const pct = Math.min(100, (p.stock / max) * 100);
            return (<tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td className="cell-mono">{p.sku}</td>
              <td style={{ fontWeight: 600, color: isLow ? "#f59e0b" : "#22c55e" }}>{p.stock}</td>
              <td>{p.min}</td>
              <td>{max}</td>
              <td><div style={{ width: 100, height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: isLow ? "#f59e0b" : "#22c55e", borderRadius: 3 }} /></div></td>
              <td><span className={`badge ${isLow ? "pending" : "completed"}`}>{isLow ? "Reorder" : "OK"}</span></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── CATEGORIES ─── */
export function CategoriesPage() {
  return (
    <>
      <div className="greeting"><div><h1>Categories</h1><p className="greeting-sub">Product categories & tags</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ Add Category</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Total Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>{categoriesData.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td className="cell-mono">{c.slug}</td>
            <td>{c.products}</td>
            <td>{c.totalStock}</td>
            <td><span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
            <td><div className="cell-actions"><button className="btn-icon" title="Edit">✏️</button><button className="btn-icon" title="Delete">🗑</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── BARCODES ─── */
export function BarcodesPage() {
  const [search, setSearch] = useState("");
  const filtered = barcodesData.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.barcode.includes(search));

  return (
    <>
      <div className="greeting"><div><h1>Barcodes & SKUs</h1><p className="greeting-sub">Barcode and SKU management</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search barcodes..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ Generate Barcode</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Barcode</th><th>Type</th><th></th></tr></thead>
          <tbody>{filtered.map((b) => (<tr key={b.id}>
            <td style={{ fontWeight: 600 }}>{b.name}</td>
            <td className="cell-mono">{b.sku}</td>
            <td className="cell-mono" style={{ letterSpacing: 1 }}>{b.barcode}</td>
            <td>{b.type}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="Print">🖨</button><button className="btn-icon" title="Edit">✏️</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── STOCK ADJUSTMENTS ─── */
export function AdjustmentsPage() {
  const [filter, setFilter] = useState("All");
  const types = ["All", "Addition", "Reduction"];
  const filtered = filter === "All" ? adjustmentsData : adjustmentsData.filter((a) => a.type === filter);

  return (
    <>
      <div className="greeting"><div><h1>Stock Adjustments</h1><p className="greeting-sub">Inventory corrections & updates</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{types.map((t) => (<button key={t} className={`filter-tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>{t}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ New Adjustment</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Product</th><th>SKU</th><th>Type</th><th>Qty</th><th>Reason</th><th>By</th><th>Date</th></tr></thead>
          <tbody>{filtered.map((a) => (<tr key={a.id}>
            <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{a.id}</td>
            <td>{a.product}</td>
            <td className="cell-mono">{a.sku}</td>
            <td><span className={`badge ${a.type === "Addition" ? "completed" : "pending"}`}>{a.type}</span></td>
            <td style={{ fontWeight: 600, color: a.qty > 0 ? "#22c55e" : "#ef4444" }}>{a.qty > 0 ? `+${a.qty}` : a.qty}</td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{a.reason}</td>
            <td>{a.by}</td>
            <td className="cell-mono">{a.date}</td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

/* ─── TRANSFERS ─── */
export function InventoryTransfersPage() {
  return (
    <>
      <div className="greeting"><div><h1>Inventory Transfers</h1><p className="greeting-sub">Stock transfers between branches</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ New Transfer</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>From</th><th>To</th><th>Product</th><th>Qty</th><th>Status</th><th>Date</th><th>By</th><th></th></tr></thead>
          <tbody>{transfersData.map((t) => (<tr key={t.id}>
            <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{t.id}</td>
            <td>{t.from}</td>
            <td>{t.to}</td>
            <td>{t.product}</td>
            <td style={{ fontWeight: 600 }}>{t.qty}</td>
            <td><span className={`badge ${t.status === "Completed" ? "completed" : t.status === "In Transit" ? "processing" : "pending"}`}>{t.status}</span></td>
            <td className="cell-mono">{t.date}</td>
            <td>{t.by}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
