import React from "react";
import {
  MapPin,
  Phone,
  Smartphone,
  UserCog,
  Edit3,
  Trash2,
  CheckCircle2,
  User2,
  ChevronDown,
  ChevronUp,
  Play,
  Ban,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import {
  TECHS,
  statusOf,
  splitDateTime,
  waLink,
  buildVisitMessage,
} from "./agendaUtils";

const pill =
  "flex items-center gap-1 px-3 py-1 text-sm font-medium border rounded-full shadow-sm hover:shadow-md hover:scale-105 transition transform max-sm:text-xs";

const containerStyle = (estado, programado, highlighted) => {
  if (highlighted) return "bg-violet-100 dark:bg-violet-900 border-l-violet-500";
  if (estado === "finalizado") return "border-l-green-400 bg-green-100 dark:bg-green-950";
  if (estado === "cancelado") return "border-l-gray-400 bg-gray-100 dark:bg-slate-900 opacity-80";
  if (estado === "en curso") return "border-l-amber-400 bg-amber-100 dark:bg-amber-950";
  if (programado) return "bg-cyan-100 border-l-cyan-500 dark:bg-cyan-950";
  return "border-l-red-400 bg-red-100 dark:bg-red-950";
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
      className={`p-4 rounded-xl shadow-md border-l-4 transition-all duration-200 text-slate-800 dark:text-slate-100 ${
        closed ? "cursor-pointer" : ""
      } ${containerStyle(estado, !!s.programado_id, highlighted)}`}
    >
      <div className="flex justify-between items-start max-sm:flex-col max-sm:gap-2">
        {/* Datos del servicio */}
        <div className="w-full">
          <div className="flex items-center justify-between max-sm:flex-wrap">
            <div className="flex items-center space-x-6 max-sm:space-x-3 max-sm:flex-wrap">
              <span className="font-semibold text-gray-800 dark:text-gray-100 max-sm:text-sm flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <User2 size={16} className="text-gray-600 dark:text-gray-400 relative top-[1px]" />
                  {s.clientName}
                </span>
                {s.programado_id && (
                  <span className="px-2 py-[2px] text-xs rounded-full bg-cyan-200 text-cyan-900 border border-cyan-400">
                    Programado
                  </span>
                )}
                {estado === "en curso" && (
                  <span className="px-2 py-[2px] text-xs rounded-full bg-amber-200 text-amber-900 border border-amber-400">
                    En curso
                  </span>
                )}
                {estado === "cancelado" && (
                  <span className="px-2 py-[2px] text-xs rounded-full bg-gray-300 text-gray-800 border border-gray-400">
                    Cancelado
                  </span>
                )}
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100 max-sm:text-sm">
                {time}
              </span>
            </div>

            {closed && (
              <span
                onClick={stop(() => onToggle(s.id))}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 cursor-pointer ml-2"
              >
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            )}
          </div>

          {collapsed && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-sm:text-xs italic truncate">
              {s.description}
            </div>
          )}

          {!collapsed && (
            <>
              {equipo && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 max-sm:text-xs">
                  {equipo}
                </div>
              )}

              <div className="text-sm text-gray-800 dark:text-gray-100 mt-1 max-sm:text-xs">
                {s.description}
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 max-sm:text-xs break-words">
                <span className="inline-flex items-center">
                  <MapPin size={16} className="mr-1 text-gray-500 dark:text-gray-400 relative top-[1px]" />
                  {s.address}
                </span>
                {" • "}
                {phoneLink ? (
                  <a
                    href={phoneLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center text-green-600 hover:underline ml-1"
                  >
                    <Smartphone size={16} className="mr-1 text-green-600 relative top-[1px]" />
                    {s.phone}
                  </a>
                ) : (
                  <span className="inline-flex items-center text-gray-700 dark:text-gray-300 ml-1">
                    <Phone size={16} className="mr-1 text-gray-600 dark:text-gray-400 relative top-[1px]" />
                    {s.phone}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Técnico y botones */}
        {!collapsed && (
          <div className="flex flex-col items-end gap-2 mt-2 max-sm:items-start max-sm:w-full">
            <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <span className="inline-flex items-center whitespace-nowrap">
                <UserCog size={14} className="mr-1 text-gray-500 dark:text-gray-400 relative top-[1px]" />
                Técnico: {tech || "-"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 justify-end max-sm:justify-start">
              {avisoLink && !closed && (
                <a
                  href={avisoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Abrir WhatsApp con el mensaje de la visita ya escrito"
                  className={`${pill} bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200`}
                >
                  <MessageCircle size={16} className="text-emerald-600" />
                  <span>Avisar al cliente</span>
                </a>
              )}

              <button
                onClick={stop(() => onEdit(s))}
                className={`${pill} bg-blue-100 border-blue-400 text-blue-700 hover:bg-blue-200`}
              >
                <Edit3 size={16} className="text-blue-600" />
                <span>Editar</span>
              </button>

              {estado === "pendiente" && (
                <button
                  onClick={stop(() => onStatus(s.id, "en curso"))}
                  className={`${pill} bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200`}
                >
                  <Play size={16} className="text-amber-600" />
                  <span>En curso</span>
                </button>
              )}

              {!closed && (
                <button
                  onClick={stop(() => onStatus(s.id, "finalizado"))}
                  className={`${pill} bg-green-100 border-green-400 text-green-700 hover:bg-green-200`}
                >
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>Finalizado</span>
                </button>
              )}

              {!closed && (
                <button
                  onClick={stop(() => onStatus(s.id, "cancelado"))}
                  className={`${pill} bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-200`}
                >
                  <Ban size={16} className="text-gray-600" />
                  <span>Cancelar</span>
                </button>
              )}

              {closed && (
                <button
                  onClick={stop(() => onStatus(s.id, "pendiente"))}
                  className={`${pill} bg-white border-slate-400 text-slate-700 hover:bg-slate-100`}
                >
                  <RotateCcw size={16} className="text-slate-600" />
                  <span>Reabrir</span>
                </button>
              )}

              <button
                onClick={stop(() => onDelete(s.id))}
                className={`${pill} bg-red-100 border-red-400 text-red-700 hover:bg-red-200`}
              >
                <Trash2 size={16} className="text-red-600" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
