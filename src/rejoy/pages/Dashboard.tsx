"use client";

import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import DashboardTable from "@/components/ui/DashboardTable";
import NotificationSettings from "@/components/ui/NotificationSettings";
import WeeklySheetSettings from "@/components/ui/WeeklySheetSettings";
import { MotionWrapper } from "@/components/ui/MotionWrapper";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "admin") {
    return null;
  }

  return (
    <MotionWrapper className="bg-black-100">
      <Navbar aria-label="Main Navigation" />
      <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto px-4 sm:px-10 min-h-screen">
        <div className="w-full pt-20 max-w-4xl">
          <DashboardTable />
          <NotificationSettings />
          <WeeklySheetSettings />
        </div>
      </main>
    </MotionWrapper>
  );
}
