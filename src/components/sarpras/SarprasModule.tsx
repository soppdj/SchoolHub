import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Camera,
  Layers,
  ArrowRight,
  Send,
  Building,
  Check,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SarprasItem, SarprasTicket } from '../../types';

export const SarprasModule: React.FC = () => {
  const {
    sarprasItems,
    sarprasTickets,
    reportSarprasTicket,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'tickets' | 'report_form'>('inventory');
  const [selectedRoom, setSelectedRoom] = useState<string>('Semua Ruangan');

  // Rooms list
  const rooms = ['Semua Ruangan', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Ruang Guru', 'Ruang TU', 'Mushola', 'UKS'];

  // Reporting Form State (Step 1 of cross-role workflow)
  const [reportRoom, setReportRoom] = useState<string>('Kelas 3');
  const roomItems = sarprasItems.filter(i => i.room_name === reportRoom);
  const [selectedItemId, setSelectedItemId] = useState<string>(roomItems[0]?.id || '');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<number>(150000);

  const filteredItems = selectedRoom === 'Semua Ruangan'
    ? sarprasItems
    : sarprasItems.filter(i => i.room_name === selectedRoom);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = sarprasItems.find(i => i.id === selectedItemId) || roomItems[0];
    if (!item || !issueDescription) {
      alert('Mohon pilih barang inventaris dan isi uraian kerusakan!');
      return;
    }

    await reportSarprasTicket({
      item_id: item.id,
      item_name: item.name,
      room_name: reportRoom,
      reported_by_id: currentUser.id,
      issue_description: issueDescription,
      estimated_cost: estimatedCost,
      sarpras_notes: 'Diteruskan oleh Koordinator Sarpras untuk persetujuan anggaran Kepala Sekolah.',
    });

    alert('✅ Tiket Kerusakan Sarpras Berhasil Dibuat!\nStatus sekarang: "Menunggu Persetujuan Kepsek".\nBegitu disetujui Kepala Sekolah, draf pengeluaran kas akan otomatis terbuat di modul Keuangan TU.');
    setIssueDescription('');
    setActiveTab('tickets');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner explaining the 4-step cross role automation */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              Automated Cross-Role Workflow
            </span>
            <span className="text-amber-100 text-xs font-semibold">Sarpras & Keuangan Sekolah</span>
          </div>
          <h2 className="text-base font-extrabold mt-0.5">Alur Pelaporan Fasilitas: Guru ➔ Sarpras ➔ Kepsek ➔ Draf Keuangan TU</h2>
          <div className="flex items-center gap-2 text-[11px] text-amber-100 mt-1 flex-wrap">
            <span className="bg-white/10 px-2 py-0.5 rounded">1. Guru Lapor Rusak</span>
            <span>➔</span>
            <span className="bg-white/10 px-2 py-0.5 rounded">2. Sarpras Taksir Biaya</span>
            <span>➔</span>
            <span className="bg-white/10 px-2 py-0.5 rounded">3. Approval Kepsek</span>
            <span>➔</span>
            <span className="bg-white/10 px-2 py-0.5 rounded font-black text-white bg-school-navy-900/50">4. Draf Kas Terbit Otomatis</span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('report_form')}
          className="bg-white text-amber-900 hover:bg-amber-50 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-amber-700" />
          <span>Lapor Kerusakan Baru</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Inventaris per Ruangan</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tickets'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Tiket Perbaikan & Pengadaan</span>
            {sarprasTickets.length > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 rounded-full">
                {sarprasTickets.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Filter Ruangan:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 bg-white"
            >
              {rooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. ROOM-BY-ROOM INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const conditionColors = {
              'Baik': 'bg-emerald-100 text-emerald-800 border-emerald-300',
              'Rusak Ringan': 'bg-amber-100 text-amber-800 border-amber-300',
              'Perlu Diganti': 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
            };

            return (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${conditionColors[item.condition]}`}>
                    {item.condition}
                  </span>
                </div>

                <div className="font-extrabold text-sm text-school-navy-950 leading-tight">
                  {item.name}
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Lokasi: <strong>{item.room_name}</strong></span>
                  <span>Jumlah: <strong>{item.quantity} Unit</strong></span>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Dicek: {item.last_checked_date}</span>
                  <button
                    onClick={() => {
                      setReportRoom(item.room_name);
                      setSelectedItemId(item.id);
                      setActiveTab('report_form');
                    }}
                    className="text-amber-700 hover:text-amber-800 font-bold hover:underline"
                  >
                    + Lapor Kerusakan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. TICKETS LIST WITH STATUS BADGES */}
      {activeTab === 'tickets' && (
        <div className="space-y-3">
          {sarprasTickets.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-school-navy-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {t.ticket_number}
                  </span>
                  <span className="font-black text-slate-900 text-sm">{t.item_name} ({t.room_name})</span>
                </div>
                <p className="text-slate-600 leading-relaxed max-w-2xl">{t.issue_description}</p>
                {t.sarpras_notes && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Catatan Sarpras:</strong> {t.sarpras_notes}
                  </div>
                )}
                {t.finance_transaction_id && (
                  <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Draf Pengeluaran Kas Otomatis Terbit: #{t.finance_transaction_id}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                  t.status === 'Disetujui'
                    ? 'bg-emerald-100 text-emerald-800'
                    : t.status === 'Menunggu Persetujuan Kepsek'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {t.status}
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs">
                  Estimasi Biaya: Rp {Number(t.estimated_cost || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. STEP 1 REPORT FORM */}
      {activeTab === 'report_form' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-4">
          <h3 className="font-extrabold text-base text-school-navy-900 border-b pb-2 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Lapor Kerusakan / Usulan Penggantian Sarpras
          </h3>

          <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Ruangan Fasilitas</label>
              <select
                value={reportRoom}
                onChange={(e) => {
                  setReportRoom(e.target.value);
                  const items = sarprasItems.filter(i => i.room_name === e.target.value);
                  if (items.length > 0) setSelectedItemId(items[0].id);
                }}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold bg-white"
              >
                {rooms.filter(r => r !== 'Semua Ruangan').map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih Barang dari Inventaris Ruangan Ini</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white"
              >
                {roomItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name} ({item.condition})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Uraian Kerusakan / Kendala</label>
              <textarea
                required
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Contoh: Kipas bergetar kencang dan mengeluarkan bau terbakar setelah 10 menit menyala..."
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Taksiran / Estimasi Biaya Servis / Ganti (Rp)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-school-gold-400" />
                <span>Kirim Tiket & Ajukan Persetujuan Anggaran ke Kepala Sekolah</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
