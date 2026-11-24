import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { MotionProvider } from "@/components/MotionProvider";
import { Maintenance } from "@/components/Maintenance";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
const isMaintenance = MAINTENANCE_MODE && process.env.NODE_ENV === 'production';

export const metadata: Metadata = {
  title: "FinFlow | Sổ chi tiêu và tất toán gia đình",
  description: "Quản lý chi tiêu chung, chia tỷ lệ minh bạch và chốt sổ công nợ hàng tháng cho gia đình.",
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
    <html
      lang="vi"
      className={`${plusJakarta.variable} ${beVietnam.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink font-body">
        <MotionProvider>
          <ToastProvider>
            {isMaintenance ? (
              <Maintenance />
            ) : (
              <AuthProvider>
                {children}
              </AuthProvider>
            )}
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
