import React from "react";
import { CheckCircle2, Ban, CalendarDays } from "lucide-react";
import {
  cardCls,
  btn,
  btnSm,
  splitDateTime,
  fmtDate,
  statusOf,
  STATUS_LABEL,
} from "./agendaUtils";

export default function PendientesView({ overdue, onStatus, onGoTo }) {
  return (
    <section className="md:col-span-3">
      <div className={cardCls}>
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Servicios pendientes
          </div>
          <div className="text-2xl font-bold">Atrasados (anteriores a hoy)</div>
        </div>

        {overdue.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No hay servicios pendientes anteriores a hoy. 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {overdue.map((s) => {
              const { date, time } = splitDateTime(s.datetime);
              const estado = statusOf(s);
              return (
                <div
                  key={s.id}
                  className="flex rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden"
                >
                  <div className="w-1.5 shrink-0 bg-rose-500" />
                  <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-50">
                        {s.clientName}
                        {estado !== "pendiente" && (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
                            {STATUS_LABEL[estado] || estado}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-rose-600 dark:text-rose-300">
                        {fmtDate(date)} • {time}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {s.description || "(Sin descripción)"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => onGoTo(s)} className={`${btn.primary} ${btnSm}`}>
                        <CalendarDays size={14} />
                        <span>Ver en agenda</span>
                      </button>
                      <button
                        onClick={() => onStatus(s.id, "finalizado")}
                        className={`${btn.green} ${btnSm}`}
                      >
                        <CheckCircle2 size={14} />
                        <span>Finalizado</span>
                      </button>
                      <button
                        onClick={() => onStatus(s.id, "cancelado")}
                        className={`${btn.ghost} ${btnSm}`}
                      >
                        <Ban size={14} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
