"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type UserRole =
  | "user"
  | "admin"
  | "owner_admin"
  | "employee_admin";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface UsersResponse {
  success: boolean;
  message?: string;
  currentUser?: {
    id: number;
    role: UserRole;
  };
  users?: User[];
}

interface CreateAdminResponse {
  success: boolean;
  message?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] =
    useState<UserRole | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users", {
        credentials: "include",
      });

      const data: UsersResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch users");
      }

      setUsers(data.users ?? []);
      setCurrentUserRole(data.currentUser?.role ?? null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createEmployeeAdmin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newAdmin.name.trim(),
          email: newAdmin.email.trim(),
          password: newAdmin.password,
          role: "employee_admin",
        }),
      });

      const data: CreateAdminResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create employee admin"
        );
      }

      setSuccess(
        data.message || "Employee Admin created successfully!"
      );

      setNewAdmin({
        name: "",
        email: "",
        password: "",
      });

      await fetchUsers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setCreating(false);
    }
  };

  const removeEmployeeAccess = async (user: User) => {
    const confirmed = window.confirm(
      `Remove admin access from ${user.name}? They will become a regular user.`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(user.id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          targetUserId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update user access"
        );
      }

      setSuccess(data.message || "Employee Admin access removed.");
      await fetchUsers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const isOwner = currentUserRole === "owner_admin";

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "owner_admin":
        return "Owner Admin";
      case "employee_admin":
        return "Employee Admin";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "owner_admin":
        return "bg-purple-100 text-purple-700";
      case "employee_admin":
        return "bg-blue-100 text-blue-700";
      case "admin":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage ShopEase users and administrator access.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Create Employee Admin */}
        {isOwner && (
          <form
            onSubmit={createEmployeeAdmin}
            className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Create Employee Admin
            </h2>

            <p className="mb-4 text-sm text-gray-500">
              Create an account with employee administrator access.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="admin-name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="admin-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter full name"
                  required
                  value={newAdmin.name}
                  onChange={(event) =>
                    setNewAdmin((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email address"
                  required
                  value={newAdmin.email}
                  onChange={(event) =>
                    setNewAdmin((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Temporary Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  value={newAdmin.password}
                  onChange={(event) =>
                    setNewAdmin((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Employee Admin"}
            </button>
          </form>
        )}

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {users.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Employee Admins</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {
                  users.filter(
                    (user) => user.role === "employee_admin"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Regular Users</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {users.filter((user) => user.role === "user").length}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              All Users
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Joined</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const canRemoveAccess =
                      isOwner && user.role === "employee_admin";

                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>

                          <p className="mt-1 text-gray-500">
                            {user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          {new Date(
                            user.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {canRemoveAccess ? (
                            <button
                              type="button"
                              onClick={() => removeEmployeeAccess(user)}
                              disabled={updatingId === user.id}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {updatingId === user.id
                                ? "Updating..."
                                : "Remove Access"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {isOwner
            ? "As Owner Admin, you can create Employee Admin accounts and remove their access."
            : "You can view users, but cannot create accounts or remove administrator access."}
        </p>
      </div>
    </div>
  );
}