
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Cliente = {
  id: string;
  razon_social: string;
  rfc?: string | null;
};

type Producto = {
  id: string;
  clave: string;
  descripcion: string;
  marca?: string | null;
  modelo?: string | null;
  unidad?: string | null;
  precio_venta: number;
  tasa_iva: number;
  estatus: boolean;
};

type Partida = {
  id: string;
  producto_id: string;
  clave_producto: string;
  descripcion: string;
  marca: string;
  modelo: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  tasa_iva: number;
};

type Cotizacion = {
  id: string;
  folio: string;
  fecha: string;
  fecha_vencimiento: string | null;
  moneda: string;
  estatus: string;
  total: number;
  cliente_id: string;
};

const supabase = createClient();

const redondear = (valor: number) =>
  Math.round((valor + Number.EPSILON) * 100) / 100;

const moneda = (valor: number, tipo = "MXN") =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: tipo,
  }).format(Number(valor) || 0);

const porcentajeIVA = (valor: number) => {
  const numero = Number(valor) || 0;
  return numero <= 1 ? numero * 100 : numero;
};

const nuevaPartida = (): Partida => ({
  id: crypto.randomUUID(),
  producto_id: "",
  clave_producto: "",
  descripcion: "",
  marca: "",
  modelo: "",
  unidad: "Pieza",
  cantidad: 1,
  precio_unitario: 0,
  descuento_porcentaje: 0,
  tasa_iva: 16,
});

export default function CotizacionesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [monedaSeleccionada, setMonedaSeleccionada] = useState("MXN");
  const [vigencia, setVigencia] = useState(30);
  const [condicionesPago, setCondicionesPago] = useState("Transferencia");
  const [tiempoEntrega, setTiempoEntrega] = useState("");
  const [descuentoGeneral, setDescuentoGeneral] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [partidas, setPartidas] = useState<Partida[]>([nuevaPartida()]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [clientesRes, productosRes, cotizacionesRes] =
      await Promise.all([
        supabase
          .from("clientes")
          .select("id, razon_social, rfc")
          .order("razon_social"),

        supabase
          .from("productos")
          .select(
            "id, clave, descripcion, marca, modelo, unidad, precio_venta, tasa_iva, estatus"
          )
          .eq("estatus", true)
          .order("descripcion"),

        supabase
          .from("cotizaciones")
          .select(
            "id, folio, fecha, fecha_vencimiento, moneda, estatus, total, cliente_id"
          )
          .order("created_at", { ascending: false }),
      ]);

    if (clientesRes.error) {
      setError("No se pudieron cargar los clientes: " + clientesRes.error.message);
    } else {
      setClientes(clientesRes.data || []);
    }

    if (productosRes.error) {
      setError("No se pudieron cargar los productos: " + productosRes.error.message);
    } else {
      setProductos(productosRes.data || []);
    }

    if (cotizacionesRes.error) {
      setError("No se pudieron cargar las cotizaciones: " + cotizacionesRes.error.message);
    } else {
      setCotizaciones(cotizacionesRes.data || []);
    }

    setCargando(false);
  }

  function agregarPartida() {
    setPartidas((actuales) => [...actuales, nuevaPartida()]);
  }

  function eliminarPartida(id: string) {
    setPartidas((actuales) =>
      actuales.length > 1
        ? actuales.filter((partida) => partida.id !== id)
        : actuales
    );
  }

  function seleccionarProducto(partidaId: string, productoId: string) {
    const producto = productos.find((p) => p.id === productoId);

    setPartidas((actuales) =>
      actuales.map((partida) => {
        if (partida.id !== partidaId) return partida;

        if (!producto) {
          return {
            ...partida,
            producto_id: "",
            clave_producto: "",
            descripcion: "",
            marca: "",
            modelo: "",
            precio_unitario: 0,
          };
        }

        return {
          ...partida,
          producto_id: producto.id,
          clave_producto: producto.clave,
          descripcion: producto.descripcion,
          marca: producto.marca || "",
          modelo: producto.modelo || "",
          unidad: producto.unidad || "Pieza",
          precio_unitario: Number(producto.precio_venta) || 0,
          tasa_iva: porcentajeIVA(Number(producto.tasa_iva)),
        };
      })
    );
  }

  function actualizarPartida(
    id: string,
    campo: keyof Partida,
    valor: string | number
  ) {
    setPartidas((actuales) =>
      actuales.map((partida) =>
        partida.id === id
          ? { ...partida, [campo]: valor }
          : partida
      )
    );
  }

  const calculo = useMemo(() => {
    const lineas = partidas.map((partida) => {
      const cantidad = Math.max(0, Number(partida.cantidad) || 0);
      const precio = Math.max(0, Number(partida.precio_unitario) || 0);
      const descuento = Math.min(
        100,
        Math.max(0, Number(partida.descuento_porcentaje) || 0)
      );

      const bruto = redondear(cantidad * precio);
      const descuentoImporte = redondear(bruto * descuento / 100);
      const despuesDescuento = redondear(bruto - descuentoImporte);

      return {
        partida,
        bruto,
        descuentoImporte,
        despuesDescuento,
        descuentoGeneralAsignado: 0,
        baseGravable: 0,
        importeIVA: 0,
        total: 0,
      };
    });

    const subtotalBruto = redondear(
      lineas.reduce((suma, linea) => suma + linea.bruto, 0)
    );

    const descuentoPartidas = redondear(
      lineas.reduce((suma, linea) => suma + linea.descuentoImporte, 0)
    );

    const subtotalTrasDescuentos = redondear(
      lineas.reduce((suma, linea) => suma + linea.despuesDescuento, 0)
    );

    const tasaGeneral = Math.min(
      100,
      Math.max(0, Number(descuentoGeneral) || 0)
    );

    const descuentoGeneralImporte = redondear(
      subtotalTrasDescuentos * tasaGeneral / 100
    );

    const elegibles = lineas.filter(
      (linea) => linea.despuesDescuento > 0
    );

    let asignado = 0;

    elegibles.forEach((linea, indice) => {
      if (indice === elegibles.length - 1) {
        linea.descuentoGeneralAsignado = redondear(
          descuentoGeneralImporte - asignado
        );
      } else {
        linea.descuentoGeneralAsignado = redondear(
          subtotalTrasDescuentos > 0
            ? descuentoGeneralImporte *
                (linea.despuesDescuento / subtotalTrasDescuentos)
            : 0
        );
        asignado = redondear(
          asignado + linea.descuentoGeneralAsignado
        );
      }
    });

    lineas.forEach((linea) => {
      linea.baseGravable = redondear(
        linea.despuesDescuento - linea.descuentoGeneralAsignado
      );

      const iva = Math.max(
        0,
        Number(linea.partida.tasa_iva) || 0
      );

      linea.importeIVA = redondear(
        linea.baseGravable * iva / 100
      );

      linea.total = redondear(
        linea.baseGravable + linea.importeIVA
      );
    });

    const ivaTotal = redondear(
      lineas.reduce((suma, linea) => suma + linea.importeIVA, 0)
    );

    const descuentoTotal = redondear(
      descuentoPartidas + descuentoGeneralImporte
    );

    const total = redondear(
      subtotalBruto - descuentoTotal + ivaTotal
    );

    return {
      lineas,
      subtotalBruto,
      descuentoPartidas,
      subtotalTrasDescuentos,
      descuentoGeneralImporte,
      descuentoTotal,
      ivaTotal,
      total,
    };
  }, [partidas, descuentoGeneral]);

  async function guardarCotizacion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (!clienteId) {
      setError("Selecciona un cliente.");
      return;
    }

    if (partidas.length === 0 || partidas.some((p) => !p.descripcion.trim())) {
      setError("Agrega al menos un producto válido.");
      return;
    }

    if (
      partidas.some(
        (p) =>
          Number(p.cantidad) <= 0 ||
          Number(p.precio_unitario) < 0 ||
          Number(p.descuento_porcentaje) < 0 ||
          Number(p.descuento_porcentaje) > 100 ||
          Number(p.tasa_iva) < 0 ||
          Number(p.tasa_iva) > 100
      )
    ) {
      setError("Revisa cantidades, precios, descuentos e IVA de las partidas.");
      return;
    }

    setGuardando(true);

    try {
      const anio = new Date(fecha + "T12:00:00").getFullYear();

      const { data: folio, error: folioError } = await supabase.rpc(
        "siguiente_folio_cotizacion",
        { p_anio: anio }
      );

      if (folioError) throw folioError;

      const cotizacionInsert = {
        folio,
        cliente_id: clienteId,
        fecha,
        fecha_vencimiento: fechaVencimiento || null,
        moneda: monedaSeleccionada,
        vigencia_dias: Number(vigencia) || 30,
        condiciones_pago: condicionesPago,
        tiempo_entrega: tiempoEntrega,
        estatus: "Borrador",
        subtotal_bruto: calculo.subtotalBruto,
        descuento_partidas: calculo.descuentoPartidas,
        descuento_general_porcentaje: Number(descuentoGeneral) || 0,
        descuento_general_importe: calculo.descuentoGeneralImporte,
        descuento_total: calculo.descuentoTotal,
        iva_total: calculo.ivaTotal,
        total: calculo.total,
        observaciones,
        version_actual: 1,
      };

      const { data: cotizacion, error: cotizacionError } =
        await supabase
          .from("cotizaciones")
          .insert(cotizacionInsert)
          .select()
          .single();

      if (cotizacionError) throw cotizacionError;

      const detallesInsert = calculo.lineas.map((linea, indice) => ({
        cotizacion_id: cotizacion.id,
        numero_partida: indice + 1,
        producto_id: linea.partida.producto_id || null,
        clave_producto: linea.partida.clave_producto,
        descripcion: linea.partida.descripcion,
        marca: linea.partida.marca,
        modelo: linea.partida.modelo,
        unidad: linea.partida.unidad,
        cantidad: Number(linea.partida.cantidad),
        precio_unitario: Number(linea.partida.precio_unitario),
        descuento_porcentaje:
          Number(linea.partida.descuento_porcentaje) / 100,
        descuento_importe: linea.descuentoImporte,
        descuento_general_asignado:
          linea.descuentoGeneralAsignado,
        base_gravable: linea.baseGravable,
        tasa_iva: Number(linea.partida.tasa_iva) / 100,
        importe_iva: linea.importeIVA,
        total_partida: linea.total,
      }));

      const { error: detallesError } = await supabase
        .from("cotizacion_detalles")
        .insert(detallesInsert);

      if (detallesError) {
        await supabase
          .from("cotizaciones")
          .delete()
          .eq("id", cotizacion.id);

        throw detallesError;
      }

      const cliente = clientes.find((c) => c.id === clienteId);

      const snapshot = {
        cotizacion: {
          ...cotizacionInsert,
          id: cotizacion.id,
          folio,
          cliente: cliente || null,
        },
        partidas: calculo.lineas.map((linea, indice) => ({
          numero_partida: indice + 1,
          ...linea.partida,
          descuento_importe: linea.descuentoImporte,
          descuento_general_asignado:
            linea.descuentoGeneralAsignado,
          base_gravable: linea.baseGravable,
          importe_iva: linea.importeIVA,
          total_partida: linea.total,
        })),
        resumen: {
          subtotal_bruto: calculo.subtotalBruto,
          descuento_partidas: calculo.descuentoPartidas,
          descuento_general_porcentaje: Number(descuentoGeneral) || 0,
          descuento_general_importe: calculo.descuentoGeneralImporte,
          descuento_total: calculo.descuentoTotal,
          iva_total: calculo.ivaTotal,
          total: calculo.total,
        },
      };

      const { error: versionError } = await supabase
        .from("cotizacion_versiones")
        .insert({
          cotizacion_id: cotizacion.id,
          numero_version: 1,
          snapshot,
          motivo_cambio: "Creación de cotización",
        });

      if (versionError) {
        await supabase
          .from("cotizaciones")
          .delete()
          .eq("id", cotizacion.id);

        throw versionError;
      }

      setMensaje(`Cotización ${folio} guardada correctamente.`);

      setClienteId("");
      setFecha(new Date().toISOString().slice(0, 10));
      setFechaVencimiento("");
      setMonedaSeleccionada("MXN");
      setVigencia(30);
      setCondicionesPago("Transferencia");
      setTiempoEntrega("");
      setDescuentoGeneral(0);
      setObservaciones("");
      setPartidas([nuevaPartida()]);

      await cargarDatos();
    } catch (error: unknown) {
      const mensajeError =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar la cotización.";

      setError(mensajeError);
    } finally {
      setGuardando(false);
    }
  }

  const nombreCliente = (id: string) =>
    clientes.find((cliente) => cliente.id === id)?.razon_social ||
    "Cliente no encontrado";

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
              Gamma Scientific
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Cotizaciones
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Elaboración y control de cotizaciones comerciales.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarDatos}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Actualizar información
          </button>
        </header>

        {mensaje && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={guardarCotizacion} className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Datos de la cotización
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cliente *
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Moneda
                </label>
                <select
                  value={monedaSeleccionada}
                  onChange={(e) => setMonedaSeleccionada(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                >
                  <option value="MXN">MXN - Peso mexicano</option>
                  <option value="USD">USD - Dólar estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Vigencia (días)
                </label>
                <input
                  type="number"
                  min="1"
                  value={vigencia}
                  onChange={(e) => setVigencia(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Condiciones de pago
                </label>
                <input
                  value={condicionesPago}
                  onChange={(e) => setCondicionesPago(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tiempo de entrega
                </label>
                <input
                  value={tiempoEntrega}
                  onChange={(e) => setTiempoEntrega(e.target.value)}
                  placeholder="Ej. 8 a 10 semanas"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800">
                Productos y servicios
              </h2>

              <button
                type="button"
                onClick={agregarPartida}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                + Agregar partida
              </button>
            </div>

            {partidas.map((partida, indice) => (
              <div
                key={partida.id}
                className="mb-5 rounded-lg border border-slate-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700">
                    Partida {indice + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() => eliminarPartida(partida.id)}
                    disabled={partidas.length === 1}
                    className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Seleccionar producto del catálogo
                    </label>
                    <select
                      value={partida.producto_id}
                      onChange={(e) =>
                        seleccionarProducto(partida.id, e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    >
                      <option value="">Seleccionar producto (opcional)</option>
                      {productos.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.clave} - {producto.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Clave
                    </label>
                    <input
                      value={partida.clave_producto}
                      onChange={(e) =>
                        actualizarPartida(
                          partida.id,
                          "clave_producto",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Unidad
                    </label>
                    <input
                      value={partida.unidad}
                      onChange={(e) =>
                        actualizarPartida(partida.id, "unidad", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Descripción *
                    </label>
                    <textarea
                      value={partida.descripcion}
                      onChange={(e) =>
                        actualizarPartida(
                          partida.id,
                          "descripcion",
                          e.target.value
                        )
                      }
                      required
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Marca
                    </label>
                    <input
                      value={partida.marca}
                      onChange={(e) =>
                        actualizarPartida(partida.id, "marca", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Modelo
                    </label>
                    <input
                      value={partida.modelo}
                      onChange={(e) =>
                        actualizarPartida(partida.id, "modelo", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={partida.cantidad}
                      onChange={(e) =>
                        actualizarPartida(
                          partida.id,
                          "cantidad",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Precio unitario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={partida.precio_unitario}
                      onChange={(e) =>
                        actualizarPartida(
                          partida.id,
                          "precio_unitario",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Descuento de partida (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={partida.descuento_porcentaje}
                      onChange={(e) =>
                        actualizarPartida(
                          partida.id,
                          "descuento_porcentaje",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      IVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={partida.tasa_iva}
                      onChange={(e) =>
                        actualizarPartida(
                          partida.id,
                          "tasa_iva",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                    />
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 md:col-span-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Importe antes de descuentos</span>
                      <span>
                        {moneda(
                          partida.cantidad * partida.precio_unitario,
                          monedaSeleccionada
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Descuento general y observaciones
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descuento general (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={descuentoGeneral}
                  onChange={(e) =>
                    setDescuentoGeneral(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Se aplica después de los descuentos individuales.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Resumen de cotización
            </h2>

            <div className="ml-auto max-w-md space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal bruto</span>
                <span>
                  {moneda(calculo.subtotalBruto, monedaSeleccionada)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Descuentos por partida</span>
                <span>
                  -{moneda(calculo.descuentoPartidas, monedaSeleccionada)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Descuento general</span>
                <span>
                  -{moneda(calculo.descuentoGeneralImporte, monedaSeleccionada)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-semibold text-slate-700">
                <span>Descuento total</span>
                <span>
                  {moneda(calculo.descuentoTotal, monedaSeleccionada)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>IVA total</span>
                <span>
                  {moneda(calculo.ivaTotal, monedaSeleccionada)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between text-xl font-bold text-slate-900">
                  <span>TOTAL</span>
                  <span className="text-teal-700">
                    {moneda(calculo.total, monedaSeleccionada)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setPartidas([nuevaPartida()]);
                setClienteId("");
                setDescuentoGeneral(0);
                setObservaciones("");
                setError("");
                setMensaje("");
              }}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Limpiar formulario
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar cotización"}
            </button>
          </div>
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              Cotizaciones registradas
            </h2>
            <span className="text-sm text-slate-500">
              {cotizaciones.length} registros
            </span>
          </div>

          {cargando ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Cargando cotizaciones...
            </p>
          ) : cotizaciones.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No hay cotizaciones registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="p-3">Folio</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Moneda</th>
                    <th className="p-3">Estatus</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cotizacion) => (
                    <tr
                      key={cotizacion.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 font-semibold text-teal-700">
                        {cotizacion.folio}
                      </td>
                      <td className="p-3 text-slate-600">
                        {cotizacion.fecha}
                      </td>
                      <td className="p-3 text-slate-700">
                        {nombreCliente(cotizacion.cliente_id)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {cotizacion.moneda}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {cotizacion.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-800">
                        {moneda(cotizacion.total, cotizacion.moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
