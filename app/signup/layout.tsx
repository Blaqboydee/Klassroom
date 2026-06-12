import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free Klassroom account and start earning streaks for completing assignments on time.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
