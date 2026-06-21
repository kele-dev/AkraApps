import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "../context/AppContext";

export const metadata: Metadata = {
  title: "AKRA — Di Sini Kita Akrab dengan Kata",
  description: "AKRA — Media sosial dan komunitas bagi para pembaca buku untuk berbagi kutipan, memposting pemikiran, dan mencatat progres membaca bersama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
