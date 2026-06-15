import { useState } from "react";

const customersData = [
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
];

const segmentsData = [
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

const communicationsData = [
  { id: 1, customer: "Peter Kamau", type: "SMS", subject: "Birthday Discount", status: "Sent", date: "2026-06-15" },
  { id: 2, customer: "All VIP", type: "Email", subject: "Exclusive June Offer", status: "Sent", date: "2026-06-14" },
  { id: 3, customer: "Nancy Chebet", type: "SMS", subject: "We Miss You — 20% Off", status: "Sent", date: "2026-06-12" },
  { id: 4, customer: "All Customers", type: "Email", subject: "New Menu Items", status: "Draft", date: "2026-06-10" },
  { id: 5, customer: "Faith Wambui", type: "SMS", subject: "Order Ready for Pickup", status: "Sent", date: "2026-06-09" },
];

export function AllCustomersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const statuses = ["All", "Active", "VIP", "Inactive"];
  const filtered = customersData.filter(
    (c) => (filter === "All" || c.status === filter) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  );

  return (
    <>
      <div className="greeting"><div><h1>All Customers</h1><p className="greeting-sub">Customer directory</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Customers</div><div className="value">{customersData.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value">{customersData.filter((c) => c.status === "Active").length}</div></div>
        <div className="summary-card"><div className="label">VIP</div><div className="value">{customersData.filter((c) => c.status === "VIP").length}</div></div>
        <div className="summary-card"><div className="label">Total Revenue</div><div className="value">{customersData.reduce((s, c) => s + parseInt(c.total.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{statuses.map((s) => (<button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>))}</div>
          <div className="search-input-wrap"><input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ Add Customer</button>
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
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button><button className="btn-icon" title="Message">💬</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function SegmentsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Segments</h1><p className="greeting-sub">Customer groups & segments</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ New Segment</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Segment</th><th>Slug</th><th>Customers</th><th>Criteria</th><th>Avg Order</th><th></th></tr></thead>
          <tbody>{segmentsData.map((s) => (<tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td className="cell-mono">{s.slug}</td>
            <td>{s.customers}</td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{s.criteria}</td>
            <td className="cell-highlight">{s.avgOrder}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button><button className="btn-icon" title="Message">💬</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
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
  return (
    <>
      <div className="greeting"><div><h1>Communications</h1><p className="greeting-sub">Email & SMS history</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ New Campaign</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Recipient</th><th>Type</th><th>Subject</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>{communicationsData.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.customer}</td>
            <td><span className={`badge ${c.type === "SMS" ? "processing" : "completed"}`}>{c.type}</span></td>
            <td>{c.subject}</td>
            <td><span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
            <td className="cell-mono">{c.date}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
