import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

const stats = [
  {
    title: "Today's Sales",
    value: "$12,450",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Expenses",
    value: "$4,320",
    change: "+8.2%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Profit",
    value: "$8,130",
    change: "+15.3%",
    trend: "up",
    icon: TrendingDown,
  },
  {
    title: "Low Stock Alerts",
    value: "5",
    change: "Items",
    trend: "down",
    icon: AlertTriangle,
  },
];

const recentTransactions = [
  { id: 1, customer: "John Doe", amount: "$450", status: "Paid", date: "2024-01-15" },
  { id: 2, customer: "Jane Smith", amount: "$320", status: "Pending", date: "2024-01-15" },
  { id: 3, customer: "Bob Wilson", amount: "$890", status: "Paid", date: "2024-01-14" },
  { id: 4, customer: "Alice Brown", amount: "$150", status: "Overdue", date: "2024-01-14" },
  { id: 5, customer: "Charlie Davis", amount: "$620", status: "Paid", date: "2024-01-13" },
];

function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500">
                <span
                  className={`font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RecentTransactions() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest sales and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{tx.customer}</p>
                  <p className="text-sm text-gray-500">{tx.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    tx.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : tx.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {tx.status}
                </span>
                <span className="font-medium text-gray-900">{tx.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Welcome back! Heres an overview of your business.</p>
      </div>
      <DashboardCards />
      <RecentTransactions />
    </div>
  );
}