
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const menu = [
  { name: "Panel principal", icon: "⌂" },
  { name: "Cotizaciones", icon: "▤" },
  { name: "Clientes", icon: "♙" },
  { name: "Productos", icon: "▦" },
  { name: "Proveedores", icon: "♧" },
  { name: "Compras", icon: "⇩" },
  { name: "Ventas y pagos", icon: "$" },
  { name: "Reportes", icon: "▥" },
  { name: "Usuarios y permisos", icon: "⚙" },
];

const activities = [
  {
    folio: "COT-2026-00024",
    cliente: "Laboratorios del Centro",
    fecha: "10 nov 2026",
    estado: "Enviada",
    total: "$28,450.00",
  },
  {
    folio: "COT-2026-00023",
    cliente: "Química Analítica del Norte",
    fecha: "09 nov 2026",
    estado: "Aceptada",
    total: "$16,800.00",
  },
  {
    folio: "COT-2026-00022",
    cliente: "Laboratorio San José",
    fecha: "08 nov 2026",
    estado: "Borrador",
    total: "$9,250.00",
  },
  {
    folio: "COT-2026-00021",
    cliente: "Servicios Industriales del Pacífico",
    fecha: "07 nov 2026",
    estado: "Pendiente",
    total: "$42,100.00",
  },
];

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [active, setActive] = useState("Panel principal");
  const [search, setSearch] = useState("");
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  async function cerrarSesion() {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      alert("No fue posible cerrar la sesión. Intenta nuevamente.");
      setCerrandoSesion(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  const filteredActivities = activities.filter((item) =>
    `${item.folio} ${item.cliente} ${item.estado}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3F6F9] text-slate-800 md:flex">

      {/* MENÚ LATERAL */}
      <aside className="w-full bg-[#102B46] text-white md:min-h-screen md:w-64 md:shrink-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#19B6B0] text-2xl font-bold">
            G
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              GAMMA SCIENTIFIC
            </h1>
            <p className="text-xs text-slate-300">
              Sistema administrativo
            </p>
          </div>
        </div>

        <div className="px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-slate-400">
            MENÚ PRINCIPAL
          </p>

          <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {menu.map((item) => (
              <button
                key={item.name}
                onClick={() => setActive(item.name)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                  active === item.name
                    ? "bg-[#19B6B0] font-semibold text-[#102B46]"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <span className="w-5 text-center text-lg">
                  {item.icon}
                </span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden px-7 py-5 text-xs text-slate-400 md:block">
          Gamma Scientific © 2026
          <br />
          Sistema de gestión empresarial
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-w-0 flex-1">

        {/* ENCABEZADO */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <div>
            <p className="text-sm text-slate-500">
              Gamma Scientific / Administración
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#102B46]">
              {active}
            </h2>
          </div>

          {/* USUARIO Y CERRAR SESIÓN */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#102B46]">
                Administrador
              </p>
              <p className="text-xs text-slate-500">
                Cuenta de usuario
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDF5F3] font-bold text-[#117D79]">
              A
            </div>

            <button
              onClick={cerrarSesion}
              disabled={cerrandoSesion}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#102B46] transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </header>

        <div className="space-y-7 p-5 md:p-9">

          {active === "Panel principal" ? (
            <>
              {/* BIENVENIDA */}
              <section>
                <h3 className="text-xl font-semibold text-[#102B46]">
                  Bienvenido al sistema
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Aquí puedes consultar la actividad comercial de
                  Gamma Scientific.
                </p>
              </section>

              {/* INDICADORES */}
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Cotizaciones",
                    value: "24",
                    detail: "Este mes",
                    icon: "▤",
                    color: "text-blue-700",
                    bg: "bg-blue-50",
                  },
                  {
                    title: "Aceptadas",
                    value: "12",
                    detail: "Este mes",
                    icon: "✓",
                    color: "text-emerald-700",
                    bg: "bg-emerald-50",
                  },
                  {
                    title: "Pendientes",
                    value: "8",
                    detail: "Por seguimiento",
                    icon: "◷",
                    color: "text-amber-700",
                    bg: "bg-amber-50",
                  },
                  {
                    title: "Clientes",
                    value: "56",
                    detail: "Registrados",
                    icon: "♙",
                    color: "text-[#117D79]",
                    bg: "bg-[#E5F7F5]",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {card.title}
                      </p>
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${card.bg} ${card.color}`}
                      >
                        {card.icon}
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-[#102B46]">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {card.detail}
                    </p>
                  </div>
                ))}
              </section>

              {/* ACCESO RÁPIDO */}
              <section className="flex flex-col justify-between gap-4 rounded-xl bg-[#102B46] p-6 text-white shadow-sm sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    Nueva cotización
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Comienza una nueva propuesta comercial.
                  </p>
                </div>
                <button
                  onClick={() => setActive("Cotizaciones")}
                  className="rounded-lg bg-[#19B6B0] px-6 py-3 text-sm font-semibold text-[#102B46] transition hover:bg-[#52D3CD]"
                >
                  + Crear cotización
                </button>
              </section>

              {/* ACTIVIDAD RECIENTE */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-[#102B46]">
                      Actividad reciente
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Últimas cotizaciones registradas
                    </p>
                  </div>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar cotización..."
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#19B6B0] sm:w-64"
                  />
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="pb-3 pr-4 font-medium">FOLIO</th>
                        <th className="pb-3 pr-4 font-medium">CLIENTE</th>
                        <th className="pb-3 pr-4 font-medium">FECHA</th>
                        <th className="pb-3 pr-4 font-medium">ESTATUS</th>
                        <th className="pb-3 text-right font-medium">TOTAL</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredActivities.map((item) => (
                        <tr
                          key={item.folio}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="whitespace-nowrap py-4 pr-4 font-semibold text-[#102B46]">
                            {item.folio}
                          </td>
                          <td className="min-w-48 py-4 pr-4 text-slate-600">
                            {item.cliente}
                          </td>
                          <td className="whitespace-nowrap py-4 pr-4 text-slate-500">
                            {item.fecha}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                item.estado === "Aceptada"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.estado === "Enviada"
                                  ? "bg-blue-100 text-blue-700"
                                  : item.estado === "Borrador"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {item.estado}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-4 text-right font-semibold text-[#102B46]">
                            {item.total}
                          </td>
                        </tr>
                      ))}

                      {filteredActivities.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-slate-400"
                          >
                            No se encontraron cotizaciones.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-[#19A8A4]">
                MÓDULO DE GAMMA SCIENTIFIC
              </p>
              <h3 className="mt-3 text-2xl font-bold text-[#102B46]">
                {active}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Esta sección tendrá sus propios formularios, búsquedas,
                filtros y registros. Estamos construyendo cada módulo
                paso a paso.
              </p>

              {active === "Usuarios y permisos" && (
                <p className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                  Regla del sistema: solamente el administrador podrá
                  crear nuevos usuarios.
                </p>
              )}

              <button
                onClick={() => setActive("Panel principal")}
                className="mt-6 rounded-lg bg-[#102B46] px-5 py-3 text-sm font-semibold text-white hover:bg-[#19476C]"
              >
                Volver al panel principal
              </button>
            </section>
          )}

          <footer className="pb-4 text-center text-xs text-slate-400">
            Gamma Scientific · Sistema administrativo · Versión inicial
          </footer>
        </div>
      </main>
    </div>
  );
}
