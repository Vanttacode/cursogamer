import type { APIRoute } from "astro";
import { supabaseServer } from "../../../lib/supabaseServer";
import { calcTotalCLP } from "../../../lib/pricing";

function makeId() {
  return (
    "R" +
    Math.random().toString(16).slice(2, 8).toUpperCase() +
    "-" +
    Date.now().toString(36).toUpperCase()
  );
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, error: "JSON inválido." }, 400);

  const guardianName = String(body.guardianName ?? "").trim();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const email = String(body.email ?? "").trim();
  const children = Array.isArray(body.children) ? body.children : [];

  if (!guardianName || !whatsapp || !email) {
    return json({ ok: false, error: "Faltan datos del tutor/a." }, 400);
  }
  if (children.length < 1 || children.length > 3) {
    return json({ ok: false, error: "Participantes: mínimo 1, máximo 3." }, 400);
  }
  for (const c of children) {
    if (!String(c?.name ?? "").trim() || !String(c?.age ?? "").trim()) {
      return json({ ok: false, error: "Cada participante debe tener nombre y edad." }, 400);
    }
  }

  // Verificar cupos disponibles (pero NO descontar todavía)
  const spots = await fetch(new URL("/api/spots", request.url)).then((r) => r.json());
  if (!spots?.ok) return json({ ok: false, error: "No se pudo verificar cupos." }, 500);
  if (spots.left <= 0) return json({ ok: false, error: "Cupos agotados." }, 409);

  const childrenCount = children.length;
  const totalCLP = calcTotalCLP(childrenCount);
  const id = makeId();

  const { error } = await supabaseServer.from("reservations").insert({
    id,
    guardian_name: guardianName,
    whatsapp,
    email,
    children,
    children_count: childrenCount,
    total_clp: totalCLP,
    status: "STARTED",
  });

  if (error) return json({ ok: false, error: "No se pudo guardar la reserva." }, 500);

  return json({ ok: true, reservationId: id, totalCLP, spotsLeft: spots.left }, 200);
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
