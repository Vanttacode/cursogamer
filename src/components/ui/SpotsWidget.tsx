import React, { useEffect, useMemo, useState } from "react";

type Spots = {
  total: number;
  taken: number;
  available: number;
  pct: number;
  dateText: string;
  city: string;
};

const ULTIMOS_UMBRAL = 5;
const ADELANTO_UMBRAL = 6;

export default function SpotsWidget() {
  const [spots, setSpots] = useState<Spots | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/spots", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j?.error) return;
        setSpots(j);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const view = useMemo(() => {
    const total = spots?.total ?? 18;
    const taken = spots?.taken ?? 0;
    const available = Math.max(0, (spots?.available ?? total - taken));
    const pct = spots?.pct ?? (total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0);
    const agotado = available <= 0;
    const ultimos = !agotado && available <= ULTIMOS_UMBRAL;

    const statusText = agotado ? "CUPOS AGOTADOS" : ultimos ? `ÚLTIMOS ${available} CUPOS` : `QUEDAN ${available} CUPOS`;

    const statusTone = agotado
      ? "text-red-300 border-red-500/25 bg-red-500/10"
      : ultimos
        ? "text-yellow-200 border-yellow-400/25 bg-yellow-400/10"
        : "text-green-300 border-green-500/25 bg-green-500/10";

    const barTone = agotado ? "bg-red-400/70" : ultimos ? "bg-yellow-300/70" : "bg-green-400/70";

    const showAdvance = !agotado && available <= ADELANTO_UMBRAL;

    return { total, taken, available, pct, agotado, ultimos, statusText, statusTone, barTone, showAdvance };
  }, [spots]);

  return (
    <div className="space-y-3 max-w-xl">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border text-[11px] font-mono ${view.statusTone}`}>
        <span>●</span>
        <span>{view.statusText}</span>
        <span className="opacity-50">({view.taken}/{view.total})</span>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] font-mono text-jules-secondary mb-2">
          <span>OCUPACIÓN</span>
          <span className="text-white/80">{view.pct}%</span>
        </div>

        <div className="h-2 rounded bg-white/10 border border-white/10 overflow-hidden">
          <div className={`h-full ${view.barTone}`} style={{ width: `${view.pct}%` }} />
        </div>

        <div className="mt-2 text-[11px] font-mono text-jules-secondary">
          {view.agotado ? (
            <span className="text-red-200/90">Cupos agotados. Escríbenos por WhatsApp para lista de espera.</span>
          ) : (
            <span>
              Quedan <span className="text-white font-semibold">{view.available}</span> cupos.
            </span>
          )}
        </div>
      </div>

      {view.showAdvance && (
        <div className="inline-flex flex-wrap items-center gap-2 px-4 py-3 rounded border border-jules-border bg-black/25 text-xs font-mono text-jules-secondary">
          <span className="text-jules-accent font-bold">Nota:</span>
          <span>
            Si se completa el cupo antes, <span className="text-white font-semibold">se adelanta la fecha de inicio</span> y te avisamos.
          </span>
        </div>
      )}
    </div>
  );
}
