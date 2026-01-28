import React, { useEffect, useState } from "react";

type SpotsResponse =
  | { ok: true; total: number; taken: number; left: number }
  | { ok: false; error: string };

export default function SpotsBig(props: { variant?: "hero" | "compact" }) {
  const [spots, setSpots] = useState<SpotsResponse | null>(null);

  async function load() {
    const r = await fetch("/api/spots");
    const j = (await r.json()) as SpotsResponse;
    setSpots(j);
  }

  useEffect(() => {
    load().catch(() => {});
    const id = window.setInterval(() => load().catch(() => {}), 15000); // refresh cada 15s
    return () => window.clearInterval(id);
  }, []);

  const left = spots && "ok" in spots && spots.ok ? spots.left : null;
  const total = spots && "ok" in spots && spots.ok ? spots.total : 30;

  const hero = props.variant !== "compact";

  return (
    <div>
      <div className="bigSpots">
        <span className="label">Quedan</span>
        <span className="n">{left === null ? "…" : left}</span>
        <span className="label">cupos</span>
        <div className="sub">
          de {total} • cupos limitados para atención personalizada
        </div>
      </div>

      {hero && (
        <div className="small" style={{ marginTop: 10 }}>
          * El cupo se confirma al enviar comprobante.
        </div>
      )}
    </div>
  );
}
