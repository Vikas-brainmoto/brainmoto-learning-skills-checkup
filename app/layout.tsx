import type { ReactNode } from "react";
import type { Metadata } from "next";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brainmoto Learning Skills Check-Up",
  icons: {
    icon: [{ url: "/logo-icon.webp?v=1", type: "image/webp" }],
    shortcut: [{ url: "/logo-icon.webp?v=1", type: "image/webp" }],
    apple: [{ url: "/logo-icon.webp?v=1", type: "image/webp" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
