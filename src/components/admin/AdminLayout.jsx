import React, { useState, useEffect } from 'react';
import DashboardView from './DashboardView';
import ReservationsView from './ReservationsView';

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-purple-500/30">
      <nav className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="font-mono font-bold tracking-tight text-lg">VANTTA ADMIN</span>
          </div>
          
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
            <TabButton active={activeTab === 'reservations'} onClick={() => setActiveTab('reservations')} label="Reservas" />
          </div>

          <button onClick={handleLogout} className="text-xs font-mono text-red-400 hover:text-red-300 px-3 py-1 border border-red-500/20 rounded hover:bg-red-500/10 transition">
            LOGOUT
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'overview' && <DashboardView stats={stats} refresh={fetchStats} />}
        {activeTab === 'reservations' && <ReservationsView />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
        active 
          ? 'bg-zinc-700 text-white shadow-sm' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  );
}