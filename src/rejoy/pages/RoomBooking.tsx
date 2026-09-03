"use client";

import React from "react";
import RBTable from "@/components/ui/RBTable";
import Navbar from "@/components/Navbar";
import { MotionWrapper } from "@/components/ui/MotionWrapper";

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
