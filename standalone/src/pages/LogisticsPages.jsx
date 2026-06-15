import { useState } from "react";
import Modal from "../components/Modal";

const initialDeliveriesData = [
  { id: "DEL-001", order: "#1023", customer: "John Doe", address: "123 Kenyatta Ave, Nairobi", status: "Delivered", driver: "Mike Otieno", date: "2026-06-15", eta: "10:30 AM" },
  { id: "DEL-002", order: "#1020", customer: "Sarah Njoki", address: "456 Moi Ave, Mombasa", status: "In Transit", driver: "Jane Wanjiku", date: "2026-06-15", eta: "2:00 PM" },
  { id: "DEL-003", order: "#1017", customer: "James Mwangi", address: "789 Oginga Rd, Kisumu", status: "In Transit", driver: "Paul Ochieng", date: "2026-06-14", eta: "4:30 PM" },
  { id: "DEL-004", order: "#1015", customer: "Brian Ochieng", address: "321 Uhuru Hwy, Nakuru", status: "Pending", driver: "—", date: "2026-06-16", eta: "—" },
  { id: "DEL-005", order: "#1012", customer: "Lucy Wanjiru", address: "654 Tom Mboya, Eldoret", status: "Delivered", driver: "Mike Otieno", date: "2026-06-14", eta: "11:00 AM" },
];

const initialShippingData = [
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
  const [deliveries, setDeliveries] = useState(initialDeliveriesData);
  const [filter, setFilter] = useState("All");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [newAssign, setNewAssign] = useState({ order: "", driver: "", eta: "" });

  const statuses = ["All", ...new Set(deliveries.map((d) => d.status))];
  const filtered = filter === "All" ? deliveries : deliveries.filter((d) => d.status === filter);

  const handleAssign = () => {
    const idNum = deliveries.length + 1;
    const entry = {
      id: `DEL-${String(idNum).padStart(3, "0")}`,
      order: newAssign.order,
      customer: "—",
      address: "—",
      status: "Pending",
      driver: newAssign.driver,
      date: new Date().toISOString().split("T")[0],
      eta: newAssign.eta,
    };
    setDeliveries([...deliveries, entry]);
    setShowAssignModal(false);
    setNewAssign({ order: "", driver: "", eta: "" });
  };

  const handleTrack = (delivery) => {
    setSelectedDelivery(delivery);
    setShowTrackModal(true);
  };

  return (
    <>
      <div className="greeting"><div><h1>Deliveries</h1><p className="greeting-sub">Delivery management</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Today's Deliveries</div><div className="value">{deliveries.length}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value" style={{ color: "#f59e0b" }}>{deliveries.filter((d) => d.status === "Pending").length}</div></div>
        <div className="summary-card"><div className="label">In Transit</div><div className="value" style={{ color: "#3b82f6" }}>{deliveries.filter((d) => d.status === "In Transit").length}</div></div>
        <div className="summary-card"><div className="label">Delivered</div><div className="value" style={{ color: "#22c55e" }}>{deliveries.filter((d) => d.status === "Delivered").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{statuses.map((s) => (<button key={s} className={`filter-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>+ Assign Delivery</button>
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
            <td><div className="cell-actions"><button className="btn-icon" title="Track" onClick={() => handleTrack(d)}>📍</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showAssignModal && (
        <Modal title="Assign Delivery" onClose={() => setShowAssignModal(false)}>
          <div className="form-group">
            <label className="form-label">Order</label>
            <input className="form-input" placeholder="#1024" value={newAssign.order} onChange={(e) => setNewAssign({ ...newAssign, order: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Driver</label>
            <input className="form-input" placeholder="Driver name" value={newAssign.driver} onChange={(e) => setNewAssign({ ...newAssign, driver: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">ETA</label>
            <input className="form-input" placeholder="e.g. 3:00 PM" value={newAssign.eta} onChange={(e) => setNewAssign({ ...newAssign, eta: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
          </div>
        </Modal>
      )}

      {showTrackModal && selectedDelivery && (
        <Modal title={`Tracking - ${selectedDelivery.id}`} onClose={() => setShowTrackModal(false)}>
          <div className="form-group">
            <label className="form-label">Order</label>
            <div className="cell-mono">{selectedDelivery.order}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <div>{selectedDelivery.customer}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <div style={{ color: "#94a3b8" }}>{selectedDelivery.address}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div><span className={`badge ${selectedDelivery.status === "Delivered" ? "completed" : selectedDelivery.status === "In Transit" ? "processing" : "pending"}`}>{selectedDelivery.status}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Driver</label>
            <div>{selectedDelivery.driver}</div>
          </div>
          <div className="form-group">
            <label className="form-label">ETA</label>
            <div className="cell-mono">{selectedDelivery.eta}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowTrackModal(false)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function ShippingPage() {
  const [shipping, setShipping] = useState(initialShippingData);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({ name: "", zones: "", fee: "", minOrder: "", estTime: "", provider: "" });

  const handleAddZone = () => {
    const entry = {
      id: shipping.length + 1,
      name: zoneForm.name,
      zones: zoneForm.zones,
      fee: `KSh ${zoneForm.fee}`,
      minOrder: `KSh ${zoneForm.minOrder}`,
      estTime: zoneForm.estTime,
      provider: zoneForm.provider,
    };
    setShipping([...shipping, entry]);
    setShowAddZoneModal(false);
    setZoneForm({ name: "", zones: "", fee: "", minOrder: "", estTime: "", provider: "" });
  };

  const handleEdit = (zone) => {
    setSelectedZone(zone);
    setZoneForm({
      name: zone.name,
      zones: zone.zones,
      fee: zone.fee.replace("KSh ", ""),
      minOrder: zone.minOrder.replace("KSh ", ""),
      estTime: zone.estTime,
      provider: zone.provider,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setShipping(shipping.map((s) =>
      s.id === selectedZone.id
        ? { ...s, name: zoneForm.name, zones: zoneForm.zones, fee: `KSh ${zoneForm.fee}`, minOrder: `KSh ${zoneForm.minOrder}`, estTime: zoneForm.estTime, provider: zoneForm.provider }
        : s
    ));
    setShowEditModal(false);
    setSelectedZone(null);
    setZoneForm({ name: "", zones: "", fee: "", minOrder: "", estTime: "", provider: "" });
  };

  return (
    <>
      <div className="greeting"><div><h1>Shipping</h1><p className="greeting-sub">Shipping configurations</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary" onClick={() => setShowAddZoneModal(true)}>+ Add Zone</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Method</th><th>Coverage</th><th>Fee</th><th>Min Order</th><th>Est. Time</th><th>Provider</th><th></th></tr></thead>
          <tbody>{shipping.map((s) => (<tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td><span className="badge processing">{s.zones}</span></td>
            <td className="cell-highlight">{s.fee}</td>
            <td className="cell-mono">{s.minOrder}</td>
            <td>{s.estTime}</td>
            <td>{s.provider}</td>
            <td><div className="cell-actions"><button className="btn-icon" title="Edit" onClick={() => handleEdit(s)}>✏️</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showAddZoneModal && (
        <Modal title="Add Shipping Zone" onClose={() => setShowAddZoneModal(false)}>
          <div className="form-group">
            <label className="form-label">Method Name</label>
            <input className="form-input" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Coverage</label>
            <input className="form-input" value={zoneForm.zones} onChange={(e) => setZoneForm({ ...zoneForm, zones: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fee (KSh)</label>
              <input className="form-input" type="number" value={zoneForm.fee} onChange={(e) => setZoneForm({ ...zoneForm, fee: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Order (KSh)</label>
              <input className="form-input" type="number" value={zoneForm.minOrder} onChange={(e) => setZoneForm({ ...zoneForm, minOrder: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Est. Time</label>
            <input className="form-input" value={zoneForm.estTime} onChange={(e) => setZoneForm({ ...zoneForm, estTime: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Provider</label>
            <input className="form-input" value={zoneForm.provider} onChange={(e) => setZoneForm({ ...zoneForm, provider: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowAddZoneModal(false); setZoneForm({ name: "", zones: "", fee: "", minOrder: "", estTime: "", provider: "" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddZone}>Add Zone</button>
          </div>
        </Modal>
      )}

      {showEditModal && selectedZone && (
        <Modal title={`Edit - ${selectedZone.name}`} onClose={() => setShowEditModal(false)}>
          <div className="form-group">
            <label className="form-label">Method Name</label>
            <input className="form-input" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Coverage</label>
            <input className="form-input" value={zoneForm.zones} onChange={(e) => setZoneForm({ ...zoneForm, zones: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fee (KSh)</label>
              <input className="form-input" type="number" value={zoneForm.fee} onChange={(e) => setZoneForm({ ...zoneForm, fee: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Order (KSh)</label>
              <input className="form-input" type="number" value={zoneForm.minOrder} onChange={(e) => setZoneForm({ ...zoneForm, minOrder: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Est. Time</label>
            <input className="form-input" value={zoneForm.estTime} onChange={(e) => setZoneForm({ ...zoneForm, estTime: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Provider</label>
            <input className="form-input" value={zoneForm.provider} onChange={(e) => setZoneForm({ ...zoneForm, provider: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function TrackingPage() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const handleTrack = (t) => {
    setSelectedTrack(t);
    setShowDetailModal(true);
  };

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
            <td><button className="btn btn-sm btn-primary" onClick={() => handleTrack(t)}>Track</button></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showDetailModal && selectedTrack && (
        <Modal title={`Tracking - ${selectedTrack.id}`} onClose={() => setShowDetailModal(false)}>
          <div className="form-group">
            <label className="form-label">Order</label>
            <div className="cell-mono">{selectedTrack.order}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div><span className={`badge ${selectedTrack.status === "Delivered" ? "completed" : selectedTrack.status === "In Transit" ? "processing" : "pending"}`}>{selectedTrack.status}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Current Location</label>
            <div>{selectedTrack.location}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Last Update</label>
            <div className="cell-mono">{selectedTrack.lastUpdate}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Driver</label>
            <div>{selectedTrack.driver}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Contact</label>
            <div className="cell-mono" style={{ color: "#3b82f6" }}>{selectedTrack.phone}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}
