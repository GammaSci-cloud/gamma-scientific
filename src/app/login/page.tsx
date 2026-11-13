
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function iniciarSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function recuperarContrasena() {
    setError("");
    setMensaje("");

    if (!correo.trim()) {
      setError("Primero escribe tu correo electrónico.");
      return;
    }

    setRecuperando(true);

    const redirectTo =
      `${window.location.origin}/auth/confirm?next=/actualizar-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      correo,
      { redirectTo }
    );

    if (error) {
      setError("No se pudo enviar el correo: " + error.message);
      setRecuperando(false);
      return;
    }

    setMensaje(
      "Si la cuenta existe, recibirás un correo con instrucciones para crear tu contraseña. Revisa también el correo no deseado."
    );

    setRecuperando(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">

        <div className="bg-slate-900 px-8 py-10 text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-teal-400">
            GAMMA SCIENTIFIC
          </p>

          <h1 className="mt-5 text-2xl font-bold text-white">
            Sistema administrativo
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Ingresa con tu cuenta para continuar
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="space-y-5 p-8">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>

            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>

            <input
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Escribe tu contraseña"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={recuperarContrasena}
              disabled={recuperando}
              className="text-sm font-semibold text-teal-700 hover:underline disabled:opacity-60"
            >
              {recuperando
                ? "Enviando..."
                : "¿Olvidaste tu contraseña?"}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-700">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-teal-700 disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Acceso exclusivo para usuarios autorizados.
          </p>

        </form>
      </section>
    </main>
  );
}
