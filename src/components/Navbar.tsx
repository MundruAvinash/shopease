"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

const LOGOUT_EVENT_KEY = "shopease_logout_event";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  );

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void fetchUser();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
        setUser(null);
        setLoading(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUser(null);

        localStorage.setItem(
          LOGOUT_EVENT_KEY,
          JSON.stringify({
            reason: "manual",
            timestamp: Date.now(),
          })
        );

        router.replace("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-4 text-gray-900 shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
      <Link
        href="/"
        className="text-2xl font-bold text-blue-600"
      >
        ShopEase
      </Link>

      <div className="flex flex-wrap items-center gap-6 font-medium">
        <Link
          href="/"
          className="transition hover:text-blue-600"
        >
          Home
        </Link>

        <Link
          href="/products"
          className="transition hover:text-blue-600"
        >
          Products
        </Link>

        {!loading && user && (
          <>
            <Link href="/orders" className="hover:text-blue-600">
              Orders
            </Link>

            {user.role === "admin" && (
              <Link href="/admin" className="hover:text-blue-600">
                Admin
              </Link>
            )}

            <Link href="/profile" className="hover:text-blue-600">
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </>
        )}

        {!loading && !user && (
          <>
            <Link href="/login" className="hover:text-blue-600">
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}

        <Link
          href="/cart"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Cart ({cartCount})
        </Link>
      </div>
    </nav>
  );
}