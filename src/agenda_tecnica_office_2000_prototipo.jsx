// Agenda Técnica Office2000 - v2.0
// Archivo principal. Las funciones de Supabase están en agendaApi.js, las utilidades
// en agendaUtils.js y las pantallas / tarjetas en sus propios archivos.
import toast, { Toaster } from "react-hot-toast";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  startTransition,
} from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ClipboardPlus,
  History,
  MessageCircle,
  Trash2,
  FileDown,
  Edit3,
  UserPlus,
  Search,
} from "lucide-react";

import { CotizadorView } from "./CotizadorModal";
import {
  supabase,
  fetchAll,
  insertRow,
  insertMany,
  updateRow,
  deleteRow,
  deleteServiciosFuturosDB,
} from "./agendaApi";
import {
  TECHS,
  LIMITE_MESES,
  STATUS_LABEL,
  cardCls,
  inputCls,
  labelCls,
  btn,
  capFirst,
  norm,
  statusOf,
  isClosed,
  toLocalISODate,
  startOfToday,
  splitDateTime,
  fmtDate,
  waNumber,
  normalizeTime,
  fechasProgramado,
  byDatetime,
  byName,
  byFecha,
  upsertById,
  newId,
} from "./agendaUtils";
import ServiceCard from "./ServiceCard";
import PendientesView from "./PendientesView";
import ClientesView from "./ClientesView";
import ProgramadosView from "./ProgramadosView";
import LoginScreen from "./LoginScreen";
import AppHeader from "./AppHeader";
import CalendarPanel from "./CalendarPanel";
import Modal from "./Modal";

// Si en Vercel se define REACT_APP_REQUIRE_LOGIN=true, se pide usuario y contraseña
const REQUIRE_LOGIN = process.env.REACT_APP_REQUIRE_LOGIN === "true";

const emptyService = {
  id: null,
  clientId: "",
  clientName: "",
  address: "",
  phone: "",
  type: "",
  brand: "",
  model: "",
  description: "",
  status: "pendiente",
  tech: TECHS[0].id,
};

const emptyProg = {
  id: "",
  cliente: "",
  direccion: "",
  telefono: "",
  descripcion: "",
  fecha: "",
  hora: "",
  frecuencia: "1",
  tecnico: TECHS[0].id,
};

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

export default function AgendaTecnicaOffice2000() {
  // ---------------- Estado general ----------------
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("agenda_dark") === "1";
    } catch (e) {
      return false;
    }
  });
  const [mostrarCotizador, setMostrarCotizador] = useState(false);
  const [view, setView] = useState("agenda");

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [programados, setProgramados] = useState([]);

  const [selectedDate, setSelectedDate] = useState(startOfToday);
  const [highlightServiceId, setHighlightServiceId] = useState(null);
  const [expandedServices, setExpandedServices] = useState([]);
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState("todos");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: "", id: null });

  // Formulario de servicio
  const [form, setForm] = useState(emptyService);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const suggestionsRef = useRef(null);

  // Servicios anteriores de un cliente
  const [selectedClientServices, setSelectedClientServices] = useState([]);
  const [showClientServicesModal, setShowClientServicesModal] = useState(false);

  // WhatsApp (número suelto)
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Cliente nuevo / editar
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", address: "", phone: "" });

  // Programados
  const [showProgramadoModal, setShowProgramadoModal] = useState(false);
  const [progForm, setProgForm] = useState(emptyProg);
  const [progSuggestions, setProgSuggestions] = useState([]);
  const progSuggestionsRef = useRef(null);
  const progClienteInputRef = useRef(null);

  // Acceso (login opcional)
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!REQUIRE_LOGIN);
  const canLoad = !REQUIRE_LOGIN || !!session;

  // Copias de las listas para que el realtime pueda consultarlas sin "congelarlas"
  const clientsRef = useRef([]);
  const programadosRef = useRef([]);
  clientsRef.current = clients;
  programadosRef.current = programados;

  // ---------------- Efectos ----------------
  useEffect(() => {
    try {
      localStorage.setItem("agenda_dark", darkMode ? "1" : "0");
    } catch (e) {
      /* sin almacenamiento local */
    }
  }, [darkMode]);

  // Instalable como app en el celular
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Sesión de Supabase (solo si se exige login)
  useEffect(() => {
    if (!REQUIRE_LOGIN) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (showForm) setTimeout(() => document.getElementById("inputCliente")?.focus(), 100);
  }, [showForm]);

  useEffect(() => {
    if (showProgramadoModal && progClienteInputRef.current) {
      setTimeout(() => progClienteInputRef.current?.focus(), 100);
    }
  }, [showProgramadoModal]);

  // Cerrar las listas de sugerencias al hacer clic afuera
  useEffect(() => {
    const onDoc = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setClientSuggestions([]);
      }
      if (progSuggestionsRef.current && !progSuggestionsRef.current.contains(e.target)) {
        setProgSuggestions([]);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    if (!highlightServiceId) return;
    const timer = setTimeout(() => setHighlightServiceId(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightServiceId]);

  // Carga inicial + actualizaciones en tiempo real
  useEffect(() => {
    if (!canLoad) return;
    let mounted = true;

    (async () => {
      const [c, s, p] = await Promise.all([
        fetchAll("clients", "name"),
        fetchAll("services", "datetime"),
        fetchAll("programados", "fecha"),
      ]);
      if (!mounted) return;
      setClients(c);
      setServices(s);
      setProgramados(p);
    })();

    // Escucha una tabla. Los avisos (toast) se muestran solo si el cambio NO lo hizo esta misma pantalla.
    const listen = (table, ref, setter, cmp, msgs) =>
      supabase
        .channel(`realtime-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
          const { eventType, new: nuevo, old } = payload;

          if (msgs && ref) {
            const prev = ref.current;
            if (eventType === "INSERT" && !prev.some((r) => r.id === nuevo.id)) {
              toast.success(msgs.ins(nuevo), { duration: 3000 });
            } else if (eventType === "UPDATE") {
              const cur = prev.find((r) => r.id === nuevo.id);
              if (!cur || JSON.stringify(cur) !== JSON.stringify(nuevo)) {
                toast(msgs.upd(nuevo), { duration: 3000 });
              }
            } else if (eventType === "DELETE" && prev.some((r) => r.id === old.id)) {
              toast.error(msgs.del(), { duration: 3000 });
            }
          }

          startTransition(() => {
            setter((prev) => {
              if (eventType === "INSERT" || eventType === "UPDATE") return upsertById(prev, nuevo, cmp);
              if (eventType === "DELETE") return prev.filter((r) => r.id !== old.id);
              return prev;
            });
          });
        })
        .subscribe();

    const channels = [
      listen("services", null, setServices, byDatetime, null),
      listen("clients", clientsRef, setClients, byName, {
        ins: (r) => `👤 Nuevo cliente: ${r.name}`,
        upd: (r) => `🧾 Cliente actualizado: ${r.name}`,
        del: () => "❌ Cliente eliminado",
      }),
      listen("programados", programadosRef, setProgramados, byFecha, {
        ins: (r) => `📅 Nuevo programado: ${r.cliente}`,
        upd: (r) => `🔄 Programado actualizado: ${r.cliente}`,
        del: () => "❌ Programado eliminado",
      }),
    ];

    return () => {
      mounted = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [canLoad]);

  // ---------------- Datos derivados ----------------
  const visibleServices = useMemo(
    () => (techFilter === "todos" ? services : services.filter((s) => s.tech === techFilter)),
    [services, techFilter]
  );

  const selectedISO = toLocalISODate(selectedDate);

  const servicesOfDay = useMemo(
    () =>
      visibleServices
        .filter((s) => splitDateTime(s.datetime).date === selectedISO)
        .sort((a, b) => {
          const ra = isClosed(a) ? 1 : 0;
          const rb = isClosed(b) ? 1 : 0;
          if (ra !== rb) return ra - rb; // abiertos arriba, cerrados abajo
          return byDatetime(a, b);
        }),
    [visibleServices, selectedISO]
  );

  const countsByDay = useMemo(() => {
    const m = {};
    visibleServices.forEach((s) => {
      const { date } = splitDateTime(s.datetime);
      m[date] = (m[date] || 0) + 1;
    });
    return m;
  }, [visibleServices]);

  // Pendientes / en curso de días anteriores a hoy
  const overdue = useMemo(() => {
    const hoy = startOfToday();
    return services
      .filter((s) => {
        const e = statusOf(s);
        return (e === "pendiente" || e === "en curso") && new Date(s.datetime) < hoy;
      })
      .sort(byDatetime);
  }, [services]);

  const searchResults = useMemo(() => {
    const q = norm(search);
    if (q.length < 2) return null;
    return visibleServices
      .filter((s) =>
        [s.clientName, s.description, s.address, s.phone, s.type, s.brand, s.model].some((v) =>
          norm(v).includes(q)
        )
      )
      .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
      .slice(0, 50);
  }, [search, visibleServices]);

  useEffect(() => {
    document.title = overdue.length
      ? `(${overdue.length}) Agenda Técnica Office2000`
      : "Agenda Técnica Office2000";
  }, [overdue.length]);

  // ---------------- Acciones ----------------
  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? "Email o contraseña incorrectos" : null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setClients([]);
    setServices([]);
    setProgramados([]);
  };

  const toggleServiceExpand = (id) => {
    const abierto = expandedServices.includes(id);
    setExpandedServices((prev) => (abierto ? prev.filter((x) => x !== id) : [...prev, id]));
    if (!abierto) {
      // se vuelve a cerrar solo a los 10 segundos
      setTimeout(() => setExpandedServices((curr) => curr.filter((x) => x !== id)), 10000);
    }
  };

  const goToService = (s) => {
    const { date } = splitDateTime(s.datetime);
    setSearch("");
    setView("agenda");
    if (date) setSelectedDate(new Date(`${date}T00:00:00`));
    setHighlightServiceId(s.id);
    setShowClientServicesModal(false);
  };

  const setStatus = async (id, status) => {
    const row = await updateRow("services", id, { status });
    if (row) setServices((prev) => upsertById(prev, row, byDatetime));
    else toast.error("No se pudo actualizar el estado");
  };

  const showPreviousServices = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const list = services
      .filter((s) => s.clientId === clientId || norm(s.clientName) === norm(client.name))
      .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    setSelectedClientServices(list);
    setShowClientServicesModal(true);
  };

  // ---- PDF ----
  const exportToPDF = async () => {
    if (!servicesOfDay.length) {
      toast.error("No hay servicios para exportar");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });
      const logo = await loadImage("/Office2000.png");
      let y = 40;
      if (logo) {
        doc.addImage(logo, "PNG", 40, 20, 100, 50);
        y = 90;
      }
      doc.setFontSize(16);
      doc.text("Servicios del día", 40, y);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(
        selectedDate.toLocaleDateString("es-UY", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        40,
        y + 15
      );
      autoTable(doc, {
        startY: y + 30,
        head: [["Hora", "Cliente", "Dirección", "Teléfono", "Descripción", "Técnico"]],
        body: servicesOfDay.map((s) => [
          splitDateTime(s.datetime).time,
          s.clientName || "",
          s.address || "",
          s.phone || "",
          s.description || "",
          TECHS.find((t) => t.id === s.tech)?.name || "",
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
      });
      doc.save(`servicios_${selectedISO}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Ocurrió un error al generar el PDF");
    }
  };

  // ---- Servicios ----
  const closeForm = () => {
    setShowForm(false);
    setForm(emptyService);
    setFormDate("");
    setFormTime("");
    setClientSuggestions([]);
  };

  const openNewService = () => {
    setForm({ ...emptyService });
    setFormDate(selectedISO);
    setFormTime("");
    setClientSuggestions([]);
    setShowForm(true);
  };

  const openServiceForClient = (c) => {
    setView("agenda");
    setForm({
      ...emptyService,
      clientId: c.id,
      clientName: c.name,
      address: c.address || "",
      phone: c.phone || "",
    });
    setFormDate(selectedISO);
    setFormTime("");
    setClientSuggestions([]);
    setShowForm(true);
  };

  const openEditService = (svc) => {
    const { date, time } = splitDateTime(svc.datetime);
    setForm({ ...svc });
    setFormDate(date);
    setFormTime(time);
    setClientSuggestions([]);
    setShowForm(true);
  };

  const saveService = async () => {
    if (!form.clientName?.trim() || !formDate) {
      alert("Complete cliente y fecha/hora");
      return;
    }
    const hora = normalizeTime(formTime);
    if (!hora) {
      alert("Hora inválida. Ingresá una hora válida (ej: 14:30).");
      return;
    }

    const match = clients.find((c) => norm(c.name) === norm(form.clientName));
    const svcData = {
      ...form,
      clientId: match ? match.id : form.clientId || "",
      clientName: form.clientName.trim(),
      datetime: `${formDate}T${hora}:00`, // hora local, sin convertir a UTC
    };

    const saved = form.id
      ? await updateRow("services", form.id, svcData)
      : await insertRow("services", { ...svcData, id: newId("s") });

    if (!saved) {
      toast.error("No se pudo guardar el servicio");
      return;
    }
    setServices((prev) => upsertById(prev, saved, byDatetime));
    toast.success(form.id ? "Servicio actualizado" : `Servicio guardado para el ${fmtDate(formDate)}`);
    closeForm();
  };

  const onClientNameChange = (val) => {
    setForm((f) => ({ ...f, clientName: val, clientId: "" }));
    const q = norm(val);
    if (!q) {
      setClientSuggestions([]);
      return;
    }
    setClientSuggestions(
      clients
        .filter((c) => norm(c.name).includes(q) || norm(c.phone).includes(q) || norm(c.address).includes(q))
        .slice(0, 8)
    );
  };

  const addClientQuick = async () => {
    const name = form.clientName?.trim();
    if (!name) {
      alert("Escriba nombre para crear cliente rápido");
      return;
    }
    const existing = clients.find((c) => norm(c.name) === norm(name));
    if (existing) {
      setForm((f) => ({ ...f, clientId: existing.id, clientName: existing.name }));
      toast("Ese cliente ya existe, se vinculó.");
      return;
    }
    const created = await insertRow("clients", {
      id: newId("c"),
      name,
      address: form.address || "",
      phone: form.phone || "",
    });
    if (created) {
      setClients((prev) => upsertById(prev, created, byName));
      setForm((f) => ({ ...f, clientId: created.id }));
      toast.success("Cliente creado");
    } else {
      toast.error("No se pudo crear el cliente");
    }
  };

  // ---- Clientes ----
  const openNewClientModal = () => {
    setNewClient({ name: "", address: "", phone: "" });
    setShowClientModal(true);
  };

  const editClient = (c) => {
    setNewClient({ id: c.id, name: c.name || "", address: c.address || "", phone: c.phone || "" });
    setShowClientModal(true);
  };

  const saveNewClient = async () => {
    const name = newClient.name.trim();
    if (!name) {
      alert("Complete el nombre del cliente");
      return;
    }
    const fields = { name, address: newClient.address || "", phone: newClient.phone || "" };

    let saved = null;
    if (newClient.id) {
      saved = await updateRow("clients", newClient.id, fields);
      if (saved) {
        setClients((prev) => upsertById(prev, saved, byName));
        // si cambió el nombre, actualizarlo también en sus servicios
        const affected = services.filter((s) => s.clientId === saved.id && s.clientName !== saved.name);
        if (affected.length) {
          const rows = await Promise.all(
            affected.map((s) => updateRow("services", s.id, { clientName: saved.name }))
          );
          setServices((prev) => rows.filter(Boolean).reduce((acc, r) => upsertById(acc, r), prev));
          toast.success(
            `Se actualizó el nombre en ${affected.length} servicio${affected.length > 1 ? "s" : ""}.`,
            { duration: 6000 }
          );
        }
      }
    } else {
      saved = await insertRow("clients", { id: newId("c"), ...fields });
      if (saved) setClients((prev) => upsertById(prev, saved, byName));
    }

    if (!saved) {
      toast.error("No se pudo guardar el cliente");
      return;
    }

    // vincular servicios anteriores que tenían ese nombre pero no estaban asociados a un cliente
    const orphans = services.filter(
      (s) => !(s.clientId || "").trim() && norm(s.clientName) === norm(saved.name)
    );
    if (orphans.length) {
      const rows = await Promise.all(orphans.map((s) => updateRow("services", s.id, { clientId: saved.id })));
      setServices((prev) => rows.filter(Boolean).reduce((acc, r) => upsertById(acc, r), prev));
      toast.success(
        `Se vincularon ${orphans.length} servicio${orphans.length > 1 ? "s" : ""} anterior${
          orphans.length > 1 ? "es" : ""
        } con este cliente.`,
        { duration: 6000 }
      );
    }

    setShowClientModal(false);
    setNewClient({ name: "", address: "", phone: "" });
  };

  // ---- Programados ----
  const closeProgramadoModal = () => {
    setShowProgramadoModal(false);
    setProgForm(emptyProg);
    setProgSuggestions([]);
  };

  const editProgramado = (p) => {
    setProgForm({
      ...emptyProg,
      ...p,
      direccion: p.direccion || "",
      telefono: p.telefono || "",
      descripcion: p.descripcion || "",
      fecha: String(p.fecha || "").slice(0, 10),
      hora: p.hora ? String(p.hora).slice(0, 5) : "",
      frecuencia: String(p.frecuencia || "1"),
    });
    setShowProgramadoModal(true);
  };

  // Crea los servicios de un programado (hasta LIMITE_MESES hacia adelante)
  const generarServicios = async (p, soloFuturos) => {
    const hoy = toLocalISODate(new Date());
    const hora = normalizeTime(p.hora) || "09:00";
    const cliente = clients.find((c) => norm(c.name) === norm(p.cliente));
    const rows = fechasProgramado(p.fecha, p.frecuencia, LIMITE_MESES)
      .filter((f) => !soloFuturos || f > hoy)
      .map((f) => ({
        id: newId("s"),
        clientId: cliente?.id || "",
        clientName: p.cliente,
        address: p.direccion,
        phone: p.telefono,
        type: "",
        brand: "",
        model: "",
        description: p.descripcion,
        datetime: `${f}T${hora}:00`,
        status: "pendiente",
        tech: p.tecnico,
        programado_id: p.id,
      }));
    if (!rows.length) return true;

    const data = await insertMany("services", rows);
    if (!data) {
      toast.error("Error al generar los servicios programados");
      return false;
    }
    setServices((prev) => data.reduce((acc, r) => upsertById(acc, r), prev).slice().sort(byDatetime));
    return true;
  };

  const saveProgramado = async () => {
    if (!progForm.cliente?.trim() || !progForm.fecha) {
      alert("Ingrese cliente y fecha.");
      return;
    }
    const data = {
      cliente: progForm.cliente.trim(),
      direccion: progForm.direccion,
      telefono: progForm.telefono,
      descripcion: progForm.descripcion,
      fecha: progForm.fecha,
      hora: normalizeTime(progForm.hora) || "09:00",
      frecuencia: progForm.frecuencia,
      tecnico: progForm.tecnico,
    };

    if (progForm.id) {
      // Editar: se borran los servicios futuros y se vuelven a crear (los de días pasados no se tocan)
      const actualizado = await updateRow("programados", progForm.id, data);
      if (!actualizado) {
        toast.error("Error al actualizar programado.");
        return;
      }
      setProgramados((prev) => upsertById(prev, actualizado, byFecha));
      const hoy = toLocalISODate(new Date());
      const okDel = await deleteServiciosFuturosDB(actualizado.id, hoy);
      if (okDel) {
        setServices((prev) =>
          prev.filter(
            (s) => !(String(s.programado_id) === String(actualizado.id) && String(s.datetime) > `${hoy}T23:59:59`)
          )
        );
        await generarServicios(actualizado, true);
      } else {
        toast.error("No se pudieron reemplazar los servicios futuros.");
      }
      toast.success("Programado actualizado.");
    } else {
      const nuevo = await insertRow("programados", data);
      if (!nuevo) {
        toast.error("Error al crear programado.");
        return;
      }
      setProgramados((prev) => upsertById(prev, nuevo, byFecha));
      const ok = await generarServicios(nuevo, false);
      if (ok) toast.success("Programado creado y servicios generados ✔");
    }
    closeProgramadoModal();
  };

  // ---- Eliminar (servicio, cliente o programado) ----
  const performDelete = async () => {
    const { type, id } = confirmDelete;
    setConfirmDelete({ show: false, type: "", id: null });
    if (!id) return;

    try {
      if (type === "service") {
        if (await deleteRow("services", id)) {
          setServices((prev) => prev.filter((s) => s.id !== id));
          toast.success("Servicio eliminado.");
        } else toast.error("Error al eliminar servicio.");
      } else if (type === "client") {
        if (await deleteRow("clients", id)) {
          setClients((prev) => prev.filter((c) => c.id !== id));
          toast.success("Cliente eliminado.");
        } else toast.error("Error al eliminar cliente.");
      } else if (type === "programado") {
        const hoy = toLocalISODate(new Date());
        if (!(await deleteServiciosFuturosDB(id, hoy))) {
          toast.error("Error al eliminar servicios futuros del programado.");
          return;
        }
        if (await deleteRow("programados", id)) {
          setProgramados((prev) => prev.filter((p) => p.id !== id));
          setServices((prev) =>
            prev.filter((s) => !(String(s.programado_id) === String(id) && String(s.datetime) > `${hoy}T23:59:59`))
          );
          toast.success("Programado eliminado junto con sus servicios futuros.");
        } else toast.error("Error al eliminar programado.");
      }
    } catch (err) {
      console.error("Error en performDelete:", err);
      toast.error("Ocurrió un error al eliminar.");
    }
  };

  // ---- WhatsApp con número suelto ----
  const openWhatsapp = () => {
    const digits = whatsappNumber.replace(/\D/g, "");
    if (!digits) {
      alert("Ingresá un número");
      return;
    }
    // Celular uruguayo (con 0, con +598, con espacios) o, si es otro país, el número completo
    const n = waNumber(whatsappNumber) || (digits.length >= 11 && !digits.startsWith("0") ? digits : null);
    if (!n) {
      toast.error("El número no es válido. Ejemplo: 091 234 567");
      return;
    }
    window.open(`https://wa.me/${n}`, "_blank");
    setShowWhatsappModal(false);
    setWhatsappNumber("");
  };

  // ---------------- Pantallas especiales (después de todos los hooks) ----------------
  if (REQUIRE_LOGIN && !authReady) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando...</div>;
  }
  if (REQUIRE_LOGIN && !session) {
    return <LoginScreen onLogin={handleLogin} darkMode={darkMode} />;
  }
  if (mostrarCotizador) {
    return <CotizadorView onVolver={() => setMostrarCotizador(false)} />;
  }

  const clientServiceCount =
    confirmDelete.type === "client"
      ? services.filter((s) => s.clientId === confirmDelete.id).length
      : 0;

  // ---------------- Pantalla principal ----------------
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#e5eaf1] dark:bg-slate-950 transition-colors duration-300 ease-in-out p-3 sm:p-6 md:p-8 font-sans text-slate-800 dark:text-slate-100 antialiased overflow-x-hidden pb-20">
        <Toaster position="bottom-right" reverseOrder={false} />

        {/* ---------- Encabezado ---------- */}
        <AppHeader
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          view={view}
          overdueCount={overdue.length}
          onToday={() => {
            setSelectedDate(startOfToday());
            setView("agenda");
            setSearch("");
          }}
          onNew={openNewService}
          onView={setView}
          onCotizador={() => setMostrarCotizador(true)}
          onBack={() => setView("agenda")}
          requireLogin={REQUIRE_LOGIN}
          onLogout={handleLogout}
        />

        {/* ---------- Contenido ---------- */}
        <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start content-start">
          {view === "agenda" ? (
            <>
              {/* Calendario */}
              <aside className="md:col-span-1 flex flex-col justify-start h-fit">
                <CalendarPanel
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  onMonthChange={(n) =>
                    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + n, 1))
                  }
                  countsByDay={countsByDay}
                />
              </aside>

              {/* Agenda del día */}
              <section className="md:col-span-2 flex flex-col justify-start h-fit">
                <div className={cardCls}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Agenda diaria
                      </div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {capFirst(
                          selectedDate.toLocaleDateString("es-UY", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                      <button onClick={() => setShowWhatsappModal(true)} className={btn.softGreen}>
                        <MessageCircle size={16} />
                        <span>Enviar WhatsApp</span>
                      </button>

                      <button onClick={exportToPDF} className={btn.softRed}>
                        <FileDown size={16} />
                        <span>Exportar PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Buscador + filtro por técnico */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar servicio (cliente, equipo, dirección, teléfono...)"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                    <div className="flex gap-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-800 self-start">
                      {[{ id: "todos", name: "Todos" }, ...TECHS].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTechFilter(t.id)}
                          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition ${
                            techFilter === t.id
                              ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-200 shadow-sm"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {t.id === "todos" ? "Todos" : t.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {searchResults ? (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {searchResults.length === 0
                          ? "No se encontraron servicios."
                          : `${searchResults.length} resultado${searchResults.length > 1 ? "s" : ""} (tocá uno para ir a su día)`}
                      </div>
                      {searchResults.map((s) => {
                        const { date, time } = splitDateTime(s.datetime);
                        return (
                          <div
                            key={s.id}
                            onClick={() => goToService(s)}
                            className="border border-slate-300 dark:border-slate-700 rounded-xl p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          >
                            <div className="font-medium">
                              {s.clientName}
                              <span className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                                {STATUS_LABEL[statusOf(s)] || statusOf(s)}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {fmtDate(date)} {time} • {s.description || "(sin descripción)"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {servicesOfDay.length === 0 && (
                        <div className="p-6 text-center text-slate-600 dark:text-slate-400">
                          No hay servicios para este día. Hacé clic en "Nuevo" para agregar uno.
                        </div>
                      )}
                      {servicesOfDay.map((s) => (
                        <ServiceCard
                          key={s.id}
                          s={s}
                          expanded={expandedServices.includes(s.id)}
                          highlighted={highlightServiceId === s.id}
                          onToggle={toggleServiceExpand}
                          onEdit={openEditService}
                          onDelete={(id) => setConfirmDelete({ show: true, type: "service", id })}
                          onStatus={setStatus}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : view === "pendientes" ? (
            <PendientesView overdue={overdue} onStatus={setStatus} onGoTo={goToService} />
          ) : view === "programados" ? (
            <ProgramadosView
              programados={programados}
              onNew={() => {
                setProgForm(emptyProg);
                setShowProgramadoModal(true);
              }}
              onEdit={editProgramado}
              onDelete={(id) => setConfirmDelete({ show: true, type: "programado", id })}
            />
          ) : (
            <ClientesView
              clients={clients}
              onNew={openNewClientModal}
              onEdit={editClient}
              onDelete={(id) => setConfirmDelete({ show: true, type: "client", id })}
              onSchedule={openServiceForClient}
              onHistory={showPreviousServices}
            />
          )}
        </main>

        {/* ---------- Modal: servicio ---------- */}
        {showForm && (
          <Modal
            title={form.id ? "Editar servicio" : "Nuevo servicio"}
            icon={form.id ? <Edit3 size={18} /> : <ClipboardPlus size={18} />}
            accent="blue"
            maxWidth="max-w-3xl"
            onClose={closeForm}
            onSave={saveService}
          >
            <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
              {/* Cliente con autocompletado */}
              <div className="col-span-2 md:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className={`${labelCls} !mb-0`}>Cliente</label>
                  <button
                    type="button"
                    onClick={addClientQuick}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    title="Guardar este cliente en la lista de clientes"
                  >
                    <UserPlus size={13} />
                    Crear cliente
                  </button>
                </div>
                <div className="relative" ref={suggestionsRef}>
                  <input
                    id="inputCliente"
                    value={form.clientName ?? ""}
                    onChange={(e) => onClientNameChange(e.target.value)}
                    className={inputCls}
                    placeholder="Nombre del cliente"
                    autoComplete="off"
                  />
                  {clientSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg z-50 max-h-48 overflow-auto">
                      {clientSuggestions.map((c) => (
                        <div
                          key={c.id}
                          className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              clientId: c.id,
                              clientName: c.name,
                              address: c.address || "",
                              phone: c.phone || "",
                            }));
                            setClientSuggestions([]);
                          }}
                        >
                          <div className="font-medium text-slate-800 dark:text-slate-100">{c.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {c.address} • {c.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 md:col-span-5">
                <label className={labelCls}>Dirección</label>
                <input
                  value={form.address ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Dirección"
                  className={inputCls}
                />
              </div>

              <div className="col-span-2 md:col-span-3">
                <label className={labelCls}>Teléfono</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Teléfono"
                  className={inputCls}
                />
              </div>

              <div className="col-span-2 md:col-span-5">
                <label className={labelCls}>Tipo de equipo</label>
                <input
                  value={form.type ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="Ej: Impresora chorro de tinta"
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className={labelCls}>Marca</label>
                <input
                  value={form.brand ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="Marca"
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-4">
                <label className={labelCls}>Modelo</label>
                <input
                  value={form.model ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="Modelo"
                  className={inputCls}
                />
              </div>

              <div className="col-span-2 md:col-span-12">
                <label className={labelCls}>Descripción del problema</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Describa el problema o la tarea a realizar..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className={labelCls}>Fecha</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className={labelCls}>Hora</label>
                <input
                  type="text"
                  placeholder="Ej: 14:30"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value.replace(/[^\d:.,]/g, "").slice(0, 5))}
                  onBlur={() => setFormTime(normalizeTime(formTime) || "")}
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className={labelCls}>Estado</label>
                <select
                  value={form.status || "pendiente"}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={inputCls}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en curso">En curso</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-4">
                <label className={labelCls}>Técnico</label>
                <select
                  value={form.tech}
                  onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))}
                  className={inputCls}
                >
                  {TECHS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal>
        )}

        {/* ---------- Modal: WhatsApp con número suelto ---------- */}
        {showWhatsappModal && (
          <Modal
            title="Enviar WhatsApp"
            icon={<MessageCircle size={18} />}
            accent="green"
            maxWidth="max-w-sm"
            onClose={() => setShowWhatsappModal(false)}
            onSave={openWhatsapp}
            saveLabel="Abrir chat"
          >
            <label className={labelCls}>Número de celular</label>
            <input
              type="text"
              inputMode="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9+\s-]/g, ""))}
              placeholder="Ej: 091 234 567"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && openWhatsapp()}
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Podés escribirlo con 0, con +598 o con espacios: se acomoda solo.
            </p>
          </Modal>
        )}

        {/* ---------- Modal: cliente nuevo / editar ---------- */}
        {showClientModal && (
          <Modal
            title={newClient.id ? "Editar cliente" : "Nuevo cliente"}
            icon={<UserPlus size={18} />}
            accent="green"
            maxWidth="max-w-md"
            onClose={() => setShowClientModal(false)}
            onSave={saveNewClient}
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input
                  value={newClient.name}
                  onChange={(e) => setNewClient((n) => ({ ...n, name: e.target.value }))}
                  className={inputCls}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className={labelCls}>Dirección</label>
                <input
                  value={newClient.address}
                  onChange={(e) => setNewClient((n) => ({ ...n, address: e.target.value }))}
                  className={inputCls}
                  placeholder="Dirección"
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  value={newClient.phone}
                  onChange={(e) => setNewClient((n) => ({ ...n, phone: e.target.value }))}
                  className={inputCls}
                  placeholder="Teléfono"
                />
              </div>
            </div>
          </Modal>
        )}

        {/* ---------- Modal: servicios anteriores ---------- */}
        {showClientServicesModal && (
          <Modal
            title="Servicios anteriores"
            icon={<History size={18} />}
            accent="blue"
            maxWidth="max-w-2xl"
            onClose={() => setShowClientServicesModal(false)}
          >
            {selectedClientServices.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                Este cliente no tiene servicios registrados.
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-auto">
                {selectedClientServices.map((s) => {
                  const { date, time } = splitDateTime(s.datetime);
                  return (
                    <div
                      key={s.id}
                      onClick={() => goToService(s)}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {fmtDate(date)} • {time}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {s.description || "(Sin descripción)"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Estado: <strong>{STATUS_LABEL[statusOf(s)] || statusOf(s)}</strong> • Técnico:{" "}
                        {TECHS.find((t) => t.id === s.tech)?.name || "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Modal>
        )}

        {/* ---------- Modal: servicio programado ---------- */}
        {showProgramadoModal && (
          <Modal
            title={progForm.id ? "Editar servicio programado" : "Nuevo servicio programado"}
            icon={progForm.id ? <Edit3 size={18} /> : <ClipboardPlus size={18} />}
            accent="cyan"
            maxWidth="max-w-3xl"
            onClose={closeProgramadoModal}
            onSave={saveProgramado}
          >
            <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
              <div className="col-span-2 md:col-span-12 relative" ref={progSuggestionsRef}>
                <label className={labelCls}>Cliente</label>
                <input
                  ref={progClienteInputRef}
                  type="text"
                  value={progForm.cliente}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProgForm((prev) => ({ ...prev, cliente: val }));
                    const q = norm(val);
                    if (!q) {
                      setProgSuggestions([]);
                      return;
                    }
                    setProgSuggestions(
                      clients
                        .filter(
                          (c) =>
                            norm(c.name).includes(q) ||
                            norm(c.phone).includes(q) ||
                            norm(c.address).includes(q)
                        )
                        .slice(0, 6)
                    );
                  }}
                  placeholder="Buscar cliente..."
                  className={inputCls}
                  autoComplete="off"
                />
                {progSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg z-50 max-h-48 overflow-auto">
                    {progSuggestions.map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-2 hover:bg-cyan-50 dark:hover:bg-slate-700 cursor-pointer"
                        onClick={() => {
                          setProgForm((prev) => ({
                            ...prev,
                            cliente: c.name,
                            direccion: c.address || "",
                            telefono: c.phone || "",
                          }));
                          setProgSuggestions([]);
                        }}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {c.address} • {c.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 md:col-span-8">
                <label className={labelCls}>Dirección</label>
                <input
                  type="text"
                  value={progForm.direccion}
                  onChange={(e) => setProgForm((f) => ({ ...f, direccion: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="col-span-2 md:col-span-4">
                <label className={labelCls}>Teléfono</label>
                <input
                  type="text"
                  value={progForm.telefono}
                  onChange={(e) => setProgForm((f) => ({ ...f, telefono: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="col-span-2 md:col-span-12">
                <label className={labelCls}>Descripción</label>
                <input
                  type="text"
                  value={progForm.descripcion}
                  onChange={(e) => setProgForm((f) => ({ ...f, descripcion: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className={labelCls}>Primera fecha</label>
                <input
                  type="date"
                  value={progForm.fecha}
                  onChange={(e) => setProgForm((f) => ({ ...f, fecha: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className={labelCls}>Hora</label>
                <input
                  type="text"
                  placeholder="Ej: 1430"
                  value={progForm.hora || ""}
                  onChange={(e) =>
                    setProgForm((f) => ({ ...f, hora: e.target.value.replace(/[^\d:.,]/g, "").slice(0, 5) }))
                  }
                  onBlur={() => setProgForm((f) => ({ ...f, hora: normalizeTime(f.hora) || "" }))}
                  className={inputCls}
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className={labelCls}>Frecuencia</label>
                <select
                  value={progForm.frecuencia}
                  onChange={(e) => setProgForm((f) => ({ ...f, frecuencia: e.target.value }))}
                  className={inputCls}
                >
                  <option value="1">Cada 1 mes</option>
                  <option value="3">Cada 3 meses</option>
                  <option value="6">Cada 6 meses</option>
                  <option value="12">Cada año</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-4">
                <label className={labelCls}>Técnico</label>
                <select
                  value={progForm.tecnico}
                  onChange={(e) => setProgForm((f) => ({ ...f, tecnico: e.target.value }))}
                  className={inputCls}
                >
                  {TECHS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 md:col-span-12 text-xs text-slate-600 dark:text-slate-400">
                Se crean automáticamente los servicios de los próximos {LIMITE_MESES} meses. Si dejás la hora
                vacía se usa las 09:00.
              </div>
            </div>
          </Modal>
        )}

        {/* ---------- Modal: confirmar eliminación ---------- */}
        {confirmDelete.show && (
          <Modal
            title="Confirmar eliminación"
            icon={<Trash2 size={18} />}
            accent="red"
            maxWidth="max-w-md"
            onClose={() => setConfirmDelete({ show: false, type: "", id: null })}
            onSave={performDelete}
            saveLabel="Sí, eliminar"
          >
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {confirmDelete.type === "service" && "¿Estás seguro que querés eliminar este servicio?"}
              {confirmDelete.type === "client" && (
                <>
                  ¿Estás seguro que querés eliminar este cliente?
                  {clientServiceCount > 0 && (
                    <strong className="block mt-2 text-amber-600 dark:text-amber-400">
                      Atención: tiene {clientServiceCount} servicio{clientServiceCount > 1 ? "s" : ""} registrado
                      {clientServiceCount > 1 ? "s" : ""} en la agenda.
                    </strong>
                  )}
                </>
              )}
              {confirmDelete.type === "programado" &&
                "¿Estás seguro que querés eliminar este servicio programado? También se borran sus servicios futuros."}
            </p>
          </Modal>
        )}
      </div>
    </div>
  );
}
