"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255;
    g = parseInt(clean.substring(2, 4), 16) / 255;
    b = parseInt(clean.substring(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("");
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value || "#ffffff"));
  const [hexInput, setHexInput] = useState(value || "#ffffff");

  useEffect(() => {
    if (!open) return;
    const h = hsv.h;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, hc = canvas.height;
    ctx.clearRect(0, 0, w, hc);
    const gradX = ctx.createLinearGradient(0, 0, w, 0);
    gradX.addColorStop(0, "#fff");
    gradX.addColorStop(1, `hsl(${h}, 100%, 50%)`);
    ctx.fillStyle = gradX;
    ctx.fillRect(0, 0, w, hc);
    const gradY = ctx.createLinearGradient(0, 0, 0, hc);
    gradY.addColorStop(0, "transparent");
    gradY.addColorStop(1, "#000");
    ctx.fillStyle = gradY;
    ctx.fillRect(0, 0, w, hc);
  }, [open, hsv.h]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCanvasDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    pickFromCanvas(e);
  }, [hsv.h]);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging.current) pickFromCanvas(e);
  }, [hsv.h]);

  const handleCanvasUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const pickFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const s = x;
    const v = 1 - y;
    const hex = hsvToHex(hsv.h, s, v);
    setHsv({ h: hsv.h, s, v });
    setHexInput(hex);
    onChange(hex);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value);
    const hex = hsvToHex(h, hsv.s, hsv.v);
    setHsv({ h, s: hsv.s, v: hsv.v });
    setHexInput(hex);
    onChange(hex);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const hsv2 = hexToHsv(val);
      setHsv(hsv2);
      onChange(val);
    }
  };

  const handleHexBlur = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
      const fixed = hsvToHex(hsv.h, hsv.s, hsv.v);
      setHexInput(fixed);
    }
  };

  const markerX = hsv.s * 100;
  const markerY = (1 - hsv.v) * 100;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/[0.15] transition-all outline-none"
      >
        <div className="w-6 h-6 rounded-lg border border-white/20 shrink-0" style={{ backgroundColor: value }} />
        <span className="font-mono">{value}</span>
        <svg
          className={`w-4 h-4 ml-auto text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full min-w-[200px] bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl shadow-black/50 space-y-3"
            onMouseUp={handleCanvasUp}
            onMouseLeave={handleCanvasUp}
          >
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={200}
                height={160}
                className="w-full h-40 rounded-lg cursor-crosshair"
                onMouseDown={handleCanvasDown}
                onMouseMove={handleCanvasMove}
              />
              <div
                className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  left: `calc(${markerX}% - 7px)`,
                  top: `calc(${markerY}% - 7px)`,
                  backgroundColor: value,
                }}
              />
            </div>

            <input
              type="range"
              min="0"
              max="360"
              value={Math.round(hsv.h)}
              onChange={handleHueChange}
              className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
              style={{
                background: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)`,
              }}
            />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-white/20 shrink-0" style={{ backgroundColor: value }} />
              <input
                type="text"
                value={hexInput}
                onChange={handleHexInput}
                onBlur={handleHexBlur}
                maxLength={7}
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorPicker;
