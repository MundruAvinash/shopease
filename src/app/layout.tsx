
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/src/components/Providers";
import Navbar from "@/src/components/Navbar";
import SessionTimeout from "@/src/components/SessionTimeout";

export const metadata: Metadata = {
  title: "ShopEase",
  description: "ShopEase Mini E-Commerce Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SessionTimeout />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
