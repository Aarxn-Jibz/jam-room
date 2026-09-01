"use client";

import React from "react";
import RBTable from "../../../components/ui/RBTable";
import dynamic from "next/dynamic";
import { MotionWrapper } from "@/components/ui/MotionWrapper";

// Import Navbar dynamically with no SSR
const Navbar = dynamic(() => import("@/components/Navbar"), {
  ssr: false,
  loading: () => (
    <div className="h-[64px] w-full bg-background/60 backdrop-blur-lg" />
  ),
});

const RoomBookingPage = () => {
  return (
    <MotionWrapper className="bg-black-100">
    <Navbar aria-label="Main Navigation" />
      <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto px-4 sm:px-10 min-h-screen">
      <div className="w-full pt-20">
        <RBTable />
      </div>
    </main>
    </MotionWrapper>
  );
};

export default RoomBookingPage;
