import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { INTRO_SEEN_SCRIPT } from "@/components/motion/intro";
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
    // The intro script may add `data-intro-seen` before hydration.
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      </head>
      <body className="min-h-full bg-zinc-100">
        <div className="app-frame mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm">
          {children}
        </div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
