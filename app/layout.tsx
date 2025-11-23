import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { LenisProvider } from "@/components/lenis-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Synergy Medical - Visual Skills Training",
  description: "Interactive games designed to test, monitor, and enhance your visual capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <LenisProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster />
        </LenisProvider>
      </body>
    </html>
  );
}
