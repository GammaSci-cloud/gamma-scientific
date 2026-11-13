
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const destino =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/actualizar-password";

  const supabase = await createClient();

  // Validar enlace mediante código PKCE
  if (code) {
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(
        "Error al intercambiar el código:",
        error.message
      );

      return NextResponse.redirect(
        `${origin}/login?error=enlace_invalido`
      );
    }
  }
  // Validar enlace mediante token OTP
  else if (
    tokenHash &&
    ["signup", "invite", "recovery", "magiclink", "email_change"].includes(
      type ?? ""
    )
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (error) {
      console.error(
        "Error al verificar el token:",
        error.message
      );

      return NextResponse.redirect(
        `${origin}/login?error=enlace_invalido`
      );
    }
  }
  // No se recibió un código ni un token válido
  else {
    console.error(
      "Enlace inválido: no se recibió code o token_hash.",
      { code, tokenHash, type }
    );

    return NextResponse.redirect(
      `${origin}/login?error=enlace_invalido`
    );
  }

  // Validación correcta: continuar al destino
  return NextResponse.redirect(`${origin}${destino}`);
}
