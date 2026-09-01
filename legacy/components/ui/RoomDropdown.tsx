"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RoomDropdownProps {
  value: number;
  onChange: (value: number) => void;
  rooms: number[];
  allLabel?: string;
}

const RoomDropdown: React.FC<RoomDropdownProps> = ({ value, onChange, rooms, allLabel }) => {
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
        className="flex items-center font-mono gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm hover:bg-white/20 transition-all outline-none text-white"
      >
        <span>{value === -1 && allLabel ? allLabel : value}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
            className="absolute z-50 mt-2 w-full bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {allLabel && (
              <li
                onClick={() => { onChange(-1); setOpen(false); }}
                className={`px-3 py-3 sm:py-2.5 text-sm cursor-pointer transition-all hover:bg-purple-500/20 hover:text-purple-300 ${
                  -1 === value ? "text-purple-400 bg-purple-500/10" : "text-white"
                }`}
              >
                {allLabel}
              </li>
            )}
            {rooms.map(room => (
              <li
                key={room}
                onClick={() => { onChange(room); setOpen(false); }}
                className={`px-3 py-3 sm:py-2.5 text-sm cursor-pointer transition-all hover:bg-purple-500/20 hover:text-purple-300 ${
                  room === value ? "text-purple-400 bg-purple-500/10" : "text-white"
                }`}
              >
                {room}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomDropdown;
