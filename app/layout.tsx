import type { Metadata } from "next";
import "./globals.css";
import "./custom.css"
import { AuthProvider } from "@/lib/auth-context";
import { FontSizeProvider } from "@/lib/font-size-context";
import { NotificationProvider } from "@/lib/notification-context";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Honey Comb AI",
  description: "B2B sales tool answering who to contact? When to? And how to? In the age of AI",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <AuthProvider>
          <FontSizeProvider>
            <NotificationProvider>
              <main className="flex-1 flex flex-col w-full">{children}</main>
              <Toaster />
            </NotificationProvider>
          </FontSizeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
