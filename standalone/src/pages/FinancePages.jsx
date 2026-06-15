import { useState } from "react";

const expensesData = [
  { id: "EXP-001", category: "Utilities", description: "Electricity Bill - June", amount: "KSh 12,400", date: "2026-06-15", by: "Elijah", status: "Paid" },
  { id: "EXP-002", category: "Rent", description: "Shop Rent - Main Branch", amount: "KSh 45,000", date: "2026-06-01", by: "Elijah", status: "Paid" },
  { id: "EXP-003", category: "Supplies", description: "Cleaning Supplies Restock", amount: "KSh 3,200", date: "2026-06-12", by: "Mary", status: "Paid" },
  { id: "EXP-004", category: "Salaries", description: "Staff Salaries - June", amount: "KSh 120,000", date: "2026-06-25", by: "Elijah", status: "Pending" },
  { id: "EXP-005", category: "Marketing", description: "Social Media Ads - June", amount: "KSh 8,500", date: "2026-06-10", by: "Mary", status: "Paid" },
  { id: "EXP-006", category: "Utilities", description: "Water Bill", amount: "KSh 2,800", date: "2026-06-08", by: "Elijah", status: "Paid" },
  { id: "EXP-007", category: "Maintenance", description: "Fridge Repair", amount: "KSh 6,500", date: "2026-06-05", by: "John", status: "Paid" },
  { id: "EXP-008", category: "Supplies", description: "Packaging Materials", amount: "KSh 4,100", date: "2026-06-18", by: "Mary", status: "Pending" },
];

const debtorsData = [
  { id: "DR-001", customer: "Nairobi Tech Ltd", invoice: "INV-099", amount: "KSh 45,000", due: "2026-07-01", days: 16, status: "Current" },
  { id: "DR-002", customer: "Mombasa Traders", invoice: "INV-098", amount: "KSh 22,500", due: "2026-06-28", days: 13, status: "Current" },
  { id: "DR-003", customer: "Nakuru Retailers", invoice: "INV-097", amount: "KSh 34,600", due: "2026-06-20", days: 5, status: "Overdue" },
  { id: "DR-004", customer: "Eldoret Supplies", invoice: "INV-096", amount: "KSh 12,200", due: "2026-06-15", days: 0, status: "Due Today" },
];

const creditorsData = [
  { id: "CR-001", supplier: "Coca-Cola Beverages Africa", invoice: "PO-042", amount: "KSh 28,000", due: "2026-06-30", days: 15, status: "Current" },
  { id: "CR-002", supplier: "Kenya Meat Commission", invoice: "PO-041", amount: "KSh 35,000", due: "2026-06-25", days: 10, status: "Current" },
  { id: "CR-003", supplier: "Fresh Bakery Ltd", invoice: "PO-040", amount: "KSh 8,400", due: "2026-06-18", days: 3, status: "Overdue" },
];

export function ExpensesPage() {
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...new Set(expensesData.map((e) => e.category))];
  const filtered = filter === "All" ? expensesData : expensesData.filter((e) => e.category === filter);

  const total = expensesData.reduce((s, e) => s + parseInt(e.amount.replace(/[^0-9]/g, "")), 0);

  return (
    <>
      <div className="greeting"><div><h1>Expenses</h1><p className="greeting-sub">Business expenditure tracking</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Expenses</div><div className="value">KSh {total.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">This Month</div><div className="value">KSh {total.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value">{expensesData.filter((e) => e.status === "Pending").length}</div></div>
      </div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="filter-tabs">{categories.map((c) => (<button key={c} className={`filter-tab ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>))}</div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ Add Expense</button>
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
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button><button className="btn-icon" title="Edit">✏️</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function DebtorsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Debtors</h1><p className="greeting-sub">Accounts receivable</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Outstanding</div><div className="value">KSh {debtorsData.reduce((s, d) => s + parseInt(d.amount.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Overdue</div><div className="value" style={{ color: "#ef4444" }}>{debtorsData.filter((d) => d.status === "Overdue").length}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th></th></tr></thead>
          <tbody>{debtorsData.map((d) => (<tr key={d.id}>
            <td style={{ fontWeight: 600 }}>{d.customer}</td>
            <td className="cell-mono">{d.invoice}</td>
            <td className="cell-highlight">{d.amount}</td>
            <td className="cell-mono">{d.due}</td>
            <td><span className={`badge ${d.days > 10 ? "completed" : d.days > 5 ? "pending" : "cancelled"}`}>{d.days} days</span></td>
            <td><span className={`badge ${d.status === "Overdue" ? "overdue" : "processing"}`}>{d.status}</span></td>
            <td><button className="btn btn-sm btn-primary">Collect</button></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}

export function CreditorsPage() {
  return (
    <>
      <div className="greeting"><div><h1>Creditors</h1><p className="greeting-sub">Accounts payable</p></div></div>
      <div className="summary-row">
        <div className="summary-card"><div className="label">Total Payable</div><div className="value">KSh {creditorsData.reduce((s, c) => s + parseInt(c.amount.replace(/[^0-9]/g, "")), 0).toLocaleString()}</div></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Supplier</th><th>Invoice</th><th>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th></th></tr></thead>
          <tbody>{creditorsData.map((c) => (<tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.supplier}</td>
            <td className="cell-mono">{c.invoice}</td>
            <td className="cell-highlight">{c.amount}</td>
            <td className="cell-mono">{c.due}</td>
            <td><span className={`badge ${c.days > 10 ? "completed" : "pending"}`}>{c.days} days</span></td>
            <td><span className={`badge ${c.status === "Overdue" ? "overdue" : "processing"}`}>{c.status}</span></td>
            <td><button className="btn btn-sm btn-warning">Pay Now</button></td>
          </tr>))}</tbody>
        </table>
      </div>
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
