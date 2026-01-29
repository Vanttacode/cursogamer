import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

const PRICE_TIERS = [40000, 35000, 30000] as const;

function calcTotal(count: number) {
  let total = 0;
  for (let i = 0; i < Math.min(count, 3); i++) total += PRICE_TIERS[i];
  return total;
}

function safeFileExt(mime: string, fallbackName: string) {
  // Preferir extensión por nombre si viene
  const fromName = fallbackName.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 6) return fromName;

  // Fallback por mime
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Expected multipart/form-data", { status: 400 });
    }

    const form = await request.formData();
    const payloadRaw = form.get("payload");
    const receipt = form.get("receipt");

    if (typeof payloadRaw !== "string") {
      return new Response("Missing payload", { status: 400 });
    }
    if (!(receipt instanceof File)) {
      return new Response("Missing receipt file", { status: 400 });
    }

    const payload = JSON.parse(payloadRaw);

    const parentName = String(payload?.parentName || "").trim();
    const email = String(payload?.email || "").trim();
    const phone = String(payload?.phone || "").trim();

    const students = Array.isArray(payload?.students) ? payload.students : [];
    const studentCount = students.length;

    if (!parentName || !email) return new Response("Missing tutor info", { status: 400 });
    if (studentCount < 1 || studentCount > 3) return new Response("Max 3 students", { status: 400 });

    // Validar alumnos
    for (const s of students) {
      const n = String(s?.name || "").trim();
      if (n.length < 2) return new Response("Student name required", { status: 400 });
    }

    // Total server-side (no confiar en cliente)
    const total = calcTotal(studentCount);

    const payerRut = String(payload?.payment?.payerRut || "").trim() || null;
    const receiptRef = String(payload?.payment?.receiptRef || "").trim() || null;

    // 1) Crear registro base en DB (sin receipt_path todavía no; pero lo necesitamos)
    // Vamos a generar un UUID creando la fila después de subir, usando ruta con fecha+random.
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const ext = safeFileExt(receipt.type, receipt.name);
    const fileNameSafe = receipt.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const objectPath = `registrations/${yyyy}/${mm}/${dd}/${crypto.randomUUID()}_${fileNameSafe}.${ext}`;

    // 2) Subir comprobante (private bucket)
    const arrayBuffer = await receipt.arrayBuffer();
    const uploadRes = await supabaseAdmin.storage
      .from("receipts")
      .upload(objectPath, arrayBuffer, {
        contentType: receipt.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadRes.error) {
      console.error(uploadRes.error);
      return new Response("Failed to upload receipt", { status: 500 });
    }

    // 3) Insert registration
    const { data: reg, error: regErr } = await supabaseAdmin
      .from("registrations")
      .insert({
        parent_name: parentName,
        email,
        phone: phone || null,

        currency: "CLP",
        total_amount: total,
        student_count: studentCount,

        payer_rut: payerRut,
        receipt_ref: receiptRef,

        receipt_bucket: "receipts",
        receipt_path: objectPath,
        receipt_mime: receipt.type || null,
        receipt_size: receipt.size || null,

        status: "PENDING_REVIEW",
      })
      .select("id")
      .single();

    if (regErr || !reg?.id) {
      console.error(regErr);

      // rollback: borrar archivo subido
      await supabaseAdmin.storage.from("receipts").remove([objectPath]);

      return new Response("Failed to create registration", { status: 500 });
    }

    // 4) Insert students
    const studentRows = students.map((s: any) => ({
      registration_id: reg.id,
      name: String(s?.name || "").trim(),
      age: String(s?.age || "").trim() || null,
    }));

    const { error: stErr } = await supabaseAdmin.from("registration_students").insert(studentRows);
    if (stErr) {
      console.error(stErr);

      // rollback: borrar registro + archivo
      await supabaseAdmin.from("registrations").delete().eq("id", reg.id);
      await supabaseAdmin.storage.from("receipts").remove([objectPath]);

      return new Response("Failed to create students", { status: 500 });
    }

    return new Response(
      JSON.stringify({ ok: true, status: "PENDING_REVIEW", registrationId: reg.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
};
