
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Proveedor = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  rfc: string | null;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
  sitio_web: string | null;
  condiciones_pago: string | null;
  tiempo_entrega: string | null;
  estatus: boolean;
  observaciones: string | null;
};

type FormularioProveedor = {
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  sitio_web: string;
  condiciones_pago: string;
  tiempo_entrega: string;
  estatus: boolean;
  observaciones: string;
};

const formularioInicial: FormularioProveedor = {
  razon_social: "",
  nombre_comercial: "",
  rfc: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
  ciudad: "",
  estado: "",
  codigo_postal: "",
  sitio_web: "",
  condiciones_pago: "",
  tiempo_entrega: "",
  estatus: true,
  observaciones: "",
};

export default function ProveedoresPage() {
  const supabase = createClient();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioProveedor>(formularioInicial);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] =
    useState<string | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [rolUsuario, setRolUsuario] = useState<string | null>(null);

useEffect(() => {
  cargarProveedores();

  async function cargarRol() {
    const { data, error } = await supabase.rpc("mi_rol");

    if (error) {
      console.error("Error al consultar el rol:", error.message);
      setRolUsuario(null);
      return;
    }

    setRolUsuario(data);
  }

  cargarRol();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  async function cargarProveedores() {
    setCargando(true);
    setError("");

    const { data, error } = await supabase
      .from("proveedores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("No fue posible cargar los proveedores: " + error.message);
      setProveedores([]);
    } else {
      setProveedores((data || []) as Proveedor[]);
    }

    setCargando(false);
  }

  function actualizarCampo(
    campo: keyof FormularioProveedor,
    valor: string | boolean
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function nuevoProveedor() {
    setFormulario(formularioInicial);
    setProveedorEditando(null);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function editarProveedor(proveedor: Proveedor) {
    setFormulario({
      razon_social: proveedor.razon_social || "",
      nombre_comercial: proveedor.nombre_comercial || "",
      rfc: proveedor.rfc || "",
      contacto: proveedor.contacto || "",
      telefono: proveedor.telefono || "",
      correo: proveedor.correo || "",
      direccion: proveedor.direccion || "",
      ciudad: proveedor.ciudad || "",
      estado: proveedor.estado || "",
      codigo_postal: proveedor.codigo_postal || "",
      sitio_web: proveedor.sitio_web || "",
      condiciones_pago: proveedor.condiciones_pago || "",
      tiempo_entrega: proveedor.tiempo_entrega || "",
      estatus: proveedor.estatus,
      observaciones: proveedor.observaciones || "",
    });

    setProveedorEditando(proveedor.id);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  async function guardarProveedor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formulario.razon_social.trim()) {
      setError("La razÃ³n social es obligatoria.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    const datos = {
      razon_social: formulario.razon_social.trim(),
      nombre_comercial: formulario.nombre_comercial.trim() || null,
      rfc: formulario.rfc.trim().toUpperCase() || null,
      contacto: formulario.contacto.trim() || null,
      telefono: formulario.telefono.trim() || null,
      correo: formulario.correo.trim() || null,
      direccion: formulario.direccion.trim() || null,
      ciudad: formulario.ciudad.trim() || null,
      estado: formulario.estado.trim() || null,
      codigo_postal: formulario.codigo_postal.trim() || null,
      sitio_web: formulario.sitio_web.trim() || null,
      condiciones_pago: formulario.condiciones_pago.trim() || null,
      tiempo_entrega: formulario.tiempo_entrega.trim() || null,
      observaciones: formulario.observaciones.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let resultado;

    if (proveedorEditando) {
      resultado = await supabase
        .from("proveedores")
        .update(datos)
        .eq("id", proveedorEditando);
    } else {
      resultado = await supabase
        .from("proveedores")
        .insert([datos]);
    }

    if (resultado.error) {
      setError(
        "No fue posible guardar el proveedor. " +
          resultado.error.message
      );
      setGuardando(false);
      return;
    }

    setMensaje(
      proveedorEditando
        ? "Proveedor actualizado correctamente."
        : "Proveedor registrado correctamente."
    );

    setFormulario(formularioInicial);
    setProveedorEditando(null);
    setMostrarFormulario(false);

    await cargarProveedores();
    setGuardando(false);
  }

  async function eliminarProveedor(proveedor: Proveedor) {
  if (rolUsuario !== "administrador") {
    setError("No tienes permiso para desactivar proveedores.");
    return;
  }

  const confirmar = window.confirm(
    `Â¿Deseas desactivar al proveedor "${proveedor.razon_social}"?`
  );

  if (!confirmar) return;

  setError("");
  setMensaje("");

const { error } = await supabase.rpc("desactivar_proveedor", {
  p_proveedor_id: proveedor.id,
});

  if (error) {
    setError("No fue posible desactivar el proveedor: " + error.message);
    return;
  }

  setMensaje("Proveedor desactivado correctamente.");
  await cargarProveedores();
}

  function cancelarFormulario() {
    setMostrarFormulario(false);
    setProveedorEditando(null);
    setFormulario(formularioInicial);
    setError("");
  }

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const texto = busqueda.toLowerCase();

    return (
      proveedor.razon_social?.toLowerCase().includes(texto) ||
      proveedor.nombre_comercial?.toLowerCase().includes(texto) ||
      proveedor.rfc?.toLowerCase().includes(texto) ||
      proveedor.contacto?.toLowerCase().includes(texto) ||
      proveedor.correo?.toLowerCase().includes(texto)
    );
  });

  const activos = proveedores.filter((p) => p.estatus).length;

  const inactivos = proveedores.length - activos;

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Gamma Scientific
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Proveedores
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              AdministraciÃ³n del catÃ¡logo de proveedores.
            </p>
          </div>

          <button
            onClick={nuevoProveedor}
            className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            + Nuevo proveedor
          </button>
        </div>

        {/* MENSAJES */}
        {mensaje && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* RESUMEN */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de proveedores</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {proveedores.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Proveedores activos</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {activos}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Proveedores inactivos</p>
            <p className="mt-2 text-3xl font-bold text-slate-500">
              {inactivos}
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        {mostrarFormulario && (
          <section className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {proveedorEditando
                    ? "Editar proveedor"
                    : "Registrar proveedor"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Completa los datos del proveedor.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelarFormulario}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={guardarProveedor}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                <div>
                  <label className={labelClass}>
                    RazÃ³n social *
                  </label>
                  <input
                    className={inputClass}
                    value={formulario.razon_social}
                    onChange={(e) =>
                      actualizarCampo("razon_social", e.target.value)
                    }
                    placeholder="RazÃ³n social"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Nombre comercial</label>
                  <input
                    className={inputClass}
                    value={formulario.nombre_comercial}
                    onChange={(e) =>
                      actualizarCampo("nombre_comercial", e.target.value)
                    }
                    placeholder="Nombre comercial"
                  />
                </div>

                <div>
                  <label className={labelClass}>RFC</label>
                  <input
                    className={inputClass}
                    value={formulario.rfc}
                    onChange={(e) =>
                      actualizarCampo("rfc", e.target.value)
                    }
                    placeholder="RFC"
                    maxLength={13}
                  />
                </div>

                <div>
                  <label className={labelClass}>Contacto</label>
                  <input
                    className={inputClass}
                    value={formulario.contacto}
                    onChange={(e) =>
                      actualizarCampo("contacto", e.target.value)
                    }
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div>
                  <label className={labelClass}>TelÃ©fono</label>
                  <input
                    className={inputClass}
                    value={formulario.telefono}
                    onChange={(e) =>
                      actualizarCampo("telefono", e.target.value)
                    }
                    placeholder="TelÃ©fono"
                  />
                </div>

                <div>
                  <label className={labelClass}>Correo electrÃ³nico</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={formulario.correo}
                    onChange={(e) =>
                      actualizarCampo("correo", e.target.value)
                    }
                    placeholder="correo@proveedor.com"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className={labelClass}>DirecciÃ³n</label>
                  <input
                    className={inputClass}
                    value={formulario.direccion}
                    onChange={(e) =>
                      actualizarCampo("direccion", e.target.value)
                    }
                    placeholder="Calle, nÃºmero, colonia"
                  />
                </div>

                <div>
                  <label className={labelClass}>Ciudad</label>
                  <input
                    className={inputClass}
                    value={formulario.ciudad}
                    onChange={(e) =>
                      actualizarCampo("ciudad", e.target.value)
                    }
                    placeholder="Ciudad"
                  />
                </div>

                <div>
                  <label className={labelClass}>Estado</label>
                  <input
                    className={inputClass}
                    value={formulario.estado}
                    onChange={(e) =>
                      actualizarCampo("estado", e.target.value)
                    }
                    placeholder="Estado"
                  />
                </div>

                <div>
                  <label className={labelClass}>CÃ³digo postal</label>
                  <input
                    className={inputClass}
                    value={formulario.codigo_postal}
                    onChange={(e) =>
                      actualizarCampo("codigo_postal", e.target.value)
                    }
                    placeholder="CÃ³digo postal"
                  />
                </div>

                <div>
                  <label className={labelClass}>Sitio web</label>
                  <input
                    className={inputClass}
                    value={formulario.sitio_web}
                    onChange={(e) =>
                      actualizarCampo("sitio_web", e.target.value)
                    }
                    placeholder="https://www.ejemplo.com"
                  />
                </div>

                <div>
                  <label className={labelClass}>Condiciones de pago</label>
                  <input
                    className={inputClass}
                    value={formulario.condiciones_pago}
                    onChange={(e) =>
                      actualizarCampo("condiciones_pago", e.target.value)
                    }
                    placeholder="Ej. CrÃ©dito 30 dÃ­as"
                  />
                </div>

                <div>
                  <label className={labelClass}>Tiempo de entrega</label>
                  <input
                    className={inputClass}
                    value={formulario.tiempo_entrega}
                    onChange={(e) =>
                      actualizarCampo("tiempo_entrega", e.target.value)
                    }
                    placeholder="Ej. 8 a 10 semanas"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className={labelClass}>Observaciones</label>
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={formulario.observaciones}
                    onChange={(e) =>
                      actualizarCampo("observaciones", e.target.value)
                    }
                    placeholder="InformaciÃ³n adicional del proveedor"
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={cancelarFormulario}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando
                    ? "Guardando..."
                    : proveedorEditando
                    ? "Guardar cambios"
                    : "Registrar proveedor"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* LISTADO */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                CatÃ¡logo de proveedores
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Consulta y administra tus proveedores registrados.
              </p>
            </div>

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar proveedor..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-teal-600 sm:max-w-xs"
            />
          </div>

          {cargando ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Cargando proveedores...
            </div>
          ) : proveedoresFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">
                No hay proveedores registrados
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Registra tu primer proveedor con el botÃ³n Nuevo proveedor.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Proveedor</th>
                    <th className="px-5 py-4">RFC</th>
                    <th className="px-5 py-4">Contacto</th>
                    <th className="px-5 py-4">TelÃ©fono</th>
                    <th className="px-5 py-4">Correo</th>
                    <th className="px-5 py-4">Estatus</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {proveedoresFiltrados.map((proveedor) => (
                    <tr
                      key={proveedor.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {proveedor.razon_social}
                        </p>
                        {proveedor.nombre_comercial && (
                          <p className="mt-1 text-xs text-slate-500">
                            {proveedor.nombre_comercial}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.rfc || "â€”"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.contacto || "â€”"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.telefono || "â€”"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {proveedor.correo || "â€”"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            proveedor.estatus
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {proveedor.estatus ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editarProveedor(proveedor)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>

                          {rolUsuario === "administrador" && proveedor.estatus && (
  <button
    onClick={() => eliminarProveedor(proveedor)}
    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
  >
    Desactivar
  </button>
)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Mostrando {proveedoresFiltrados.length} de {proveedores.length} proveedores.
          </div>
        </section>

      </div>
    </main>
  );
}
