import React, { useEffect, useMemo, useState } from "react";

type Child = { name: string; age: string; notes: string };

type SpotsResponse =
  | { ok: true; total: number; taken: number; left: number }
  | { ok: false; error: string };

type StartResponse =
  | { ok: true; reservationId: string; totalCLP: number; spotsLeft: number }
  | { ok: false; error: string };

type ConfirmResponse =
  | { ok: true; spotsLeft?: number | null }
  | { ok: false; error: string };

type Step = 1 | 2 | 3;

// ✅ precios reales: 1ro 40k, 2do +35k, 3ro +30k
const PRICE_TIERS = [40000, 35000, 30000] as const;
function calcTotalCLP(childrenCount: number): number {
  let total = 0;
  for (let i = 0; i < Math.min(childrenCount, 3); i++) total += PRICE_TIERS[i];
  return total;
}

// ✅ copiar en formato que “pega ordenado” en apps bancarias (un solo botón)
const BANK_TEXT = [
  "Nombre: NICOLAS DANIEL VERA",
  "Rut: 27734575-7",
  "Banco: BancoEstado",
  "Tipo: Cuenta Corriente",
  "Número Cuenta: 92100046948",
  "Correo: nicolasvera39205@hotmail.com",
].join("\n");

export default function ReservationWidget() {
  const [spots, setSpots] = useState<SpotsResponse | null>(null);

  const [step, setStep] = useState<Step>(1);

  // Paso 1: apoderado
  const [guardianName, setGuardianName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // Paso 2: alumnos
  const [children, setChildren] = useState<Child[]>([{ name: "", age: "", notes: "" }]);

  // Paso 3: pago
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const localTotal = useMemo(() => calcTotalCLP(children.length), [children.length]);
  const totalToPay = serverTotal ?? localTotal;

  const spotsLeft = spots && spots.ok ? spots.left : null;
  const spotsTotal = spots && spots.ok ? spots.total : null;

  const canAddMore = children.length < 3;

  async function refreshSpots() {
    const r = await fetch("/api/spots");
    const j = (await r.json()) as SpotsResponse;
    setSpots(j);
  }

  useEffect(() => {
    refreshSpots().catch(() => {});
  }, []);

  function updateChild(i: number, patch: Partial<Child>) {
    setChildren((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function addChild() {
    setChildren((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, { name: "", age: "", notes: "" }];
    });
  }

  function removeChild(i: number) {
    setChildren((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== i);
    });
  }

  // ---------- VALIDACIONES ----------
  function validateStep1(): string | null {
    if (!guardianName.trim()) return "Escribe el nombre del apoderado/a.";
    if (!whatsapp.trim()) return "Escribe un número de WhatsApp.";
    if (!email.trim()) return "Escribe un correo.";
    return null;
  }

  function validateStep2(): string | null {
    if (children.length < 1) return "Debe haber al menos 1 participante.";
    for (let i = 0; i < children.length; i++) {
      if (!children[i].name.trim()) return `Falta el nombre del participante #${i + 1}.`;
      if (!children[i].age.trim()) return `Falta la edad del participante #${i + 1}.`;
    }
    return null;
  }

  // ---------- ACCIONES ----------
  async function goStep2() {
    setError(null);
    setNotice(null);
    const v = validateStep1();
    if (v) return setError(v);
    setStep(2);
  }

  // ✅ IMPORTANTE: recién al pasar a Paso 3 “reservamos” en backend para obtener reservationId + total servidor
  async function goStep3AndStartReservation() {
    setError(null);
    setNotice(null);

    const v1 = validateStep1();
    if (v1) return setError(v1);

    const v2 = validateStep2();
    if (v2) return setError(v2);

    setBusy(true);
    try {
      const res = await fetch("/api/reservations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianName, whatsapp, email, children }),
      });

      const json = (await res.json()) as StartResponse;

      if (!json.ok) {
        setError(json.error);
        await refreshSpots().catch(() => {});
        return;
      }

      setReservationId(json.reservationId);
      setServerTotal(json.totalCLP);
      setStep(3);
      setNotice("Perfecto. Transfiere y adjunta el comprobante para confirmar el cupo.");
      await refreshSpots().catch(() => {});
    } catch {
      setError("No se pudo avanzar al pago. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReservation() {
    if (!reservationId) return setError("No encontramos tu reserva. Vuelve al paso anterior y reintenta.");
    if (!receiptFile) return setError("Adjunta el comprobante (foto o PDF) para confirmar.");

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const form = new FormData();
      form.append("reservationId", reservationId);
      form.append("receipt", receiptFile);

      const res = await fetch("/api/reservations/confirm", { method: "POST", body: form });
      const json = (await res.json()) as ConfirmResponse;

      if (!json.ok) {
        setError(json.error);
        return;
      }

      await refreshSpots().catch(() => {});
      setNotice("✅ Comprobante recibido. Cupo confirmado. Te contactaremos por WhatsApp/correo.");
    } catch {
      setError("No se pudo confirmar. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function copyBank() {
    try {
      await navigator.clipboard.writeText(BANK_TEXT);
      setNotice("Datos bancarios copiados ✅");
      window.setTimeout(() => setNotice(null), 1300);
    } catch {
      setNotice("No se pudo copiar automáticamente. Intenta de nuevo.");
    }
  }

  const urgency =
    spotsLeft !== null && spotsLeft <= 5
      ? "Últimos cupos"
      : spotsLeft !== null && spotsLeft <= 12
        ? "Cupos limitados"
        : "Inscripciones abiertas";

  // ---------- UI ----------
  return (
    <div className="bg-jules-panel tech-border p-5 md:p-7 rounded-xl w-full shadow-2xl shadow-black/50">
      {/* Top bar (ordenado + “pixel vibe”) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-jules-border pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="font-mono text-[10px] tracking-widest text-jules-secondary">
              RESERVA TU CUPO
            </div>

            <div className="hidden sm:flex items-center gap-1.5 opacity-80" aria-hidden="true">
              <PixelDot />
              <PixelDot />
              <PixelDot />
              <PixelDot />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tone="blue">{urgency}</Pill>

            <Pill tone="neutral">
              {spotsLeft === null ? "Cargando cupos…" : `${spotsLeft} disponibles`}
              {spotsTotal !== null ? ` · de ${spotsTotal}` : ""}
            </Pill>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StepPill active={step === 1} done={step > 1} label="Apoderado" n={1} />
          <StepPill active={step === 2} done={step > 2} label="Alumnos" n={2} />
          <StepPill active={step === 3} done={false} label="Pago" n={3} />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 p-4">
          <div className="font-mono text-[11px] text-red-200">Revisa esto</div>
          <div className="text-white/85 mt-1">{error}</div>
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="font-mono text-[11px] text-green-200">Listo</div>
          <div className="text-white/85 mt-1">{notice}</div>
        </div>
      )}

      {/* CONTENT: siempre “texto arriba, formulario al centro” (mobile y desktop) */}
      <div className="mt-6 space-y-5">
        {/* Paso 1 */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-white font-bold text-xl">Datos del apoderado</h3>
              <p className="text-jules-secondary mt-2">
                Usaremos este contacto para confirmar la inscripción y enviarte cualquier información importante.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nombre del apoderado/a"
                value={guardianName}
                onChange={setGuardianName}
                placeholder="Nombre y apellido"
              />
              <Field
                label="WhatsApp"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="+56 9 3776 6334"
              />
            </div>

            <Field
              label="Correo"
              value={email}
              onChange={setEmail}
              placeholder="correo@ejemplo.com"
            />

            <div className="pt-1">
              <button
                type="button"
                onClick={goStep2}
                disabled={busy}
                className="w-full bg-white text-black font-mono font-bold py-3 rounded hover:bg-white/95 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Siguiente: participantes →
              </button>
            </div>
          </div>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-white font-bold text-xl">Participantes (máximo 3)</h3>
              <p className="text-jules-secondary mt-2">
                Agrega a tus hijos/participantes. El total se calcula automáticamente con los descuentos por hermanos.
              </p>
            </div>

            <div className="space-y-3">
              {children.map((c, i) => (
                <div key={i} className="p-4 rounded-lg border border-jules-border bg-black/25">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-[11px] text-jules-secondary">
                      Participante {i + 1} ·{" "}
                      <span className="text-white/85">
                        {PRICE_TIERS[i] ? `$${PRICE_TIERS[i].toLocaleString("es-CL")}` : ""}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      disabled={children.length <= 1 || busy}
                      className="text-[11px] font-mono px-3 py-2 rounded border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={children.length <= 1 ? "Debe haber al menos 1 participante" : "Quitar participante"}
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-8">
                      <Label>Nombre</Label>
                      <input
                        className="w-full bg-black/40 border border-jules-border focus:border-jules-accent text-white p-3 rounded font-mono text-sm outline-none transition-all placeholder:text-white/20"
                        value={c.name}
                        onChange={(e) => updateChild(i, { name: e.target.value })}
                        placeholder="Nombre del participante"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label>Edad</Label>
                      <input
                        className="w-full bg-black/40 border border-jules-border focus:border-jules-accent text-white p-3 rounded font-mono text-sm outline-none transition-all placeholder:text-white/20 text-center"
                        value={c.age}
                        onChange={(e) => updateChild(i, { age: e.target.value })}
                        placeholder="10–16"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label>Dato útil (opcional)</Label>
                    <input
                      className="w-full bg-black/40 border border-jules-border focus:border-jules-accent text-white p-3 rounded font-mono text-sm outline-none transition-all placeholder:text-white/20"
                      value={c.notes}
                      onChange={(e) => updateChild(i, { notes: e.target.value })}
                      placeholder="Ej: experiencia previa, observaciones"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={addChild}
                disabled={!canAddMore || busy}
                className="sm:flex-1 bg-jules-accent text-white font-mono font-bold py-3 rounded hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Agregar participante
              </button>

              <div className="sm:flex-1 rounded-lg border border-jules-border bg-black/25 p-4">
                <div className="flex items-end justify-between">
                  <div className="text-jules-secondary font-mono text-[11px]">Total</div>
                  <div className="text-white font-mono font-bold text-2xl">
                    ${localTotal.toLocaleString("es-CL")}
                    <span className="text-white/60 text-sm"> CLP</span>
                  </div>
                </div>
                <div className="mt-2 text-jules-secondary text-[12px]">
                  1: $40.000 · 2: $75.000 · 3: $105.000
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="w-1/3 px-4 py-3 rounded border border-white/15 text-white/80 font-mono hover:text-white hover:border-white/30 transition disabled:opacity-50"
              >
                ← Volver
              </button>

              <button
                type="button"
                onClick={goStep3AndStartReservation}
                disabled={busy}
                className="flex-1 bg-white text-black font-mono font-bold py-3 rounded hover:bg-white/95 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Siguiente: pago →
              </button>
            </div>

            <p className="text-jules-secondary text-sm">
              El cupo se confirma al adjuntar el comprobante en el paso de pago.
            </p>
          </div>
        )}

        {/* Paso 3 */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-white font-bold text-xl">Pago y comprobante</h3>
              <p className="text-jules-secondary mt-2">
                Transfiere el total y adjunta el comprobante (foto o PDF). Apenas lo recibimos, confirmamos el cupo.
              </p>
            </div>

            <div className="rounded-lg border border-jules-border bg-black/25 p-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <div className="text-jules-secondary font-mono text-[11px]">Total a transferir</div>
                  <div className="text-white font-mono font-bold text-3xl mt-1">
                    ${totalToPay.toLocaleString("es-CL")} <span className="text-white/60 text-sm">CLP</span>
                  </div>
                  <div className="text-jules-secondary text-[12px] mt-2">
                    ID de reserva: <span className="text-white/85 font-mono">{reservationId ?? "—"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyBank}
                  className="bg-jules-accent text-white font-mono font-bold px-5 py-3 rounded hover:bg-blue-600 transition-all"
                >
                  Copiar datos bancarios
                </button>
              </div>

              <pre className="mt-4 whitespace-pre-wrap font-mono text-sm text-white/85 rounded border border-white/10 bg-black/30 p-4">
{BANK_TEXT}
              </pre>

              <div className="text-jules-secondary text-[12px] mt-3">
                Sugerencia en comentario:{" "}
                <span className="text-white/85 font-mono">Taller Videojuego {reservationId}</span>
              </div>
            </div>

            <div className="rounded-lg border border-jules-border bg-black/25 p-4">
              <div className="text-jules-secondary font-mono text-[11px]">Comprobante (foto o PDF)</div>

              <label className="mt-3 block cursor-pointer">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setReceiptFile(f);
                    setError(null);
                  }}
                />

                <div className="rounded-lg border border-white/10 bg-black/30 p-4 hover:border-white/20 transition">
                  <div className="text-white font-semibold">
                    {receiptFile ? receiptFile.name : "Haz clic para adjuntar el comprobante"}
                  </div>
                  <div className="text-jules-secondary text-sm mt-1">
                    {receiptFile
                      ? `Tamaño: ${(receiptFile.size / 1024 / 1024).toFixed(2)} MB`
                      : "Formatos aceptados: imagen o PDF"}
                  </div>
                </div>
              </label>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={busy}
                  className="w-1/3 px-4 py-3 rounded border border-white/15 text-white/80 font-mono hover:text-white hover:border-white/30 transition disabled:opacity-50"
                >
                  ← Volver
                </button>

                <button
                  type="button"
                  onClick={confirmReservation}
                  disabled={busy || !receiptFile}
                  className="flex-1 bg-white text-black font-mono font-bold py-3 rounded hover:bg-white/95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title={!receiptFile ? "Adjunta un comprobante para confirmar" : "Confirmar cupo"}
                >
                  {busy ? "Confirmando…" : "Confirmar cupo"}
                </button>
              </div>

              <p className="text-jules-secondary text-sm mt-3">
                Al confirmar, el cupo se descuenta del contador automáticamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{props.label}</Label>
      <input
        className="w-full bg-black/40 border border-jules-border focus:border-jules-accent text-white p-3 rounded font-mono text-sm outline-none transition-all placeholder:text-white/20"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono text-jules-secondary tracking-wider mb-2">
      {children}
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "neutral";
}) {
  const cls =
    tone === "blue"
      ? "text-blue-200 border-blue-400/25 bg-blue-400/10"
      : "text-white/75 border-white/15 bg-white/5";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md border text-[11px] font-mono ${cls}`}>
      {children}
    </span>
  );
}

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={[
        "px-3 py-2 rounded-md border font-mono text-[11px] flex items-center gap-2",
        active
          ? "border-jules-accent/40 bg-jules-accent/10 text-white"
          : done
            ? "border-green-500/25 bg-green-500/10 text-white/90"
            : "border-white/12 bg-white/5 text-white/70",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-2.5 w-2.5 rounded-sm",
          active ? "bg-jules-accent" : done ? "bg-green-400" : "bg-white/20",
        ].join(" ")}
      />
      <span className="text-white/80">{n}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function PixelDot() {
  return <span className="h-2 w-2 rounded-[2px] bg-white/20" />;
}
