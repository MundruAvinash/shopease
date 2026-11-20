
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/src/components/Providers";
import Navbar from "@/src/components/Navbar";
import SessionTimeout from "@/src/components/SessionTimeout";
import ThemeProvider from "../components/ThemeProvider";
import Footer from "../components/Footer";

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
        <ThemeProvider>
          <Providers>
          <SessionTimeout />
          <Navbar />
          {children}
          <Footer />
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
