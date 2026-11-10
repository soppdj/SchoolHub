import React from 'react';
import {
  MonitorPlay,
  GraduationCap,
  HeartHandshake,
  ClipboardCheck,
  ReceiptText,
  Wrench,
  Award,
  Terminal,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeRoles, currentUser, sarprasTickets, pendingSyncCount } = useApp();

  const isRoleActive = (roles: string[]) => {
    return roles.some((r) => activeRoles.includes(r as any));
  };

  // Pending ticket count for Sarpras / Kepsek badges
  const pendingApprovalCount = sarprasTickets.filter(
    (t) => t.status === 'Menunggu Persetujuan Kepsek' || t.status === 'Dilaporkan'
  ).length;

  const menuItems = [
    {
      id: 'dashboard_bersama',
      label: 'Dashboard Bersama',
      sublabel: 'Live Monitoring 6 Kelas',
      icon: MonitorPlay,
      roles: ['ALL'],
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'guru_akademik',
      label: 'Guru & Akademik',
      sublabel: 'Jurnal, Presensi, Rapor',
      icon: GraduationCap,
      roles: ['Guru Kelas', 'Guru Mapel', 'Developer'],
    },
    {
      id: 'shadow_teacher',
      label: 'Shadow Teacher',
      sublabel: 'Jurnal 4 Dimensi GPK',
      icon: HeartHandshake,
      roles: ['Shadow Teacher', 'Guru Kelas', 'Developer'],
      badge: 'Inklusif',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'piket',
      label: 'Piket Harian',
      sublabel: 'Lapangan & Buku Tamu',
      icon: ClipboardCheck,
      roles: ['Guru Piket Lapangan', 'Guru Piket Kantor', 'Kepala Sekolah', 'Developer'],
    },
    {
      id: 'administrator_finance',
      label: 'Administrasi & Keuangan',
      sublabel: 'SPP, Tahunan, Kas 3 Pos',
      icon: ReceiptText,
      roles: ['Administrator', 'Developer'],
    },
    {
      id: 'sarpras',
      label: 'Sarana & Prasarana',
      sublabel: 'Inventaris & Lapor Tiket',
      icon: Wrench,
      roles: ['Sarpras', 'Guru Kelas', 'Guru Mapel', 'Administrator', 'Developer'],
      badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} Tiket` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'kepala_sekolah',
      label: 'Kepala Sekolah',
      sublabel: 'Executive & Approval',
      icon: Award,
      roles: ['Kepala Sekolah', 'Developer'],
      badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} Menunggu` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'developer_mode',
      label: 'Mode Developer',
      sublabel: 'Template & Backup Sistem',
      icon: Terminal,
      roles: ['Developer'],
      badge: 'Super Admin',
      badgeColor: 'bg-purple-600 text-white',
    },
  ];

  // Filter based on user's active enabled roles
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.roles.includes('ALL')) return true;
    return isRoleActive(item.roles);
  });

  return (
    <aside className="w-64 xl:w-72 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between shadow-sm min-h-[calc(100vh-60px)]">
      <div className="p-3.5 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Modul Operasional Terpadu
        </div>

        <nav className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-[#0F2942] text-white shadow-md shadow-school-navy-900/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-school-gold-500 text-school-navy-950 font-bold'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] truncate leading-tight ${
                        isActive ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-school-gold-400 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* School Information & Identity Footer */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
              alt="Logo"
              className="w-5 h-5 object-contain"
            />
            <div className="text-[11px] font-bold text-slate-800">SD Khoirur Rooziqiin</div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Sistem internal terpadu berbasis offline-first & realtime broadcast.
          </p>
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Versi 2.4.0 (PWA)</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
