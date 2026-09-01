"use client";

import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";

interface DatePickerProps {
  selected?: Date;
  onSelect: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selected, onSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selected || new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="select-none w-full">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(d => subMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-white">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth(d => addMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdays.map(wd => (
          <div key={wd} className="text-center text-xs font-semibold text-gray-500 py-2">
            {wd}
          </div>
        ))}
        {days.map((d, i) => {
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isSelected = selected ? isSameDay(d, selected) : false;
          const isToday = isSameDay(d, new Date());

          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className={`text-sm rounded-xl py-2.5 transition-all ${
                isSelected
                  ? "bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/30"
                  : isToday && isCurrentMonth
                  ? "text-purple-300 font-semibold hover:bg-white/10 ring-2 ring-purple-500/50"
                  : isCurrentMonth
                  ? "text-white hover:bg-white/10"
                  : "text-gray-600"
              }`}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DatePicker;
