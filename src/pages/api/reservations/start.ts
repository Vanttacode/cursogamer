import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

type Child = { name: string; age: string; notes?: string };

function calcTotalCLP(childrenCount: number): number {
  // 1: 40k, 2: +35k, 3: +30k => 40k / 75k / 105k
  const tiers = [40000, 35000, 30000];
  let total = 0;
  for (let i = 0; i < Math.min(childrenCount, 3); i++) total += tiers[i];
  return total;
}

function getSupabaseAdmin() {
  // ⚠️ En Astro server: usa import.meta.env (NO uses PUBLIC_ para secretos)
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const service = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (!url) throw new Error("Missing PUBLIC_SUPABASE_URL");
  if (!service) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, service, { auth: { persistSession: false } });
}

async function getSpotsTotal(supabase: ReturnType<typeof getSupabaseAdmin>) {
  // meta: { key, value }
  const { data, error } = await supabase
    .from("meta")
    .select("value")
    .eq("key", "spots_total")
    .maybeSingle();

  if (error) return 30; // fallback
  const n = Number(data?.value ?? 30);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

async function countTaken(supabase: ReturnType<typeof getSupabaseAdmin>) {
  // Tomados = reservas confirmadas
  const { count } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "CONFIRMED");

  return count ?? 0;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = getSupabaseAdmin();

    const body = (await request.json()) as {
      guardianName?: string;
      whatsapp?: string;
      email?: string;
      children?: Child[];
    };

    const guardianName = (body.guardianName ?? "").trim();
    const whatsapp = (body.whatsapp ?? "").trim();
    const email = (body.email ?? "").trim();
    const children = Array.isArray(body.children) ? body.children : [];

    if (!guardianName) return new Response(JSON.stringify({ ok: false, error: "Falta nombre del tutor/a." }), { status: 400 });
    if (!whatsapp) return new Response(JSON.stringify({ ok: false, error: "Falta WhatsApp." }), { status: 400 });
    if (!email) return new Response(JSON.stringify({ ok: false, error: "Falta correo." }), { status: 400 });

    if (children.length < 1 || children.length > 3) {
      return new Response(JSON.stringify({ ok: false, error: "Debes inscribir entre 1 y 3 participantes." }), { status: 400 });
    }

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!c?.name?.trim()) {
        return new Response(JSON.stringify({ ok: false, error: `Falta el nombre del participante #${i + 1}.` }), { status: 400 });
      }
      if (!c?.age?.trim()) {
        return new Response(JSON.stringify({ ok: false, error: `Falta la edad del participante #${i + 1}.` }), { status: 400 });
      }
    }

    // Spots check (no descuenta aquí; descuenta al confirmar)
    const totalSpots = await getSpotsTotal(supabase);
    const taken = await countTaken(supabase);
    const left = Math.max(0, totalSpots - taken);

    if (left <= 0) {
      return new Response(JSON.stringify({ ok: false, error: "No quedan cupos disponibles." }), { status: 409 });
    }

    const reservationId =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());

    const totalCLP = calcTotalCLP(children.length);

    const { error: insErr } = await supabase.from("reservations").insert({
      id: reservationId,
      guardian_name: guardianName,
      whatsapp,
      email,
      children,
      children_count: children.length,
      total_clp: totalCLP,
      status: "STARTED",
    });

    if (insErr) {
      return new Response(JSON.stringify({ ok: false, error: insErr.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ ok: true, reservationId, totalCLP, spotsLeft: left }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// (Opcional) Si quieres mantener GET para debug:
// export const GET: APIRoute = async () => new Response("OK");
