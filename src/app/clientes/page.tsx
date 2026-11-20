
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Cliente = {
  id: string;
  razonSocial: string;
  rfc: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
};

const clienteVacio = {
  razonSocial: "",
  rfc: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
  ciudad: "",
  estado: "",
  codigoPostal: "",
};

const campos = [
  ["razonSocial", "Razón social", true],
  ["rfc", "RFC", true],
  ["contacto", "Nombre del contacto", false],
  ["telefono", "Teléfono", false],
  ["correo", "Correo electrónico", false],
  ["direccion", "Dirección fiscal", false],
  ["ciudad", "Ciudad", false],
  ["estado", "Estado", false],
  ["codigoPostal", "Código postal", false],
] as const;

export default function ClientesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState(clienteVacio);
  const [editando, setEditando] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState("");

  // CONSULTAR CLIENTES EN SUPABASE
  useEffect(() => {
    async function cargarClientes() {
      setCargando(true);
      setError("");

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("razon_social", { ascending: true });

      if (error) {
        console.error("Error al consultar clientes:", error.message);
        setError("No fue posible cargar los clientes. Intenta nuevamente.");
        setCargando(false);
        return;
      }

      const lista: Cliente[] = (data ?? []).map((cliente) => ({
        id: cliente.id,
        razonSocial: cliente.razon_social ?? "",
        rfc: cliente.rfc ?? "",
        contacto: cliente.contacto ?? "",
        telefono: cliente.telefono ?? "",
        correo: cliente.correo ?? "",
        direccion: cliente.direccion_fiscal ?? "",
        ciudad: cliente.ciudad ?? "",
        estado: cliente.estado ?? "",
        codigoPostal: cliente.codigo_postal ?? "",
      }));

      setClientes(lista);
      setCargando(false);
    }

    cargarClientes();
  }, [supabase]);

  // GUARDAR O ACTUALIZAR CLIENTE
  async function guardarCliente(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (guardando) return;

    setError("");
    setGuardando(true);

    const datosCliente = {
      razon_social: formulario.razonSocial.trim(),
      rfc: formulario.rfc.trim().toUpperCase(),
      contacto: formulario.contacto.trim(),
      telefono: formulario.telefono.trim(),
      correo: formulario.correo.trim(),
      direccion_fiscal: formulario.direccion.trim(),
      ciudad: formulario.ciudad.trim(),
      estado: formulario.estado.trim(),
      codigo_postal: formulario.codigoPostal.trim(),
      updated_at: new Date().toISOString(),
    };

    if (editando !== null) {
      const { data, error } = await supabase
        .from("clientes")
        .update(datosCliente)
        .eq("id", editando)
        .select()
        .single();

      if (error) {
        console.error("Error al actualizar cliente:", error.message);
        setError("No fue posible actualizar el cliente.");
        setGuardando(false);
        return;
      }

      const actualizado: Cliente = {
        id: data.id,
        razonSocial: data.razon_social ?? "",
        rfc: data.rfc ?? "",
        contacto: data.contacto ?? "",
        telefono: data.telefono ?? "",
        correo: data.correo ?? "",
        direccion: data.direccion_fiscal ?? "",
        ciudad: data.ciudad ?? "",
        estado: data.estado ?? "",
        codigoPostal: data.codigo_postal ?? "",
      };

      setClientes((actuales) =>
        actuales.map((cliente) =>
          cliente.id === editando ? actualizado : cliente
        )
      );
    } else {
      const { data, error } = await supabase
        .from("clientes")
        .insert(datosCliente)
        .select()
        .single();

      if (error) {
        console.error("Error al registrar cliente:", error.message);
        setError("No fue posible registrar el cliente.");
        setGuardando(false);
        return;
      }

      const nuevo: Cliente = {
        id: data.id,
        razonSocial: data.razon_social ?? "",
        rfc: data.rfc ?? "",
        contacto: data.contacto ?? "",
        telefono: data.telefono ?? "",
        correo: data.correo ?? "",
        direccion: data.direccion_fiscal ?? "",
        ciudad: data.ciudad ?? "",
        estado: data.estado ?? "",
        codigoPostal: data.codigo_postal ?? "",
      };

      setClientes((actuales) =>
        [...actuales, nuevo].sort((a, b) =>
          a.razonSocial.localeCompare(b.razonSocial)
        )
      );
    }

    cancelarFormulario();
    setGuardando(false);
  }

  // PREPARAR EDICIÓN
  function editarCliente(cliente: Cliente) {
    setFormulario({
      razonSocial: cliente.razonSocial,
      rfc: cliente.rfc,
      contacto: cliente.contacto,
      telefono: cliente.telefono,
      correo: cliente.correo,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      estado: cliente.estado,
      codigoPostal: cliente.codigoPostal,
    });

    setEditando(cliente.id);
    setMostrarFormulario(true);
    setError("");
  }

  // ELIMINAR CLIENTE
  async function eliminarCliente(id: string) {
    if (eliminando !== null) return;

    if (!confirm("¿Deseas eliminar este cliente?")) return;

    setError("");
    setEliminando(id);

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar cliente:", error.message);
      setError("No fue posible eliminar el cliente.");
      setEliminando(null);
      return;
    }

    setClientes((actuales) =>
      actuales.filter((cliente) => cliente.id !== id)
    );

    setEliminando(null);
  }

  // CANCELAR FORMULARIO
  function cancelarFormulario() {
    setFormulario(clienteVacio);
    setEditando(null);
    setMostrarFormulario(false);
    setError("");
  }

  // BUSCAR CLIENTES
  const clientesFiltrados = clientes.filter((cliente) =>
    `${cliente.razonSocial} ${cliente.rfc} ${cliente.contacto} ${cliente.ciudad} ${cliente.estado} ${cliente.codigoPostal}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              Gamma Scientific
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-800">
              Clientes
            </h1>
            <p className="mt-2 text-slate-500">
              Administración de clientes y contactos comerciales.
            </p>
          </div>

          <button
            onClick={() => {
              cancelarFormulario();
              setMostrarFormulario(true);
            }}
            className="rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white shadow hover:bg-teal-700"
          >
            + Nuevo cliente
          </button>
        </div>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* INDICADORES */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de clientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {clientes.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Resultados de búsqueda</p>
            <p className="mt-2 text-3xl font-bold text-teal-600">
              {clientesFiltrados.length}
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        {mostrarFormulario && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-800">
              {editando !== null
                ? "Editar cliente"
                : "Registrar nuevo cliente"}
            </h2>

            <form onSubmit={guardarCliente}>
              <div className="grid gap-5 md:grid-cols-2">
                {campos.map(([campo, etiqueta, requerido]) => (
                  <label key={campo} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {etiqueta}
                    </span>

                    <input
                      required={requerido}
                      type={campo === "correo" ? "email" : "text"}
                      maxLength={
                        campo === "codigoPostal" ? 10 : undefined
                      }
                      value={formulario[campo]}
                      onChange={(e) =>
                        setFormulario((actual) => ({
                          ...actual,
                          [campo]: e.target.value,
                        }))
                      }
                      placeholder={`Escribe ${etiqueta.toLowerCase()}`}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : editando !== null
                    ? "Guardar cambios"
                    : "Guardar cliente"}
                </button>

                <button
                  type="button"
                  onClick={cancelarFormulario}
                  disabled={guardando}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        {/* DIRECTORIO */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              Directorio de clientes
            </h2>

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por razón social, RFC, contacto o ubicación..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 md:max-w-xl"
            />
          </div>

          {cargando ? (
            <div className="p-12 text-center text-slate-500">
              Cargando clientes...
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">
                No hay clientes registrados
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Utiliza el botón “Nuevo cliente” para agregar el primero.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Razón social</th>
                    <th className="px-5 py-4">RFC</th>
                    <th className="px-5 py-4">Contacto</th>
                    <th className="px-5 py-4">Ciudad / Estado</th>
                    <th className="px-5 py-4">Correo</th>
                    <th className="px-5 py-4">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {cliente.razonSocial}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {cliente.rfc}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {cliente.contacto || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {cliente.ciudad || "—"}
                        {cliente.estado ? `, ${cliente.estado}` : ""}
                        {cliente.codigoPostal
                          ? ` (${cliente.codigoPostal})`
                          : ""}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {cliente.correo || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => editarCliente(cliente)}
                            className="font-semibold text-teal-700 hover:underline"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => eliminarCliente(cliente.id)}
                            disabled={eliminando !== null}
                            className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                          >
                            {eliminando === cliente.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-5 text-xs text-slate-400">
          Gamma Scientific · Clientes conectados a Supabase.
        </p>
      </div>
    </main>
  );
}
