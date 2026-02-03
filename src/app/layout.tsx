import type { FC } from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IMAGO Media Search",
  description: "Search and browse IMAGO media archive",
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

const RootLayout: FC<RootLayoutProps> = ({
  children,
}) => {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
};

export default RootLayout;
