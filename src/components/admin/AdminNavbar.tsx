"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminNavbar() {
  const [search, setSearch] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();

    if (query) {
      window.location.href = `/admin?search=${encodeURIComponent(query)}`;
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
          Dashboard
        </h1>
        <p className="hidden text-sm text-gray-500 sm:block">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="hidden w-full max-w-md md:block"
      >
        <label htmlFor="admin-search" className="sr-only">
          Search dashboard
        </label>

        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <span aria-hidden="true" className="text-gray-400">
            ⌕
          </span>

          <input
            id="admin-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dashboard..."
            className="w-full bg-transparent px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Link
          href="/admin/products"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:px-4"
        >
          <span aria-hidden="true">＋</span>
          <span className="hidden sm:inline"> New</span>
        </Link>

        <div className="hidden h-9 w-px bg-gray-200 sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">
              ShopEase Admin
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}