import React, { useState } from 'react';

export default function DashboardView({ stats, refresh }) {
  const [newSpots, setNewSpots] = useState('');
  const [saving, setSaving] = useState(false);

  if (!stats) return <div className="text-center py-20 animate-pulse font-mono">Cargando datos del sistema...</div>;

  const handleUpdateSpots = async (e) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/stats', {
      method: 'POST',
      body: JSON.stringify({ value: newSpots || stats.spotsTotal }),
    });
    setNewSpots('');
    await refresh();
    setSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="CUPOS TOTALES" value={stats.spotsTotal} color="blue" />
        <Card label="TOMADOS" value={stats.taken} color="purple" />
        <Card label="DISPONIBLES" value={stats.available} color={stats.available < 5 ? 'red' : 'green'} />
        <Card label="% OCUPACIÓN" value={`${Math.round((stats.taken / stats.spotsTotal) * 100)}%`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Breakdown */}
        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/50">
          <h3 className="text-sm font-mono text-zinc-400 mb-4 uppercase">Estado de Reservas</h3>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center p-3 rounded bg-black/20 border border-white/5">
                <Badge status={status} />
                <span className="font-mono font-bold text-lg">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Config */}
        <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/50">
          <h3 className="text-sm font-mono text-zinc-400 mb-4 uppercase">Configuración Rápida</h3>
          <form onSubmit={handleUpdateSpots} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Modificar Cupos Totales</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-purple-500"
                  placeholder={stats.spotsTotal}
                  value={newSpots}
                  onChange={(e) => setNewSpots(e.target.value)}
                />
                <button 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-mono text-sm disabled:opacity-50"
                >
                  {saving ? '...' : 'GUARDAR'}
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              * Al cambiar este valor, el porcentaje de ocupación se recalculará automáticamente.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const Card = ({ label, value, color }) => {
  const colors = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    green: "text-green-400 border-green-500/20 bg-green-500/5",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
  };
  return (
    <div className={`p-6 rounded-xl border ${colors[color] || colors.blue} flex flex-col items-center justify-center text-center`}>
      <span className="text-[10px] font-mono opacity-70 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-4xl font-bold tracking-tighter">{value}</span>
    </div>
  );
};

export const Badge = ({ status }) => {
  const styles = {
    STARTED: "bg-zinc-800 text-zinc-400 border-zinc-700",
    CONFIRMED: "bg-blue-900/30 text-blue-300 border-blue-800",
    APPROVED: "bg-green-900/30 text-green-300 border-green-800",
    PAID: "bg-purple-900/30 text-purple-300 border-purple-800",
    REJECTED: "bg-red-900/30 text-red-300 border-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${styles[status] || styles.STARTED}`}>
      {status}
    </span>
  );
};