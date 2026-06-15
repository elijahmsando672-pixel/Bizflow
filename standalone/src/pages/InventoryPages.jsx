import { useState } from "react";
import Modal from "../components/Modal";
import productsInventory from "../data/products";

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
  const [products, setProducts] = useState(productsInventory);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "Beverages", price: "", cost: "", stock: "", min: "" });

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const totalValue = products.reduce((s, p) => s + p.cost * p.stock, 0);
  const lowStock = products.filter((p) => p.stock <= p.min);

  const categories = [...new Set(products.map((p) => p.category))];

  function resetForm() {
    setForm({ name: "", sku: "", category: "Beverages", price: "", cost: "", stock: "", min: "" });
  }

  function openAdd() {
    setEditing(null);
    resetForm();
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({ name: product.name, sku: product.sku, category: product.category, price: String(product.price), cost: String(product.cost), stock: String(product.stock), min: String(product.min) });
    setShowModal(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return alert("Product name is required");
    if (!form.sku.trim()) return alert("SKU is required");
    if (!form.price || Number(form.price) <= 0) return alert("Valid price is required");
    const nextId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const entry = {
      id: editing ? editing.id : nextId,
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      cost: Number(form.cost),
      stock: Number(form.stock),
      min: Number(form.min),
      unit: "pcs",
    };
    if (editing) {
      setProducts(products.map((p) => (p.id === editing.id ? entry : p)));
    } else {
      setProducts([...products, entry]);
    }
    setShowModal(false);
    setEditing(null);
    resetForm();
  }

  function confirmDelete(product) {
    setDeleting(product);
    setShowDelete(true);
  }

  function handleDelete() {
    setProducts(products.filter((p) => p.id !== deleting.id));
    setShowDelete(false);
    setDeleting(null);
  }

  return (
    <>
      <div className="greeting"><div><h1>Products</h1><p className="greeting-sub">Product catalog & inventory</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Products</div><div className="value">{products.length}</div></div>
        <div className="summary-card"><div className="label">Inventory Value</div><div className="value">KSh {totalValue.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Low Stock Alerts</div><div className="value" style={{ color: "#f59e0b" }}>{lowStock.length}</div></div>
        <div className="summary-card"><div className="label">Total Units</div><div className="value">{products.reduce((s, p) => s + p.stock, 0)}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-ghost" onClick={() => setShowImport(true)}>📥 Import</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
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
              <td><div className="cell-actions"><button className="btn-icon" title="Edit" onClick={() => openEdit(p)}>✏️</button><button className="btn-icon" title="Delete" onClick={() => confirmDelete(p)}>🗑</button></div></td>
            </tr>);
          })}</tbody>
        </table>
      </div>

      {showImport && (
        <Modal title="Import Products" onClose={() => setShowImport(false)}>
          <div className="form-group">
            <label className="form-label">Upload CSV File</label>
            <input className="form-input" type="file" accept=".csv" />
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>CSV file with headers: name, sku, category, price, cost, stock, min_stock</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowImport(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setShowImport(false); alert("Import started — 12 products processed"); }}>Import</button>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => { setShowModal(false); setEditing(null); resetForm(); }}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Price</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Cost</label>
            <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Min Stock</label>
            <input type="number" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setEditing(null); resetForm(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Product" onClose={() => { setShowDelete(false); setDeleting(null); }}>
          <p style={{ color: "#94a3b8", margin: "12px 0" }}>Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowDelete(false); setDeleting(null); }}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
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
  const [categories, setCategories] = useState(categoriesData);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", status: "Active" });

  function resetForm() {
    setForm({ name: "", slug: "", status: "Active" });
  }

  function openAdd() {
    setEditing(null);
    resetForm();
    setShowModal(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, status: cat.status });
    setShowModal(true);
  }

  function handleSubmit() {
    if (editing) {
      setCategories(categories.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
    } else {
      const nextId = categories.length ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
      setCategories([...categories, { id: nextId, name: form.name, slug: form.slug, products: 0, totalStock: 0, status: form.status }]);
    }
    setShowModal(false);
    setEditing(null);
    resetForm();
  }

  function confirmDelete(cat) {
    setDeleting(cat);
    setShowDelete(true);
  }

  function handleDelete() {
    setCategories(categories.filter((c) => c.id !== deleting.id));
    setShowDelete(false);
    setDeleting(null);
  }

  return (
    <>
      <div className="greeting"><div><h1>Categories</h1><p className="greeting-sub">Product categories & tags</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary" onClick={openAdd}>+ Add Category</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Total Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>{categories.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td className="cell-mono">{c.slug}</td>
            <td>{c.products}</td>
            <td>{c.totalStock}</td>
            <td><span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
            <td><div className="cell-actions"><button className="btn-icon" title="Edit" onClick={() => openEdit(c)}>✏️</button><button className="btn-icon" title="Delete" onClick={() => confirmDelete(c)}>🗑</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => { setShowModal(false); setEditing(null); resetForm(); }}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setEditing(null); resetForm(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Category" onClose={() => { setShowDelete(false); setDeleting(null); }}>
          <p style={{ color: "#94a3b8", margin: "12px 0" }}>Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowDelete(false); setDeleting(null); }}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─── BARCODES ─── */
export function BarcodesPage() {
  const [search, setSearch] = useState("");
  const [barcodes, setBarcodes] = useState(barcodesData);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: "" });
  const filtered = barcodes.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.barcode.includes(search));

  function handleGenerate() {
    const product = productsInventory.find((p) => p.id === Number(form.productId));
    if (!product) return;
    const nextId = barcodes.length ? Math.max(...barcodes.map((b) => b.id)) + 1 : 1;
    const barcode = String(9000000000000 + nextId);
    setBarcodes([...barcodes, { id: nextId, name: product.name, sku: product.sku, barcode, type: "EAN-13" }]);
    setShowModal(false);
    setForm({ productId: "" });
  }

  return (
    <>
      <div className="greeting"><div><h1>Barcodes & SKUs</h1><p className="greeting-sub">Barcode and SKU management</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search barcodes..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Generate Barcode</button>
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
            <td><div className="cell-actions"><button className="btn-icon" title="Print" onClick={() => alert("Print functionality coming soon")}>🖨</button><button className="btn-icon" title="Edit">✏️</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Generate Barcode" onClose={() => { setShowModal(false); setForm({ productId: "" }); }}>
          <div className="form-group">
            <label>Product</label>
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">-- Select Product --</option>
              {productsInventory.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku})</option>))}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ productId: "" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleGenerate}>Generate</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─── STOCK ADJUSTMENTS ─── */
export function AdjustmentsPage() {
  const [filter, setFilter] = useState("All");
  const [adjustments, setAdjustments] = useState(adjustmentsData);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product: "", sku: "", type: "Addition", qty: "", reason: "" });
  const types = ["All", "Addition", "Reduction"];
  const filtered = filter === "All" ? adjustments : adjustments.filter((a) => a.type === filter);

  function handleSubmit() {
    const maxNum = adjustments.length ? Math.max(...adjustments.map((a) => parseInt(a.id.replace("ADJ-", "")))) : 0;
    const nextId = `ADJ-${String(maxNum + 1).padStart(3, "0")}`;
    const entry = {
      id: nextId,
      product: form.product,
      sku: form.sku,
      type: form.type,
      qty: form.type === "Reduction" ? -Math.abs(Number(form.qty)) : Number(form.qty),
      reason: form.reason,
      by: "Current User",
      date: new Date().toISOString().slice(0, 10),
    };
    setAdjustments([...adjustments, entry]);
    setShowModal(false);
    setForm({ product: "", sku: "", type: "Addition", qty: "", reason: "" });
  }

  return (
    <>
      <div className="greeting"><div><h1>Stock Adjustments</h1><p className="greeting-sub">Inventory corrections & updates</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{types.map((t) => (<button key={t} className={`filter-tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>{t}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Adjustment</button>
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

      {showModal && (
        <Modal title="New Adjustment" onClose={() => { setShowModal(false); setForm({ product: "", sku: "", type: "Addition", qty: "", reason: "" }); }}>
          <div className="form-group">
            <label>Product</label>
            <select value={form.product} onChange={(e) => {
              const p = productsInventory.find((prod) => prod.name === e.target.value);
              setForm({ ...form, product: e.target.value, sku: p ? p.sku : "" });
            }}>
              <option value="">-- Select Product --</option>
              {productsInventory.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input type="text" value={form.sku} readOnly style={{ background: "#0f172a", color: "#64748b" }} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Addition">Addition</option>
              <option value="Reduction">Reduction</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Reason</label>
            <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ product: "", sku: "", type: "Addition", qty: "", reason: "" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─── TRANSFERS ─── */
export function InventoryTransfersPage() {
  const [transfers, setTransfers] = useState(transfersData);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ from: "", to: "", product: "", qty: "" });
  const locations = ["Main Shop", "Branch A", "Branch B"];

  function handleSubmit() {
    const nextId = `TRF-${String(transfers.length + 1).padStart(3, "0")}`;
    const entry = {
      id: nextId,
      from: form.from,
      to: form.to,
      product: form.product,
      qty: Number(form.qty),
      status: "Pending",
      date: new Date().toISOString().slice(0, 10),
      by: "Current User",
    };
    setTransfers([...transfers, entry]);
    setShowModal(false);
    setForm({ from: "", to: "", product: "", qty: "" });
  }

  return (
    <>
      <div className="greeting"><div><h1>Inventory Transfers</h1><p className="greeting-sub">Stock transfers between branches</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Transfer</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>From</th><th>To</th><th>Product</th><th>Qty</th><th>Status</th><th>Date</th><th>By</th><th></th></tr></thead>
          <tbody>{transfers.map((t) => (<tr key={t.id}>
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

      {showModal && (
        <Modal title="New Transfer" onClose={() => { setShowModal(false); setForm({ from: "", to: "", product: "", qty: "" }); }}>
          <div className="form-group">
            <label>From</label>
            <select value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}>
              <option value="">-- Select Location --</option>
              {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>To</label>
            <select value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>
              <option value="">-- Select Location --</option>
              {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Product</label>
            <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">-- Select Product --</option>
              {productsInventory.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ from: "", to: "", product: "", qty: "" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        </Modal>
      )}
    </>
  );
}
