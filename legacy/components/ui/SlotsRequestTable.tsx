"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { FaCalendarAlt, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Modal from "./Modal";
import RoomDropdown from "./RoomDropdown";
import FilterDropdown from "./FilterDropdown";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";

export type RequestType = {
  id: string;
  user_id: string;
  status: "approved" | "denied" | "pending";
  slot_start: string;
  slot_end: string;
  request_date: string;
  response_date: string | null;
  user_name?: string;
  band_name?: string;
  reason?: string;
  room_id: string;
};

const statusColorMap = {
  approved: "bg-green-500/20 text-green-300",
  denied: "bg-red-500/20 text-red-300",
  pending: "bg-amber-500/20 text-amber-300",
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
];

interface SlotsRequestsTableProps {
  isAdmin: boolean;
  userId: string;
}

export default function SlotsRequestTable({ isAdmin, userId }: SlotsRequestsTableProps) {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestType[]>([]);
  const [rooms, setRooms] = useState<{ id: string; number: string }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [isTableScrolled, setIsTableScrolled] = useState(false);
  const itemsPerPage = 7;

  const handleTableScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (el) {
      setIsTableScrolled(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }
  }, []);

  const roomIdsByNumber = useMemo(() => {
    const map: { [key: number]: string } = {};
    rooms.forEach(r => {
      const num = parseInt(r.number, 10);
      if (!isNaN(num)) map[num] = r.id;
    });
    return map;
  }, [rooms]);

  const roomNumbers = useMemo(
    () => Object.keys(roomIdsByNumber).map(Number).sort((a, b) => a - b),
    [roomIdsByNumber]
  );

  const roomNumbersById = useMemo(() => {
    const map: { [key: string]: number } = {};
    Object.entries(roomIdsByNumber).forEach(([num, id]) => {
      map[id] = parseInt(num, 10);
    });
    return map;
  }, [roomIdsByNumber]);

  const selectedRoomNumber = useMemo(() => {
    if (selectedRoom === "all") return -1;
    const entry = Object.entries(roomIdsByNumber).find(([, id]) => id === selectedRoom);
    return entry ? parseInt(entry[0], 10) : roomNumbers[0] || 365;
  }, [selectedRoom, roomIdsByNumber, roomNumbers]);

  useEffect(() => {
    const fetchRoomsAndRequests = async () => {
      try {
        const roomsRes = await axios.get("/api/rooms");
        setRooms(roomsRes.data);
      } catch (error) {
        console.error("Error fetching rooms", error);
      }
    };
    fetchRoomsAndRequests();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!selectedRoom) return;
      setLoadingRequests(true);
      try {
        const params: any = {};
        if (selectedRoom !== "all") params.room_id = selectedRoom;
        if (!isAdmin) params.user_id = userId;
        const res = await axios.get("/api/requests", { params });
        setRequests(res.data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [selectedRoom, isAdmin, userId]);

  useEffect(() => {
    let tempRequests = requests.filter((req) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (req.user_name || "").toLowerCase().includes(q) ||
        (req.band_name || "").toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesDate = !dateFilter || format(new Date(req.request_date), "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd");

      return matchesSearch && matchesStatus && matchesDate;
    });
    setFilteredRequests(tempRequests);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, requests]);

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const formatError = (err: any): string => {
    const data = err.response?.data;
    if (err.response?.status === 409) {
      return `This time slot is already booked by ${data?.band_name || "another profile"}. Please choose a different time or room.`;
    }
    return data?.message || "An unexpected error occurred. Please try again.";
  };

  const handleAction = async (id: string, newStatus: "approved" | "denied" | "delete") => {
    try {
      if (newStatus === 'delete') {
        await axios.delete(`/api/requests?id=${id}`);
        setRequests(prev => prev.filter(r => r.id !== id));
      } else {
        const res = await axios.put(`/api/requests?id=${id}`, { status: newStatus });
        const updated = res.data.request;
        setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      }
    } catch (error: any) {
        setModalTitle("Action Failed");
        setModalContent(<p>{formatError(error)}</p>)
        setModalOpen(true);
    }
  };

  const openEditModal = (req: RequestType) => {
    setModalTitle("Edit Request");
    setModalContent(
      <EditRequestForm
        request={req}
        rooms={rooms}
        roomIdsByNumber={roomIdsByNumber}
        onSave={(updated) => {
          if (updated) setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
          setModalOpen(false);
        }}
        onError={(msg) => {
          setModalOpen(false);
          setTimeout(() => {
            setModalTitle("Action Failed");
            setModalContent(<p>{msg}</p>);
            setModalOpen(true);
          }, 200);
        }}
      />
    );
    setModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-white w-full h-full flex flex-col shadow-2xl relative"
    >
      {loadingRequests && (
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-medium text-gray-400 uppercase tracking-widest">Room</span>
          <RoomDropdown
            value={selectedRoomNumber}
            onChange={(num) => setSelectedRoom(num === -1 ? "all" : roomIdsByNumber[num])}
            rooms={roomNumbers}
            allLabel="All Rooms"
          />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/10">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white/10 font-mono border border-white/20 rounded-full px-4 py-2 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full sm:w-40"
          />
          <button
            onClick={() => {
              setModalTitle("Select Date");
              setModalContent(
                <div className="py-2">
                  <DatePicker
                    selected={dateFilter}
                    onSelect={(d) => { setDateFilter(d); setModalOpen(false); }}
                  />
                </div>
              );
              setModalOpen(true);
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-purple-400"
          >
            <FaCalendarAlt />
          </button>
          {dateFilter && (
            <button
              onClick={() => setDateFilter(undefined)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-400"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {loadingRequests ? (
        <div className="flex flex-col items-center justify-center gap-5 py-20 text-gray-400">
          <motion.svg
            className="w-8 h-8 text-purple-400/80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <path d="M6.5 4h11v2.5L13 12l4.5 5.5V20h-11v-2.5L11 12 6.5 6.5V4z" />
            <path d="M8 14.5h8" strokeWidth="1" />
          </motion.svg>
          <span className="text-sm font-medium">Loading requests...</span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Table */}
          <div className="relative">
            <div
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]"
            >
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5">
                <tr>
                  {isAdmin && <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">User</th>}
                  {selectedRoom === "all" && <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Room</th>}
                  <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Profile</th>
                  <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Slot</th>
                  <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Requested</th>
                  <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Responded</th>
                  <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Status</th>
                  <th className="p-2 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req, idx) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    className="border-b border-white/10 group hover:bg-white/[0.03] transition-colors"
                  >
                    {isAdmin && <td className="p-2 sm:p-3 text-sm font-mono text-gray-400">{req.user_name}</td>}
                    {selectedRoom === "all" && <td className="p-2 sm:p-3 text-sm font-mono text-gray-500">Room {roomNumbersById[req.room_id]}</td>}
                    <td className="p-2 sm:p-3 text-sm font-mono text-gray-400">{req.band_name}</td>
                    <td className="p-2 sm:p-3 font-mono text-sm text-gray-500">{format(new Date(req.slot_start), "MMM d, h:mm a")}</td>
                    <td className="p-2 sm:p-3 font-mono text-sm text-gray-500">{format(new Date(req.request_date), "MMM d, h:mm a")}</td>
                    <td className="p-2 sm:p-3 font-mono text-sm text-gray-500">{req.response_date ? format(new Date(req.response_date), "MMM d, h:mm a") : "—"}</td>
                    <td className="p-2 sm:p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusColorMap[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex gap-1 sm:gap-2 flex-wrap">
                        {isAdmin && req.status === 'pending' && (
                          <button
                            onClick={() => handleAction(req.id, 'approved')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-all text-green-400"
                          >
                            <FaCheck />
                          </button>
                        )}
                        {isAdmin && req.status === 'pending' && (
                          <button
                            onClick={() => handleAction(req.id, 'denied')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-all text-red-400"
                          >
                            <FaTimes />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(req)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-all text-blue-400"
                          >
                            <FaEdit />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(req.id, 'delete')}
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
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-all"
          >
            &lt;
          </button>
          {Array.from({length: totalPages}, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, i, arr) => {
              const showEllipsis = i > 0 && p - arr[i - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="text-xs text-gray-500 px-1">…</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                      currentPage === p
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono transition-all"
          >
            &gt;
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </motion.div>
  );
}

const EditRequestForm = ({ request, rooms, roomIdsByNumber, onSave, onError }: {
  request: RequestType;
  rooms: { id: string; number: string }[];
  roomIdsByNumber: { [key: number]: string };
  onSave: (updated?: RequestType) => void;
  onError?: (msg: string) => void;
}) => {
  const [formState, setFormState] = useState(request);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roomNumbers = useMemo(
    () => rooms.map(r => parseInt(r.number, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b),
    [rooms]
  );

  const selectedRoomNumber = useMemo(() => {
    const entry = Object.entries(roomIdsByNumber).find(([, id]) => id === formState.room_id);
    return entry ? parseInt(entry[0], 10) : roomNumbers[0] || 365;
  }, [formState.room_id, roomIdsByNumber, roomNumbers]);

  const handleSave = async () => {
    try {
      const { user_name, band_name, ...dbFields } = formState;
      const res = await axios.put(`/api/requests?id=${formState.id}`, dbFields);
      onSave(res.data.request);
    } catch (error: any) {
      const data = error.response?.data;
      if (error.response?.status === 409) {
        onError?.(`This time slot is already booked by ${data?.band_name || "another profile"}. Please choose a different time or room.`);
      } else {
        onError?.(data?.message || "An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="space-y-2 shrink-0">
          <label className="text-xs font-bold text-gray-400 uppercase font-mono">Room</label>
          <RoomDropdown
            value={selectedRoomNumber}
            onChange={(num) => setFormState({...formState, room_id: roomIdsByNumber[num]})}
            rooms={roomNumbers}
          />
        </div>
        <div className="space-y-2 relative flex-1 min-w-0" ref={dateRef}>
          <label className="text-xs font-bold text-gray-400 uppercase font-mono">Date</label>
          <button
            type="button"
            onClick={() => setShowDatePicker(o => !o)}
            className="w-full flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-mono hover:bg-white/20 transition-all outline-none text-white"
          >
            <FaCalendarAlt className="text-purple-400 text-xs" />
            <span>{format(new Date(formState.slot_start), "MMM d, yyyy")}</span>
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ml-auto ${showDatePicker ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDatePicker && (
            <div className="absolute z-50 mt-2 left-0 right-0 w-full bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
              <DatePicker
                selected={new Date(formState.slot_start)}
                onSelect={(d) => {
                  const t = format(new Date(formState.slot_start), "HH:mm");
                  setFormState({...formState, slot_start: new Date(`${format(d, "yyyy-MM-dd")}T${t}:00`).toISOString()});
                  setShowDatePicker(false);
                }}
              />
            </div>
          )}
        </div>
        <div className="space-y-2 shrink-0">
          <label className="text-xs font-bold text-gray-400 uppercase font-mono">Time</label>
          <TimePicker
            value={format(new Date(formState.slot_start), "HH:mm")}
            onChange={(time) => {
              const d = format(new Date(formState.slot_start), "yyyy-MM-dd");
              setFormState({...formState, slot_start: new Date(`${d}T${time}:00`).toISOString()});
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase font-mono">Status</label>
        <div className="flex gap-2">
          {["pending", "approved", "denied"].map(s => (
            <button
              key={s}
              onClick={() => setFormState({...formState, status: s as any})}
              className={`flex-1 px-4 py-2.5 text-sm font-mono rounded-xl transition-all ${
                formState.status === s
                  ? s === 'approved'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : s === 'denied'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase font-mono">Reason</label>
        <textarea
          value={formState.reason || ""}
          onChange={e => setFormState({...formState, reason: e.target.value})}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-mono h-24 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>
      <button
        onClick={handleSave}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-mono font-bold rounded-xl border border-purple-400/20 hover:from-purple-700 hover:to-purple-600 hover:border-purple-400/40 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]"
      >
        Save
      </button>
    </div>
  );
};
