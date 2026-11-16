import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cardCls, toLocalISODate } from "./agendaUtils";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Calendario del mes. Los puntitos indican cuántos servicios hay cada día (hasta 3).
export default function CalendarPanel({ selectedDate, onSelect, onMonthChange, countsByDay }) {
  const todayISO = toLocalISODate(new Date());
  const selectedISO = toLocalISODate(selectedDate);

  const weeks = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7; // la semana empieza el lunes
    const lastDay = new Date(y, m + 1, 0).getDate();
    const cells = [
      ...Array(offset).fill(null),
      ...Array.from({ length: lastDay }, (_, i) => new Date(y, m, i + 1)),
    ];
    while (cells.length % 7) cells.push(null);
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [selectedDate]);

  const arrow =
    "flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition";

  return (
    <div className={`${cardCls} !p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-100">
          {selectedDate.toLocaleString("es-UY", { month: "long" })}{" "}
          <span className="text-slate-400 font-normal">{selectedDate.getFullYear()}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onMonthChange(-1)} className={arrow} aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => onMonthChange(1)} className={arrow} aria-label="Mes siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] font-semibold uppercase tracking-wide text-center text-slate-500 dark:text-slate-400">
        {weekDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {week.map((day, j) => {
              const iso = day ? toLocalISODate(day) : "";
              const isSelected = day && iso === selectedISO;
              const isToday = day && iso === todayISO;
              const cnt = day ? countsByDay[iso] || 0 : 0;
              return (
                <button
                  key={j}
                  disabled={!day}
                  onClick={() => day && onSelect(new Date(day))}
                  title={cnt ? `${cnt} servicio${cnt > 1 ? "s" : ""}` : undefined}
                  className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-sm transition ${
                    !day
                      ? "pointer-events-none"
                      : isSelected
                      ? "bg-blue-600 text-white font-semibold shadow-md"
                      : isToday
                      ? "bg-blue-100 text-blue-800 font-semibold ring-1 ring-blue-400 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-400/50"
                      : "bg-slate-50 text-slate-800 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {day && (
                    <>
                      <span className="leading-none">{day.getDate()}</span>
                      <span className="flex gap-0.5 h-1">
                        {Array.from({ length: Math.min(cnt, 3) }).map((_, k) => (
                          <span
                            key={k}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-600 dark:bg-blue-400"}`}
                          />
                        ))}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
