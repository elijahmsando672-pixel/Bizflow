import { useState } from "react";

const suppliersData = [
  { id: 1, name: "Coca-Cola Beverages Africa", contact: "George Omondi", email: "george@ccba.co.ke", phone: "+254 722 100 200", products: 4, status: "Active", since: "2024-01-10" },
  { id: 2, name: "Kenya Meat Commission", contact: "James Kariuki", email: "james@kmc.co.ke", phone: "+254 733 200 300", products: 3, status: "Active", since: "2024-03-15" },
  { id: 3, name: "Fresh Bakery Ltd", contact: "Mary Wambui", email: "mary@freshbakery.co.ke", phone: "+254 744 300 400", products: 2, status: "Active", since: "2024-06-01" },
  { id: 4, name: "Sunny Snacks Ltd", contact: "Peter Ndungu", email: "peter@sunnysnacks.co.ke", phone: "+254 755 400 500", products: 2, status: "Active", since: "2024-08-20" },
  { id: 5, name: "Highlands Water Co", contact: "Ann Muthoni", email: "ann@highlandswater.co.ke", phone: "+254 766 500 600", products: 1, status: "Inactive", since: "2025-02-10" },
];

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const filtered = suppliersData.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="greeting"><div><h1>Suppliers</h1><p className="greeting-sub">Vendor management</p></div></div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-input-wrap"><input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <div className="page-toolbar-right">
          <button className="btn btn-primary">+ Add Supplier</button>
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
            <td><div className="cell-actions"><button className="btn-icon" title="View">👁</button><button className="btn-icon" title="Order">📦</button></div></td>
          </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
