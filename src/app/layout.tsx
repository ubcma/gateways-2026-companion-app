import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gateways 2026",
  description: "Companion app for Gateways, the UBCMA marketing networking conference.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-100">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm">
          {children}
        </div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
