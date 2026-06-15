import { useState } from "react";
import Modal from "../components/Modal";

const initialExpensesData = [
  { id: "EXP-001", category: "Utilities", description: "Electricity Bill - June", amount: "KSh 12,400", date: "2026-06-15", by: "Elijah", status: "Paid" },
  { id: "EXP-002", category: "Rent", description: "Shop Rent - Main Branch", amount: "KSh 45,000", date: "2026-06-01", by: "Elijah", status: "Paid" },
  { id: "EXP-003", category: "Supplies", description: "Cleaning Supplies Restock", amount: "KSh 3,200", date: "2026-06-12", by: "Mary", status: "Paid" },
  { id: "EXP-004", category: "Salaries", description: "Staff Salaries - June", amount: "KSh 120,000", date: "2026-06-25", by: "Elijah", status: "Pending" },
  { id: "EXP-005", category: "Marketing", description: "Social Media Ads - June", amount: "KSh 8,500", date: "2026-06-10", by: "Mary", status: "Paid" },
  { id: "EXP-006", category: "Utilities", description: "Water Bill", amount: "KSh 2,800", date: "2026-06-08", by: "Elijah", status: "Paid" },
  { id: "EXP-007", category: "Maintenance", description: "Fridge Repair", amount: "KSh 6,500", date: "2026-06-05", by: "John", status: "Paid" },
  { id: "EXP-008", category: "Supplies", description: "Packaging Materials", amount: "KSh 4,100", date: "2026-06-18", by: "Mary", status: "Pending" },
];

const initialDebtorsData = [
  { id: "DR-001", customer: "Nairobi Tech Ltd", invoice: "INV-099", amount: "KSh 45,000", due: "2026-07-01", days: 16, status: "Current" },
  { id: "DR-002", customer: "Mombasa Traders", invoice: "INV-098", amount: "KSh 22,500", due: "2026-06-28", days: 13, status: "Current" },
  { id: "DR-003", customer: "Nakuru Retailers", invoice: "INV-097", amount: "KSh 34,600", due: "2026-06-20", days: 5, status: "Overdue" },
  { id: "DR-004", customer: "Eldoret Supplies", invoice: "INV-096", amount: "KSh 12,200", due: "2026-06-15", days: 0, status: "Due Today" },
];

const initialCreditorsData = [
  { id: "CR-001", supplier: "Coca-Cola Beverages Africa", invoice: "PO-042", amount: "KSh 28,000", due: "2026-06-30", days: 15, status: "Current" },
  { id: "CR-002", supplier: "Kenya Meat Commission", invoice: "PO-041", amount: "KSh 35,000", due: "2026-06-25", days: 10, status: "Current" },
  { id: "CR-003", supplier: "Fresh Bakery Ltd", invoice: "PO-040", amount: "KSh 8,400", due: "2026-06-18", days: 3, status: "Overdue" },
];

export function ExpensesPage() {
  const [expenses, setExpenses] = useState(initialExpensesData);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [form, setForm] = useState({ category: "Utilities", description: "", amount: "", status: "Pending" });
  const [editForm, setEditForm] = useState({ category: "", description: "", amount: "", status: "" });
  const categories = ["All", ...new Set(expenses.map((e) => e.category))];
  const filtered = filter === "All" ? expenses : expenses.filter((e) => e.category === filter);

  const total = expenses.reduce((s, e) => s + parseInt(e.amount.replace(/[^0-9]/g, "")), 0);

  const handleAdd = () => {
    const num = String(expenses.length + 1).padStart(3, "0");
    const newId = `EXP-${num}`;
    const cleanAmount = form.amount.replace(/^KSh\s*/i, '');
    setExpenses([...expenses, { id: newId, category: form.category, description: form.description, amount: `KSh ${cleanAmount}`, date: new Date().toISOString().split("T")[0], by: "Elijah", status: form.status }]);
    setShowModal(false);
    setForm({ category: "Utilities", description: "", amount: "", status: "Pending" });
  };

  const handleEdit = () => {
    setExpenses(expenses.map((e) => e.id === showEditModal.id ? { ...e, category: editForm.category, description: editForm.description, amount: editForm.amount, status: editForm.status } : e));
    setShowEditModal(null);
  };

  const openEdit = (exp) => {
    setEditForm({ category: exp.category, description: exp.description, amount: exp.amount, status: exp.status });
    setShowEditModal(exp);
  };

  return (
    <>
      <div className="greeting"><div><h1>Expenses</h1><p className="greeting-sub">Business expenditure tracking</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Expenses</div><div className="value">KSh {total.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">This Month</div><div className="value">KSh {total.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value">{expenses.filter((e) => e.status === "Pending").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{categories.map((c) => (<button key={c} className={`filter-tab ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>By</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((e) => (<tr key={e.id}>
            <td className="cell-mono" style={{ color: "#ef4444", fontWeight: 600 }}>{e.id}</td>
            <td><span className="badge processing">{e.category}</span></td>
            <td>{e.description}</td>
            <td className="cell-highlight">{e.amount}</td>
            <td className="cell-mono">{e.date}</td>
            <td>{e.by}</td>
            <td><span className={`badge ${e.status.toLowerCase()}`}>{e.status}</span></td>
            <td><div className="cell-actions"><button className="btn-icon" title="View" onClick={() => setShowViewModal(e)}>👁</button><button className="btn-icon" title="Edit" onClick={() => openEdit(e)}>✏️</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add Expense" onClose={() => { setShowModal(false); setForm({ category: "Utilities", description: "", amount: "", status: "Pending" }); }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.filter((c) => c !== "All").map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input className="form-input" placeholder="e.g. 15000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setForm({ category: "Utilities", description: "", amount: "", status: "Pending" }); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </Modal>
      )}

      {showViewModal && (
        <Modal title={showViewModal.id} onClose={() => setShowViewModal(null)}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.category}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.description}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.amount}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.date}</div>
          </div>
          <div className="form-group">
            <label className="form-label">By</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.by}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showViewModal.status}</div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setShowViewModal(null)}>Close</button>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal title={`Edit ${showEditModal.id}`} onClose={() => setShowEditModal(null)}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
              {categories.filter((c) => c !== "All").map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input className="form-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowEditModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit}>Save</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function DebtorsPage() {
  const [debtors, setDebtors] = useState(initialDebtorsData);
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  const handleCollect = () => {
    setDebtors(debtors.map((d) => d.id === showConfirmModal.id ? { ...d, status: "Collected", days: 0 } : d));
    setShowConfirmModal(null);
  };

  return (
    <>
      <div className="greeting"><div><h1>Debtors</h1><p className="greeting-sub">Accounts receivable</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Outstanding</div><div className="value">KSh {debtors.reduce((s, d) => s + parseInt(d.amount.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Overdue</div><div className="value" style={{ color: "#ef4444" }}>{debtors.filter((d) => d.status === "Overdue").length}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th></th></tr></thead>
          <tbody>{debtors.map((d) => (<tr key={d.id}>
            <td style={{ fontWeight: 600 }}>{d.customer}</td>
            <td className="cell-mono">{d.invoice}</td>
            <td className="cell-highlight">{d.amount}</td>
            <td className="cell-mono">{d.due}</td>
            <td><span className={`badge ${d.days > 10 ? "overdue" : d.days > 5 ? "pending" : "completed"}`}>{d.days} days</span></td>
            <td><span className={`badge ${d.status === "Overdue" ? "overdue" : d.status === "Collected" ? "completed" : "processing"}`}>{d.status}</span></td>
            <td>{d.status !== "Collected" ? <button className="btn btn-sm btn-primary" onClick={() => setShowConfirmModal(d)}>Collect</button> : <span className="badge completed">Done</span>}</td>
          </tr>))}</tbody>
        </table>
      </div>

      {showConfirmModal && (
        <Modal title="Confirm Collection" onClose={() => setShowConfirmModal(null)}>
          <p style={{ color: "#94a3b8", marginBottom: 20 }}>Are you sure you want to mark <strong style={{ color: "#fff" }}>{showConfirmModal.customer}</strong> invoice <strong style={{ color: "#fff" }}>{showConfirmModal.invoice}</strong> of <strong style={{ color: "#22c55e" }}>{showConfirmModal.amount}</strong> as collected?</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowConfirmModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCollect}>Confirm</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function CreditorsPage() {
  const [creditors, setCreditors] = useState(initialCreditorsData);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  const handlePay = () => {
    setCreditors(creditors.map((c) => c.id === showPaymentModal.id ? { ...c, status: "Paid", days: 0 } : c));
    setShowPaymentModal(null);
    setPaymentMethod("Bank Transfer");
  };

  return (
    <>
      <div className="greeting"><div><h1>Creditors</h1><p className="greeting-sub">Accounts payable</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Payable</div><div className="value">KSh {creditors.reduce((s, c) => s + parseInt(c.amount.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Supplier</th><th>Invoice</th><th>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th></th></tr></thead>
          <tbody>{creditors.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.supplier}</td>
            <td className="cell-mono">{c.invoice}</td>
            <td className="cell-highlight">{c.amount}</td>
            <td className="cell-mono">{c.due}</td>
            <td><span className={`badge ${c.days > 10 ? "overdue" : "pending"}`}>{c.days} days</span></td>
            <td><span className={`badge ${c.status === "Paid" ? "completed" : c.status === "Overdue" ? "overdue" : "processing"}`}>{c.status}</span></td>
            <td>{c.status !== "Paid" ? <button className="btn btn-sm btn-warning" onClick={() => setShowPaymentModal(c)}>Pay Now</button> : <span className="badge completed">Paid</span>}</td>
          </tr>))}</tbody>
        </table>
      </div>

      {showPaymentModal && (
        <Modal title={`Pay ${showPaymentModal.supplier}`} onClose={() => { setShowPaymentModal(null); setPaymentMethod("Bank Transfer"); }}>
          <div className="form-group">
            <label className="form-label">Invoice</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6 }}>{showPaymentModal.invoice}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <div className="form-input" style={{ background: "#0f172a", padding: "8px 12px", borderRadius: 6, fontWeight: 600, color: "#22c55e" }}>{showPaymentModal.amount}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowPaymentModal(null); setPaymentMethod("Bank Transfer"); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePay}>Confirm Payment</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function CashFlowPage() {
  const income = 45600 + 7800 + 3200 + 9600 + 5200 + 4100 + 2100 + 4500;
  const expenses = 12400 + 45000 + 3200 + 8500 + 2800 + 6500;

  const months = [
    { month: "Jan", income: 120000, expenses: 95000 },
    { month: "Feb", income: 135000, expenses: 102000 },
    { month: "Mar", income: 148000, expenses: 110000 },
    { month: "Apr", income: 162000, expenses: 118000 },
    { month: "May", income: 158000, expenses: 105000 },
    { month: "Jun", income: income, expenses: expenses },
  ];

  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.expenses]));

  return (
    <>
      <div className="greeting"><div><h1>Cash Flow</h1><p className="greeting-sub">Cash inflow & outflow overview</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label" style={{ color: "#22c55e" }}>Income (June)</div><div className="value" style={{ color: "#22c55e" }}>KSh {income.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label" style={{ color: "#ef4444" }}>Expenses (June)</div><div className="value" style={{ color: "#ef4444" }}>KSh {expenses.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Net Cash Flow</div><div className="value" style={{ color: income - expenses > 0 ? "#22c55e" : "#ef4444" }}>KSh {(income - expenses).toLocaleString()}</div></div>
      </div>
      <div className="section-card">
        <div className="section-card-title">Monthly Cash Flow</div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", height: 200 }}>
          {months.map((m) => {
            const incomeH = (m.income / maxVal) * 100;
            const expenseH = (m.expenses / maxVal) * 100;
            return (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", display: "flex", gap: 4, alignItems: "flex-end", height: 180 }}>
                  <div style={{ flex: 1, height: `${incomeH}%`, background: "#22c55e", borderRadius: "4px 4px 0 0", opacity: 0.8 }} title={`Income: ${m.income}`} />
                  <div style={{ flex: 1, height: `${expenseH}%`, background: "#ef4444", borderRadius: "4px 4px 0 0", opacity: 0.8 }} title={`Expenses: ${m.expenses}`} />
                </div>
                <span style={{ fontSize: 10, color: "#64748b" }}>{m.month}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center", fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#22c55e" }} /> Income</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444" }} /> Expenses</span>
        </div>
      </div>
    </>
  );
}

export function BudgetPage() {
  const budgets = [
    { category: "Utilities", budget: 20000, spent: 15200, remaining: 4800 },
    { category: "Salaries", budget: 120000, spent: 120000, remaining: 0 },
    { category: "Marketing", budget: 15000, spent: 8500, remaining: 6500 },
    { category: "Supplies", budget: 10000, spent: 7300, remaining: 2700 },
    { category: "Maintenance", budget: 12000, spent: 6500, remaining: 5500 },
    { category: "Rent", budget: 45000, spent: 45000, remaining: 0 },
  ];

  return (
    <>
      <div className="greeting"><div><h1>Budget</h1><p className="greeting-sub">Budget planning & tracking</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Budget</div><div className="value">KSh {budgets.reduce((s, b) => s + b.budget, 0).toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Total Spent</div><div className="value">KSh {budgets.reduce((s, b) => s + b.spent, 0).toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Remaining</div><div className="value">KSh {budgets.reduce((s, b) => s + b.remaining, 0).toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Progress</th></tr></thead>
          <tbody>{budgets.map((b) => {
            const pct = (b.spent / b.budget) * 100;
            return (<tr key={b.category}>
              <td style={{ fontWeight: 600 }}>{b.category}</td>
              <td>KSh {b.budget.toLocaleString()}</td>
              <td>KSh {b.spent.toLocaleString()}</td>
              <td style={{ fontWeight: 600, color: b.remaining === 0 ? "#ef4444" : "#22c55e" }}>KSh {b.remaining.toLocaleString()}</td>
              <td>
                <div style={{ width: 160, height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e", borderRadius: 4 }} />
                </div>
              </td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </>
  );
}
