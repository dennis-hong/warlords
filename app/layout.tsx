import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warlords - 삼국지 전략 게임",
  description: "삼국지3 벤치마크 전략 시뮬레이션 웹게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
