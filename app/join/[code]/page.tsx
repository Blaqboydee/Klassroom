import JoinClient from "./JoinClient";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;
  return <JoinClient code={code.toUpperCase()} />;
}
