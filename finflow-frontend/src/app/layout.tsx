import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Maintenance } from "@/components/Maintenance";

const inter = Inter({ subsets: ["latin"] });

const MAINTENANCE_MODE = true;

export const metadata: Metadata = {
  title: "FinFlow - Family Finance Simplified",
  description: "Manage family expenses, settle debts, and keep your finances in flow.",
  icons: {
    icon: "/finflow-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900`}>
        <ToastProvider>
          {MAINTENANCE_MODE ? (
            <Maintenance />
          ) : (
            <AuthProvider>
              {children}
            </AuthProvider>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
