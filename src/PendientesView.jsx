import React from "react";
import { CheckCircle2, Ban, CalendarDays } from "lucide-react";
import {
  cardCls,
  splitDateTime,
  fmtDate,
  statusOf,
  STATUS_LABEL,
} from "./agendaUtils";

const pill =
  "flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full shadow-sm hover:shadow-md hover:scale-105 transition transform";

export default function PendientesView({ overdue, onStatus, onGoTo }) {
  return (
    <section className="md:col-span-3">
      <div className={cardCls}>
        <div className="mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Servicios pendientes</div>
          <div className="text-xl font-semibold">Atrasados (anteriores a hoy)</div>
        </div>

        {overdue.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
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
                  className="p-3 border-l-4 border-l-red-400 rounded-lg shadow-sm bg-red-50 dark:bg-red-950 flex items-start justify-between gap-3 max-sm:flex-col"
                >
                  <div>
                    <div className="font-medium text-red-800 dark:text-red-200">
                      {s.clientName}
                      {estado !== "pendiente" && (
                        <span className="ml-2 text-xs px-2 py-[1px] rounded-full bg-amber-200 text-amber-900">
                          {STATUS_LABEL[estado] || estado}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {fmtDate(date)} • {time}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {s.description || "(Sin descripción)"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onGoTo(s)}
                      className={`${pill} bg-blue-600 text-white hover:bg-blue-700`}
                    >
                      <CalendarDays size={16} />
                      <span>Ver en agenda</span>
                    </button>
                    <button
                      onClick={() => onStatus(s.id, "finalizado")}
                      className={`${pill} bg-green-600 text-white hover:bg-green-700`}
                    >
                      <CheckCircle2 size={16} />
                      <span>Finalizado</span>
                    </button>
                    <button
                      onClick={() => onStatus(s.id, "cancelado")}
                      className={`${pill} bg-gray-600 text-white hover:bg-gray-700`}
                    >
                      <Ban size={16} />
                      <span>Cancelar</span>
                    </button>
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
