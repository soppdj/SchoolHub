import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  FileCheck,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KepsekModule: React.FC = () => {
  const {
    currentUser,
    allStaff,
    classes,
    students,
    staffAttendance,
    sarprasTickets,
    approveSarprasTicket,
    rejectSarprasTicket,
    financeTransactions,
  } = useApp();

  // Pending Tickets awaiting Kepsek Approval
  const pendingSarprasTickets = sarprasTickets.filter(
    (t) => t.status === 'Menunggu Persetujuan Kepsek' || t.status === 'Dilaporkan'
  );

  // Staff on leave
  const staffOnLeave = staffAttendance.filter((s) => s.status === 'Izin' || s.status === 'Sakit');

  return (
    <div className="space-y-4">
      
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-school-navy-950 via-school-navy-900 to-school-navy-800 rounded-2xl p-5 text-white shadow-md border-b-2 border-school-gold-500 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Executive Dashboard
            </span>
            <span className="text-school-gold-400 text-xs font-semibold">Dr. H. Salman Farisi, M.Pd.</span>
          </div>
          <h2 className="text-xl font-extrabold mt-1">Pusat Kendali & Persetujuan Kepala Sekolah</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Persetujuan anggaran pengadaan Sarpras otomatis memicu penerbitan draf pengeluaran kas di Tata Usaha.
          </p>
        </div>

        {/* Pending Badge */}
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/15 text-center shrink-0">
          <div className="text-2xl font-black text-school-gold-400 leading-none">
            {pendingSarprasTickets.length + staffOnLeave.length}
          </div>
          <div className="text-[10px] text-slate-300 mt-1 uppercase tracking-wide font-bold">
            Menunggu Tinjauan
          </div>
        </div>
      </div>

      {/* KPI & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tingkat Kehadiran Guru</span>
          <div className="text-xl font-black text-slate-900">
            {Math.round(((allStaff.length - staffOnLeave.length) / allStaff.length) * 100)}%
          </div>
          <div className="text-[11px] text-slate-500">
            {allStaff.length - staffOnLeave.length} dari {allStaff.length} Staf Hadir
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Siswa Terdaftar</span>
          <div className="text-xl font-black text-slate-900">
            {students.length} Siswa
          </div>
          <div className="text-[11px] text-slate-500">
            Kelas 1 - 6 (Tahun Ajaran 2026/2027)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Siswa Inklusif (GPK)</span>
          <div className="text-xl font-black text-rose-700">
            {students.filter(s => s.has_special_needs).length} Siswa
          </div>
          <div className="text-[11px] text-slate-500">
            Didampingi Guru Khusus & Rapor Adaptif
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tiket Sarpras Aktif</span>
          <div className="text-xl font-black text-amber-600">
            {sarprasTickets.length} Tiket
          </div>
          <div className="text-[11px] text-slate-500">
            {pendingSarprasTickets.length} Menunggu Persetujuan
          </div>
        </div>
      </div>

      {/* MANDATORY APPROVAL SECTION: SARPRAS BUDGET REQUESTS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-school-gold-600" />
              Persetujuan Anggaran Pengadaan & Perbaikan Sarpras
            </h3>
            <p className="text-xs text-slate-500">
              Setiap anggaran yang disetujui otomatis mengunci status tiket dan membuat <strong>Draf Pengeluaran</strong> di modul Keuangan TU.
            </p>
          </div>
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-1 rounded-full">
            {pendingSarprasTickets.length} Permohonan
          </span>
        </div>

        {pendingSarprasTickets.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Semua permohonan anggaran Sarpras telah selesai ditinjau.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSarprasTickets.map((ticket) => {
              const reporter = allStaff.find(s => s.id === ticket.reported_by_id);
              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-school-navy-900">
                        {ticket.ticket_number}
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        {ticket.item_name} ({ticket.room_name})
                      </span>
                    </div>

                    <p className="text-slate-600 max-w-2xl leading-relaxed">
                      <strong>Keluhan:</strong> {ticket.issue_description}
                    </p>

                    <div className="text-[11px] text-slate-500">
                      Diajukan oleh: <strong>{reporter?.name || 'Staf Sekolah'}</strong> • Estimasi: <strong className="text-slate-900 font-mono text-xs">Rp {Number(ticket.estimated_cost || 0).toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  {/* 1-Click Approve or Reject Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => rejectSarprasTicket(ticket.id, 'Ditunda untuk prioritas semester depan')}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>

                    <button
                      onClick={() => {
                        approveSarprasTicket(ticket.id, Number(ticket.estimated_cost) || 100000);
                        alert(`✅ Anggaran untuk ${ticket.item_name} Disetujui!\nSistem telah otomatis menerbitkan Draf Pengeluaran di Modul Keuangan TU.`);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Setujui Anggaran</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STAFF LEAVE & PERMISSION OVERSIGHT */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2 border-b pb-3">
          <Users className="w-5 h-5 text-school-gold-600" />
          Pengawasan Izin & Cuti Guru / Staf
        </h3>

        {staffOnLeave.length === 0 ? (
          <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
            Seluruh guru dan tenaga kependidikan hadir bertugas hari ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {staffOnLeave.map((att) => {
              const staff = allStaff.find(s => s.id === att.user_id);
              return (
                <div key={att.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={staff?.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-slate-900">{staff?.name}</div>
                      <div className="text-slate-500">{att.leave_reason || 'Izin dinas luar / pelatihan'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {att.status}
                    </span>
                    <button
                      onClick={() => alert(`Izin ${staff?.name} telah diverifikasi oleh Kepala Sekolah.`)}
                      className="bg-school-navy-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-md"
                    >
                      Verifikasi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
