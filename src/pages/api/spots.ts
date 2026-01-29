import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
// OJO: esta key debe existir SOLO en server (.env), jamás como PUBLIC_
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Faltan SUPABASE_URL (o PUBLIC_SUPABASE_URL) o SUPABASE_SERVICE_ROLE_KEY en .env");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ✅ Solo estos estados consumen cupo real (ajusta si quieres)
const ACTIVE_STATUSES = ["CONFIRMED", "APPROVED", "PAID"] as const;

async function getMetaInt(keys: string[], fallback: number) {
  for (const key of keys) {
    const { data, error } = await supabase
      .from("meta")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (!error && data?.value) {
      const n = parseInt(String(data.value), 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return fallback;
}

export const GET: APIRoute = async () => {
  try {
    // ✅ soporta ambas keys para que no te rompa nada según cómo lo tengas en BD
    const total = await getMetaInt(["spots_total", "course_spots_total"], 30);

    // ✅ Tomados = suma de children_count de reservas confirmadas (o activas)
    // Importante: NO cuentes filas, porque 1 reserva puede ser 1/2/3 cupos.
    const { data, error } = await supabase
      .from("reservations")
      .select("status, children_count");

    if (error) throw error;

    const taken = (data || []).reduce((acc, row: any) => {
      const isActive = ACTIVE_STATUSES.includes(row.status);
      const qty = Number(row.children_count) || 0;
      return acc + (isActive ? qty : 0);
    }, 0);

    const left = Math.max(0, total - taken);
    const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

    // ✅ Formato “ok:true” para calzar con tu SpotsResponse del widget
    // + devolvemos "available" por compatibilidad con pantallas viejas
    return new Response(
      JSON.stringify({
        ok: true,
        total,
        taken,
        left,
        available: left,
        pct,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: "spots_fetch_failed", detail: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
