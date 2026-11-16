import React from "react";
import {
  MapPin,
  Phone,
  Smartphone,
  UserCog,
  Edit3,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  Ban,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import {
  TECHS,
  STATUS_LABEL,
  btn,
  btnSm,
  statusOf,
  splitDateTime,
  waLink,
  buildVisitMessage,
} from "./agendaUtils";

const STATUS_STYLE = {
  pendiente: {
    bar: "bg-rose-500",
    pill: "bg-rose-100 text-rose-800 ring-1 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30",
  },
  "en curso": {
    bar: "bg-amber-500",
    pill: "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
  },
  finalizado: {
    bar: "bg-emerald-500",
    pill: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30",
  },
  cancelado: {
    bar: "bg-slate-400",
    pill: "bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600",
  },
};

export default function ServiceCard({
  s,
  expanded,
  highlighted,
  onToggle,
  onEdit,
  onDelete,
  onStatus,
}) {
  const estado = statusOf(s);
  const closed = estado === "finalizado" || estado === "cancelado";
  const collapsed = closed && !expanded;
  const style = STATUS_STYLE[estado] || STATUS_STYLE.pendiente;
  const bar = highlighted
    ? "bg-violet-500"
    : estado === "pendiente" && s.programado_id
    ? "bg-cyan-500"
    : style.bar;

  const { time } = splitDateTime(s.datetime);
  const tech = TECHS.find((t) => t.id === s.tech)?.name;
  const phoneLink = waLink(s.phone);
  const avisoLink = waLink(s.phone, buildVisitMessage(s));
  const equipo = [s.type, [s.brand, s.model].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" • ");

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      onClick={() => closed && onToggle(s.id)}
      className={`flex rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
        highlighted
          ? "ring-2 ring-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-700"
          : "bg-white dark:bg-slate-900 border-slate-300/80 dark:border-slate-700"
      } ${closed ? "cursor-pointer" : ""} ${collapsed ? "opacity-75 hover:opacity-100" : ""}`}
    >
      <div className={`w-1.5 shrink-0 ${bar}`} />

      <div className="flex-1 min-w-0 p-4">
        {/* Hora, cliente y estado */}
        <div className="flex items-start gap-3">
          <div className="text-lg font-bold tabular-nums leading-6 text-slate-900 dark:text-white">
            {time || "--:--"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-slate-900 dark:text-slate-50 break-words">
                {s.clientName}
              </span>
              <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${style.pill}`}>
                {STATUS_LABEL[estado] || estado}
              </span>
              {s.programado_id && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/30">
                  Programado
                </span>
              )}
            </div>
            {collapsed && (
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                {s.description}
              </div>
            )}
          </div>
          {closed && (
            <span
              onClick={stop(() => onToggle(s.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Detalle */}
            <div className="mt-3 space-y-1.5">
              {equipo && (
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{equipo}</div>
              )}
              {s.description && (
                <div className="text-sm text-slate-800 dark:text-slate-100">{s.description}</div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                {s.address && (
                  <span className="inline-flex items-center gap-1 break-words">
                    <MapPin size={15} className="shrink-0" />
                    {s.address}
                  </span>
                )}
                {s.phone &&
                  (phoneLink ? (
                    <a
                      href={phoneLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <Smartphone size={15} />
                      {s.phone}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={15} />
                      {s.phone}
                    </span>
                  ))}
                <span className="inline-flex items-center gap-1">
                  <UserCog size={15} />
                  {tech || "-"}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
              {estado === "pendiente" && (
                <button
                  onClick={stop(() => onStatus(s.id, "en curso"))}
                  className={`${btn.softAmber} ${btnSm}`}
                >
                  <Play size={14} />
                  <span>En curso</span>
                </button>
              )}

              {!closed && (
                <button
                  onClick={stop(() => onStatus(s.id, "finalizado"))}
                  className={`${btn.green} ${btnSm}`}
                >
                  <CheckCircle2 size={14} />
                  <span>Finalizado</span>
                </button>
              )}

              {avisoLink && !closed && (
                <a
                  href={avisoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Abrir WhatsApp con el mensaje de la visita ya escrito"
                  className={`${btn.softGreen} ${btnSm}`}
                >
                  <MessageCircle size={14} />
                  <span>Avisar al cliente</span>
                </a>
              )}

              {closed && (
                <button
                  onClick={stop(() => onStatus(s.id, "pendiente"))}
                  className={`${btn.ghost} ${btnSm}`}
                >
                  <RotateCcw size={14} />
                  <span>Reabrir</span>
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                {!closed && (
                  <button
                    onClick={stop(() => onStatus(s.id, "cancelado"))}
                    className={`${btn.ghost} ${btnSm}`}
                  >
                    <Ban size={14} />
                    <span>Cancelar</span>
                  </button>
                )}
                <button onClick={stop(() => onEdit(s))} className={`${btn.ghost} ${btnSm}`}>
                  <Edit3 size={14} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={stop(() => onDelete(s.id))}
                  title="Eliminar"
                  aria-label="Eliminar"
                  className={`${btn.softRed} ${btnSm}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
