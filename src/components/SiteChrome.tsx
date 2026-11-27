"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/src/components/Navbar";
import Footer from "../components/Footer";

export default function SiteChrome({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}