
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    }
  );

  // Obtener la sesión sin asumir que siempre existe
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const usuarioAutenticado = !error && !!claims;

  const ruta = request.nextUrl.pathname;

  // Rutas públicas
  const rutasPublicas = [
    "/login",
    "/auth/confirm",
  ];

  const esRutaPublica = rutasPublicas.includes(ruta);

  // Si no hay sesión, redirigir al login
  if (!usuarioAutenticado && !esRutaPublica) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";
    url.search = "";

    return NextResponse.redirect(url);
  }

  // Si ya inició sesión y visita login, ir al panel
  if (usuarioAutenticado && ruta === "/login") {
    const url = request.nextUrl.clone();

    url.pathname = "/";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
