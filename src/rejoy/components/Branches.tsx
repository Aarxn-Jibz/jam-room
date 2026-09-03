import React from "react";
import { FocusCards } from "./ui/focus-cards";
import SWO_Logo from "../public/Bands/culturalteam.jpeg"; // Import images correctly
import Natyarpana from "../public/Bands/natyarpana.jpeg";
import ckc from "../public/Bands/choir.jpeg";

const Branches = () => {
  const cards = [
    {
      title: "The Cultural Team",
      desc: "Mentored by Mr. Jobin Shiji Daniel, they are the face of the University and participate in fests all across India. The Team consists of students from every department, and are the best of the best in their own fields.",
      src: SWO_Logo, // Use imported image directly
    },
    {
      title: "The University Choir",
      desc: "Guided by Mr. Roshan Yohann Anand, they are one of Bangalore's premier performing choirs with over 120 members. They're well known for their annual Christmas Concert Magnificat as well as their guest performances at AIVSC and Reound (SJCC).",
      src: ckc,
    },
    {
      title: "Natyarpana",
      desc: "The University Dance Team, guided by Mrs. Nivedya Don, is a group of dancing talents handpicked from the University. They are most prominently known for the University Dance Day - Nritta, being the celebration of dance in all forms.",
      src: Natyarpana,
    },
     ];

  return (
    <div className="mt-8">
      <FocusCards cards={cards} />
    </div>
  );
};

export default Branches;
