import type { Metadata } from "next";
import "./globals.css";

const description =
  "A playful learning platform where students earn streaks for completing assignments on time, fostering consistency and friendly competition.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://klassroom.cv"),
  title: {
    default: "Klassroom — Assignments, Streaks & Submissions",
    template: "%s | Klassroom",
  },
  description,
  applicationName: "Klassroom",
  verification: {
    google: "SyGuMHHLhCtoTbdAleO_-w892unFy25bFElzvuuYqx4",
  },
  openGraph: {
    type: "website",
    siteName: "Klassroom",
    url: "/",
    title: "Klassroom — Assignments, Streaks & Submissions",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Klassroom — Assignments, Streaks & Submissions",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
