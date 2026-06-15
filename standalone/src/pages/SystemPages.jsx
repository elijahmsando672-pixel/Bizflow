import { useState } from "react";

const usersData = [
  { id: 1, name: "Elijah", email: "elijah@bizflow.com", role: "Admin", shop: "All Shops", status: "Active", lastLogin: "2026-06-15 09:30", joined: "2024-01-01" },
  { id: 2, name: "Mary Wanjiku", email: "mary@bizflow.com", role: "Manager", shop: "Main Shop", status: "Active", lastLogin: "2026-06-15 10:15", joined: "2024-03-15" },
  { id: 3, name: "John Kamau", email: "john@bizflow.com", role: "Staff", shop: "Main Shop", status: "Active", lastLogin: "2026-06-14 14:00", joined: "2024-06-01" },
  { id: 4, name: "Jane Wanjiku", email: "jane@bizflow.com", role: "Manager", shop: "Branch A", status: "Active", lastLogin: "2026-06-15 08:45", joined: "2024-06-15" },
  { id: 5, name: "Paul Ochieng", email: "paul@bizflow.com", role: "Manager", shop: "Branch B", status: "Active", lastLogin: "2026-06-14 16:20", joined: "2025-01-20" },
  { id: 6, name: "Peter Kamau", email: "peter@bizflow.com", role: "Staff", shop: "Main Shop", status: "Inactive", lastLogin: "2026-05-20", joined: "2024-08-10" },
];

const auditLogData = [
  { id: 1, user: "Elijah", action: "Order Created", target: "Order #1023", details: "New sale of KSh 4,500", date: "2026-06-15 10:30" },
  { id: 2, user: "Mary Wanjiku", action: "Inventory Updated", target: "French Fries", details: "Adjusted stock -3 (Spoilage)", date: "2026-06-15 09:15" },
  { id: 3, user: "John Kamau", action: "Payment Processed", target: "Order #1022", details: "Cash payment of KSh 2,100", date: "2026-06-15 08:45" },
  { id: 4, user: "Elijah", action: "Supplier Payment", target: "Coca-Cola", details: "Paid invoice PO-042 KSh 28,000", date: "2026-06-14 16:00" },
  { id: 5, user: "Jane Wanjiku", action: "Branch Transfer", target: "Transfer ST-002", details: "Stock sent to Branch B", date: "2026-06-14 14:30" },
  { id: 6, user: "System", action: "Backup", target: "Database", details: "Daily backup completed", date: "2026-06-14 03:00" },
  { id: 7, user: "Paul Ochieng", action: "User Login", target: "Account", details: "Login from IP 192.168.1.45", date: "2026-06-14 08:20" },
  { id: 8, user: "Elijah", action: "Settings Changed", target: "Tax Rate", details: "VAT updated to 16%", date: "2026-06-13 11:00" },
];

export function UsersPage() {
  const [filter, setFilter] = useState("All");
  const roles = ["All", "Admin", "Manager", "Staff"];
  const filtered = filter === "All" ? usersData : usersData.filter((u) => u.role === filter);

  return (
    <>
      <div className="greeting"><div><h1>Users & Roles</h1><p className="greeting-sub">Staff accounts & permissions</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Users</div><div className="value">{usersData.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value">{usersData.filter((u) => u.status === "Active").length}</div></div>
        <div className="summary-card"><div className="label">Admins</div><div className="value">{usersData.filter((u) => u.role === "Admin").length}</div></div>
        <div className="summary-card"><div className="label">Managers</div><div className="value">{usersData.filter((u) => u.role === "Manager").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{roles.map((r) => (<button key={r} className={`filter-tab ${filter === r ? "active" : ""}`} onClick={() => setFilter(r)}>{r}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ Invite User</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Shop</th><th>Last Login</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((u) => (<tr key={u.id}>
            <td style={{ fontWeight: 600 }}>{u.name}</td>
            <td>{u.email}</td>
            <td><span className={`badge ${u.role === "Admin" ? "completed" : u.role === "Manager" ? "processing" : "pending"}`}>{u.role}</span></td>
            <td>{u.shop}</td>
            <td className="cell-mono">{u.lastLogin}</td>
            <td className="cell-mono">{u.joined}</td>
            <td><span className={`badge ${u.status.toLowerCase()}`}>{u.status}</span></td>
            <td><div className="cell-actions"><button className="btn-icon" title="Edit">✏️</button><button className="btn-icon" title="Permissions">🔑</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState("General");

  const tabs = ["General", "Business", "Tax", "Notifications", "Security"];

  return (
    <>
      <div className="greeting"><div><h1>Settings</h1><p className="greeting-sub">System configuration</p></div></div>
      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div>
          {tab === "General" && (
            <div className="section-card">
              <div className="section-card-title">General Settings</div>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input className="form-input" defaultValue="BizFlow ERP" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" defaultValue="KES">
                    <option>KES - Kenyan Shilling</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-select" defaultValue="Africa/Nairobi">
                    <option>Africa/Nairobi (UTC+3)</option>
                    <option>Africa/Lagos (UTC+1)</option>
                    <option>Africa/Cairo (UTC+2)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" defaultValue="en">
                  <option>English</option>
                  <option>Swahili</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          )}
          {tab === "Business" && (
            <div className="section-card">
              <div className="section-card-title">Business Info</div>
              <div className="form-group">
                <label className="form-label">Business Address</label>
                <textarea className="form-textarea" defaultValue="123 Kenyatta Avenue, Nairobi, Kenya" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" defaultValue="+254 700 123 456" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" defaultValue="info@bizflow.co.ke" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">KRA PIN</label>
                <input className="form-input" defaultValue="P051234567Z" />
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          )}
          {tab === "Tax" && (
            <div className="section-card">
              <div className="section-card-title">Tax Configuration</div>
              <div className="form-group">
                <label className="form-label">VAT Rate (%)</label>
                <input className="form-input" type="number" defaultValue={16} />
              </div>
              <div className="form-group">
                <label className="form-label">Default Tax Category</label>
                <select className="form-select" defaultValue="vat">
                  <option value="vat">VAT Standard</option>
                  <option value="vat-zero">VAT Zero Rated</option>
                  <option value="exempt">Tax Exempt</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          )}
          {tab === "Notifications" && (
            <div className="section-card">
              <div className="section-card-title">Notification Preferences</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["New Order Alerts", "Low Stock Warnings", "Payment Confirmations", "Daily Sales Report", "System Updates"].map((n) => (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ color: "#e2e8f0" }}>{n}</span>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: "#22c55e", cursor: "pointer", position: "relative" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, right: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "Security" && (
            <div className="section-card">
              <div className="section-card-title">Security Settings</div>
              <div className="form-group">
                <label className="form-label">Two-Factor Authentication</label>
                <select className="form-select" defaultValue="disabled">
                  <option value="disabled">Disabled</option>
                  <option value="sms">SMS-based OTP</option>
                  <option value="app">Authenticator App</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Session Timeout (minutes)</label>
                <input className="form-input" type="number" defaultValue={60} />
              </div>
              <div className="form-group">
                <label className="form-label">Password Policy</label>
                <select className="form-select" defaultValue="standard">
                  <option value="standard">Standard (8+ chars)</option>
                  <option value="strong">Strong (12+ chars, special chars)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const filtered = auditLogData.filter(
    (a) => a.user.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase()) || a.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="greeting"><div><h1>Audit Log</h1><p className="greeting-sub">System activity log</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search activity..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-ghost">📥 Export</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Action</th><th>Target</th><th>Details</th><th>Date & Time</th></tr></thead>
          <tbody>{filtered.map((a) => (<tr key={a.id}>
            <td style={{ fontWeight: 600 }}>{a.user}</td>
            <td><span className="badge processing">{a.action}</span></td>
            <td>{a.target}</td>
            <td style={{ color: "#94a3b8", fontSize: 12 }}>{a.details}</td>
            <td className="cell-mono">{a.date}</td>
          </tr>))}</tbody>
        </table>
        <div className="pagination">
          <span>Showing {filtered.length} of {auditLogData.length} entries</span>
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
