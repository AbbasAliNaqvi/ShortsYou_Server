"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/Home/Hero";
import { Sections } from "@/components/Home/Sections";

export function HomeDashboard() {
  const router = useRouter();

  // Redirect authenticated users straight to the dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("shortsyou_jwt")) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <>
      <Hero />
      <Sections />
    </>
  );
}
