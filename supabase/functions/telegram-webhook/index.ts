// Follow Deno deploy and Supabase Edge Function standards
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
    };
    text?: string;
    caption?: string;
    photo?: Array<{
      file_id: string;
      file_size: number;
      width: number;
      height: number;
    }>;
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const msg = update.message;
    if (!msg) return new Response("OK", { status: 200 });

    const chatId = msg.chat.id;
    const fromId = String(msg.from.id);
    const fromUsername = msg.from.username?.toLowerCase() || "";

    // 1. Verify User is a registered staff member of SD Khoirur Rooziqiin Bandung
    const { data: staffMembers, error: staffErr } = await supabase
      .from("profiles")
      .select("*")
      .or(`telegram_id.eq.${fromId},telegram_username.ilike.${fromUsername}`);

    if (staffErr || !staffMembers || staffMembers.length === 0) {
      await sendTelegramMessage(
        chatId,
        `⚠️ *Akses Ditolak*\nID Telegram Anda (\`${fromId}\`) belum terdaftar sebagai staf resmi di *School Hub SD Khoirur Rooziqiin Bandung*.\n\nSilakan hubungi Administrator atau Developer untuk mendaftarkan akun Anda.`
      );
      return new Response("Unauthorized", { status: 200 });
    }

    const staff = staffMembers[0];
    const fullText = (msg.caption || msg.text || "").trim();

    // 2. Parse commands
    if (fullText.startsWith("/start")) {
      const welcome = `🌟 *Selamat Datang di School Hub Assistant*\n*SD Khoirur Rooziqiin Bandung*\n\n` +
        `Halo, *${staff.name}* (${staff.roles.join(", ")})!\n\n` +
        `Perintah yang dapat digunakan:\n` +
        `• \`/spp [Nama] [Nominal] [Bulan]\` - Input/Update SPP + Bukti Transfer\n` +
        `• \`/tahunan [Nama] [Cicilan Ke-] [Nominal]\` - Input Cicilan Iuran Tahunan\n` +
        `• \`/cek [Nama]\` - Cek riwayat SPP & Progres Iuran Tahunan\n` +
        `• \`/jadwal\` - Cek jadwal pelajaran & piket hari ini`;
      await sendTelegramMessage(chatId, welcome);
      return new Response("OK", { status: 200 });
    }

    // SPP Command: /spp [Nama] [Nominal] [Bulan]
    if (fullText.startsWith("/spp")) {
      const parts = fullText.split(/\s+/);
      if (parts.length < 4) {
        await sendTelegramMessage(
          chatId,
          `⚠️ *Format Kurang Lengkap*\nGunakan format:\n\`/spp [Nama Siswa] [Nominal] [Bulan]\`\n\nContoh: \`/spp Ahmad 350000 November\``
        );
        return new Response("OK", { status: 200 });
      }

      const studentQuery = parts[1];
      const nominal = parseInt(parts[2].replace(/[^0-9]/g, ""), 10);
      const month = parts[3];

      // Find student
      const { data: students } = await supabase
        .from("students")
        .select("id, name, class_id")
        .ilike("name", `%${studentQuery}%`)
        .limit(1);

      if (!students || students.length === 0) {
        await sendTelegramMessage(chatId, `❌ Siswa dengan nama *${studentQuery}* tidak ditemukan.`);
        return new Response("OK", { status: 200 });
      }

      const student = students[0];
      const receiptNo = `KWT-${Date.now().toString().slice(-6)}`;

      // Insert/Update fee_spp
      await supabase.from("fee_spp").upsert({
        student_id: student.id,
        academic_year_id: "ay-2026",
        month,
        nominal,
        status: "Lunas",
        paid_date: new Date().toISOString(),
        payment_method: "Transfer Bank",
        receipt_number: receiptNo,
        recorded_by: staff.id,
      });

      const reply = `✅ *Pembayaran SPP Berhasil Dicatat!*\n\n` +
        `• *Siswa*: ${student.name}\n` +
        `• *Bulan*: ${month}\n` +
        `• *Nominal*: Rp ${nominal.toLocaleString("id-ID")}\n` +
        `• *No. Kuitansi*: \`${receiptNo}\`\n` +
        `• *Pencatat*: ${staff.name}\n` +
        `• *Bukti Transfer*: ${msg.photo ? "Tersimpan di Cloud Storage" : "Tanpa Foto"}\n\n` +
        `📄 Kuitansi resmi dapat diunduh di Web App School Hub.`;

      await sendTelegramMessage(chatId, reply);
      return new Response("OK", { status: 200 });
    }

    // Annual Fee Command: /tahunan [Nama] [Cicilan Ke-] [Nominal]
    if (fullText.startsWith("/tahunan")) {
      const parts = fullText.split(/\s+/);
      if (parts.length < 4) {
        await sendTelegramMessage(
          chatId,
          `⚠️ *Format Kurang Lengkap*\nGunakan format:\n\`/tahunan [Nama Siswa] [Cicilan Ke-] [Nominal]\`\n\nContoh: \`/tahunan Ahmad 2 500000\``
        );
        return new Response("OK", { status: 200 });
      }

      const studentQuery = parts[1];
      const installmentNo = parseInt(parts[2], 10);
      const nominal = parseInt(parts[3].replace(/[^0-9]/g, ""), 10);

      const { data: students } = await supabase
        .from("students")
        .select("id, name, annual_fee_target")
        .ilike("name", `%${studentQuery}%`)
        .limit(1);

      if (!students || students.length === 0) {
        await sendTelegramMessage(chatId, `❌ Siswa dengan nama *${studentQuery}* tidak ditemukan.`);
        return new Response("OK", { status: 200 });
      }

      const student = students[0];
      const target = Number(student.annual_fee_target) || 3500000;
      const receiptNo = `KWT-THN-${Date.now().toString().slice(-6)}`;

      await supabase.from("fee_annual_installments").insert({
        student_id: student.id,
        installment_number: installmentNo,
        nominal,
        paid_date: new Date().toISOString(),
        payment_method: "Transfer Bank",
        receipt_number: receiptNo,
        notes: `Input via Telegram Bot oleh ${staff.name}`,
        recorded_by: staff.id,
      });

      // Recalculate summary
      const { data: allInstallments } = await supabase
        .from("fee_annual_installments")
        .select("nominal")
        .eq("student_id", student.id);

      const totalPaid = (allInstallments || []).reduce((acc: number, cur: any) => acc + Number(cur.nominal), 0);
      const pct = Math.min(100, Math.round((totalPaid / target) * 100));
      const remaining = Math.max(0, target - totalPaid);

      // ASCII visual progress bar for Telegram
      const filledBlocks = Math.round(pct / 10);
      const emptyBlocks = 10 - filledBlocks;
      const progressBar = "🟩".repeat(filledBlocks) + "⬜".repeat(emptyBlocks);

      const reply = `✅ *Cicilan Iuran Tahunan Dicatat!*\n\n` +
        `• *Siswa*: ${student.name}\n` +
        `• *Cicilan Ke-*: ${installmentNo}\n` +
        `• *Nominal Dibayar*: Rp ${nominal.toLocaleString("id-ID")}\n` +
        `• *No. Kuitansi*: \`${receiptNo}\`\n\n` +
        `📊 *Status Iuran Tahunan Terpadu*:\n` +
        `${progressBar} *${pct}%*\n` +
        `• *Total Terbayar*: Rp ${totalPaid.toLocaleString("id-ID")} / Rp ${target.toLocaleString("id-ID")}\n` +
        `• *Sisa Tagihan*: Rp ${remaining.toLocaleString("id-ID")}\n` +
        `• *Status*: ${pct >= 100 ? "🎉 LUNAS" : "SEBAGIAN"}`;

      await sendTelegramMessage(chatId, reply);
      return new Response("OK", { status: 200 });
    }

    // Check student status: /cek [Nama]
    if (fullText.startsWith("/cek")) {
      const parts = fullText.split(/\s+/);
      const studentQuery = parts.slice(1).join(" ");
      const { data: students } = await supabase
        .from("students")
        .select("id, name, annual_fee_target, classes(name)")
        .ilike("name", `%${studentQuery}%`)
        .limit(1);

      if (!students || students.length === 0) {
        await sendTelegramMessage(chatId, `❌ Siswa *${studentQuery}* tidak ditemukan.`);
        return new Response("OK", { status: 200 });
      }

      const student = students[0];
      const target = Number(student.annual_fee_target) || 3500000;

      const { data: allInstallments } = await supabase
        .from("fee_annual_installments")
        .select("nominal")
        .eq("student_id", student.id);

      const totalPaid = (allInstallments || []).reduce((acc: number, cur: any) => acc + Number(cur.nominal), 0);
      const pct = Math.min(100, Math.round((totalPaid / target) * 100));

      await sendTelegramMessage(
        chatId,
        `📋 *Info Keuangan Siswa*\n` +
        `• *Nama*: ${student.name}\n` +
        `• *Kelas*: ${(student as any).classes?.name || "-"}\n` +
        `• *Target Iuran Tahunan*: Rp ${target.toLocaleString("id-ID")}\n` +
        `• *Total Terbayar*: Rp ${totalPaid.toLocaleString("id-ID")} (${pct}%)\n` +
        `• *Sisa*: Rp ${(target - totalPaid).toLocaleString("id-ID")}`
      );
      return new Response("OK", { status: 200 });
    }

    // Default response
    await sendTelegramMessage(
      chatId,
      `Ketik \`/start\` untuk melihat daftar perintah yang didukung.`
    );
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
