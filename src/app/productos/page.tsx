
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Producto = {
  id: string;
  clave: string;
  descripcion: string;
  marca: string;
  modelo: string;
  categoria: string;
  unidad: string;
  precioCosto: number;
  porcentajeUtilidad: number;
  precioVenta: number;
  tasaIva: number;
  proveedor: string;
  tiempoEntrega: string;
  estatus: boolean;
  observaciones: string;
};

const productoVacio = {
  clave: "",
  descripcion: "",
  marca: "",
  modelo: "",
  categoria: "",
  unidad: "Pieza",
  precioCosto: "0",
  porcentajeUtilidad: "0",
  precioVenta: "0",
  tasaIva: "16",
  proveedor: "",
  tiempoEntrega: "",
  estatus: true,
  observaciones: "",
};

const camposTexto = [
  ["clave", "Clave del producto"],
  ["descripcion", "Descripción"],
  ["marca", "Marca"],
  ["modelo", "Modelo"],
  ["categoria", "Categoría"],
  ["unidad", "Unidad"],
  ["proveedor", "Proveedor"],
  ["tiempoEntrega", "Tiempo de entrega"],
] as const;

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export default function ProductosPage() {
  const supabase = createClient();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [formulario, setFormulario] = useState(productoVacio);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setCargando(true);
    setError("");

    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("clave", { ascending: true });

    if (error) {
      console.error("Error al cargar productos:", error.message);
      setError(
        "No fue posible cargar los productos. Verifica la conexión y los permisos."
      );
      setCargando(false);
      return;
    }

    const lista: Producto[] = (data ?? []).map((p) => ({
      id: p.id,
      clave: p.clave ?? "",
      descripcion: p.descripcion ?? "",
      marca: p.marca ?? "",
      modelo: p.modelo ?? "",
      categoria: p.categoria ?? "",
      unidad: p.unidad ?? "Pieza",
      precioCosto: Number(p.precio_costo ?? 0),
      porcentajeUtilidad: Number(p.porcentaje_utilidad ?? 0),
      precioVenta: Number(p.precio_venta ?? 0),
      tasaIva: Number(p.tasa_iva ?? 0.16) * 100,
      proveedor: p.proveedor ?? "",
      tiempoEntrega: p.tiempo_entrega ?? "",
      estatus: p.estatus ?? true,
      observaciones: p.observaciones ?? "",
    }));

    setProductos(lista);
    setCargando(false);
  }

  function actualizarCampo(
    campo: keyof typeof productoVacio,
    valor: string | boolean
  ) {
    setFormulario((actual) => {
      const actualizado = {
        ...actual,
        [campo]: valor,
      };

      if (campo === "precioCosto" || campo === "porcentajeUtilidad") {
        const costo = Number(actualizado.precioCosto) || 0;
        const utilidad = Number(actualizado.porcentajeUtilidad) || 0;

        actualizado.precioVenta = (
          costo * (1 + utilidad / 100)
        ).toFixed(2);
      }

      return actualizado;
    });
  }

  const precioVentaCalculado =
    Number(formulario.precioVenta) || 0;

  const tasaIvaCalculada =
    Number(formulario.tasaIva) || 0;

  const importeIva =
    precioVentaCalculado * (tasaIvaCalculada / 100);

  const precioConIva =
    precioVentaCalculado + importeIva;

  function prepararNuevo() {
    setFormulario(productoVacio);
    setEditando(null);
    setError("");
    setMostrarFormulario(true);
  }

  function editarProducto(producto: Producto) {
    setFormulario({
      clave: producto.clave,
      descripcion: producto.descripcion,
      marca: producto.marca,
      modelo: producto.modelo,
      categoria: producto.categoria,
      unidad: producto.unidad,
      precioCosto: String(producto.precioCosto),
      porcentajeUtilidad: String(producto.porcentajeUtilidad),
      precioVenta: String(producto.precioVenta),
      tasaIva: String(producto.tasaIva),
      proveedor: producto.proveedor,
      tiempoEntrega: producto.tiempoEntrega,
      estatus: producto.estatus,
      observaciones: producto.observaciones,
    });

    setEditando(producto.id);
    setError("");
    setMostrarFormulario(true);
  }

  async function guardarProducto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setError("");

    const costo = Number(formulario.precioCosto);
    const utilidad = Number(formulario.porcentajeUtilidad);
    const precio = Number(formulario.precioVenta);
    const iva = Number(formulario.tasaIva);

    if (
      !Number.isFinite(costo) ||
      costo < 0 ||
      !Number.isFinite(utilidad) ||
      utilidad < 0 ||
      !Number.isFinite(precio) ||
      precio < 0 ||
      !Number.isFinite(iva) ||
      iva < 0 ||
      iva > 100
    ) {
      setError(
        "Verifica los costos, precios, utilidad e IVA. Los valores deben ser válidos y no negativos; el IVA no puede superar 100%."
      );
      setGuardando(false);
      return;
    }

    const datos = {
      clave: formulario.clave.trim().toUpperCase(),
      descripcion: formulario.descripcion.trim(),
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      categoria: formulario.categoria.trim(),
      unidad: formulario.unidad.trim() || "Pieza",
      precio_costo: costo,
      porcentaje_utilidad: utilidad,
      precio_venta: precio,
      tasa_iva: iva / 100,
      proveedor: formulario.proveedor.trim(),
      tiempo_entrega: formulario.tiempoEntrega.trim(),
      estatus: formulario.estatus,
      observaciones: formulario.observaciones.trim(),
      updated_at: new Date().toISOString(),
    };

    const resultado = editando
      ? await supabase
          .from("productos")
          .update(datos)
          .eq("id", editando)
      : await supabase
          .from("productos")
          .insert(datos);

    if (resultado.error) {
      console.error(
        "Error al guardar producto:",
        resultado.error.message
      );

      setError(
        resultado.error.code === "23505"
          ? "Ya existe un producto con esa clave. Utiliza una clave diferente."
          : "No fue posible guardar el producto. Verifica los datos y los permisos."
      );

      setGuardando(false);
      return;
    }

    await cargarProductos();

    setFormulario(productoVacio);
    setEditando(null);
    setMostrarFormulario(false);
    setGuardando(false);
  }

  async function eliminarProducto(id: string) {
    if (eliminando) return;

    if (!confirm("¿Deseas eliminar este producto?")) return;

    setError("");
    setEliminando(id);

    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Error al eliminar producto:",
        error.message
      );

      setError("No fue posible eliminar el producto.");
      setEliminando(null);
      return;
    }

    setProductos((actuales) =>
      actuales.filter((p) => p.id !== id)
    );

    setEliminando(null);
  }

  const productosFiltrados = productos.filter((p) =>
    `${p.clave} ${p.descripcion} ${p.marca} ${p.modelo} ${p.categoria} ${p.proveedor}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  function cancelar() {
    setFormulario(productoVacio);
    setEditando(null);
    setMostrarFormulario(false);
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              Gamma Scientific
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-800">
              Productos
            </h1>

            <p className="mt-2 text-slate-500">
              Catálogo de productos y servicios.
            </p>
          </div>

          <button
            onClick={prepararNuevo}
            className="rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white shadow hover:bg-teal-700"
          >
            + Nuevo producto
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total de productos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {productos.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Productos activos
            </p>

            <p className="mt-2 text-3xl font-bold text-teal-600">
              {productos.filter((p) => p.estatus).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Resultados de búsqueda
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {productosFiltrados.length}
            </p>
          </div>
        </div>

        {mostrarFormulario && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold text-slate-800">
              {editando
                ? "Editar producto"
                : "Registrar producto"}
            </h2>

            <form onSubmit={guardarProducto}>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                {camposTexto.map(([campo, etiqueta]) => (
                  <label key={campo} className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      {etiqueta}
                    </span>

                    <input
                      required={
                        campo === "clave" ||
                        campo === "descripcion"
                      }
                      value={formulario[campo]}
                      onChange={(e) =>
                        actualizarCampo(campo, e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Precio de costo
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formulario.precioCosto}
                    onChange={(e) =>
                      actualizarCampo("precioCosto", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Utilidad (%)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.porcentajeUtilidad}
                    onChange={(e) =>
                      actualizarCampo(
                        "porcentajeUtilidad",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Se utiliza para calcular automáticamente el precio de venta.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Precio de venta (antes de IVA)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    readOnly
                    value={formulario.precioVenta}
                    className="w-full rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 font-semibold text-teal-800"
                  />

                  <p className="mt-1 text-xs text-teal-700">
                    Calculado automáticamente con costo y utilidad.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    IVA (%)
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={formulario.tasaIva}
                    onChange={(e) =>
                      actualizarCampo("tasaIva", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Estatus
                  </span>

                  <select
                    value={formulario.estatus ? "true" : "false"}
                    onChange={(e) =>
                      actualizarCampo(
                        "estatus",
                        e.target.value === "true"
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>

              </div>

              <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-3">

                <div>
                  <p className="text-sm text-slate-500">
                    Precio antes de IVA
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {formatoMoneda(precioVentaCalculado)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Importe de IVA ({tasaIvaCalculada}%)
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {formatoMoneda(importeIva)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    Precio con IVA incluido
                  </p>

                  <p className="mt-1 text-2xl font-bold text-teal-700">
                    {formatoMoneda(precioConIva)}
                  </p>
                </div>

              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Observaciones
                </span>

                <textarea
                  rows={3}
                  value={formulario.observaciones}
                  onChange={(e) =>
                    actualizarCampo("observaciones", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />
              </label>

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : editando
                    ? "Guardar cambios"
                    : "Guardar producto"}
                </button>

                <button
                  type="button"
                  onClick={cancelar}
                  disabled={guardando}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>

              </div>

            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              Catálogo de productos
            </h2>

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por clave, descripción, marca, modelo o categoría..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 md:max-w-xl"
            />
          </div>

          {cargando ? (
            <div className="p-12 text-center text-slate-500">
              Cargando productos...
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No hay productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Clave</th>
                    <th className="px-5 py-4">Descripción</th>
                    <th className="px-5 py-4">Marca / Modelo</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4">Costo</th>
                    <th className="px-5 py-4">Precio venta</th>
                    <th className="px-5 py-4">Precio con IVA</th>
                    <th className="px-5 py-4">IVA</th>
                    <th className="px-5 py-4">Estatus</th>
                    <th className="px-5 py-4">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {productosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {p.clave}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {p.descripcion}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {p.marca} {p.modelo}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {p.categoria || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatoMoneda(p.precioCosto)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatoMoneda(p.precioVenta)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-teal-700">
                        {formatoMoneda(
                          p.precioVenta * (1 + p.tasaIva / 100)
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {p.tasaIva}%
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            p.estatus
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.estatus ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-3">

                          <button
                            onClick={() => editarProducto(p)}
                            className="font-semibold text-teal-700 hover:underline"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => eliminarProducto(p.id)}
                            disabled={eliminando !== null}
                            className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                          >
                            {eliminando === p.id
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
          Gamma Scientific · Productos conectados a Supabase.
        </p>

      </div>
    </main>
  );
}
