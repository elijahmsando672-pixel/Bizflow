"use client";

import { Smartphone } from "lucide-react";

export default function MPesaAgentsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-gradient-to-br from-cyan-500 to-teal-500 p-4 rounded-2xl mb-4">
        <Smartphone className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-100 mb-2">M-Pesa Agents</h2>
      <p className="text-gray-400 text-sm">Manage m-pesa agents.</p>
    </div>
  );
}
