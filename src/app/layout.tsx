import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grammar Studio | English and Telugu",
  description: "A 30-day interactive English grammar course with natural Telugu explanations, audio, quizzes, and progress tracking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
