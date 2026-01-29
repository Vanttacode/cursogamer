import React, { useState, useEffect } from 'react';
import { Badge } from './DashboardView';

export default function ReservationsView() {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const fetchReservations = async () => {
    const res = await fetch(`/api/admin/reservations?q=${search}`);
    if (res.ok) setReservations(await res.json());
  };

  useEffect(() => {
    const timeout = setTimeout(fetchReservations, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Listado de Reservas</h2>
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="bg-black/30 border border-white/10 rounded px-4 py-2 text-sm w-64 focus:border-purple-500 outline-none text-white placeholder:text-zinc-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-zinc-400 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="p-4">ID / Fecha</th>
              <th className="p-4">Tutor & Contacto</th> {/* Título actualizado */}
              <th className="p-4 text-center">Niños</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reservations.map(r => (
              <tr key={r.id} className="hover:bg-white/5 transition">
                {/* ID y Fecha */}
                <td className="p-4 align-top">
                  <div className="font-mono text-xs text-zinc-500 mb-0.5">{r.id.slice(0,8)}</div>
                  <div className="text-zinc-300">{new Date(r.created_at).toLocaleDateString()}</div>
                </td>

                {/* Tutor y Contacto (Aquí agregué los datos) */}
                <td className="p-4 align-top">
                  <div className="font-bold text-white text-base mb-1">{r.guardian_name}</div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-0.5">
                    <span className="opacity-50">📧</span> 
                    <span>{r.email}</span>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-mono">
                    <span className="opacity-70">📱</span> 
                    <span>{r.whatsapp}</span>
                  </div>
                </td>

                <td className="p-4 text-center align-top">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-bold">{r.children_count}</span>
                </td>
                
                <td className="p-4 font-mono text-zinc-300 align-top">
                  ${r.total_clp?.toLocaleString()}
                </td>
                
                <td className="p-4 align-top">
                  <div className="flex items-center gap-2">
                    <Badge status={r.status} />
                    {r.receipt_path && <span title="Comprobante adjunto" className="text-xs cursor-help">📎</span>}
                  </div>
                </td>
                
                <td className="p-4 text-right align-top">
                  <button 
                    onClick={() => setSelectedId(r)}
                    className="text-xs border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded transition font-medium"
                  >
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 && <div className="p-8 text-center text-zinc-500">No se encontraron reservas</div>}
      </div>

      {selectedId && <ReservationModal reservation={selectedId} close={() => { setSelectedId(null); fetchReservations(); }} />}
    </div>
  );
}

function ReservationModal({ reservation, close }) {
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (reservation.receipt_path) {
      fetch('/api/admin/update-reservation', {
        method: 'POST',
        body: JSON.stringify({ id: reservation.id, action: 'get_receipt' })
      })
      .then(res => res.json())
      .then(data => setReceiptUrl(data.url));
    }
  }, [reservation]);

  const changeStatus = async (newStatus) => {
    if(!confirm(`¿Cambiar estado a ${newStatus}?`)) return;
    setLoadingAction(true);
    await fetch('/api/admin/update-reservation', {
      method: 'POST',
      body: JSON.stringify({ id: reservation.id, action: 'update_status', status: newStatus })
    });
    setLoadingAction(false);
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Detalle Reserva</h3>
            <span className="font-mono text-xs text-zinc-500">{reservation.id}</span>
          </div>
          <button onClick={close} className="text-zinc-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            
            {/* Sección de Datos de Contacto en el Modal también */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Datos de Contacto</label>
              <div className="bg-black/30 rounded-lg p-3 space-y-2 border border-white/5">
                <div className="text-sm text-white font-bold">{reservation.guardian_name}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-2">📧 {reservation.email}</div>
                <div className="text-xs text-green-400 font-mono flex items-center gap-2">📱 {reservation.whatsapp}</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Participantes ({reservation.children_count})</label>
              <div className="bg-black/30 rounded-lg p-3 space-y-2 border border-white/5">
                {reservation.children?.map((child, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                    <span className="text-white font-medium">{child.name}</span>
                    <span className="text-zinc-400">{child.age} años</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Comprobante</label>
              {reservation.receipt_path ? (
                receiptUrl ? (
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-white/10 aspect-video bg-black">
                    <img src={receiptUrl} alt="Comprobante" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-xs font-mono border border-white px-2 py-1 rounded text-white bg-black/50 backdrop-blur">VER DOCUMENTO</span>
                    </div>
                  </a>
                ) : <div className="text-xs animate-pulse text-zinc-500">Generando enlace seguro...</div>
              ) : (
                <div className="text-sm text-zinc-600 italic py-2 border border-white/5 rounded-lg p-3 bg-black/20">No se adjuntó archivo</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-zinc-800/50 border border-white/5 text-center">
              <div className="text-xs text-zinc-500 mb-1">ESTADO ACTUAL</div>
              <Badge status={reservation.status} />
            </div>

            <div className="space-y-2">
              <button disabled={loadingAction} onClick={() => changeStatus('APPROVED')} className="w-full py-3 bg-green-600/20 text-green-400 border border-green-600/50 rounded hover:bg-green-600/30 transition text-sm font-bold flex items-center justify-center gap-2">
                ✅ APROBAR (Descuenta Cupo)
              </button>
              <button disabled={loadingAction} onClick={() => changeStatus('PAID')} className="w-full py-3 bg-purple-600/20 text-purple-400 border border-purple-600/50 rounded hover:bg-purple-600/30 transition text-sm font-bold flex items-center justify-center gap-2">
                💰 MARCAR PAGADO
              </button>
              <div className="h-px bg-white/10 my-4"></div>
              <button disabled={loadingAction} onClick={() => changeStatus('REJECTED')} className="w-full py-2 bg-red-600/10 text-red-400 border border-red-600/20 rounded hover:bg-red-600/20 transition text-xs font-bold">
                ⛔ RECHAZAR / LIBERAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}