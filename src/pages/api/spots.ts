import type { APIRoute } from "astro";
import { supabaseServer } from "../../lib/supabaseServer";

export const GET: APIRoute = async () => {
  const { data: totalRow, error: e1 } = await supabaseServer
    .from("meta")
    .select("value")
    .eq("key", "spots_total")
    .maybeSingle();

  const { data: seedRow, error: e2 } = await supabaseServer
    .from("meta")
    .select("value")
    .eq("key", "spots_taken_seed")
    .maybeSingle();

  if (e1 || e2) return json({ ok: false, error: "No se pudo leer meta." }, 500);

  const total = Number(totalRow?.value ?? 30);
  const seed = Number(seedRow?.value ?? 5);

  const { count, error: e3 } = await supabaseServer
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("status", "CONFIRMED");

  if (e3) return json({ ok: false, error: "No se pudo contar reservas." }, 500);

  const confirmed = Number(count ?? 0);
  const taken = seed + confirmed;
  const left = Math.max(0, total - taken);

  return json({ ok: true, total, taken, left }, 200);
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
