"use client";
import React, { useState, useEffect} from "react";
import Image, { StaticImageData } from "next/image";
import Blossoms from "../../public/Bands/blossoms.jpeg";
import TalentWeek from "../../public/Bands/Talent Week.jpeg";
import Magnificat from "../../public/Choir/Magnificat.jpeg";
import Erato from "../../public/Bands/erato.jpeg"
import Nritta from "../../public/Bands/nritta.jpeg"


interface EventProps {
  title: string;
  description: string;
  imageSrc: StaticImageData | string;
  altText: string;
  visible: boolean;
  reverse?: boolean; // Determines the layout direction
}

const EventData: EventProps[] = [
  {
    title: "Magnificat",
    description:
      "Magnificat is an annual music festival wherein The University Choir, one of the wings of SWO, organises and performs for the students. The fest is planned around Christmas time during which the Choirs from all four campuses in Bangalore- Central, Kengeri, Bannerghatta and Yeshwantpur- perform in each campus. Magnificat also witnesses the performances of Performing Choirs from other Universities, churches as well as orchestras. With all the campuses decked and decorated in the colours of Christmas, the spirit of Christmas comes alive in this celebration of music and carols spreading warmth and joy among all.",
    imageSrc: Magnificat, // Use imported image
    altText: "Magnificat",
    visible: false, // Initially hidden
    reverse: false,
  },
  { 
    title: "Erato",
    description:
      "Erato is a night where music takes center stage. This annual musical festival brings together the rich and diverse notes of Christ University's Bangalore Kengeri Campus, featuring breathtaking performances by the University’s Cultural Team, Choir, and Band. The finest talents of our campus come together for a night of musical artistry. Erato showcases the beauty of music across genres, so let the music speak!",
    imageSrc: Erato, // Use imported image
    altText: "Erato",
    visible: false, // Initially hidden
    reverse: true,
  },
  {
    title: "Blossoms",
    description:
      "An annual cultural fest organised by the Student Welfare Office, Blossoms seeks to host activities and competitions at the inter deanery level. Much like Darpan in its search for talent and skills among the students and participants, Blossoms provides an opportunity on a bigger scale. With varying categories of activities like, literary, art, performing arts like music, dance and theatre the fest witnesses a remarkable display of flair and brilliance among all those associated with it.",
    imageSrc: Blossoms,
    altText: "Band 1",
    visible: false, // Initially hidden
    reverse: false, 
  },
  {
    title: "Talent Week",
    description: 
      "Talent Week is a stage for all students & faculties to showcase their talents through various artforms including music, theatre, streetplay and dance! Each day is dedicated to one artform allowing students from all around the campus to participate and take the stage!",
    imageSrc: TalentWeek,
    altText: "Talent Week",
    visible: false, // Initially hidden
    reverse: true,
  },
  {
    title: "Nritta",
    description:
      "One of the biggest stages is set for Nritta, the dance fest which showcases the multitude of talents among the students. The fest receives participation from hundreds of students every year who come forth to perform and portray their dancing abilities in numerous dance forms while simultaneously enjoying themselves. A robust and vibrant range of colours and performances are given by various groups from across all four campuses in Bangalore along with that of the cultural teams in each of the campuses.",
    imageSrc: Nritta,
    altText: "Nritta",
    visible: false, // Initially hidden
    reverse: false,
  },
];

const Event: React.FC<EventProps> = ({
  title,
  description,
  imageSrc,
  altText,
  visible,
  reverse = false,
}) => {
  return (
    <div
      className={`transition-opacity duration-1000 ease-in-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div
        className={`max-w-6xl mx-auto mt-4 flex flex-col sm:flex-row items-center ${
          reverse ? "sm:flex-row-reverse" : "sm:flex-row"
        }`}
      >
        {/* Text Section */}
        <div className="flex-1 p-4">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-700">{description}</p>
        </div>

        {/* Image Section */}
        <div className="flex-1 p-4 w-full sm:w-auto">
          <Image
            src={imageSrc}
            alt={altText}
            className="rounded-lg shadow-lg w-full h-auto"
            placeholder="blur"
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );
};

const EventsPage: React.FC = () => {
  const [visibleStates, setVisibleStates] = useState<boolean[]>(
    EventData.map(() => false)
  );

  useEffect(() => {
    const handleScroll = () => {
      const updatedStates = EventData.map((_, index) => {
        const element = document.getElementById(`event-${index}`);
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight - 100; // Fade in when the element is near the viewport
      });
      setVisibleStates(updatedStates);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Trigger on mount

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen py-10">
      {EventData.map((event, index) => (
        <div id={`event-${index}`} key={index}>
          <Event
            title={event.title}
            description={event.description}
            imageSrc={event.imageSrc}
            altText={event.altText}
            visible={visibleStates[index]} // Controlled by scroll logic
            reverse={event.reverse}
          />
        </div>
      ))}
    </div>
  );
};

export default EventsPage;
