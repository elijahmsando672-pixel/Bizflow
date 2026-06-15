import { useState } from "react";

const transactionsData = [
  { id: "TXN-001", order: "#1023", customer: "John Doe", amount: "KSh 4,500", method: "M-Pesa", status: "Completed", date: "2026-06-15", ref: "MPE8921K" },
  { id: "TXN-002", order: "#1022", customer: "Mary Wanjiku", amount: "KSh 2,100", method: "Cash", status: "Completed", date: "2026-06-15", ref: "CSH-0012" },
  { id: "TXN-003", order: "#1021", customer: "David Kimani", amount: "KSh 7,800", method: "Card", status: "Completed", date: "2026-06-14", ref: "CRD-7823" },
  { id: "TXN-004", order: "#1020", customer: "Sarah Njoki", amount: "KSh 3,200", method: "M-Pesa", status: "Pending", date: "2026-06-14", ref: "MPE8910K" },
  { id: "TXN-005", order: "#1015", customer: "Brian Ochieng", amount: "KSh 3,900", method: "M-Pesa", status: "Failed", date: "2026-06-11", ref: "MPE8890K" },
  { id: "TXN-006", order: "#1012", customer: "Lucy Wanjiru", amount: "KSh 4,100", method: "Card", status: "Completed", date: "2026-06-10", ref: "CRD-7811" },
  { id: "TXN-007", order: "#1008", customer: "Kevin Mutua", amount: "KSh 6,800", method: "Bank Transfer", status: "Completed", date: "2026-06-09", ref: "BTR-5501" },
  { id: "TXN-008", order: "#1005", customer: "Jane Wambui", amount: "KSh 2,600", method: "Cash", status: "Completed", date: "2026-06-08", ref: "CSH-0010" },
];

const pendingData = [
  { id: "PD-001", customer: "Sarah Njoki", invoice: "INV-1020", amount: "KSh 3,200", due: "2026-06-20", days: 5, method: "M-Pesa" },
  { id: "PD-002", customer: "Brian Ochieng", invoice: "INV-1015", amount: "KSh 3,900", due: "2026-06-18", days: 3, method: "M-Pesa" },
  { id: "PD-003", customer: "Grace Akinyi", invoice: "INV-1008", amount: "KSh 6,800", due: "2026-06-25", days: 10, method: "Bank Transfer" },
  { id: "PD-004", customer: "Nairobi Tech Ltd", invoice: "INV-099", amount: "KSh 45,000", due: "2026-07-01", days: 16, method: "Bank Transfer" },
];

const refundsData = [
  { id: "RFD-001", order: "#1018", customer: "Grace Akinyi", amount: "KSh 1,800", reason: "Cancelled Order", status: "Completed", date: "2026-06-13" },
  { id: "RFD-002", order: "#1009", customer: "Kevin Mutua", amount: "KSh 250", reason: "Quality Issue", status: "Pending", date: "2026-06-11" },
  { id: "RFD-003", order: "#0997", customer: "Ann Mwende", amount: "KSh 4,500", reason: "Wrong Item", status: "Completed", date: "2026-06-08" },
];

const chargebacksData = [
  { id: "CB-001", transaction: "TXN-005", customer: "Brian Ochieng", amount: "KSh 3,900", reason: "Customer Dispute", status: "Open", date: "2026-06-12" },
  { id: "CB-002", transaction: "TXN-003", customer: "David Kimani", amount: "KSh 7,800", reason: "Duplicate Charge", status: "Investigating", date: "2026-06-10" },
];

const paymentMethods = [
  { id: 1, name: "M-Pesa", type: "Mobile Money", status: "Active", transactions: 1248, lastUsed: "2026-06-15", fee: "1.0%" },
  { id: 2, name: "Cash", type: "Physical", status: "Active", transactions: 892, lastUsed: "2026-06-15", fee: "0%" },
  { id: 3, name: "Card (Visa/Mastercard)", type: "Card", status: "Active", transactions: 445, lastUsed: "2026-06-14", fee: "2.5%" },
  { id: 4, name: "Bank Transfer", type: "EFT", status: "Active", transactions: 167, lastUsed: "2026-06-12", fee: "0.5%" },
  { id: 5, name: "Airtel Money", type: "Mobile Money", status: "Inactive", transactions: 0, lastUsed: "N/A", fee: "1.0%" },
];

export function TransactionsPage() {
  const [status, setStatus] = useState("All");
  const statuses = ["All", ...new Set(transactionsData.map((t) => t.status))];
  const filtered = status === "All" ? transactionsData : transactionsData.filter((t) => t.status === status);

  const total = transactionsData.reduce((s, t) => s + parseInt(t.amount.replace(/[^0-9]/g, "")), 0);

  return (
    <>
      <div className="greeting">
        <div>
          <h1>Transactions</h1>
          <p className="greeting-sub">All payment transactions</p>
        </div>
      </div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Transactions</div><div className="value">{transactionsData.length}</div></div>
        <div className="summary-card"><div className="label">Total Volume</div><div className="value">KSh {total.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Completed</div><div className="value">{transactionsData.filter((t) => t.status === "Completed").length}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value">{transactionsData.filter((t) => t.status === "Pending").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{statuses.map((s) => (<button key={s} className={`filter-tab ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>{s}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-ghost">📥 Export</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>TXN ID</th><th>Order</th><th>Customer</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((t) => (<tr key={t.id}><td className="cell-mono" style={{ color: "#3b82f6", fontWeight: 600 }}>{t.id}</td><td className="cell-mono">{t.order}</td><td>{t.customer}</td><td className="cell-highlight">{t.amount}</td><td>{t.method}</td><td className="cell-mono">{t.ref}</td><td className="cell-mono">{t.date}</td><td><span className={`badge ${t.status.toLowerCase()}`}>{t.status}</span></td><td><div className="cell-actions"><button className="btn-icon" title="View">👁</button></div></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function PendingPaymentsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Pending Payments</h1><p className="greeting-sub">Payments awaiting confirmation</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Pending</div><div className="value">{pendingData.length}</div></div>
        <div className="summary-card"><div className="label">Total Outstanding</div><div className="value">KSh {pendingData.reduce((s, p) => s + parseInt(p.amount.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Invoice</th><th>Amount</th><th>Due Date</th><th>Days Left</th><th>Method</th><th></th></tr></thead>
          <tbody>{pendingData.map((p) => (<tr key={p.id}><td className="cell-mono" style={{ color: "#f59e0b", fontWeight: 600 }}>{p.id}</td><td>{p.customer}</td><td className="cell-mono">{p.invoice}</td><td className="cell-highlight">{p.amount}</td><td className="cell-mono">{p.due}</td><td><span className={`badge ${p.days <= 5 ? "pending" : "completed"}`}>{p.days} days</span></td><td>{p.method}</td><td><div className="cell-actions"><button className="btn btn-sm btn-primary">Mark Paid</button></div></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function RefundsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Refunds</h1><p className="greeting-sub">Processed and pending refunds</p></div></div>
      <div className="page-toolbar"><div className="page-toolbar-right"><button className="btn btn-primary">+ Process Refund</button></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Refund ID</th><th>Order</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>{refundsData.map((r) => (<tr key={r.id}><td className="cell-mono" style={{ color: "#ef4444", fontWeight: 600 }}>{r.id}</td><td className="cell-mono">{r.order}</td><td>{r.customer}</td><td className="cell-highlight">{r.amount}</td><td style={{ color: "#94a3b8", fontSize: 12 }}>{r.reason}</td><td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td><td className="cell-mono">{r.date}</td><td><div className="cell-actions"><button className="btn-icon" title="View">👁</button></div></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function ChargebacksPage() {
  return (
    <>
      <div className="greeting"><div><h1>Chargebacks</h1><p className="greeting-sub">Disputed transactions</p></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Case ID</th><th>Transaction</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>{chargebacksData.map((c) => (<tr key={c.id}><td className="cell-mono" style={{ color: "#ef4444", fontWeight: 600 }}>{c.id}</td><td className="cell-mono">{c.transaction}</td><td>{c.customer}</td><td className="cell-highlight">{c.amount}</td><td style={{ color: "#94a3b8", fontSize: 12 }}>{c.reason}</td><td><span className="badge pending">{c.status}</span></td><td className="cell-mono">{c.date}</td><td><div className="cell-actions"><button className="btn btn-sm btn-primary">Investigate</button></div></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function PaymentMethodsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Payment Methods</h1><p className="greeting-sub">Configure payment gateways</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Active Methods</div><div className="value">{paymentMethods.filter((m) => m.status === "Active").length}</div></div>
        <div className="summary-card"><div className="label">Total Transactions</div><div className="value">{paymentMethods.reduce((s, m) => s + m.transactions, 0).toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Method</th><th>Type</th><th>Transactions</th><th>Fee</th><th>Last Used</th><th>Status</th><th></th></tr></thead>
          <tbody>{paymentMethods.map((m) => (<tr key={m.id}><td style={{ fontWeight: 600 }}>{m.name}</td><td>{m.type}</td><td>{m.transactions.toLocaleString()}</td><td>{m.fee}</td><td className="cell-mono">{m.lastUsed}</td><td><span className={`badge ${m.status.toLowerCase()}`}>{m.status}</span></td><td><div className="cell-actions"><button className="btn-icon" title="Configure">⚙️</button><button className="btn-icon" title="Toggle">{m.status === "Active" ? "⏸" : "▶️"}</button></div></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
