import { useState } from "react";
import Modal from "../components/Modal";

const initialCustomersData = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "+254 712 345 678", orders: 24, total: "KSh 98,400", since: "2025-01-15", status: "Active" },
  { id: 2, name: "Mary Wanjiku", email: "mary@example.com", phone: "+254 723 456 789", orders: 18, total: "KSh 62,300", since: "2025-03-20", status: "Active" },
  { id: 3, name: "David Kimani", email: "david@example.com", phone: "+254 734 567 890", orders: 31, total: "KSh 145,200", since: "2024-11-05", status: "Active" },
  { id: 4, name: "Sarah Njoki", email: "sarah@example.com", phone: "+254 745 678 901", orders: 7, total: "KSh 18,900", since: "2026-02-10", status: "Active" },
  { id: 5, name: "Peter Kamau", email: "peter@example.com", phone: "+254 756 789 012", orders: 42, total: "KSh 201,600", since: "2024-06-01", status: "VIP" },
  { id: 6, name: "Grace Akinyi", email: "grace@example.com", phone: "+254 767 890 123", orders: 3, total: "KSh 6,800", since: "2026-04-22", status: "Active" },
  { id: 7, name: "James Mwangi", email: "james@example.com", phone: "+254 778 901 234", orders: 15, total: "KSh 52,100", since: "2025-08-14", status: "Active" },
  { id: 8, name: "Faith Wambui", email: "faith@example.com", phone: "+254 789 012 345", orders: 9, total: "KSh 28,700", since: "2025-11-30", status: "VIP" },
  { id: 9, name: "Brian Ochieng", email: "brian@example.com", phone: "+254 701 234 567", orders: 5, total: "KSh 14,500", since: "2026-03-05", status: "Active" },
  { id: 10, name: "Nancy Chebet", email: "nancy@example.com", phone: "+254 712 345 678", orders: 11, total: "KSh 33,200", since: "2025-05-18", status: "Inactive" },
  { id: 11, name: "Nairobi Tech Ltd", email: "info@nairobitech.co.ke", phone: "+254 720 100 200", orders: 8, total: "KSh 156,000", since: "2024-09-01", status: "Active" },
  { id: 12, name: "Mombasa Traders", email: "info@mombasatraders.co.ke", phone: "+254 741 200 300", orders: 5, total: "KSh 89,500", since: "2025-02-15", status: "Active" },
];

const initialSegmentsData = [
  { id: 1, name: "VIP Customers", slug: "vip", customers: 2, criteria: "Spent > KSh 100k", avgOrder: "KSh 12,400" },
  { id: 2, name: "Regulars", slug: "regulars", customers: 4, criteria: "10+ orders", avgOrder: "KSh 5,800" },
  { id: 3, name: "New Customers", slug: "new", customers: 3, criteria: "Joined < 3 months", avgOrder: "KSh 4,200" },
  { id: 4, name: "At Risk", slug: "at-risk", customers: 1, criteria: "Inactive > 60 days", avgOrder: "KSh 3,200" },
];

const feedbackData = [
  { id: 1, customer: "John Doe", rating: 5, comment: "Excellent service! The food was amazing.", date: "2026-06-15", source: "POS" },
  { id: 2, customer: "Mary Wanjiku", rating: 4, comment: "Good experience, but wait time was a bit long.", date: "2026-06-14", source: "Online" },
  { id: 3, customer: "David Kimani", rating: 5, comment: "Best chicken in town! Highly recommended.", date: "2026-06-12", source: "POS" },
  { id: 4, customer: "Sarah Njoki", rating: 3, comment: "Food was okay but packaging could be better.", date: "2026-06-10", source: "App" },
  { id: 5, customer: "Peter Kamau", rating: 5, comment: "Always consistent quality. Love this place!", date: "2026-06-08", source: "POS" },
  { id: 6, customer: "Grace Akinyi", rating: 2, comment: "Order was wrong. Had to wait for replacement.", date: "2026-05-30", source: "POS" },
];

const initialCommunicationsData = [
  { id: 1, customer: "Peter Kamau", type: "SMS", subject: "Birthday Discount", status: "Sent", date: "2026-06-15" },
  { id: 2, customer: "All VIP", type: "Email", subject: "Exclusive June Offer", status: "Sent", date: "2026-06-14" },
  { id: 3, customer: "Nancy Chebet", type: "SMS", subject: "We Miss You — 20% Off", status: "Sent", date: "2026-06-12" },
  { id: 4, customer: "All Customers", type: "Email", subject: "New Menu Items", status: "Draft", date: "2026-06-10" },
  { id: 5, customer: "Faith Wambui", type: "SMS", subject: "Order Ready for Pickup", status: "Sent", date: "2026-06-09" },
];

export function AllCustomersPage() {
  const [customers, setCustomers] = useState(initialCustomersData);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", status: "Active" });
  const statuses = ["All", "Active", "VIP", "Inactive"];
  const filtered = customers.filter(
    (c) => (filter === "All" || c.status === filter) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  );

  const handleAdd = () => {
    const newId = Math.max(...customers.map((c) => c.id)) + 1;
    setCustomers([...customers, { id: newId, ...form, orders: 0, total: "KSh 0", since: new Date().toISOString().split("T")[0] }]);
    setShowModal(false);
    setForm({ name: "", email: "", phone: "", status: "Active" });
  };

  return (
    <>
      <div className="greeting"><div><h1>All Customers</h1><p className="greeting-sub">Customer directory</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Customers</div><div className="value">{customers.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value">{customers.filter((c) => c.status === "Active").length}</div></div>
        <div className="summary-card"><div className="label">VIP</div><div className="value">{customers.filter((c) => c.status === "VIP").length}</div></div>
        <div className="summary-card"><div className="label">Total Revenue</div><div className="value">{customers.reduce((s, c) => s + parseInt(c.total.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{statuses.map((s) => (<button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>))}</div>
          <div className="search-input-wrap"><input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Customer</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Customer Since</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td>{c.email}</td>
            <td className="cell-mono">{c.phone}</td>
            <td>{c.orders}</td>
            <td className="cell-highlight">{c.total}</td>
            <td className="cell-mono">{c.since}</td>
            <td><span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => setShowViewModal(c)}>👁</button><button className="btn-icon" title="Message" onClick={() => setShowMessageModal(c)}>💬</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add Customer" onClose={() => { setShowModal(false); setForm({ name: "", email: "", phone: "", status: "Active" }); }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
              <option value="VIP">VIP</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ name: "", email: "", phone: "", status: "Active" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </Modal>
      )}

      {showViewModal && (
        <Modal title={showViewModal.name} onClose={() => setShowViewModal(null)}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.email}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.phone}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Orders</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.orders}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Total Spent</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.total}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.status}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Customer Since</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.since}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      {showMessageModal && (
        <Modal title={`Message ${showMessageModal.name}`} onClose={() => setShowMessageModal(null)}>
          <div className="form-group">
            <label className="form-label">To</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showMessageModal.email}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-input" rows={4} placeholder="Type your message..." />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowMessageModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowMessageModal(null)}>Send</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function SegmentsPage() {
  const [segments, setSegments] = useState(initialSegmentsData);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(null);
  const [form, setForm] = useState({ name: "", criteria: "" });

  const handleAdd = () => {
    const newId = Math.max(...segments.map((s) => s.id)) + 1;
    const slug = form.name.toLowerCase().replace(/\s+/g, "-");
    setSegments([...segments, { id: newId, name: form.name, slug, customers: 0, criteria: form.criteria, avgOrder: "KSh 0" }]);
    setShowModal(false);
    setForm({ name: "", criteria: "" });
  };

  return (
    <>
      <div className="greeting"><div><h1>Segments</h1><p className="greeting-sub">Customer groups & segments</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Segment</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Segment</th><th>Slug</th><th>Customers</th><th>Criteria</th><th>Avg Order</th><th></th></tr></thead>
          <tbody>{segments.map((s) => (<tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td className="cell-mono">{s.slug}</td>
            <td>{s.customers}</td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{s.criteria}</td>
            <td className="cell-highlight">{s.avgOrder}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => setShowViewModal(s)}>👁</button><button className="btn-icon" title="Message" onClick={() => setShowMessageModal(s)}>💬</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Segment" onClose={() => { setShowModal(false); setForm({ name: "", criteria: "" }); }}>
          <div className="form-group">
            <label className="form-label">Segment Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Criteria</label>
            <input className="form-input" value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ name: "", criteria: "" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </Modal>
      )}

      {showViewModal && (
        <Modal title={showViewModal.name} onClose={() => setShowViewModal(null)}>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.slug}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Customers</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.customers}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Criteria</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.criteria}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Avg Order</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.avgOrder}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      {showMessageModal && (
        <Modal title={`Message ${showMessageModal.name}`} onClose={() => setShowMessageModal(null)}>
          <div className="form-group">
            <label className="form-label">Recipient</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showMessageModal.name} ({showMessageModal.customers} customers)</div>
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-input" rows={4} placeholder="Type your message..." />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowMessageModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowMessageModal(null)}>Send</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function FeedbackPage() {
  return (
    <>
      <div className="greeting"><div><h1>Customer Feedback</h1><p className="greeting-sub">Reviews, ratings & surveys</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Reviews</div><div className="value">{feedbackData.length}</div></div>
        <div className="summary-card"><div className="label">Avg Rating</div><div className="value">{(feedbackData.reduce((s, f) => s + f.rating, 0) / feedbackData.length).toFixed(1)} ★</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Rating</th><th>Comment</th><th>Source</th><th>Date</th></tr></thead>
          <tbody>{feedbackData.map((f) => (<tr key={f.id}>
            <td style={{ fontWeight: 600 }}>{f.customer}</td>
            <td><span style={{ color: "#f59e0b" }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span></td>
            <td style={{ color: "#94a3b8", fontSize: 12, maxWidth: 300 }}>{f.comment}</td>
            <td><span className={`badge ${f.source === "POS" ? "completed" : "processing"}`}>{f.source}</span></td>
            <td className="cell-mono">{f.date}</td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function CommunicationsPage() {
  const [communications, setCommunications] = useState(initialCommunicationsData);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [form, setForm] = useState({ recipient: "", type: "SMS", subject: "", status: "Draft" });

  const handleAdd = () => {
    const newId = Math.max(...communications.map((c) => c.id)) + 1;
    setCommunications([...communications, { id: newId, customer: form.recipient, type: form.type, subject: form.subject, status: form.status, date: new Date().toISOString().split("T")[0] }]);
    setShowModal(false);
    setForm({ recipient: "", type: "SMS", subject: "", status: "Draft" });
  };

  return (
    <>
      <div className="greeting"><div><h1>Communications</h1><p className="greeting-sub">Email & SMS history</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Recipient</th><th>Type</th><th>Subject</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>{communications.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.customer}</td>
            <td><span className={`badge ${c.type === "SMS" ? "processing" : "completed"}`}>{c.type}</span></td>
            <td>{c.subject}</td>
            <td><span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
            <td className="cell-mono">{c.date}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => setShowViewModal(c)}>👁</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Campaign" onClose={() => { setShowModal(false); setForm({ recipient: "", type: "SMS", subject: "", status: "Draft" }); }}>
          <div className="form-group">
            <label className="form-label">Recipient</label>
            <select className="form-input" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })}>
              <option value="">Select recipient...</option>
              <option value="All Customers">All Customers</option>
              <option value="All VIP">All VIP</option>
              <option value="Peter Kamau">Peter Kamau</option>
              <option value="Nancy Chebet">Nancy Chebet</option>
              <option value="Faith Wambui">Faith Wambui</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="SMS">SMS</option>
              <option value="Email">Email</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ recipient: "", type: "SMS", subject: "", status: "Draft" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </Modal>
      )}

      {showViewModal && (
        <Modal title={showViewModal.subject} onClose={() => setShowViewModal(null)}>
          <div className="form-group">
            <label className="form-label">Recipient</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.customer}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.type}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.status}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.date}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}
