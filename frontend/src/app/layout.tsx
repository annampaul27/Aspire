import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import ToastContainer from "@/components/layout/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aspire AI — AI-Powered Talent & Skill Assessment Platform",
  description:
    "Connect employers with job-ready talent through verified skill assessments, intelligent candidate matching, and structured learning paths.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`} suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-[#0a0f1a] text-gray-100 flex flex-col font-sans antialiased">
        <StoreProvider>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 relative">{children}</main>
            <ToastContainer />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
