import { useState } from "react";

const deliveriesData = [
  { id: "DEL-001", order: "#1023", customer: "John Doe", address: "123 Kenyatta Ave, Nairobi", status: "Delivered", driver: "Mike Otieno", date: "2026-06-15", eta: "10:30 AM" },
  { id: "DEL-002", order: "#1020", customer: "Sarah Njoki", address: "456 Moi Ave, Mombasa", status: "In Transit", driver: "Jane Wanjiku", date: "2026-06-15", eta: "2:00 PM" },
  { id: "DEL-003", order: "#1017", customer: "James Mwangi", address: "789 Oginga Rd, Kisumu", status: "In Transit", driver: "Paul Ochieng", date: "2026-06-14", eta: "4:30 PM" },
  { id: "DEL-004", order: "#1015", customer: "Brian Ochieng", address: "321 Uhuru Hwy, Nakuru", status: "Pending", driver: "—", date: "2026-06-16", eta: "—" },
  { id: "DEL-005", order: "#1012", customer: "Lucy Wanjiru", address: "654 Tom Mboya, Eldoret", status: "Delivered", driver: "Mike Otieno", date: "2026-06-14", eta: "11:00 AM" },
];

const shippingData = [
  { id: 1, name: "Standard Delivery", zones: "Within City", fee: "KSh 250", minOrder: "KSh 500", estTime: "1-2 hrs", provider: "In-House" },
  { id: 2, name: "Express Delivery", zones: "Within City", fee: "KSh 500", minOrder: "KSh 1,000", estTime: "30 min", provider: "In-House" },
  { id: 3, name: "Regional", zones: "Upcountry", fee: "KSh 800", minOrder: "KSh 2,000", estTime: "1-2 days", provider: "Courier Partner" },
  { id: 4, name: "Cross-County", zones: "Nationwide", fee: "KSh 1,500", minOrder: "KSh 5,000", estTime: "2-4 days", provider: "Wells Fargo" },
];

const trackingData = [
  { id: "TRK-001", order: "#1023", status: "Delivered", location: "Nairobi", lastUpdate: "10:30 AM", driver: "Mike Otieno", phone: "+254 712 111 222" },
  { id: "TRK-002", order: "#1020", status: "In Transit", location: "Mombasa Rd, Exit 14", lastUpdate: "12:15 PM", driver: "Jane Wanjiku", phone: "+254 723 222 333" },
  { id: "TRK-003", order: "#1017", status: "In Transit", location: "Kisumu, Town Center", lastUpdate: "3:00 PM", driver: "Paul Ochieng", phone: "+254 734 333 444" },
  { id: "TRK-004", order: "#1008", status: "Out for Delivery", location: "Nairobi, Lavington", lastUpdate: "1:45 PM", driver: "Mike Otieno", phone: "+254 712 111 222" },
];

export function DeliveriesPage() {
  const [filter, setFilter] = useState("All");
  const statuses = ["All", ...new Set(deliveriesData.map((d) => d.status))];
  const filtered = filter === "All" ? deliveriesData : deliveriesData.filter((d) => d.status === filter);

  return (
    <>
      <div className="greeting"><div><h1>Deliveries</h1><p className="greeting-sub">Delivery management</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Today's Deliveries</div><div className="value">{deliveriesData.length}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value" style={{ color: "#f59e0b" }}>{deliveriesData.filter((d) => d.status === "Pending").length}</div></div>
        <div className="summary-card"><div className="label">In Transit</div><div className="value" style={{ color: "#3b82f6" }}>{deliveriesData.filter((d) => d.status === "In Transit").length}</div></div>
        <div className="summary-card"><div className="label">Delivered</div><div className="value" style={{ color: "#22c55e" }}>{deliveriesData.filter((d) => d.status === "Delivered").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{statuses.map((s) => (<button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ Assign Delivery</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Order</th><th>Customer</th><th>Address</th><th>Driver</th><th>ETA</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((d) => (<tr key={d.id}>
            <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{d.id}</td>
            <td className="cell-mono">{d.order}</td>
            <td>{d.customer}</td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{d.address}</td>
            <td>{d.driver}</td>
            <td className="cell-mono">{d.eta}</td>
            <td><span className={`badge ${d.status === "Delivered" ? "completed" : d.status === "In Transit" ? "processing" : "pending"}`}>{d.status}</span></td>
            <td><div className="cell-actions"><button className="btn-icon" title="Track">📍</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function ShippingPage() {
  return (
    <>
      <div className="greeting"><div><h1>Shipping</h1><p className="greeting-sub">Shipping configurations</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ Add Zone</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Method</th><th>Coverage</th><th>Fee</th><th>Min Order</th><th>Est. Time</th><th>Provider</th><th></th></tr></thead>
          <tbody>{shippingData.map((s) => (<tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td><span className="badge processing">{s.zones}</span></td>
            <td className="cell-highlight">{s.fee}</td>
            <td className="cell-mono">{s.minOrder}</td>
            <td>{s.estTime}</td>
            <td>{s.provider}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="Edit">✏️</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function TrackingPage() {
  return (
    <>
      <div className="greeting"><div><h1>Tracking</h1><p className="greeting-sub">Real-time shipment tracking</p></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Tracking ID</th><th>Order</th><th>Status</th><th>Location</th><th>Last Update</th><th>Driver</th><th>Contact</th><th></th></tr></thead>
          <tbody>{trackingData.map((t) => (<tr key={t.id}>
            <td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{t.id}</td>
            <td className="cell-mono">{t.order}</td>
            <td><span className={`badge ${t.status === "Delivered" ? "completed" : t.status === "In Transit" ? "processing" : "pending"}`}>{t.status}</span></td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{t.location}</td>
            <td className="cell-mono">{t.lastUpdate}</td>
            <td>{t.driver}</td>
            <td className="cell-mono">{t.phone}</td>
            <td><button className="btn btn-sm btn-primary">Track</button></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
