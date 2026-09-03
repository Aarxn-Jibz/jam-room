"use client";

import Navbar from '@/components/Navbar';
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import Branches from "@/components/Branches";
import Events from "@/components/ui/events";
import { MotionWrapper } from "@/components/ui/MotionWrapper";

export default function HomePage() {
  return (
    <MotionWrapper className="bg-black-100">
      <Navbar />
    <main className="relative bg-black-100 flex justify-center items-center flex-col overflow-hidden mx-auto px-4 sm:px-10">
      <div className="w-full">
        <Hero />
        <Mission />
        <Branches />
        <Events />
      </div>
    </main>
    </MotionWrapper>
  );
}
