import React from "react";
import { ClipboardPlus, CalendarDays, Clock3, Repeat, Edit3, Trash2, UserCog } from "lucide-react";
import { cardCls, btn, btnSm, TECHS, fmtDate } from "./agendaUtils";

export default function ProgramadosView({ programados, onNew, onEdit, onDelete }) {
  return (
    <section className="md:col-span-3">
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-3 mb-5 max-sm:flex-col max-sm:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Servicios programados
            </div>
            <div className="text-2xl font-bold">Listado de programaciones</div>
          </div>
          <button onClick={onNew} className={btn.cyan}>
            <ClipboardPlus size={16} />
            <span>Nuevo programado</span>
          </button>
        </div>

        {programados.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No hay servicios programados. Tocá "Nuevo programado" para agregar uno.
          </div>
        ) : (
          <div className="space-y-3">
            {programados.map((p) => {
              const meses = Number(p.frecuencia) || 1;
              return (
                <div
                  key={p.id}
                  className="flex rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden"
                >
                  <div className="w-1.5 shrink-0 bg-cyan-500" />
                  <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-cyan-800 dark:text-cyan-300">
                        {p.cliente}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {p.descripcion || "(sin descripción)"}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={15} />
                          {fmtDate(String(p.fecha).slice(0, 10))}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={15} />
                          {p.hora ? String(p.hora).slice(0, 5) : "09:00"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Repeat size={15} />
                          cada {meses === 12 ? "año" : `${meses} mes${meses > 1 ? "es" : ""}`}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserCog size={15} />
                          {TECHS.find((t) => t.id === p.tecnico)?.name || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button onClick={() => onEdit(p)} className={`${btn.ghost} ${btnSm}`}>
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => onDelete(p.id)}
                        title="Eliminar"
                        aria-label="Eliminar"
                        className={`${btn.softRed} ${btnSm}`}
                      >
                        <Trash2 size={14} />
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
