import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Space_Grotesk } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KC — Fitness Hub | Premier Gym",
  description:
    "Transform your life with our world-class facilities and expert trainers. Attendance-based memberships, AI workout architect, and nutrition tracking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${space.variable}`}>
      <body className="bg-carbon font-sans text-zinc-200 antialiased">
        {children}
      </body>
    </html>
  );
}
