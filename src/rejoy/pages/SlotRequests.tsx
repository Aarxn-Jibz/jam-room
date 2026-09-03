"use client";

import React, { useEffect } from "react";
import SlotsRequestsTable from "@/components/ui/SlotsRequestTable";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { MotionWrapper } from "@/components/ui/MotionWrapper";

const SlotRequestsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;

    // 2) If not signed in or not admin, kick them back to home
    if (!session) {
      router.replace("/");
    }
  }, [session, status, router]);
  
  if (status === "loading" || !session) {
    return null;
  }
  
  return (
    <MotionWrapper className="bg-black-100">
      <Navbar aria-label="Main Navigation" />
      <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto px-4 sm:px-10 min-h-screen">
        <div className="w-full pt-20">
          <SlotsRequestsTable isAdmin={session.user.role === "admin"} userId={session.user.id!} />
        </div>
      </main>
    </MotionWrapper>
  );
};

export default SlotRequestsPage;
