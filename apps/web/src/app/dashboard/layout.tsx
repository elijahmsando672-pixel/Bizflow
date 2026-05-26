'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Receipt, Package, Users, CheckSquare, 
  BarChart3, Settings, LogOut, Menu, X, MessageCircle
} from 'lucide-react';
import { authApi } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: Receipt, label: 'Transactions' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
  });

  const businessName = profile?.business?.name ?? 'BizFlow';
  const businessType = profile?.business?.type ?? '';
  const userInitial = profile?.name?.charAt(0) ?? profile?.email?.charAt(0) ?? 'A';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">BizFlow</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">WhatsApp Connected</span>
            </div>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-medium text-slate-900">{businessName}</div>
                <div className="text-sm text-slate-500">{businessType || 'Business'}</div>
              </div>
              <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
