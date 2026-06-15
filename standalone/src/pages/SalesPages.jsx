import { useState } from "react";

/* ─── PRODUCTS DATA (shared with POS) ─── */
const products = [
  { id: 1, name: "Coca Cola 500ml", sku: "BVR-001", price: 60, category: "Beverages", stock: 120 },
  { id: 2, name: "Fanta Orange 500ml", sku: "BVR-002", price: 60, category: "Beverages", stock: 90 },
  { id: 3, name: "Sprite 500ml", sku: "BVR-003", price: 60, category: "Beverages", stock: 85 },
  { id: 4, name: "Kentucky Fried Chicken", sku: "FOD-001", price: 450, category: "Fast Food", stock: 30 },
  { id: 5, name: "Beef Burger", sku: "FOD-002", price: 350, category: "Fast Food", stock: 25 },
  { id: 6, name: "Chicken Burger", sku: "FOD-003", price: 380, category: "Fast Food", stock: 20 },
  { id: 7, name: "French Fries Large", sku: "FOD-004", price: 250, category: "Fast Food", stock: 40 },
  { id: 8, name: "Mineral Water 1L", sku: "BVR-004", price: 80, category: "Beverages", stock: 200 },
  { id: 9, name: "Chocolate Cake Slice", sku: "SNS-001", price: 180, category: "Snacks", stock: 15 },
  { id: 10, name: "Samosa (4 pcs)", sku: "SNS-002", price: 120, category: "Snacks", stock: 50 },
  { id: 11, name: "Mandazi (2 pcs)", sku: "SNS-003", price: 60, category: "Snacks", stock: 35 },
  { id: 12, name: "Chapati & Beans", sku: "FOD-005", price: 150, category: "Fast Food", stock: 28 },
];

const categories = [...new Set(products.map((p) => p.category))];

const ordersData = [
  { id: "#1023", customer: "John Doe", items: 3, amount: "KSh 4,500", status: "Completed", date: "2026-06-15", payment: "M-Pesa" },
  { id: "#1022", customer: "Mary Wanjiku", items: 2, amount: "KSh 2,100", status: "Pending", date: "2026-06-15", payment: "Cash" },
  { id: "#1021", customer: "David Kimani", items: 5, amount: "KSh 7,800", status: "Completed", date: "2026-06-14", payment: "Card" },
  { id: "#1020", customer: "Sarah Njoki", items: 1, amount: "KSh 3,200", status: "Processing", date: "2026-06-14", payment: "M-Pesa" },
  { id: "#1019", customer: "Peter Kamau", items: 4, amount: "KSh 9,600", status: "Completed", date: "2026-06-13", payment: "Bank Transfer" },
  { id: "#1018", customer: "Grace Akinyi", items: 2, amount: "KSh 1,800", status: "Cancelled", date: "2026-06-13", payment: "Cash" },
  { id: "#1017", customer: "James Mwangi", items: 3, amount: "KSh 5,200", status: "Completed", date: "2026-06-12", payment: "M-Pesa" },
  { id: "#1016", customer: "Faith Wambui", items: 6, amount: "KSh 11,400", status: "Completed", date: "2026-06-12", payment: "Card" },
  { id: "#1015", customer: "Brian Ochieng", items: 2, amount: "KSh 3,900", status: "Pending", date: "2026-06-11", payment: "M-Pesa" },
  { id: "#1014", customer: "Nancy Chebet", items: 1, amount: "KSh 750", status: "Completed", date: "2026-06-11", payment: "Cash" },
  { id: "#1013", customer: "Tom Odhiambo", items: 4, amount: "KSh 6,300", status: "Processing", date: "2026-06-10", payment: "M-Pesa" },
  { id: "#1012", customer: "Lucy Wanjiru", items: 3, amount: "KSh 4,100", status: "Completed", date: "2026-06-10", payment: "Card" },
];

const quotationsData = [
  { id: "QT-001", customer: "Nairobi Tech Ltd", items: 15, amount: "KSh 45,000", status: "Accepted", date: "2026-06-14", expiry: "2026-07-14" },
  { id: "QT-002", customer: "Mombasa Traders", items: 8, amount: "KSh 22,500", status: "Pending", date: "2026-06-13", expiry: "2026-07-13" },
  { id: "QT-003", customer: "Kisumu Distributors", items: 22, amount: "KSh 67,800", status: "Draft", date: "2026-06-12", expiry: "2026-07-12" },
  { id: "QT-004", customer: "Eldoret Supplies", items: 6, amount: "KSh 12,200", status: "Declined", date: "2026-06-11", expiry: "2026-07-11" },
  { id: "QT-005", customer: "Nakuru Retailers", items: 12, amount: "KSh 34,600", status: "Accepted", date: "2026-06-10", expiry: "2026-07-10" },
];

const returnsData = [
  { id: "RTN-001", order: "#1018", customer: "Grace Akinyi", item: "Beef Burger", qty: 1, amount: "KSh 350", reason: "Wrong order", status: "Approved", date: "2026-06-14" },
  { id: "RTN-002", order: "#1015", customer: "Brian Ochieng", item: "Coca Cola 500ml", qty: 2, amount: "KSh 120", reason: "Damaged", status: "Pending", date: "2026-06-13" },
  { id: "RTN-003", order: "#1012", customer: "Lucy Wanjiru", item: "Chicken Burger", qty: 1, amount: "KSh 380", reason: "Expired", status: "Approved", date: "2026-06-12" },
  { id: "RTN-004", order: "#1009", customer: "Kevin Mutua", item: "French Fries", qty: 1, amount: "KSh 250", reason: "Quality issue", status: "Rejected", date: "2026-06-11" },
];

const receiptsData = [
  { id: "RCP-001", order: "#1023", customer: "John Doe", amount: "KSh 4,500", method: "M-Pesa", date: "2026-06-15", ref: "MPE8921K" },
  { id: "RCP-002", order: "#1022", customer: "Mary Wanjiku", amount: "KSh 2,100", method: "Cash", date: "2026-06-15", ref: "CSH-0012" },
  { id: "RCP-003", order: "#1021", customer: "David Kimani", amount: "KSh 7,800", method: "Card", date: "2026-06-14", ref: "CRD-7823" },
  { id: "RCP-004", order: "#1020", customer: "Sarah Njoki", amount: "KSh 3,200", method: "M-Pesa", date: "2026-06-14", ref: "MPE8910K" },
  { id: "RCP-005", order: "#1017", customer: "James Mwangi", amount: "KSh 5,200", method: "M-Pesa", date: "2026-06-12", ref: "MPE8901K" },
  { id: "RCP-006", order: "#1014", customer: "Nancy Chebet", amount: "KSh 750", method: "Cash", date: "2026-06-11", ref: "CSH-0011" },
];

/* ─── POS ─── */
export function PosPage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("Walk-in Customer");

  const filtered = products.filter(
    (p) => (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <>
      <div className="greeting">
        <div>
          <h1>Point of Sale</h1>
          <p className="greeting-sub">New sale transaction</p>
        </div>
      </div>

      <div className="pos-layout">
        <div className="pos-products">
          <div className="page-toolbar">
            <div className="page-toolbar-left">
              <div className="pos-categories">
                <button className={`pos-cat-btn ${category === "All" ? "active" : ""}`} onClick={() => setCategory("All")}>All</button>
                {categories.map((c) => (
                  <button key={c} className={`pos-cat-btn ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="page-toolbar-right">
              <div className="search-input-wrap">
                <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pos-grid">
            {filtered.map((p) => (
              <div key={p.id} className="pos-grid-item" onClick={() => addToCart(p)}>
                <div className="name">{p.name}</div>
                <div className="price">KSh {p.price}</div>
                <div className="sku">{p.sku}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3>Cart ({cart.length})</h3>
            {cart.length > 0 && (
              <button className="btn btn-sm btn-ghost" onClick={() => setCart([])}>Clear</button>
            )}
          </div>

          <select className="pos-customer-select" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option>Walk-in Customer</option>
            <option>John Doe</option>
            <option>Mary Wanjiku</option>
            <option>David Kimani</option>
          </select>

          <div className="pos-cart-items">
            {cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price">KSh {item.price}</div>
                </div>
                <div className="qty-controls">
                  <button onClick={() => updateQty(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <button className="btn-icon" onClick={() => removeItem(item.id)} style={{ border: "none", color: "#ef4444" }}>✕</button>
              </div>
            ))}
            {cart.length === 0 && (
              <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0", fontSize: 13 }}>Select products to start a sale</p>
            )}
          </div>

          <div className="pos-cart-totals">
            <div className="pos-cart-total-row">
              <span>Subtotal</span>
              <span>KSh {subtotal.toLocaleString()}</span>
            </div>
            <div className="pos-cart-total-row">
              <span>VAT (16%)</span>
              <span>KSh {tax.toLocaleString()}</span>
            </div>
            <div className="pos-cart-total-row grand">
              <span>Total</span>
              <span>KSh {total.toLocaleString()}</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }} disabled={cart.length === 0}>
            Charge KSh {total.toLocaleString()}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── ORDERS ─── */
export function OrdersPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const statuses = ["All", ...new Set(ordersData.map((o) => o.status))];
  const filtered = ordersData.filter(
    (o) => (filter === "All" || o.status === filter) &&
      (o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    { label: "Total Orders", value: ordersData.length },
    { label: "Completed", value: ordersData.filter((o) => o.status === "Completed").length },
    { label: "Pending", value: ordersData.filter((o) => o.status === "Pending").length },
    { label: "Revenue", value: `KSh ${ordersData.reduce((s, o) => s + parseInt(o.amount.replace(/[^0-9]/g, "")), 0).toLocaleString()}` },
  ];

  return (
    <>
      <div className="greeting">
        <div>
          <h1>Orders</h1>
          <p className="greeting-sub">Manage all sales orders</p>
        </div>
      </div>

      <div className="summary-row">
        {stats.map((s) => (
          <div key={s.label} className="summary-card">
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">
            {statuses.map((s) => (
              <button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="page-toolbar-right">
          <div className="search-input-wrap">
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary">+ New Order</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="cell-id cell-mono">{o.id}</td>
                <td>{o.customer}</td>
                <td>{o.items}</td>
                <td className="cell-highlight">{o.amount}</td>
                <td>{o.payment}</td>
                <td className="cell-mono">{o.date}</td>
                <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-icon" title="View">👁</button>
                    <button className="btn-icon" title="Edit">✏️</button>
                    <button className="btn-icon" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing {filtered.length} of {ordersData.length} orders</span>
          <div className="pagination-btns">
            <button>‹</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>›</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── QUOTATIONS ─── */
export function QuotationsPage() {
  const [filter, setFilter] = useState("All");
  const statuses = ["All", ...new Set(quotationsData.map((q) => q.status))];
  const filtered = filter === "All" ? quotationsData : quotationsData.filter((q) => q.status === filter);

  return (
    <>
      <div className="greeting">
        <div>
          <h1>Quotations</h1>
          <p className="greeting-sub">Customer quotations & proposals</p>
        </div>
      </div>

      <div className="summary-row">
        {[{ label: "Total Quotations", value: quotationsData.length }, { label: "Accepted", value: quotationsData.filter((q) => q.status === "Accepted").length }, { label: "Pending Response", value: quotationsData.filter((q) => q.status === "Pending").length }, { label: "Total Value", value: quotationsData.reduce((s, q) => s + parseInt(q.amount.replace(/[^0-9]/g, "")), 0).toLocaleString() }].map((s) => (
          <div key={s.label} className="summary-card">
            <div className="label">{s.label}</div>
            <div className="value">{s.label === "Total Value" ? `KSh ${s.value}` : s.value}</div>
          </div>
        ))}
      </div>

      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">
            {statuses.map((s) => (
              <button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ New Quotation</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.id}>
                <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{q.id}</td>
                <td>{q.customer}</td>
                <td>{q.items}</td>
                <td className="cell-highlight">{q.amount}</td>
                <td className="cell-mono">{q.date}</td>
                <td className="cell-mono">{q.expiry}</td>
                <td><span className={`badge ${q.status.toLowerCase()}`}>{q.status}</span></td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-icon" title="View">👁</button>
                    <button className="btn-icon" title="Convert to Order">📄</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── RETURNS ─── */
export function ReturnsPage() {
  const [filter, setFilter] = useState("All");
  const statuses = ["All", ...new Set(returnsData.map((r) => r.status))];
  const filtered = filter === "All" ? returnsData : returnsData.filter((r) => r.status === filter);

  return (
    <>
      <div className="greeting">
        <div>
          <h1>Returns & Exchanges</h1>
          <p className="greeting-sub">Manage product returns and exchanges</p>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">
            {statuses.map((s) => (
              <button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ New Return</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="cell-mono" style={{ color: "#f59e0b", fontWeight: 600 }}>{r.id}</td>
                <td className="cell-mono">{r.order}</td>
                <td>{r.customer}</td>
                <td>{r.item}</td>
                <td>{r.qty}</td>
                <td>{r.amount}</td>
                <td style={{ color: "#94a3b8", fontSize: 12 }}>{r.reason}</td>
                <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-icon" title="View">👁</button>
                    <button className="btn-icon" title="Process">⚙️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ─── RECEIPTS ─── */
export function ReceiptsPage() {
  const [search, setSearch] = useState("");

  const filtered = receiptsData.filter(
    (r) => r.id.toLowerCase().includes(search.toLowerCase()) || r.customer.toLowerCase().includes(search.toLowerCase()) || r.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="greeting">
        <div>
          <h1>Receipts</h1>
          <p className="greeting-sub">Sales receipts history</p>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap">
            <input type="text" placeholder="Search receipts..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-ghost">📥 Export</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="cell-mono" style={{ color: "#22c55e", fontWeight: 600 }}>{r.id}</td>
                <td className="cell-mono">{r.order}</td>
                <td>{r.customer}</td>
                <td className="cell-highlight">{r.amount}</td>
                <td><span className="badge completed">{r.method}</span></td>
                <td className="cell-mono">{r.ref}</td>
                <td className="cell-mono">{r.date}</td>
                <td>
                  <button className="btn-icon" title="Print">🖨</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
