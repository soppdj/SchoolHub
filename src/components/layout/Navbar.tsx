import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  User,
  Shield,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    logout,
    allStaff,
    activeRoles,
    toggleActiveRole,
    networkStatus,
    triggerSync,
    pendingSyncCount,
    isTelegramDrawerOpen,
    setIsTelegramDrawerOpen,
  } = useApp();

  const [isStaffSelectorOpen, setIsStaffSelectorOpen] = useState(false);

  // Available roles for the current user
  const userRoles = currentUser?.roles || [];

  const roleColors: Record<UserRole, string> = {
    'Developer': 'bg-purple-100 text-purple-800 border-purple-300',
    'Administrator': 'bg-blue-100 text-blue-800 border-blue-300',
    'Kepala Sekolah': 'bg-school-gold-100 text-school-gold-700 border-school-gold-400 font-bold',
    'Guru Kelas': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Guru Mapel': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Shadow Teacher': 'bg-rose-100 text-rose-800 border-rose-300',
    'Sarpras': 'bg-amber-100 text-amber-800 border-amber-300',
    'Guru Piket Lapangan': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Guru Piket Kantor': 'bg-teal-100 text-teal-800 border-teal-300',
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F2942] text-white border-b-2 border-school-gold-500 shadow-md">
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border-2 border-school-gold-400 p-0.5 flex items-center justify-center shadow-md overflow-hidden shrink-0">
            <img
              src="/logo.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
              alt="Logo SD Khoirur Rooziqiin Bandung"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">School Hub</span>
              <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                SD KHOIRUR ROOZIQIIN
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block tracking-tight font-medium">
              Pusat Data Terpadu SD Khoirur Rooziqiin Bandung
            </p>
          </div>
        </div>

        {/* Center: Interactive Additive Multi-Role Filter Chips */}
        <div className="hidden lg:flex items-center gap-2 bg-[#153654] px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs text-school-gold-400 font-semibold pr-2 border-r border-white/15">
            <Layers className="w-3.5 h-3.5" />
            <span>Peran Aktif:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {userRoles.map((role) => {
              const isActive = activeRoles.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => toggleActiveRole(role)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
                    isActive
                      ? `${roleColors[role]} shadow-sm scale-100 ring-2 ring-white/20`
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isActive ? `Klik untuk menonaktifkan tampilan ${role}` : `Klik untuk mengaktifkan tampilan ${role}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-current' : 'bg-slate-500'}`} />
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Sync Badge, Telegram Drawer Trigger & Profile Switcher */}
        <div className="flex items-center gap-2.5">

          {/* Network & Offline Status Badge */}
          <div className="flex items-center gap-1.5 bg-[#153654] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
            {networkStatus === 'online' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden md:inline">Online</span>
              </span>
            ) : networkStatus === 'offline' ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Offline (Tersimpan Lokal)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden md:inline">Sinkronisasi...</span>
              </span>
            )}

            {pendingSyncCount > 0 && (
              <span className="bg-school-gold-500 text-school-navy-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {pendingSyncCount}
              </span>
            )}

            <button
              onClick={triggerSync}
              title="Sinkronkan Antrean Offline ke Cloud"
              className="ml-1 p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Telegram Bot Assistant Simulator Trigger */}
          <button
            onClick={() => setIsTelegramDrawerOpen(!isTelegramDrawerOpen)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all border border-blue-400/40"
            title="Buka Simulator Bot Telegram Sekolah"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bot Telegram</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* User Profile & Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsStaffSelectorOpen(!isStaffSelectorOpen)}
              className="flex items-center gap-2 bg-[#153654] hover:bg-[#1E3A8A] border border-white/15 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            >
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser?.name || 'User'}
                className="w-6 h-6 rounded-full object-cover border border-school-gold-400"
              />
              <div className="text-left hidden sm:block">
                <div className="font-bold text-white text-xs leading-none truncate max-w-[120px]">
                  {currentUser?.name ? currentUser.name.split(',')[0] : 'Profil'}
                </div>
                <div className="text-[10px] text-school-gold-400 leading-tight">
                  {currentUser?.roles?.[0] || 'Staf'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown to switch staff perspectives */}
            {isStaffSelectorOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <div className="text-xs font-bold text-school-navy-900 flex items-center justify-between">
                    <span>Ganti Perspektif Staf</span>
                    <span className="text-[10px] font-normal text-slate-500">({allStaff.length} Staf Terdaftar)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pilih salah satu akun internal untuk menguji hak akses & menu terintegrasi.
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {allStaff.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        setCurrentUser(staff);
                        setIsStaffSelectorOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                        staff.id === currentUser?.id ? 'bg-amber-50/80 font-bold border-l-4 border-school-gold-500' : ''
                      }`}
                    >
                      <img
                        src={staff.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={staff.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{staff.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span className="text-school-gold-700 font-semibold">{staff.roles.join(', ')}</span>
                          {staff.specialty && <span>• {staff.specialty}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Logout Button */}
                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      setIsStaffSelectorOpen(false);
                      logout();
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Logout Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Role Filter Bar */}
      <div className="lg:hidden px-3 py-1.5 bg-[#153654] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] text-school-gold-400 font-semibold shrink-0">Peran:</span>
        {userRoles.map((role) => {
          const isActive = activeRoles.includes(role);
          return (
            <button
              key={role}
              onClick={() => toggleActiveRole(role)}
              className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-all ${
                isActive ? `${roleColors[role]} font-bold` : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>
    </header>
  );
};
