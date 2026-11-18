
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
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Profile not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            My Profile
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your account information
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="text-lg font-semibold text-gray-800">
              {profile.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email Address</p>
            <p className="text-lg font-semibold text-gray-800">
              {profile.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Account Role</p>
            <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
              {profile.role}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">Account Created</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Date(profile.created_at).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-5">{error}</p>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full mt-8 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

      </div>
    </main>
  );
}
