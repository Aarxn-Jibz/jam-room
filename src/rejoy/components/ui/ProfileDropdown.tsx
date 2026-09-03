"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Band {
  id: string;
  name: string;
  colour: string;
}

interface ProfileDropdownProps {
  value: string;
  onChange: (value: string) => void;
  bands: Band[];
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ value, onChange, bands }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = bands.find(b => b.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/[0.15] transition-all outline-none"
      >
        <span className={`flex items-center gap-2 font-mono ${selected ? "text-white" : "text-gray-500"}`}>
          {selected && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.colour }} />}
          {selected ? selected.name : "Select a Profile"}
        </span>
        <svg
          className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
            className="absolute z-50 mt-2 w-full bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-xl overflow-y-auto shadow-2xl shadow-black/50 max-h-48"
          >
            {bands.map(b => (
              <li
                key={b.id}
                onClick={() => { onChange(b.id); setOpen(false); }}
                className={`px-4 py-3 sm:py-3 text-sm cursor-pointer transition-all hover:bg-purple-500/20 hover:text-purple-300 font-mono ${
                  b.id === value ? "text-purple-400 bg-purple-500/10" : "text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.colour }} />
                  {b.name}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
