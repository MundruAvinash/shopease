"use client";

import Link from "next/link";
import { useState } from "react";

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: "▦" },
  { label: "Analytics", href: "/admin", icon: "▥" },
  { label: "Users", href: "/admin", icon: "♙" },
  { label: "E-commerce", href: "/admin", icon: "▣" },
  { label: "Inventory", href: "/admin/products", icon: "⬡" },
  { label: "Transactions", href: "/admin/orders", icon: "▤" },
  { label: "Messages", href: "/admin", icon: "▱" },
  { label: "Calendar", href: "/admin", icon: "▦" },
  { label: "Reports", href: "/admin", icon: "▧" },
  { label: "Settings", href: "/admin", icon: "⚙" },
];

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={mobileOpen}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 text-xl text-gray-700 shadow-sm lg:hidden"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center gap-3 border-b border-gray-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-2xl font-bold text-white shadow-md">
            ⚡
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Nexus
            </h1>
            <p className="text-xs text-gray-500">ShopEase Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {menuItems.map((item, index) => {
            const active = index === 0;

            return (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                <span>{item.label}</span>

                {active && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    New
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin profile */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">
                ShopEase Admin
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}