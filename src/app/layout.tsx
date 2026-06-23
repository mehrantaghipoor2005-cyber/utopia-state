import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "دستیار هوش مصنوعی فارسی",
  description: "دستیار هوشمند فارسی - مانند سیری، برای کارهای روزمره شما",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-persian antialiased">{children}</body>
    </html>
  );
}
