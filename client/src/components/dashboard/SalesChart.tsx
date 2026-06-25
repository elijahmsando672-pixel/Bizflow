"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { date: "01 Jun", value: 1200 },
  { date: "02 Jun", value: 1900 },
  { date: "03 Jun", value: 1100 },
  { date: "04 Jun", value: 1400 },
  { date: "05 Jun", value: 800 },
  { date: "06 Jun", value: 1300 },
  { date: "07 Jun", value: 1200 },
  { date: "10 Jun", value: 900 },
  { date: "11 Jun", value: 1600 },
  { date: "12 Jun", value: 2400 },
  { date: "13 Jun", value: 1800 },
  { date: "14 Jun", value: 1200 },
  { date: "15 Jun", value: 1300 },
  { date: "17 Jun", value: 1900 },
  { date: "18 Jun", value: 1600 },
  { date: "20 Jun", value: 900 },
  { date: "21 Jun", value: 1200 },
  { date: "22 Jun", value: 800 },
  { date: "23 Jun", value: 400 },
];

export default function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
          labelStyle={{ color: "#fff" }}
        />
        <Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
