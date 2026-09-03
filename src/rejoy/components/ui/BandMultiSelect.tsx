"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck } from "react-icons/fa";

interface Band {
  id: string;
  name: string;
}

interface BandMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  bands: Band[];
}

const BandMultiSelect: React.FC<BandMultiSelectProps> = ({ value, onChange, bands }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter(v => v !== id) : [...value, id]
    );
  };

  const selectedNames = bands.filter(b => value.includes(b.id)).map(b => b.name);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/[0.15] transition-all outline-none"
      >
        <span className={selectedNames.length ? "text-white" : "text-gray-500"}>
          {selectedNames.length ? selectedNames.join(", ") : "Select profiles"}
        </span>
        <svg
          className={`w-4 h-4 ml-2 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
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
            className="absolute z-50 mt-2 w-full bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl shadow-black/50 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {bands.map(b => {
              const selected = value.includes(b.id);
              return (
                <li
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-all hover:bg-purple-500/20 hover:text-purple-300 ${
                    selected ? "text-purple-400 bg-purple-500/10" : "text-white"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    selected ? "bg-purple-500 border-purple-500" : "border-white/30"
                  }`}>
                    {selected && <FaCheck className="text-white text-[8px]" />}
                  </div>
                  {b.name}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BandMultiSelect;
