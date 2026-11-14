import React from "react";
import { ClipboardPlus, CalendarDays, Clock3, Repeat, Edit3, Trash2, UserCog } from "lucide-react";
import { cardCls, TECHS, fmtDate } from "./agendaUtils";

export default function ProgramadosView({ programados, onNew, onEdit, onDelete }) {
  return (
    <section className="md:col-span-3">
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Servicios programados</div>
            <div className="text-xl font-semibold">Listado de programaciones</div>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-5 py-2 text-base font-medium bg-cyan-600 text-white rounded-full shadow-sm hover:bg-cyan-700 hover:shadow-md hover:scale-105 transition-all duration-150 max-sm:text-sm"
          >
            <ClipboardPlus size={16} className="text-white" />
            <span>Nuevo programado</span>
          </button>
        </div>

        {programados.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No hay servicios programados. Hacé clic en "Nuevo programado" para agregar uno.
          </div>
        ) : (
          <div className="space-y-3">
            {programados.map((p) => {
              const meses = Number(p.frecuencia) || 1;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-200 bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-cyan-800 dark:text-cyan-200">{p.cliente}</div>
                    <div className="text-sm text-gray-800 dark:text-gray-300">
                      {p.descripcion || "(sin descripción)"}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-400 mt-1">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={15} className="text-gray-500 dark:text-gray-400" />
                        <span>{fmtDate(String(p.fecha).slice(0, 10))}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock3 size={15} className="text-gray-500 dark:text-gray-400" />
                        <span>{p.hora ? String(p.hora).slice(0, 5) : "09:00"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Repeat size={15} className="text-gray-500 dark:text-gray-400" />
                        <span>
                          cada {meses === 12 ? "año" : `${meses} mes${meses > 1 ? "es" : ""}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserCog size={15} className="text-gray-500 dark:text-gray-400" />
                        <span>{TECHS.find((t) => t.id === p.tecnico)?.name || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onEdit(p)}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 hover:shadow-md hover:scale-105 transition transform"
                    >
                      <Edit3 size={15} />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 hover:shadow-md hover:scale-105 transition transform"
                    >
                      <Trash2 size={15} />
                      Eliminar
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
