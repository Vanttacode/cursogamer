import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const ACTIVE_STATUSES = ["CONFIRMED", "APPROVED", "PAID"] as const;

async function getMetaInt(keys: string[], fallback: number) {
  for (const key of keys) {
    const { data, error } = await supabaseAdmin
      .from("meta")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (!error && data?.value != null) {
      const n = parseInt(String(data.value), 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return fallback;
}

async function computeSpots() {
  const total = await getMetaInt(["spots_total", "course_spots_total"], 30);

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select("status, children_count");

  if (error) throw error;

  const taken = (data || []).reduce((acc, row: any) => {
    const isActive = ACTIVE_STATUSES.includes(row.status);
    const qty = Number(row.children_count) || 0;
    return acc + (isActive ? qty : 0);
  }, 0);

  const left = Math.max(0, total - taken);
  return { total, taken, left };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const reservationId = String(form.get("reservationId") ?? "").trim();
    const receipt = form.get("receipt");

    if (!reservationId) {
      return new Response(JSON.stringify({ ok: false, error: "Falta reservationId." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!(receipt instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: "Debes adjuntar un comprobante (foto o PDF)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verifica reserva existe
    const { data: rsv, error: rsvErr } = await supabaseAdmin
      .from("reservations")
      .select("id,status,children_count")
      .eq("id", reservationId)
      .maybeSingle();

    if (rsvErr) throw rsvErr;
    if (!rsv) {
      return new Response(JSON.stringify({ ok: false, error: "Reserva no encontrada." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Subir a Storage (bucket: receipts) — idempotente
    const ext = (receipt.name.split(".").pop() || "bin").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${reservationId}/receipt.${safeExt}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("receipts")
      .upload(path, receipt, {
        contentType: receipt.type || "application/octet-stream",
        upsert: true, // ✅ reintentos no fallan
      });

    if (upErr) throw upErr;

    // Confirmar (si ya estaba CONFIRMED, igual actualizamos receipt_path)
    const { error: upRsvErr } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "CONFIRMED",
        receipt_path: path,
      })
      .eq("id", reservationId);

    if (upRsvErr) throw upRsvErr;

    // ✅ Recalcular cupos y devolverlos
    const { total, taken, left } = await computeSpots();

    return new Response(
      JSON.stringify({ ok: true, spotsLeft: left, total, taken }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
