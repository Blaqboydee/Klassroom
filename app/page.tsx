"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Streaks from "@/components/Streaks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const SEEN_LANDING_KEY = "hasSeenLanding";

export default function LandingPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  // useEffect(() => {
  //   const hasSeen = localStorage.getItem(SEEN_LANDING_KEY);
  //   if (hasSeen) {
  //     router.replace("/login");
  //   } else {
  //     localStorage.setItem(SEEN_LANDING_KEY, "true");
  //     setShow(true);
  //   }
  // }, [router]);

  // if (!show) return null;

  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Streaks />
      <CTA />
      <Footer />
    </>
  );
}


