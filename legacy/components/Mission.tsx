"use client";

import React, { useState, useEffect } from "react";
import { BackgroundGradient } from "./ui/background-gradient";
import Image from "next/image";
import vision from "../public/Bands/vision.jpeg"
import mission from "../public/Bands/mission.jpeg"
import scope from "../public/Bands/scope.jpeg"
import purpose from "../public/Bands/purpose.jpeg"

// Data
const missionData = {
  vision: {
    title: "Vision",
    description:
      "To inspire excellence and build confident student leaders to create a better world.",
    image: vision,
  },
  mission: {
    title: "Mission",
    description:
      "To foster talent and holistic growth by providing students with a multidisciplinary platform of opportunities for service and self-expression.",
    image: mission,
  },
  scope: {
    title: "Scope",
    description:
      "A sense of responsibility in the student community of Christ (Deemed to be University) towards self and society.",
    image: scope,
  },
  purpose: {
    title: "Purpose",
    description:
      "To inspire students to build a better world through holistic development.",
    image: purpose,
  },
};

const Mission = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const sections = Object.values(missionData);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSection((prevSection) => (prevSection + 1) % sections.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [sections.length]);

  const handleDotClick = (index: number) => {
    setCurrentSection(index);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black-100 p-4 sm:p-0">
      <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mx-auto">
        {/* Slideshow */}
        <div className="w-full sm:w-1/2 relative h-[250px] sm:h-[350px] lg:h-[400px] lg:w-[600px]">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSection ? "opacity-100" : "opacity-0"
              }`}
                // style={{ height: "100%", width: "100%" }}
            >
              <Image
                src={section.image}
                alt={section.title}
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 640px) 100vw, 600px"
              />
            </div>
          ))}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {sections.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full cursor-pointer ${
                  index === currentSection ? "bg-white" : "bg-gray-400"
                }`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="w-full sm:w-1/2 sm:h-[200px] flex flex-col items-center justify-center text-center mt-4 sm:mt-0 sm:ml-10">
      <p className="text-base sm:text-xl text-black mb-2 dark:text-neutral-200 font-semibold">
        {sections[currentSection].title}
      </p>
      <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
        {sections[currentSection].description}
      </p>
    </div>
      </BackgroundGradient>
    </div>
  );
};

export default Mission;
