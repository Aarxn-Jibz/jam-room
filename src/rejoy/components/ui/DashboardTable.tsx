"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import TimePicker from "./TimePicker";

const to12Hour = (time: string): string => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

interface SlotConfig {
  id: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

const DashboardTable: React.FC = () => {
  const [configs, setConfigs] = useState<SlotConfig[]>([]);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isTableScrolled, setIsTableScrolled] = useState(false);
  const itemsPerPage = 7;

  const handleTableScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (el) {
      setIsTableScrolled(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/slotconfig");
      setConfigs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addConfig = async (start: string, end: string) => {
    if (!start || !end) {
      alert("Please enter both start and end times.");
      return;
    }
    try {
      await axios.post("/api/slotconfig", {
        start_time: start,
        end_time: end,
        enabled: newEnabled,
      });
      setNewStart("");
      setNewEnd("");
      fetchConfigs();
    } catch (error) {
      console.error("Error creating slot configuration:", error);
    }
  };

  const toggleEnabled = async (id: number, current: boolean) => {
    try {
      await axios.put("/api/slotconfig", {
        id,
        enabled: !current,
      });
      fetchConfigs();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteConfig = async (id: number) => {
    try {
      await axios.delete(`/api/slotconfig?id=${id}`);
      setCurrentPage(1);
      fetchConfigs();
    } catch (error) {
      console.error(error);
    }
  };

  const totalPages = Math.ceil(configs.length / itemsPerPage);
  const currentConfigs = configs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-white w-full shadow-2xl relative">
      {loading && (
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 animate-pulse" />
      )}

      <h2 className="text-2xl font-bold mb-6 font-mono">Slot Configuration</h2>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 font-mono">
          <TimePicker
            value={newStart}
            onChange={setNewStart}
            placeholder="Start time"
          />
        </div>
        <div className="flex-1 font-mono">
          <TimePicker
            value={newEnd}
            onChange={setNewEnd}
            placeholder="End time"
          />
        </div>
        <button
          onClick={() => addConfig(newStart, newEnd)}
          className="flex-1 font-mono px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl border border-purple-400/20 shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400 active:scale-[0.98] text-sm font-semibold transition-all"
        >
          Add Slot
        </button>
      </div>

      <div className="relative">
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]"
        >
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Start Time</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">End Time</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentConfigs.map((config, index) => (
              <motion.tr
                key={config.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="border-b border-white/10 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{config.id}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-400">{to12Hour(config.start_time)}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-400">{to12Hour(config.end_time)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      config.enabled
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {config.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleEnabled(config.id, config.enabled)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all text-red-400"
                    >
                      <FaTimes />
                    </button>
                    <button
                      onClick={() => deleteConfig(config.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all text-gray-400"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        </div>
        {isTableScrolled && (
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-black-100/80 via-black-100/40 to-transparent pointer-events-none rounded-r-2xl" />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-all"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, i, arr) => {
              const showEllipsis = i > 0 && p - arr[i - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="text-xs text-gray-500 px-1">…</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === p
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-all"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardTable;
