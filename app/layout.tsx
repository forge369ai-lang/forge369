import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forge369 | From demand to digital product",
  description: "Discover, validate and build digital products people want to buy.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
