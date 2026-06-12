import type { Metadata } from "next";
import JoinClient from "./JoinClient";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const metadata: Metadata = {
  title: "Join a class",
  // Invite links are unique per class; keep them out of search results.
  robots: { index: false, follow: false },
};

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;
  return <JoinClient code={code.toUpperCase()} />;
}
