"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

type UserRole = "user" | "admin" | "owner_admin" | "employee_admin";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: AdminUser;
}

export default function AdminNavbar() {
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const result: ProfileResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Unable to load profile");
        }

        if (active) {
          setUser(result.data);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error ? error.message : "Unable to load profile"
          );
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();

    if (query) {
      router.push(`/admin?search=${encodeURIComponent(query)}`);
    }
  }

  function getRoleLabel(role: UserRole) {
    switch (role) {
      case "owner_admin":
        return "Owner Admin";
      case "employee_admin":
        return "Employee Admin";
      case "admin":
        return "Administrator";
      default:
        return "User";
    }
  }

  const initials = user?.name.trim().charAt(0).toUpperCase() || "A";

  async function handleLogout() {
    try {
      setLoggingOut(true);
      setError("");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to log out");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to log out"
      );
      setLoggingOut(false);
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

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Open admin profile"
            className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-gray-100 sm:gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-gray-800">
                {user?.name || "Loading profile..."}
              </p>

              <p className="text-xs text-gray-500">
                {user ? getRoleLabel(user.role) : " "}
              </p>
            </div>

            <span
              aria-hidden="true"
              className={`text-gray-500 transition ${
                profileOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              {/* Profile details */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {user?.name || "Loading profile..."}
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="mt-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                )}

                {error && (
                  <p role="alert" className="mt-3 text-xs text-red-600">
                    {error}
                  </p>
                )}
              </div>

              {/* Logout */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">↪</span>
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}