import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git Flowchart",
  description: "Next.js App Router Architecture & Flowchart Visualizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

