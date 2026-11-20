
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch profile");
        }

        setProfile(result.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      setError("");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log out"
      );
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-white">
        <p className="text-lg font-medium">Loading profile...</p>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
        <p className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-white">
        <p>Profile not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-800 dark:bg-gray-900">

        {/* Profile Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Profile
          </h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your account information
          </p>
        </div>

        {/* Profile Details */}
        <div className="space-y-5">

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full Name
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {profile.name}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Email Address
            </p>
            <p className="break-all text-lg font-semibold text-gray-800 dark:text-white">
              {profile.email}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Account Role
            </p>
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 font-medium capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {profile.role}
            </span>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Account Created
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {new Date(profile.created_at).toLocaleDateString("en-IN")}
            </p>
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-8 w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

      </div>
    </main>
  );
}
