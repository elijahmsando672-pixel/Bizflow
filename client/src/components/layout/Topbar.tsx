"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Search, Plus, LogOut, FileText, ShoppingCart, Package, User, FileEdit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    { label: "Create Sale", href: "/sales", icon: ShoppingCart },
    { label: "Add Expense", href: "/expenses", icon: FileText },
    { label: "Add Product", href: "/products", icon: Package },
    { label: "Add Customer", href: "/customers", icon: User },
    { label: "New Invoice", href: "/invoices", icon: FileEdit },
    { label: "New Project", href: "/projects", icon: FileEdit },
  ];

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1 items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setOpen(!open)}
          >
            <Plus className="h-4 w-4" />
            Quick Action
          </Button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white shadow-lg z-50">
              <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase text-gray-500">Create New</p>
              </div>
              <div className="border-t">
                {actions.map((action) => (
                  <button
                    key={action.href}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setOpen(false);
                      window.location.href = action.href;
                    }}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 border-l pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{user?.name || user?.email}</span>
            <span className="text-xs text-gray-500">{user?.role}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}