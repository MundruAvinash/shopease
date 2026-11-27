import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/src/components/Providers";
import SessionTimeout from "@/src/components/SessionTimeout";
import SiteChrome from "@/src/components/SiteChrome";

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
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}