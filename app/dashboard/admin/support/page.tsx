import { Suspense } from "react";
import { SupportCenter } from "@/components/support/SupportCenter";

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<main className="page"><span className="skeleton h-12 w-full block rounded-lg" /></main>}>
      <SupportCenter role="admin" />
    </Suspense>
  );
}
