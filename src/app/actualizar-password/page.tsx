
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function guardarPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setExito("");

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.updateUser({
      password: contrasena,
    });

    if (error) {
      setError(
        "No fue posible guardar la contraseña. Es posible que el enlace haya vencido. Solicita uno nuevo."
      );
      setCargando(false);
      return;
    }

    setExito("Tu contraseña se guardó correctamente.");

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-slate-900 px-8 py-10 text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-teal-400">
            GAMMA SCIENTIFIC
          </p>

          <h1 className="mt-5 text-2xl font-bold text-white">
            Crear contraseña
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Configura tu contraseña de acceso al sistema.
          </p>
        </div>

        <form onSubmit={guardarPassword} className="space-y-5 p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nueva contraseña
            </label>

            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirmar contraseña
            </label>

            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="Escribe nuevamente la contraseña"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {exito && (
            <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-700">
              {exito}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white shadow hover:bg-teal-700 disabled:opacity-60"
          >
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </section>
    </main>
  );
}
