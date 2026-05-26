"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut, ShoppingCart, Package, User, FileEdit, Sun, Moon, Sparkles, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-provider";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    { label: "Add Expense", href: "/expenses", icon: FileEdit },
    { label: "Add Product", href: "/products", icon: Package },
    { label: "Add Customer", href: "/customers", icon: User },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 lg:px-6 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="flex flex-1 items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="lg:hidden text-gray-500 dark:text-gray-400" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="relative w-full max-w-xs lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search anything..."
            className="h-9 border-gray-200 bg-gray-50 pl-10 text-sm placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-indigo-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 lg:gap-2">
        <div className="relative" ref={dropdownRef}>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 hidden sm:inline-flex"
            onClick={() => setOpen(!open)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Quick Action
          </Button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-dropdown z-50 dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Create New</p>
              </div>
              <div className="p-1">
                {actions.map((action) => (
                  <button
                    key={action.href}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => {
                      setOpen(false);
                      window.location.href = action.href;
                    }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      <action.icon className="h-3.5 w-3.5" />
                    </span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-gray-900" />
        </Button>

        <div className="ml-1 lg:ml-2 flex items-center gap-2 lg:gap-3 border-l border-gray-200 pl-2 lg:pl-3 dark:border-gray-700">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || user?.email}</span>
            <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{user?.role}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-sm">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
