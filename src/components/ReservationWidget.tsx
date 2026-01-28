import React, { useEffect, useMemo, useState } from "react";
import { calcTotalCLP } from "../lib/pricing";

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

type Step = 1 | 2;

const BANK = {
  name: "NICOLAS DANIEL VERA",
  rut: "27734575-7",
  bank: "BancoEstado",
  type: "Cuenta Corriente",
  number: "92100046948",
  email: "nicolasvera39205@hotmail.com",
};

export default function ReservationWidget() {
  const [spots, setSpots] = useState<SpotsResponse | null>(null);

  const [step, setStep] = useState<Step>(1);

  const [guardianName, setGuardianName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [children, setChildren] = useState<Child[]>([
    { name: "", age: "", notes: "" },
  ]);

  const [reservationId, setReservationId] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const localTotal = useMemo(() => calcTotalCLP(children.length), [children.length]);
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
      if (prev.length <= 1) return prev; // mínimo 1
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function validateStep1(): string | null {
    if (!guardianName.trim()) return "Falta nombre del tutor/a.";
    if (!whatsapp.trim()) return "Falta número de WhatsApp.";
    if (!email.trim()) return "Falta correo.";

    for (let i = 0; i < children.length; i++) {
      if (!children[i].name.trim()) return `Falta nombre del participante #${i + 1}.`;
      if (!children[i].age.trim()) return `Falta edad del participante #${i + 1}.`;
    }
    return null;
  }

  async function startReservation() {
    setError(null);
    setNotice(null);

    const v = validateStep1();
    if (v) {
      setError(v);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/reservations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianName,
          whatsapp,
          email,
          children,
        }),
      });

      const json = (await res.json()) as StartResponse;

      if (!json.ok) {
        setError(json.error);
        await refreshSpots().catch(() => {});
        return;
      }

      setReservationId(json.reservationId);
      setServerTotal(json.totalCLP);
      setStep(2);
      setNotice("Listo. Transfiere y adjunta el comprobante para confirmar el cupo.");
      await refreshSpots().catch(() => {});
    } catch {
      setError("No se pudo iniciar la reserva. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReservation() {
    if (!reservationId) {
      setError("Falta ID de reserva. Vuelve al paso 1 y reintenta.");
      return;
    }
    if (!receiptFile) {
      setError("Debes adjuntar un comprobante (foto o PDF) para confirmar.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const form = new FormData();
      form.append("reservationId", reservationId);
      form.append("receipt", receiptFile);

      const res = await fetch("/api/reservations/confirm", {
        method: "POST",
        body: form,
      });

      const json = (await res.json()) as ConfirmResponse;

      if (!json.ok) {
        setError(json.error);
        return;
      }

      await refreshSpots().catch(() => {});
      setNotice("✅ Comprobante recibido. Cupo confirmado.");
    } catch {
      setError("No se pudo confirmar. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copiado ✅");
      setTimeout(() => setNotice(null), 1200);
    } catch {
      setNotice("No se pudo copiar automáticamente.");
    }
  }

  const spotsLeft = spots && "ok" in spots && spots.ok ? spots.left : null;
  const totalToPay = serverTotal ?? localTotal;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="inner" style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div className="stepperRow">
            <span className={`stepPill ${step === 1 ? "stepPillActive" : ""}`}>
              <span className="mono" style={{ color: "var(--neon-blue)" }}>PASO 1</span>
              <span>Datos</span>
            </span>
            <span className={`stepPill ${step === 2 ? "stepPillActive" : ""}`}>
              <span className="mono" style={{ color: "var(--neon-green)" }}>PASO 2</span>
              <span>Pago</span>
            </span>
          </div>

          <div style={{ textAlign: "right", minWidth: 220 }}>
            <div className="bigSpots">
              <span className="label">Quedan</span>
              <span className="n">{spotsLeft === null ? "…" : spotsLeft}</span>
              <span className="label">cupos</span>
              <div className="sub">Cupos limitados para atención personalizada</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "rgba(255,90,120,.35)" }}>
          <div className="inner">
            <b style={{ color: "rgba(255,200,210,.95)" }}>Error:</b>{" "}
            <span className="small">{error}</span>
          </div>
        </div>
      )}

      {notice && (
        <div className="card" style={{ borderColor: "rgba(54,255,141,.25)" }}>
          <div className="inner">
            <b style={{ color: "rgba(200,255,226,.95)" }}>Info:</b>{" "}
            <span className="small">{notice}</span>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="twoCol">
          <div className="card">
            <div className="inner">
              <div className="badge">
                <span style={{ color: "var(--neon-blue)" }}>PASO 1</span>
                <span>•</span>
                <span className="mono">Datos para reservar</span>
              </div>

              <h3 style={{ margin: "12px 0 6px" }}>Tutor/a</h3>
              <p className="p" style={{ marginBottom: 10 }}>
                Este contacto recibirá la confirmación y detalles.
              </p>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Field label="Nombre tutor/a" value={guardianName} onChange={setGuardianName} placeholder="Nombre y apellido" />
                <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+56 9 XXXX XXXX" />
              </div>

              <div style={{ marginTop: 10 }}>
                <Field label="Correo" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" />
              </div>

              <hr className="sep" />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Participantes</h3>
                  <div className="small">Mínimo 1 • Máximo 3</div>
                </div>
                <button className="btn" type="button" onClick={addChild} disabled={!canAddMore || busy}>
                  + Agregar hijo/a
                </button>
              </div>

              <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                {children.map((c, i) => (
                  <div key={i} className="card" style={{ background: "rgba(10,15,28,.55)" }}>
                    <div className="inner">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <b>Participante #{i + 1}</b>
                        <button
                          className={`btn ${children.length > 1 ? "btnDanger" : ""}`}
                          type="button"
                          onClick={() => removeChild(i)}
                          disabled={children.length <= 1 || busy}
                          title={children.length <= 1 ? "Debe haber al menos 1 participante" : "Quitar participante"}
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="grid" style={{ gridTemplateColumns: "1fr 160px", marginTop: 10 }}>
                        <Field label="Nombre" value={c.name} onChange={(v) => updateChild(i, { name: v })} placeholder="Nombre del participante" />
                        <Field label="Edad" value={c.age} onChange={(v) => updateChild(i, { age: v })} placeholder="10–16" />
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <Field label="Dato útil (opcional)" value={c.notes} onChange={(v) => updateChild(i, { notes: v })} placeholder="Ej: experiencia previa, observaciones" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card stickyDesk">
            <div className="inner">
              <div className="badge">
                <span style={{ color: "var(--neon-green)" }}>RESUMEN</span>
                <span>•</span>
                <span className="mono">Total</span>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="small">Total</div>
                <div className="mono" style={{ fontSize: 28 }}>
                  ${localTotal.toLocaleString("es-CL")} CLP
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  1 niño: $40.000 • 2: $80.000 • 3: $100.000
                </div>
              </div>

              <hr className="sep" />

              <button className="btn btnPrimary" type="button" onClick={startReservation} disabled={busy}>
                {busy ? "Guardando…" : "Continuar → Ver transferencia"}
              </button>

              <div className="small" style={{ marginTop: 10 }}>
                Cupo confirmado solo con comprobante.
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="twoCol">
          <div className="card">
            <div className="inner">
              <div className="badge">
                <span style={{ color: "var(--neon-green)" }}>PASO 2</span>
                <span>•</span>
                <span className="mono">Transferencia</span>
              </div>

              <h3 style={{ margin: "12px 0 6px" }}>Total a transferir</h3>
              <div className="mono" style={{ fontSize: 30 }}>
                ${totalToPay.toLocaleString("es-CL")} CLP
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                ID reserva: <span className="mono">{reservationId}</span>
              </div>

              <hr className="sep" />

              <h3 style={{ margin: "0 0 10px" }}>Datos bancarios</h3>

              <div className="grid" style={{ gap: 10 }}>
                <CopyRow label="Nombre" value={BANK.name} onCopy={copy} />
                <CopyRow label="RUT" value={BANK.rut} onCopy={copy} />
                <CopyRow label="Banco" value={BANK.bank} onCopy={copy} />
                <CopyRow label="Tipo" value={BANK.type} onCopy={copy} />
                <CopyRow label="N° Cuenta" value={BANK.number} onCopy={copy} />
                <CopyRow label="Correo" value={BANK.email} onCopy={copy} />
              </div>

              <div className="small" style={{ marginTop: 10 }}>
                Sugerencia en comentario:{" "}
                <span className="kbd">Taller Videojuego {reservationId}</span>
              </div>

              <div className="btnRow" style={{ marginTop: 12 }}>
                <button className="btn" type="button" onClick={() => setStep(1)} disabled={busy}>
                  ← Volver a editar datos
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="inner">
              <div className="badge">
                <span style={{ color: "var(--neon-blue)" }}>COMPROBANTE</span>
                <span>•</span>
                <span className="mono">Foto o PDF</span>
              </div>

              <h3 style={{ margin: "12px 0 6px" }}>Adjunta el comprobante</h3>
              <p className="p">
                Sin comprobante no se puede confirmar el cupo.
              </p>

              <div className="dropzone" style={{ marginTop: 12 }}>
                <div className="small" style={{ marginBottom: 10 }}>
                  {receiptFile ? (
                    <>
                      Archivo listo: <span className="mono">{receiptFile.name}</span>
                      <div className="small" style={{ marginTop: 6 }}>
                        Tamaño: {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    "Selecciona un archivo para habilitar “Confirmar cupo”."
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setReceiptFile(f);
                    setError(null);
                  }}
                />
              </div>

              <hr className="sep" />

              <button
                className="btn btnPrimary"
                type="button"
                onClick={confirmReservation}
                disabled={busy || !receiptFile}
                title={!receiptFile ? "Adjunta un comprobante para confirmar" : "Confirmar cupo"}
              >
                {busy ? "Confirmando…" : "Confirmar cupo ✅"}
              </button>

              <div className="small" style={{ marginTop: 10 }}>
                Al confirmar, el cupo se descuenta del contador.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="small">{props.label}</span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </label>
  );
}

function CopyRow(props: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="copyRow">
      <div style={{ minWidth: 110 }}>
        <div className="small">{props.label}</div>
        <div className="mono" style={{ fontSize: 14 }}>{props.value}</div>
      </div>
      <button className="btn" type="button" onClick={() => props.onCopy(props.value)}>
        Copiar
      </button>
    </div>
  );
}
