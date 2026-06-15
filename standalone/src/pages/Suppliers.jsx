import { useState } from "react";
import Modal from "../components/Modal";

const initialSuppliersData = [
  { id: 1, name: "Coca-Cola Beverages Africa", contact: "George Omondi", email: "george@ccba.co.ke", phone: "+254 722 100 200", products: 4, status: "Active", since: "2024-01-10" },
  { id: 2, name: "Kenya Meat Commission", contact: "James Kariuki", email: "james@kmc.co.ke", phone: "+254 733 200 300", products: 3, status: "Active", since: "2024-03-15" },
  { id: 3, name: "Fresh Bakery Ltd", contact: "Mary Wambui", email: "mary@freshbakery.co.ke", phone: "+254 744 300 400", products: 2, status: "Active", since: "2024-06-01" },
  { id: 4, name: "Sunny Snacks Ltd", contact: "Peter Ndungu", email: "peter@sunnysnacks.co.ke", phone: "+254 755 400 500", products: 2, status: "Active", since: "2024-08-20" },
  { id: 5, name: "Highlands Water Co", contact: "Ann Muthoni", email: "ann@highlandswater.co.ke", phone: "+254 766 500 600", products: 1, status: "Inactive", since: "2025-02-10" },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(initialSuppliersData);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", status: "Active" });
  const [orderForm, setOrderForm] = useState({ product: "", qty: "" });
  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const newId = Math.max(...suppliers.map((s) => s.id)) + 1;
    setSuppliers([...suppliers, { id: newId, ...form, products: 0, since: new Date().toISOString().split("T")[0] }]);
    setShowModal(false);
    setForm({ name: "", contact: "", email: "", phone: "", status: "Active" });
  };

  return (
    <>
      <div className="greeting"><div><h1>Suppliers</h1><p className="greeting-sub">Vendor management</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Supplier</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Supplier</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Products</th><th>Status</th><th>Since</th><th></th></tr></thead>
          <tbody>{filtered.map((s) => (<tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td>{s.contact}</td>
            <td>{s.email}</td>
            <td className="cell-mono">{s.phone}</td>
            <td>{s.products}</td>
            <td><span className={`badge ${s.status.toLowerCase()}`}>{s.status}</span></td>
            <td className="cell-mono">{s.since}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => setShowViewModal(s)}>👁</button><button className="btn-icon" title="Order" onClick={() => setShowOrderModal(s)}>📦</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add Supplier" onClose={() => { setShowModal(false); setForm({ name: "", contact: "", email: "", phone: "", status: "Active" }); }}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input className="form-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ name: "", contact: "", email: "", phone: "", status: "Active" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </Modal>
      )}

      {showViewModal && (
        <Modal title={showViewModal.name} onClose={() => setShowViewModal(null)}>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.contact}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.email}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.phone}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Products</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.products}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.status}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Since</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.since}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      {showOrderModal && (
        <Modal title={`New Order — ${showOrderModal.name}`} onClose={() => { setShowOrderModal(null); setOrderForm({ product: "", qty: "" }); }}>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showOrderModal.name}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Product</label>
            <input className="form-input" placeholder="Product name" value={orderForm.product} onChange={(e) => setOrderForm({ ...orderForm, product: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" placeholder="0" value={orderForm.qty} onChange={(e) => setOrderForm({ ...orderForm, qty: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowOrderModal(null); setOrderForm({ product: "", qty: "" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { alert(`Purchase order placed with ${showOrderModal.name} for ${orderForm.qty} x ${orderForm.product}`); setShowOrderModal(null); setOrderForm({ product: "", qty: "" }); }}>Place Order</button>
          </div>
        </Modal>
      )}
    </>
  );
}
