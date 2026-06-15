import { useState } from "react";
import Modal from "../components/Modal";

const initialUsersData = [
  { id: 1, name: "Elijah", email: "elijah@bizflow.com", role: "Admin", shop: "All Shops", status: "Active", lastLogin: "2026-06-15 09:30", joined: "2024-01-01" },
  { id: 2, name: "Mary Wanjiku", email: "mary@bizflow.com", role: "Manager", shop: "Main Shop", status: "Active", lastLogin: "2026-06-15 10:15", joined: "2024-03-15" },
  { id: 3, name: "John Kamau", email: "john@bizflow.com", role: "Staff", shop: "Main Shop", status: "Active", lastLogin: "2026-06-14 14:00", joined: "2024-06-01" },
  { id: 4, name: "Jane Wanjiku", email: "jane@bizflow.com", role: "Manager", shop: "Branch A", status: "Active", lastLogin: "2026-06-15 08:45", joined: "2024-06-15" },
  { id: 5, name: "Paul Ochieng", email: "paul@bizflow.com", role: "Manager", shop: "Branch B", status: "Active", lastLogin: "2026-06-14 16:20", joined: "2025-01-20" },
  { id: 6, name: "Peter Kamau", email: "peter@bizflow.com", role: "Staff", shop: "Main Shop", status: "Inactive", lastLogin: "2026-05-20", joined: "2024-08-10" },
];

const shopsForSelect = ["Main Shop", "Branch A", "Branch B", "All Shops"];

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
  const [users, setUsers] = useState(initialUsersData);
  const [filter, setFilter] = useState("All");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "Staff", shop: "Main Shop" });

  const roles = ["All", "Admin", "Manager", "Staff"];
  const filtered = filter === "All" ? users : users.filter((u) => u.role === filter);

  const handleInvite = () => {
    const entry = {
      id: users.length + 1,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      shop: inviteForm.shop,
      status: "Active",
      lastLogin: "—",
      joined: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, entry]);
    setShowInviteModal(false);
    setInviteForm({ name: "", email: "", role: "Staff", shop: "Main Shop" });
  };

  const handleEdit = (u) => {
    setSelectedUser(u);
    setShowEditModal(true);
  };

  const handlePermissions = (u) => {
    setSelectedUser(u);
    setShowPermissionsModal(true);
  };

  return (
    <>
      <div className="greeting"><div><h1>Users & Roles</h1><p className="greeting-sub">Staff accounts & permissions</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Users</div><div className="value">{users.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value">{users.filter((u) => u.status === "Active").length}</div></div>
        <div className="summary-card"><div className="label">Admins</div><div className="value">{users.filter((u) => u.role === "Admin").length}</div></div>
        <div className="summary-card"><div className="label">Managers</div><div className="value">{users.filter((u) => u.role === "Manager").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{roles.map((r) => (<button key={r} className={`filter-tab ${filter === r ? "active" : ""}`} onClick={() => setFilter(r)}>{r}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>+ Invite User</button>
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
            <td><div className="cell-actions"><button className="btn-icon" title="Edit" onClick={() => handleEdit(u)}>✏️</button><button className="btn-icon" title="Permissions" onClick={() => handlePermissions(u)}>🔑</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showInviteModal && (
        <Modal title="Invite User" onClose={() => setShowInviteModal(false)}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Shop</label>
            <select className="form-select" value={inviteForm.shop} onChange={(e) => setInviteForm({ ...inviteForm, shop: e.target.value })}>
              {shopsForSelect.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowInviteModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleInvite}>Send Invite</button>
          </div>
        </Modal>
      )}

      {showEditModal && selectedUser && (
        <Modal title={`Edit - ${selectedUser.name}`} onClose={() => setShowEditModal(false)}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <div>{selectedUser.name}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div>{selectedUser.email}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <div><span className={`badge ${selectedUser.role === "Admin" ? "completed" : selectedUser.role === "Manager" ? "processing" : "pending"}`}>{selectedUser.role}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Shop</label>
            <div>{selectedUser.shop}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div><span className={`badge ${selectedUser.status.toLowerCase()}`}>{selectedUser.status}</span></div>
          </div>
          <div className="form-group">
            <label className="form-label">Last Login</label>
            <div className="cell-mono">{selectedUser.lastLogin}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Joined</label>
            <div className="cell-mono">{selectedUser.joined}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowEditModal(false)}>Close</button>
          </div>
        </Modal>
      )}

      {showPermissionsModal && selectedUser && (
        <Modal title={`Permissions - ${selectedUser.name}`} onClose={() => setShowPermissionsModal(false)}>
          <div className="form-group">
            <label className="form-label">User</label>
            <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Current Role</label>
            <div><span className={`badge ${selectedUser.role === "Admin" ? "completed" : selectedUser.role === "Manager" ? "processing" : "pending"}`}>{selectedUser.role}</span></div>
          </div>
          <div style={{ margin: "16px 0", padding: "16px 0", borderTop: "1px solid #1e293b", borderBottom: "1px solid #1e293b" }}>
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>Permissions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["View Dashboard", "Manage Orders", "Manage Inventory", "Manage Users", "View Reports", "Configure Settings"].map((p) => (
                <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#e2e8f0", fontSize: 13 }}>{p}</span>
                  <span className="badge completed" style={{ fontSize: 11 }}>Granted</span>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowPermissionsModal(false)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState("General");
  const [showToast, setShowToast] = useState(false);
  const [settings, setSettings] = useState({
    businessName: "BizFlow ERP",
    currency: "KES",
    timezone: "Africa/Nairobi",
    language: "en",
    address: "123 Kenyatta Avenue, Nairobi, Kenya",
    phone: "+254 700 123 456",
    email: "info@bizflow.co.ke",
    kraPin: "P051234567Z",
    vatRate: 16,
    taxCategory: "vat",
    sessionTimeout: 60,
    twoFactor: "disabled",
    passwordPolicy: "standard",
  });

  const tabs = ["General", "Business", "Tax", "Notifications", "Security"];

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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
                <input className="form-input" value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                    <option>KES - Kenyan Shilling</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-select" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
                    <option>Africa/Nairobi (UTC+3)</option>
                    <option>Africa/Lagos (UTC+1)</option>
                    <option>Africa/Cairo (UTC+2)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
                  <option>English</option>
                  <option>Swahili</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}
          {tab === "Business" && (
            <div className="section-card">
              <div className="section-card-title">Business Info</div>
              <div className="form-group">
                <label className="form-label">Business Address</label>
                <textarea className="form-textarea" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">KRA PIN</label>
                <input className="form-input" value={settings.kraPin} onChange={(e) => setSettings({ ...settings, kraPin: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}
          {tab === "Tax" && (
            <div className="section-card">
              <div className="section-card-title">Tax Configuration</div>
              <div className="form-group">
                <label className="form-label">VAT Rate (%)</label>
                <input className="form-input" type="number" value={settings.vatRate} onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Default Tax Category</label>
                <select className="form-select" value={settings.taxCategory} onChange={(e) => setSettings({ ...settings, taxCategory: e.target.value })}>
                  <option value="vat">VAT Standard</option>
                  <option value="vat-zero">VAT Zero Rated</option>
                  <option value="exempt">Tax Exempt</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}
          {tab === "Notifications" && (
            <div className="section-card">
              <div className="section-card-title">Notification Preferences</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["New Order Alerts", "Low Stock Warnings", "Payment Confirmations", "Daily Sales Report", "System Updates"].map((n) => {
                  const key = n.toLowerCase().replace(/\s+/g, "_");
                  const isOn = settings.notifications?.[key] !== false;
                  return (
                    <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                      <span style={{ color: "#e2e8f0" }}>{n}</span>
                      <div
                        onClick={() => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, [key]: !isOn }
                        })}
                        style={{ width: 44, height: 24, borderRadius: 12, background: isOn ? "#22c55e" : "#475569", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, [isOn ? "right" : "left"]: 2, transition: "left 0.2s, right 0.2s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {tab === "Security" && (
            <div className="section-card">
              <div className="section-card-title">Security Settings</div>
              <div className="form-group">
                <label className="form-label">Two-Factor Authentication</label>
                <select className="form-select" value={settings.twoFactor} onChange={(e) => setSettings({ ...settings, twoFactor: e.target.value })}>
                  <option value="disabled">Disabled</option>
                  <option value="sms">SMS-based OTP</option>
                  <option value="app">Authenticator App</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Session Timeout (minutes)</label>
                <input className="form-input" type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password Policy</label>
                <select className="form-select" value={settings.passwordPolicy} onChange={(e) => setSettings({ ...settings, passwordPolicy: e.target.value })}>
                  <option value="standard">Standard (8+ chars)</option>
                  <option value="strong">Strong (12+ chars, special chars)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="toast">Settings saved!</div>
      )}
    </>
  );
}

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [showExportNotif, setShowExportNotif] = useState(false);
  const filtered = auditLogData.filter(
    (a) => a.user.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase()) || a.target.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    setShowExportNotif(true);
    setTimeout(() => setShowExportNotif(false), 3000);
  };

  return (
    <>
      <div className="greeting"><div><h1>Audit Log</h1><p className="greeting-sub">System activity log</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search activity..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-ghost" onClick={handleExport}>📥 Export</button>
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
            <button onClick={() => {}}>‹</button>
            <button className="active" onClick={() => {}}>1</button>
            <button onClick={() => {}}>2</button>
            <button onClick={() => {}}>3</button>
            <button onClick={() => {}}>›</button>
          </div>
        </div>
      </div>

      {showExportNotif && (
        <div className="toast">Exporting audit log...</div>
      )}
    </>
  );
}
