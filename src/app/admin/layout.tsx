import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = [
    "admin",
    "owner_admin",
    "employee_admin",
  ];

  if (!allowedRoles.includes(user.role)) {
    redirect("/products");
  }

  return <>{children}</>;
}