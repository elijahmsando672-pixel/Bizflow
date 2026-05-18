import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/lib/auth-context";
import StyledComponentsRegistry from "@/lib/registry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BizFlow - Business Management Software",
    template: "%s | BizFlow",
  },
  description: "Modern business management dashboard. Manage sales, inventory, customers, team, and finances in one place.",
  keywords: ["business management", "dashboard", "inventory", "sales", "CRM", "small business software"],
  authors: [{ name: "BizFlow" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BizFlow",
    title: "BizFlow - Business Management Software",
    description: "Modern business management dashboard. Manage sales, inventory, customers, team, and finances in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizFlow - Business Management Software",
    description: "Modern business management dashboard.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full min-h-full">
        <StyledComponentsRegistry>
          <AuthProvider>
            <Providers>{children}</Providers>
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}