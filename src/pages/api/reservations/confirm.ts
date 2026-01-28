import type { APIRoute } from "astro";
import { supabaseServer } from "../../../lib/supabaseServer";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB (ajusta si quieres)
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return json({ ok: false, error: "Formulario inválido." }, 400);

  const reservationId = String(form.get("reservationId") ?? "").trim();
  const receipt = form.get("receipt");

  if (!reservationId) return json({ ok: false, error: "Falta reservationId." }, 400);

  // ✅ Regla clave: NO se confirma si no hay comprobante
  if (!(receipt instanceof File)) {
    return json({ ok: false, error: "Debes adjuntar un comprobante (foto o PDF)." }, 400);
  }

  if (!ALLOWED_MIME.has(receipt.type)) {
    return json({ ok: false, error: "Formato inválido. Usa JPG/PNG/WEBP o PDF." }, 400);
  }
  if (receipt.size > MAX_BYTES) {
    return json({ ok: false, error: "Archivo demasiado grande (máx 8MB)." }, 400);
  }

  // Buscar reserva
  const { data: resv, error: e1 } = await supabaseServer
    .from("reservations")
    .select("id,status")
    .eq("id", reservationId)
    .maybeSingle();

  if (e1) return json({ ok: false, error: "Error buscando reserva." }, 500);
  if (!resv) return json({ ok: false, error: "Reserva no encontrada." }, 404);

  if (resv.status === "CONFIRMED") {
    // ya confirmada
    const spots = await fetch(new URL("/api/spots", request.url)).then((r) => r.json());
    return json({ ok: true, spotsLeft: spots?.left ?? null }, 200);
  }

  // Re-check cupos antes de confirmar
  const spots = await fetch(new URL("/api/spots", request.url)).then((r) => r.json());
  if (!spots?.ok) return json({ ok: false, error: "No se pudo verificar cupos." }, 500);
  if (spots.left <= 0) return json({ ok: false, error: "Cupos agotados." }, 409);

  // Subir a Storage
  const ext = guessExt(receipt.type, receipt.name);
  const path = `${reservationId}/${Date.now()}.${ext}`;

  const arrayBuffer = await receipt.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: eUp } = await supabaseServer.storage
    .from("receipts")
    .upload(path, bytes, {
      contentType: receipt.type,
      upsert: false,
    });

  if (eUp) return json({ ok: false, error: "No se pudo subir el comprobante." }, 500);

  // Marcar CONFIRMED (esto es lo que “consume” cupo al contar confirmadas)
  const { error: e2 } = await supabaseServer
    .from("reservations")
    .update({ status: "CONFIRMED", receipt_path: path })
    .eq("id", reservationId);

  if (e2) return json({ ok: false, error: "No se pudo confirmar la reserva." }, 500);

  const spots2 = await fetch(new URL("/api/spots", request.url)).then((r) => r.json());
  return json({ ok: true, spotsLeft: spots2?.left ?? null }, 200);
};

function guessExt(mime: string, name: string) {
  const lower = name.toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  // fallback por nombre
  const m = lower.match(/\.(pdf|png|webp|jpg|jpeg)$/);
  if (m?.[1]) return m[1] === "jpeg" ? "jpg" : m[1];
  return "bin";
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
