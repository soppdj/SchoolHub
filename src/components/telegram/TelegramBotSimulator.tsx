import React, { useState } from 'react';
import {
  Send,
  Camera,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TelegramSimulationMessage } from '../../types';
import { db } from '../../lib/db';

export const TelegramBotSimulator: React.FC = () => {
  const {
    isTelegramDrawerOpen,
    setIsTelegramDrawerOpen,
    currentUser,
    students,
    feeAnnualSummaries,
    feeAnnualInstallments,
    classes,
  } = useApp();

  const [inputCommand, setInputCommand] = useState<string>('/spp Ahmad 350000 November');
  const [hasPhotoAttached, setHasPhotoAttached] = useState<boolean>(true);
  const [messages, setMessages] = useState<TelegramSimulationMessage[]>([
    {
      id: 'm-1',
      from_id: 'bot',
      from_username: 'SchoolHub_Bot',
      is_bot: true,
      text: `🌟 *School Hub Telegram Assistant Aktif!*\n*SD Khoirur Rooziqiin Bandung*\n\nSelamat datang, *${currentUser.name}*!\nKetik \`/start\` atau jalankan perintah:\n• \`/spp [Nama] [Nominal] [Bulan]\`\n• \`/tahunan [Nama] [Cicilan Ke-] [Nominal]\`\n• \`/cek [Nama]\`\n• \`/jadwal\``,
      timestamp: '08:30 WIB',
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;

    const cmd = inputCommand.trim();
    const timeNow = new Date().toTimeString().slice(0, 5) + ' WIB';

    // 1. Add User Message
    const userMsg: TelegramSimulationMessage = {
      id: `u-${Date.now()}`,
      from_id: currentUser.telegram_id || '99881102',
      from_username: currentUser.telegram_username || 'staff_sdkr',
      is_bot: false,
      text: cmd,
      photo_url: hasPhotoAttached ? 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300' : undefined,
      timestamp: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputCommand('');
    setIsProcessing(true);

    // Simulate edge function logic
    setTimeout(async () => {
      let botReply = '';

      if (cmd.startsWith('/start')) {
        botReply = `🌟 *School Hub Assistant*\n*SD Khoirur Rooziqiin Bandung*\n\nAkun Terverifikasi:\n• Nama: *${currentUser.name}*\n• Peran: *${currentUser.roles.join(', ')}*\n• Telegram ID: \`${currentUser.telegram_id || '99881102'}\`\n\nPerintah Siap Digunakan:\n• \`/spp Ahmad 350000 November\`\n• \`/tahunan Ahmad 2 500000\`\n• \`/cek Ahmad\`\n• \`/jadwal\``;
      } else if (cmd.startsWith('/spp')) {
        const parts = cmd.split(/\s+/);
        const nameQuery = parts[1] || 'Ahmad';
        const nominal = parseInt(parts[2]?.replace(/[^0-9]/g, '') || '350000', 10);
        const month = parts[3] || 'November';

        const matchedStudent = students.find((s) => s.name.toLowerCase().includes(nameQuery.toLowerCase())) || students[0];
        const receiptNo = `SPP-${matchedStudent.nis}-${month.toUpperCase().slice(0, 3)}`;

        // Record in Dexie
        await db.fee_spp.put({
          id: `spp-tg-${Date.now()}`,
          student_id: matchedStudent.id,
          academic_year_id: 'ay-2026',
          month,
          nominal,
          status: 'Lunas',
          paid_date: new Date().toISOString(),
          payment_method: 'Transfer Bank',
          receipt_number: receiptNo,
          proof_file_url: hasPhotoAttached ? 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300' : undefined,
          recorded_by: currentUser.id,
        });

        botReply = `✅ *PEMBAYARAN SPP BERHASIL DICATAT!*\n\n` +
          `• *Siswa*: ${matchedStudent.name}\n` +
          `• *Kelas*: ${classes.find(c => c.id === matchedStudent.class_id)?.name}\n` +
          `• *Bulan*: ${month}\n` +
          `• *Nominal*: Rp ${nominal.toLocaleString('id-ID')}\n` +
          `• *No. Kuitansi*: \`${receiptNo}\`\n` +
          `• *Pencatat*: ${currentUser.name}\n` +
          `• *Bukti Transfer*: ${hasPhotoAttached ? '📸 Tersimpan di Firebase Storage (`bukti_transfer`)' : 'Tanpa Bukti Foto'}\n\n` +
          `📄 Kuitansi resmi PDF telah terbit dan matriks SPP kelas langsung diperbarui.`;
      } else if (cmd.startsWith('/tahunan')) {
        const parts = cmd.split(/\s+/);
        const nameQuery = parts[1] || 'Ahmad';
        const installmentNo = parseInt(parts[2] || '2', 10);
        const nominal = parseInt(parts[3]?.replace(/[^0-9]/g, '') || '500000', 10);

        const matchedStudent = students.find((s) => s.name.toLowerCase().includes(nameQuery.toLowerCase())) || students[0];
        const target = matchedStudent.annual_fee_target || 3500000;
        const receiptNo = `THN-${matchedStudent.nis}-C${installmentNo}`;

        // Add installment
        await db.fee_annual_installments.add({
          id: `fai-tg-${Date.now()}`,
          student_id: matchedStudent.id,
          installment_number: installmentNo,
          nominal,
          paid_date: new Date().toISOString(),
          payment_method: 'Transfer Bank',
          receipt_number: receiptNo,
          notes: `Input via Telegram Bot oleh ${currentUser.name}`,
          recorded_by: currentUser.id,
        });

        // Recalculate progress bar
        const totalPaid = 1500000 + nominal;
        const pct = Math.min(100, Math.round((totalPaid / target) * 100));
        const remaining = Math.max(0, target - totalPaid);

        const filledBlocks = Math.round(pct / 10);
        const emptyBlocks = 10 - filledBlocks;
        const progressBar = '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks);

        botReply = `✅ *CICILAN IURAN TAHUNAN DICATAT!*\n\n` +
          `• *Siswa*: ${matchedStudent.name}\n` +
          `• *Cicilan Ke-*: ${installmentNo}\n` +
          `• *Nominal Cicilan*: Rp ${nominal.toLocaleString('id-ID')}\n` +
          `• *No. Kuitansi*: \`${receiptNo}\`\n\n` +
          `📊 *Progress Bar Iuran Tahunan Terpadu*:\n` +
          `${progressBar} *${pct}%*\n` +
          `• *Total Terbayar*: Rp ${totalPaid.toLocaleString('id-ID')} / Rp ${target.toLocaleString('id-ID')}\n` +
          `• *Sisa Tagihan*: Rp ${remaining.toLocaleString('id-ID')}\n` +
          `• *Status*: ${pct >= 100 ? '🎉 LUNAS SEPENUHNYA' : 'SEBAGIAN'}\n\n` +
          `Progress bar visual di Web App School Hub langsung bergerak bertambah!`;
      } else if (cmd.startsWith('/cek')) {
        const parts = cmd.split(/\s+/);
        const nameQuery = parts.slice(1).join(' ') || 'Ahmad';
        const matched = students.find((s) => s.name.toLowerCase().includes(nameQuery.toLowerCase())) || students[0];

        botReply = `📋 *Status Keuangan Terpadu*\n\n` +
          `• *Nama*: ${matched.name}\n` +
          `• *NISN / NIS*: ${matched.nisn} / ${matched.nis}\n` +
          `• *Kelas*: ${classes.find(c => c.id === matched.class_id)?.name}\n` +
          `• *SPP Terakhir*: November (Lunas)\n` +
          `• *Iuran Tahunan*: Rp 2.500.000 / Rp ${matched.annual_fee_target.toLocaleString('id-ID')} (71.4%)\n` +
          `• *Sisa Tagihan Tahunan*: Rp 1.000.000`;
      } else if (cmd.startsWith('/jadwal')) {
        botReply = `📅 *Jadwal Pembiasaan & Pelajaran Hari Ini (Senin)*:\n\n` +
          `• *07:30 - 08:00*: Sholat Dhuha Bersama di Mushola\n` +
          `• *08:00 - 08:35*: JP 1\n` +
          `• *08:35 - 09:10*: JP 2\n` +
          `• *09:10 - 09:25*: Istirahat Pagi\n\n` +
          `🎯 *Petugas Piket Lapangan*: Ustadzah Fatimah Azzahra\n` +
          `🏢 *Petugas Piket Kantor*: Ustadz Dedi Kurniawan`;
      } else {
        botReply = `Ketik \`/start\` untuk melihat panduan perintah yang didukung.`;
      }

      const botMsg: TelegramSimulationMessage = {
        id: `b-${Date.now()}`,
        from_id: 'bot',
        from_username: 'SchoolHub_Bot',
        is_bot: true,
        text: botReply,
        timestamp: new Date().toTimeString().slice(0, 5) + ' WIB',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsProcessing(false);
    }, 600);
  };

  if (!isTelegramDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#17212B] text-white shadow-2xl flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="bg-[#242F3D] px-4 py-3 flex items-center justify-between border-b border-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
              <span>School Hub Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] text-blue-300">
              Bot Terverifikasi SD Khoirur Rooziqiin
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsTelegramDrawerOpen(false)}
          className="text-slate-400 hover:text-white font-bold p-1 rounded-lg"
        >
          ✕
        </button>
      </div>

      {/* User Verification Status Box */}
      <div className="bg-[#1C2733] px-3.5 py-2 border-b border-black/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">
            Login: <strong className="text-white">{currentUser.name.split(',')[0]}</strong>
          </span>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
          ID: {currentUser.telegram_id || '99881102'}
        </span>
      </div>

      {/* Quick Action Shortcut Buttons */}
      <div className="px-3.5 py-2 bg-[#242F3D] flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
        <button
          onClick={() => setInputCommand('/spp Ahmad 350000 November')}
          className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          /spp Ahmad
        </button>
        <button
          onClick={() => setInputCommand('/tahunan Ahmad 2 500000')}
          className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          /tahunan Ahmad
        </button>
        <button
          onClick={() => setInputCommand('/cek Ahmad')}
          className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          /cek Ahmad
        </button>
        <button
          onClick={() => setInputCommand('/jadwal')}
          className="bg-slate-600/40 hover:bg-slate-600/60 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          /jadwal
        </button>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-[#0E1621]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.is_bot ? 'items-start' : 'items-end'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                m.is_bot
                  ? 'bg-[#242F3D] text-white rounded-tl-xs'
                  : 'bg-[#2B5278] text-white rounded-tr-xs'
              }`}
            >
              {/* If Photo attached */}
              {m.photo_url && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                  <img
                    src={m.photo_url}
                    alt="Bukti Transfer"
                    className="w-full h-32 object-cover"
                  />
                  <div className="bg-black/60 px-2 py-0.5 text-[10px] text-slate-300 flex items-center gap-1 font-semibold">
                    <Camera className="w-3 h-3" />
                    <span>Bukti Transfer Dilampirkan</span>
                  </div>
                </div>
              )}

              <div className="whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>

              <div
                className={`text-[9px] mt-1 text-right ${
                  m.is_bot ? 'text-slate-400' : 'text-blue-200'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Bot sedang memproses transaksi & memperbarui progress bar...</span>
          </div>
        )}
      </div>

      {/* Input Ribbon */}
      <form onSubmit={handleSendCommand} className="p-3 bg-[#242F3D] border-t border-black/20 space-y-2">
        {/* Toggle Photo Attachment */}
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPhotoAttached}
              onChange={(e) => setHasPhotoAttached(e.target.checked)}
              className="rounded text-blue-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1 font-medium">
              <Camera className="w-3.5 h-3.5 text-school-gold-400" />
              Lampirkan Foto Bukti Transfer
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            placeholder="Ketik perintah (contoh: /spp Ahmad 350000 November)"
            className="flex-1 bg-[#17212B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-400 font-mono"
          />
          <button
            type="submit"
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl shadow-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};
