'use client';

import Link from 'next/link';
import { BarChart3, Package, Users, CheckSquare, ArrowRight } from 'lucide-react';

const features = [
  { icon: BarChart3, label: 'Dashboard Analytics', desc: 'Real-time business metrics and charts' },
  { icon: Package, label: 'Inventory Management', desc: 'Track stock, low alerts, and product catalog' },
  { icon: Users, label: 'Customer Management', desc: 'Manage contacts and communication' },
  { icon: CheckSquare, label: 'Task Management', desc: 'Kanban board for team productivity' },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">See BizFlow in Action</h1>
          <p className="text-xl text-slate-600 mb-8">
            Explore the features that help you manage your business efficiently
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="border px-6 py-3 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.label} className="bg-white border rounded-xl p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.label}</h3>
              <p className="text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of businesses using BizFlow to streamline operations.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition font-semibold"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
