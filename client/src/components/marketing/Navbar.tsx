"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Testimonials" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-gray-900/90 backdrop-blur-xl shadow-sm border-b border-gray-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-8 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold">
          <div className="w-9 h-9 relative">
            <Image src="/logo.png" alt="BizFlow" fill sizes="36px" className="object-contain" />
          </div>
          <span className="text-white">
            <span className="text-cyan-400">B</span>izFlow
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-300 hover:text-white font-medium transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-cyan-400 after:transition-all hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20"
          >
            Get Started
          </Link>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-gray-300 hover:text-white" aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-5 py-6 shadow-lg">
          <nav className="flex flex-col gap-3">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="py-2 text-gray-300 font-medium hover:text-cyan-400 transition-colors">
                {l.label}
              </Link>
            ))}
            <hr className="border-gray-700 my-2" />
            <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800">
              Sign In
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="text-center rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white">
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
