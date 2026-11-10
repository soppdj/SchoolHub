export type UserRole =
  | 'Developer'
  | 'Administrator'
  | 'Kepala Sekolah'
  | 'Guru Kelas'
  | 'Guru Mapel'
  | 'Shadow Teacher'
  | 'Sarpras'
  | 'Guru Piket Lapangan'
  | 'Guru Piket Kantor';

export interface UserProfile {
  id: string;
  name: string;
  title?: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  telegram_id?: string;
  telegram_username?: string;
  assigned_class_id?: string; // For Wali Kelas (e.g. 'c1', 'c2'...)
  specialty?: string; // e.g. 'PAI', 'PJOK', 'Bahasa Inggris', 'Matematika'
  avatar_url?: string;
  is_active: boolean;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2026/2027"
  semester: 1 | 2;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Kelas 1", "Kelas 2", etc.
  grade_level: number; // 1 to 6
  wali_kelas_id: string;
  room_name: string;
  student_count: number;
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  class_id: string;
  gender: 'L' | 'P';
  birth_place?: string;
  birth_date?: string;
  parent_name: string;
  parent_phone: string;
  has_special_needs: boolean;
  special_needs_notes?: string;
  shadow_teacher_id?: string;
  fee_category: 'Reguler' | 'Beasiswa' | 'Khusus';
  spp_monthly_amount: number; // default 350000
  annual_fee_target: number; // default 3500000
}

export type PanelColorState = 'WHITE' | 'GREEN' | 'RED' | 'GRAY';

export interface MasterScheduleItem {
  id: string;
  class_id: string;
  day_of_week: 1 | 2 | 3 | 4 | 5; // 1=Senin, 5=Jumat
  period_number: number; // Jam Ke-1, Jam Ke-2, etc.
  start_time: string; // e.g. "08:00"
  end_time: string; // e.g. "08:35"
  duration_jp: number; // usually 1 or 2 JP (35 or 70 mins)
  subject_name: string;
  teacher_id: string;
  is_tahfidz_day?: boolean;
}

export interface TeachingJournal {
  id: string;
  schedule_id?: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  period_number: number;
  subject_name: string;
  teacher_id: string; // who actually taught
  is_substitute: boolean;
  original_teacher_id?: string;
  shadow_teacher_id?: string;
  topic: string;
  learning_activity: string;
  notes?: string;
  present_count: number;
  sick_count: number;
  permitted_count: number;
  absent_count: number;
  created_at: string;
}

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  class_id: string;
  student_id: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  notes?: string;
}

export interface StaffAttendance {
  id: string;
  user_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Dinas Luar' | 'Belum Hadir';
  leave_reason?: string;
  proof_file_url?: string;
  jp_taught_count: number;
  substitute_jp_count: number;
}

export interface ShadowTeacherJournal {
  id: string;
  date: string;
  student_id: string;
  class_id: string;
  shadow_teacher_id: string;
  subject_name: string;
  focus_rating: 1 | 2 | 3 | 4 | 5; // 1=Sangat Kurang, 5=Sangat Baik
  focus_notes: string;
  behavior_rating: 1 | 2 | 3 | 4 | 5;
  behavior_notes: string;
  emotion_rating: 1 | 2 | 3 | 4 | 5;
  emotion_notes: string;
  material_adaptation: string;
  evidence_url?: string;
  created_at: string;
}

export interface TahfidzProgress {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id: string;
  date: string;
  juz: number;
  surah_name: string;
  verse_from: number;
  verse_to: number;
  grade: 'Lancar' | 'Cukup' | 'Ulang';
  notes?: string;
  created_at: string;
}

export interface PiketSchedule {
  id: string;
  day_of_week: 1 | 2 | 3 | 4 | 5;
  piket_lapangan_teacher_id: string;
  piket_kantor_teacher_id: string;
}

export interface PiketLapanganChecklist {
  id: string;
  date: string;
  teacher_id: string;
  sapa_pagi_completed: boolean; // 07:15 - 07:30
  dhuha_supervised: boolean; // 07:30 - 08:00
  tahfidz_orderliness: boolean;
  istirahat_patrol: boolean;
  facility_cleanliness_check: boolean;
  late_students_count: number;
  late_students_notes: string;
  incident_notes?: string;
}

export interface GuestBookEntry {
  id: string;
  date: string;
  time: string;
  guest_name: string;
  institution_or_relation: string;
  purpose: string;
  person_to_meet: string;
  phone_number: string;
  recorded_by_id: string;
}

export interface KurikulumTP {
  id: string;
  grade_level: number; // 1 - 6
  subject_name: string;
  code: string; // e.g. "TP 1.1", "TP 2.3"
  description: string;
}

export interface StudentGrade {
  id: string;
  student_id: string;
  tp_id: string;
  score_formative: number;
  score_summative: number;
  notes?: string;
}

export interface FeeSppRecord {
  id: string;
  student_id: string;
  academic_year_id: string;
  month: string; // 'Juli', 'Agustus', ..., 'Juni'
  nominal: number;
  status: 'Lunas' | 'Belum Lunas';
  paid_date?: string;
  payment_method?: 'Transfer Bank' | 'Tunai';
  receipt_number?: string;
  proof_file_url?: string;
  recorded_by?: string;
}

export interface FeeAnnualSummary {
  id: string;
  student_id: string;
  academic_year_id: string;
  target_amount: number; // e.g. 3500000
  total_paid: number;
  percentage_paid: number; // 0 - 100
  status: 'Lunas' | 'Sebagian' | 'Belum';
}

export interface FeeAnnualInstallment {
  id: string;
  student_id: string;
  installment_number: number; // 1, 2, 3...
  nominal: number;
  paid_date: string;
  payment_method: 'Transfer Bank' | 'Tunai';
  proof_file_url?: string;
  notes?: string;
  receipt_number: string;
  recorded_by?: string;
}

export type PosKeuangan = 'Kas SPP / Operasional' | 'Dana BOS' | 'Kas Kegiatan / Ekstrakurikuler';

export interface FinanceTransaction {
  id: string;
  transaction_number: string;
  date: string;
  type: 'Pemasukan' | 'Pengeluaran';
  pos_keuangan: PosKeuangan;
  category: string;
  amount: number;
  description: string;
  is_draft?: boolean;
  sarpras_ticket_id?: string;
  proof_file_url?: string;
  recorded_by: string;
}

export interface LetterTemplate {
  id: string;
  code: string; // e.g. "UND", "SK", "KET"
  title: string;
  numbering_format: string; // e.g. "{nomor}/SD-KR/{kode}/{romawi}/{tahun}"
  body_template: string;
}

export interface LetterArchive {
  id: string;
  letter_number: string;
  letter_type: 'Keluar' | 'Masuk';
  category_code: string;
  date: string;
  recipient_or_sender: string;
  subject: string;
  body_content?: string;
  file_url?: string;
  created_by: string;
}

export interface SarprasItem {
  id: string;
  code: string; // e.g. "INV-K3-001"
  name: string;
  room_name: string; // 'Kelas 1', ..., 'Ruang Guru', 'Mushola', etc.
  quantity: number;
  condition: 'Baik' | 'Rusak Ringan' | 'Perlu Diganti';
  last_checked_date: string;
}

export interface SarprasTicket {
  id: string;
  ticket_number: string;
  item_id: string;
  item_name: string;
  room_name: string;
  reported_by_id: string;
  reported_date: string;
  issue_description: string;
  photo_url?: string;
  status: 'Dilaporkan' | 'Menunggu Persetujuan Kepsek' | 'Disetujui' | 'Ditolak' | 'Dalam Pengerjaan' | 'Selesai';
  estimated_cost?: number;
  sarpras_notes?: string;
  approved_by_id?: string;
  approved_date?: string;
  finance_transaction_id?: string;
}

export interface OfflineSyncQueueItem {
  id?: number;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  synced: boolean;
  error?: string;
}

export interface TelegramSimulationMessage {
  id: string;
  from_id: string;
  from_username: string;
  is_bot: boolean;
  text: string;
  photo_url?: string;
  timestamp: string;
}
