"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock } from "react-icons/fa";

function generateTimes(): string[] {
  const times: string[] = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return times;
}

const TIME_SLOTS = generateTimes();

const to12Hour = (time: string): string => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-mono hover:bg-white/20 transition-all outline-none text-white"
      >
        <FaClock className="text-purple-400 text-xs" />
        <span className={value ? "text-white" : "text-gray-500"}>{value ? to12Hour(value) : placeholder || "Select time"}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ml-auto ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 left-0 right-0 bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl shadow-black/50 max-h-40 overflow-y-auto"
          >
            {TIME_SLOTS.map((slot) => (
              <li
                key={slot}
                onClick={() => { onChange(slot); setOpen(false); }}
                className={`px-4 py-3 sm:py-2.5 text-sm cursor-pointer transition-all hover:bg-purple-500/20 hover:text-purple-300 font-mono ${
                  slot === value ? "text-purple-400 bg-purple-500/10" : "text-white"
                }`}
              >
                {to12Hour(slot)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimePicker;
