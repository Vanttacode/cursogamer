import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function requireAdmin(request: Request) {
  const token = request.headers.get("x-admin-token") || "";
  const expected = import.meta.env.ADMIN_TOKEN || "";
  return expected && token === expected;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

    const body = await request.json().catch(() => null);
    const id = String(body?.registrationId || "").trim();
    const note = String(body?.note || "").trim() || null;

    if (!id) return new Response("Missing registrationId", { status: 400 });

    const { error } = await supabaseAdmin
      .from("registrations")
      .update({ status: "APPROVED", reviewed_at: new Date().toISOString(), review_note: note })
      .eq("id", id);

    if (error) {
      console.error(error);
      return new Response("Update failed", { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, status: "APPROVED" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
};
