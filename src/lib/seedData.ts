import {
  UserProfile,
  AcademicYear,
  SchoolClass,
  Student,
  MasterScheduleItem,
  PiketSchedule,
  StaffAttendance,
  TeachingJournal,
  ShadowTeacherJournal,
  TahfidzProgress,
  KurikulumTP,
  StudentGrade,
  FeeSppRecord,
  FeeAnnualSummary,
  FeeAnnualInstallment,
  FinanceTransaction,
  LetterTemplate,
  LetterArchive,
  SarprasItem,
  SarprasTicket,
  GuestBookEntry,
  PiketLapanganChecklist
} from '../types';

export const SEED_ACADEMIC_YEAR: AcademicYear = {
  id: 'ay-2026',
  name: '2026/2027',
  semester: 1,
  is_active: true,
  start_date: '2026-07-15',
  end_date: '2026-12-20',
};

export const SEED_STAFF: UserProfile[] = [
  {
    id: 'u-salman',
    name: 'Dr. H. Salman Farisi, M.Pd.',
    title: 'Kepala Sekolah',
    email: 'salman.farisi@sdkhoirurroziqiin.sch.id',
    phone: '081223344550',
    roles: ['Kepala Sekolah'],
    telegram_id: '99881101',
    telegram_username: 'salman_farisi',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_active: true,
  },
  {
    id: 'u-ridwan',
    name: 'M. Ridwan Kamil, S.Kom.',
    title: 'Guru TIK & Developer Sistem',
    email: 'ridwan.kamil@sdkhoirurroziqiin.sch.id',
    phone: '081223344551',
    roles: ['Developer', 'Guru Mapel'],
    telegram_id: '99881102',
    telegram_username: 'ridwan_dev',
    specialty: 'Informatika & Robotika',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    is_active: true,
  },
  {
    id: 'u-nurul',
    name: 'Nurul Hidayati, S.E.',
    title: 'Kepala Tata Usaha & Bendahara',
    email: 'nurul.hidayati@sdkhoirurroziqiin.sch.id',
    phone: '081223344552',
    roles: ['Administrator'],
    telegram_id: '99881103',
    telegram_username: 'nurul_admin',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    is_active: true,
  },
  {
    id: 'u-fatimah',
    name: 'Fatimah Azzahra, S.Pd.',
    title: 'Wali Kelas 1 & Piket Lapangan',
    email: 'fatimah.azzahra@sdkhoirurroziqiin.sch.id',
    phone: '081223344553',
    roles: ['Guru Kelas', 'Guru Piket Lapangan'],
    telegram_id: '99881104',
    telegram_username: 'fatimah_guru',
    assigned_class_id: 'c1',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    is_active: true,
  },
  {
    id: 'u-fauzan',
    name: 'Ahmad Fauzan, S.Pd.',
    title: 'Wali Kelas 2',
    email: 'ahmad.fauzan@sdkhoirurroziqiin.sch.id',
    phone: '081223344554',
    roles: ['Guru Kelas'],
    telegram_id: '99881105',
    telegram_username: 'fauzan_sd',
    assigned_class_id: 'c2',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    is_active: true,
  },
  {
    id: 'u-maryam',
    name: 'Siti Maryam, S.Pd.',
    title: 'Wali Kelas 3 & Tim Sarpras',
    email: 'siti.maryam@sdkhoirurroziqiin.sch.id',
    phone: '081223344555',
    roles: ['Guru Kelas', 'Sarpras'],
    telegram_id: '99881106',
    telegram_username: 'maryam_guru',
    assigned_class_id: 'c3',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    is_active: true,
  },
  {
    id: 'u-ilham',
    name: 'M. Ilham Pratama, S.Pd.',
    title: 'Wali Kelas 4',
    email: 'ilham.pratama@sdkhoirurroziqiin.sch.id',
    phone: '081223344556',
    roles: ['Guru Kelas'],
    telegram_id: '99881107',
    telegram_username: 'ilham_pratama',
    assigned_class_id: 'c4',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    is_active: true,
  },
  {
    id: 'u-aisyah',
    name: 'Aisyah Rahmawati, S.Pd.',
    title: 'Wali Kelas 5',
    email: 'aisyah.rahma@sdkhoirurroziqiin.sch.id',
    phone: '081223344557',
    roles: ['Guru Kelas'],
    telegram_id: '99881108',
    telegram_username: 'aisyah_sd',
    assigned_class_id: 'c5',
    avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
    is_active: true,
  },
  {
    id: 'u-dedi',
    name: 'Dedi Kurniawan, M.Pd.',
    title: 'Wali Kelas 6 & Piket Kantor',
    email: 'dedi.kurniawan@sdkhoirurroziqiin.sch.id',
    phone: '081223344558',
    roles: ['Guru Kelas', 'Guru Piket Kantor'],
    telegram_id: '99881109',
    telegram_username: 'dedi_kurnia',
    assigned_class_id: 'c6',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    is_active: true,
  },
  {
    id: 'u-hendra',
    name: 'Hendra Gunawan, S.Pd.I.',
    title: 'Guru PAI & Koordinator Tahfidz',
    email: 'hendra.gunawan@sdkhoirurroziqiin.sch.id',
    phone: '081223344559',
    roles: ['Guru Mapel'],
    telegram_id: '99881110',
    telegram_username: 'hendra_tahfidz',
    specialty: 'PAI & Tahfidz Al-Quran',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    is_active: true,
  },
  {
    id: 'u-budi',
    name: 'Budi Santoso, S.Or.',
    title: 'Guru PJOK',
    email: 'budi.santoso@sdkhoirurroziqiin.sch.id',
    phone: '081223344560',
    roles: ['Guru Mapel'],
    telegram_id: '99881111',
    telegram_username: 'budi_pjok',
    specialty: 'Pendidikan Jasmani & Olahraga',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    is_active: true,
  },
  {
    id: 'u-sarah',
    name: 'Sarah Anindya, S.Pd.',
    title: 'Guru Bahasa Inggris',
    email: 'sarah.anindya@sdkhoirurroziqiin.sch.id',
    phone: '081223344561',
    roles: ['Guru Mapel'],
    telegram_id: '99881112',
    telegram_username: 'sarah_english',
    specialty: 'Bahasa Inggris',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_active: true,
  },
  {
    id: 'u-dewi',
    name: 'Dewi Sartika, S.Pd.',
    title: 'Guru Pendamping Khusus (Shadow Teacher)',
    email: 'dewi.sartika@sdkhoirurroziqiin.sch.id',
    phone: '081223344562',
    roles: ['Shadow Teacher'],
    telegram_id: '99881113',
    telegram_username: 'dewi_shadow',
    specialty: 'Pendidikan Khusus & Terapi Anak',
    avatar_url: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150',
    is_active: true,
  },
  {
    id: 'u-rahmat',
    name: 'Rahmat Hidayat',
    title: 'Koordinator Sarana & Prasarana',
    email: 'rahmat.hidayat@sdkhoirurroziqiin.sch.id',
    phone: '081223344563',
    roles: ['Sarpras'],
    telegram_id: '99881114',
    telegram_username: 'rahmat_sarpras',
    avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
    is_active: true,
  },
];

export const SEED_CLASSES: SchoolClass[] = [
  { id: 'c1', name: 'Kelas 1', grade_level: 1, wali_kelas_id: 'u-fatimah', room_name: 'Gedung A - R.101', student_count: 18 },
  { id: 'c2', name: 'Kelas 2', grade_level: 2, wali_kelas_id: 'u-fauzan', room_name: 'Gedung A - R.102', student_count: 18 },
  { id: 'c3', name: 'Kelas 3', grade_level: 3, wali_kelas_id: 'u-maryam', room_name: 'Gedung A - R.103', student_count: 17 },
  { id: 'c4', name: 'Kelas 4', grade_level: 4, wali_kelas_id: 'u-ilham', room_name: 'Gedung B - R.201', student_count: 18 },
  { id: 'c5', name: 'Kelas 5', grade_level: 5, wali_kelas_id: 'u-aisyah', room_name: 'Gedung B - R.202', student_count: 19 },
  { id: 'c6', name: 'Kelas 6', grade_level: 6, wali_kelas_id: 'u-dedi', room_name: 'Gedung B - R.203', student_count: 18 },
];

export const SEED_STUDENTS: Student[] = [
  // Kelas 1
  { id: 's101', nisn: '0151122331', nis: '20260101', name: 'Aisyah Putri Azzahra', class_id: 'c1', gender: 'P', parent_name: 'Budi Santoso', parent_phone: '081399887711', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's102', nisn: '0151122332', nis: '20260102', name: 'Bilal Habibi', class_id: 'c1', gender: 'L', parent_name: 'Hasan Basri', parent_phone: '081399887712', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's103', nisn: '0151122333', nis: '20260103', name: 'Faqih Rabbani', class_id: 'c1', gender: 'L', parent_name: 'Darmawan', parent_phone: '081399887713', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  
  // Kelas 2 - including Ahmad Fauzi with Shadow Teacher Ustadzah Dewi
  { id: 's201', nisn: '0142233441', nis: '20250201', name: 'Ahmad Fauzi', class_id: 'c2', gender: 'L', parent_name: 'H. Suryadi', parent_phone: '081211223344', has_special_needs: true, special_needs_notes: 'Sensori integrasi & rentang fokus perlu adaptasi', shadow_teacher_id: 'u-dewi', fee_category: 'Khusus', spp_monthly_amount: 450000, annual_fee_target: 4000000 },
  { id: 's202', nisn: '0142233442', nis: '20250202', name: 'Khadijah Al-Kubro', class_id: 'c2', gender: 'P', parent_name: 'Fauzi Rahmat', parent_phone: '081211223345', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's203', nisn: '0142233443', nis: '20250203', name: 'Rayhan Alvaro', class_id: 'c2', gender: 'L', parent_name: 'Iwan Ridwan', parent_phone: '081211223346', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },

  // Kelas 3
  { id: 's301', nisn: '0133344551', nis: '20240301', name: 'Muhammad Zaky Al-Ghifari', class_id: 'c3', gender: 'L', parent_name: 'Subagja', parent_phone: '081344556677', has_special_needs: true, special_needs_notes: 'Memerlukan scaffolding visual dalam adaptasi materi', shadow_teacher_id: 'u-dewi', fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's302', nisn: '0133344552', nis: '20240302', name: 'Zahra Syabila', class_id: 'c3', gender: 'P', parent_name: 'Yudi Pratama', parent_phone: '081344556678', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },

  // Kelas 4
  { id: 's401', nisn: '0124455661', nis: '20230401', name: 'Fathir Ar-Rasyid', class_id: 'c4', gender: 'L', parent_name: 'Eko Sulistyo', parent_phone: '081288990011', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's402', nisn: '0124455662', nis: '20230402', name: 'Naila Salsabila', class_id: 'c4', gender: 'P', parent_name: 'Agus Salim', parent_phone: '081288990012', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },

  // Kelas 5
  { id: 's501', nisn: '0115566771', nis: '20220501', name: 'Hanif Al-Farabi', class_id: 'c5', gender: 'L', parent_name: 'Farid Wijaya', parent_phone: '081377889922', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's502', nisn: '0115566772', nis: '20220502', name: 'Salma Nuraini', class_id: 'c5', gender: 'P', parent_name: 'Teguh Prasetyo', parent_phone: '081377889923', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },

  // Kelas 6
  { id: 's601', nisn: '0106677881', nis: '20210601', name: 'Rizqy Pratama Putra', class_id: 'c6', gender: 'L', parent_name: 'Supardi', parent_phone: '081266778833', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
  { id: 's602', nisn: '0106677882', nis: '20210602', name: 'Maryam Tsabita', class_id: 'c6', gender: 'P', parent_name: 'Luthfi Hakim', parent_phone: '081266778834', has_special_needs: false, fee_category: 'Reguler', spp_monthly_amount: 350000, annual_fee_target: 3500000 },
];

export const SEED_PIKET_SCHEDULES: PiketSchedule[] = [
  { id: 'ps-1', day_of_week: 1, piket_lapangan_teacher_id: 'u-fatimah', piket_kantor_teacher_id: 'u-dedi' },
  { id: 'ps-2', day_of_week: 2, piket_lapangan_teacher_id: 'u-budi', piket_kantor_teacher_id: 'u-sarah' },
  { id: 'ps-3', day_of_week: 3, piket_lapangan_teacher_id: 'u-hendra', piket_kantor_teacher_id: 'u-ilham' },
  { id: 'ps-4', day_of_week: 4, piket_lapangan_teacher_id: 'u-fauzan', piket_kantor_teacher_id: 'u-maryam' },
  { id: 'ps-5', day_of_week: 5, piket_lapangan_teacher_id: 'u-aisyah', piket_kantor_teacher_id: 'u-ridwan' },
];

// Schedule items for classes (1 JP = 35 minutes)
// On normal days: 07:30-08:00 Dhuha, JP 1 starts 08:00
// On Tahfidz days (e.g. Selasa & Kamis): 07:30-08:30 Dhuha + Tahfidz, JP 1 starts 08:30
export const SEED_SCHEDULES: MasterScheduleItem[] = [
  // Kelas 1 (Senin - Normal Day)
  { id: 'sch-1-1', class_id: 'c1', day_of_week: 1, period_number: 1, start_time: '08:00', end_time: '08:35', duration_jp: 1, subject_name: 'Pendidikan Pancasila', teacher_id: 'u-fatimah' },
  { id: 'sch-1-2', class_id: 'c1', day_of_week: 1, period_number: 2, start_time: '08:35', end_time: '09:10', duration_jp: 1, subject_name: 'Bahasa Indonesia', teacher_id: 'u-fatimah' },
  { id: 'sch-1-3', class_id: 'c1', day_of_week: 1, period_number: 3, start_time: '09:25', end_time: '10:00', duration_jp: 1, subject_name: 'PAI & Budi Pekerti', teacher_id: 'u-hendra' },
  { id: 'sch-1-4', class_id: 'c1', day_of_week: 1, period_number: 4, start_time: '10:00', end_time: '10:35', duration_jp: 1, subject_name: 'PJOK', teacher_id: 'u-budi' },

  // Kelas 2 (Senin)
  { id: 'sch-2-1', class_id: 'c2', day_of_week: 1, period_number: 1, start_time: '08:00', end_time: '08:35', duration_jp: 1, subject_name: 'Matematika', teacher_id: 'u-fauzan' },
  { id: 'sch-2-2', class_id: 'c2', day_of_week: 1, period_number: 2, start_time: '08:35', end_time: '09:10', duration_jp: 1, subject_name: 'Matematika (Lanjutan)', teacher_id: 'u-fauzan' },
  { id: 'sch-2-3', class_id: 'c2', day_of_week: 1, period_number: 3, start_time: '09:25', end_time: '10:00', duration_jp: 1, subject_name: 'Bahasa Indonesia', teacher_id: 'u-fauzan' },
  { id: 'sch-2-4', class_id: 'c2', day_of_week: 1, period_number: 4, start_time: '10:00', end_time: '10:35', duration_jp: 1, subject_name: 'Bahasa Inggris', teacher_id: 'u-sarah' },

  // Kelas 3 (Senin)
  { id: 'sch-3-1', class_id: 'c3', day_of_week: 1, period_number: 1, start_time: '08:00', end_time: '08:35', duration_jp: 1, subject_name: 'IPAS (Sains & Sosial)', teacher_id: 'u-maryam' },
  { id: 'sch-3-2', class_id: 'c3', day_of_week: 1, period_number: 2, start_time: '08:35', end_time: '09:10', duration_jp: 1, subject_name: 'IPAS (Praktik)', teacher_id: 'u-maryam' },
  { id: 'sch-3-3', class_id: 'c3', day_of_week: 1, period_number: 3, start_time: '09:25', end_time: '10:00', duration_jp: 1, subject_name: 'Seni Rupa', teacher_id: 'u-maryam' },
  { id: 'sch-3-4', class_id: 'c3', day_of_week: 1, period_number: 4, start_time: '10:00', end_time: '10:35', duration_jp: 1, subject_name: 'PAI & Budi Pekerti', teacher_id: 'u-hendra' },

  // Kelas 4 (Senin)
  { id: 'sch-4-1', class_id: 'c4', day_of_week: 1, period_number: 1, start_time: '08:00', end_time: '08:35', duration_jp: 1, subject_name: 'Bahasa Inggris', teacher_id: 'u-sarah' },
  { id: 'sch-4-2', class_id: 'c4', day_of_week: 1, period_number: 2, start_time: '08:35', end_time: '09:10', duration_jp: 1, subject_name: 'Bahasa Indonesia', teacher_id: 'u-ilham' },
  { id: 'sch-4-3', class_id: 'c4', day_of_week: 1, period_number: 3, start_time: '09:25', end_time: '10:00', duration_jp: 1, subject_name: 'Matematika', teacher_id: 'u-ilham' },
  { id: 'sch-4-4', class_id: 'c4', day_of_week: 1, period_number: 4, start_time: '10:00', end_time: '10:35', duration_jp: 1, subject_name: 'Informatika Dasar', teacher_id: 'u-ridwan' },

  // Kelas 5 (Senin)
  { id: 'sch-5-1', class_id: 'c5', day_of_week: 1, period_number: 1, start_time: '08:00', end_time: '08:35', duration_jp: 1, subject_name: 'PAI & Budi Pekerti', teacher_id: 'u-hendra' },
  { id: 'sch-5-2', class_id: 'c5', day_of_week: 1, period_number: 2, start_time: '08:35', end_time: '09:10', duration_jp: 1, subject_name: 'IPAS Terpadu', teacher_id: 'u-aisyah' },
  { id: 'sch-5-3', class_id: 'c5', day_of_week: 1, period_number: 3, start_time: '09:25', end_time: '10:00', duration_jp: 1, subject_name: 'Bahasa Indonesia', teacher_id: 'u-aisyah' },
  { id: 'sch-5-4', class_id: 'c5', day_of_week: 1, period_number: 4, start_time: '10:00', end_time: '10:35', duration_jp: 1, subject_name: 'PJOK', teacher_id: 'u-budi' },

  // Kelas 6 (Senin)
  { id: 'sch-6-1', class_id: 'c6', day_of_week: 1, period_number: 1, start_time: '08:00', end_time: '08:35', duration_jp: 1, subject_name: 'PJOK', teacher_id: 'u-budi' },
  { id: 'sch-6-2', class_id: 'c6', day_of_week: 1, period_number: 2, start_time: '08:35', end_time: '09:10', duration_jp: 1, subject_name: 'Matematika Peminatan', teacher_id: 'u-dedi' },
  { id: 'sch-6-3', class_id: 'c6', day_of_week: 1, period_number: 3, start_time: '09:25', end_time: '10:00', duration_jp: 1, subject_name: 'Bahasa Inggris Lanjutan', teacher_id: 'u-sarah' },
  { id: 'sch-6-4', class_id: 'c6', day_of_week: 1, period_number: 4, start_time: '10:00', end_time: '10:35', duration_jp: 1, subject_name: 'IPAS Eksperimen', teacher_id: 'u-dedi' },
];

export const SEED_STAFF_ATTENDANCE: StaffAttendance[] = [
  { id: 'sa-salman', user_id: 'u-salman', date: '2026-11-10', check_in_time: '07:05', status: 'Hadir', jp_taught_count: 0, substitute_jp_count: 0 },
  { id: 'sa-ridwan', user_id: 'u-ridwan', date: '2026-11-10', check_in_time: '07:15', status: 'Hadir', jp_taught_count: 2, substitute_jp_count: 0 },
  { id: 'sa-nurul', user_id: 'u-nurul', date: '2026-11-10', check_in_time: '07:10', status: 'Hadir', jp_taught_count: 0, substitute_jp_count: 0 },
  { id: 'sa-fatimah', user_id: 'u-fatimah', date: '2026-11-10', check_in_time: '07:00', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-fauzan', user_id: 'u-fauzan', date: '2026-11-10', check_in_time: '07:12', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-maryam', user_id: 'u-maryam', date: '2026-11-10', check_in_time: '07:18', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-ilham', user_id: 'u-ilham', date: '2026-11-10', status: 'Izin', leave_reason: 'Menghadiri Pelatihan Guru Penggerak Tingkat Kota Bandung', proof_file_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300', jp_taught_count: 0, substitute_jp_count: 0 },
  { id: 'sa-aisyah', user_id: 'u-aisyah', date: '2026-11-10', check_in_time: '07:14', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-dedi', user_id: 'u-dedi', date: '2026-11-10', check_in_time: '07:10', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-hendra', user_id: 'u-hendra', date: '2026-11-10', check_in_time: '07:08', status: 'Hadir', jp_taught_count: 4, substitute_jp_count: 0 },
  { id: 'sa-budi', user_id: 'u-budi', date: '2026-11-10', check_in_time: '07:05', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-sarah', user_id: 'u-sarah', date: '2026-11-10', check_in_time: '07:16', status: 'Hadir', jp_taught_count: 3, substitute_jp_count: 0 },
  { id: 'sa-dewi', user_id: 'u-dewi', date: '2026-11-10', check_in_time: '07:15', status: 'Hadir', jp_taught_count: 4, substitute_jp_count: 0 },
  { id: 'sa-rahmat', user_id: 'u-rahmat', date: '2026-11-10', check_in_time: '07:00', status: 'Hadir', jp_taught_count: 0, substitute_jp_count: 0 },
];

export const SEED_TEACHING_JOURNALS: TeachingJournal[] = [
  {
    id: 'tj-1',
    schedule_id: 'sch-1-2',
    class_id: 'c1',
    date: '2026-11-10',
    period_number: 2,
    subject_name: 'Bahasa Indonesia',
    teacher_id: 'u-fatimah',
    is_substitute: false,
    topic: 'Mengenal Bunyi Huruf B dan Kata Bergambar',
    learning_activity: 'Membaca bersama buku cerita bergambar, melingkari suku kata ba-bi-bu-be-bo pada kartu kata.',
    notes: 'Anak-anak sangat antusias dan aktif berpartisipasi.',
    present_count: 17,
    sick_count: 1,
    permitted_count: 0,
    absent_count: 0,
    created_at: '2026-11-10T08:38:00Z',
  },
  {
    id: 'tj-2',
    schedule_id: 'sch-2-2',
    class_id: 'c2',
    date: '2026-11-10',
    period_number: 2,
    subject_name: 'Matematika (Lanjutan)',
    teacher_id: 'u-fauzan',
    is_substitute: false,
    shadow_teacher_id: 'u-dewi',
    topic: 'Penjumlahan Bilangan 1-50 Menggunakan Blok Dienes',
    learning_activity: 'Praktik kelompok memanipulasi stik puluhan dan satuan, menyelesaikan soal cerita sederhana.',
    notes: 'Ahmad Fauzi didampingi Ustadzah Dewi menyelesaikan 4 dari 5 target soal adaptif.',
    present_count: 18,
    sick_count: 0,
    permitted_count: 0,
    absent_count: 0,
    created_at: '2026-11-10T08:36:00Z',
  },
];

export const SEED_SHADOW_JOURNALS: ShadowTeacherJournal[] = [
  {
    id: 'sh-1',
    date: '2026-11-10',
    student_id: 's201', // Ahmad Fauzi
    class_id: 'c2',
    shadow_teacher_id: 'u-dewi',
    subject_name: 'Matematika',
    focus_rating: 4,
    focus_notes: 'Fokus bertahan selama 25 menit pertama menggunakan media stik warna-warni. Mulai terdistraksi saat suara dari lapangan terdengar namun cepat diarahkan kembali.',
    behavior_rating: 5,
    behavior_notes: 'Sangat tenang, duduk rapi di tempatnya dan mengangkat tangan ketika ingin bertanya.',
    emotion_rating: 4,
    emotion_notes: 'Ceria dan bangga saat berhasil menyusun blok puluhan dengan tepat. Senyum lepas saat diapresiasi guru kelas.',
    material_adaptation: 'Materi penjumlahan 2 digit disederhanakan menjadi penjumlahan dengan batasan angka di bawah 20 menggunakan benda konkrit.',
    created_at: '2026-11-10T08:50:00Z',
  },
];

export const SEED_TAHFIDZ: TahfidzProgress[] = [
  {
    id: 'th-1',
    student_id: 's101',
    class_id: 'c1',
    teacher_id: 'u-hendra',
    date: '2026-11-10',
    juz: 30,
    surah_name: 'An-Naba',
    verse_from: 1,
    verse_to: 15,
    grade: 'Lancar',
    notes: 'Makharijul huruf sangat fasih, tajwid mad thabi’i terjaga dengan baik.',
    created_at: '2026-11-10T08:00:00Z',
  },
  {
    id: 'th-2',
    student_id: 's201',
    class_id: 'c2',
    teacher_id: 'u-hendra',
    date: '2026-11-10',
    juz: 30,
    surah_name: 'Al-Ikhlas & Al-Falaq',
    verse_from: 1,
    verse_to: 5,
    grade: 'Lancar',
    notes: 'Didampingi Ustadzah Dewi, pelafalan ayat jelas dan lancar.',
    created_at: '2026-11-10T08:15:00Z',
  },
  {
    id: 'th-3',
    student_id: 's301',
    class_id: 'c3',
    teacher_id: 'u-hendra',
    date: '2026-11-09',
    juz: 30,
    surah_name: 'Al-Insyiqaq',
    verse_from: 1,
    verse_to: 20,
    grade: 'Cukup',
    notes: 'Perlu pengulangan pada waqaf ayat 10-14.',
    created_at: '2026-11-09T08:00:00Z',
  },
];

export const SEED_KURIKULUM_TP: KurikulumTP[] = [
  { id: 'tp-bi-1', grade_level: 1, subject_name: 'Bahasa Indonesia', code: 'TP 1.1', description: 'Menirukan dan membedakan bunyi huruf vokal dan konsonan dengan artikulasi jelas.' },
  { id: 'tp-bi-2', grade_level: 1, subject_name: 'Bahasa Indonesia', code: 'TP 1.2', description: 'Mengeja dan merangkai suku kata terbuka menjadi kata bermakna tentang lingkungan sekitar.' },
  { id: 'tp-mtk-2', grade_level: 2, subject_name: 'Matematika', code: 'TP 2.1', description: 'Memahami nilai tempat puluhan dan satuan pada bilangan cacah sampai dengan 100.' },
  { id: 'tp-mtk-2b', grade_level: 2, subject_name: 'Matematika', code: 'TP 2.2', description: 'Menyelesaikan operasi penjumlahan dan pengurangan sederhana dengan benda konkrit.' },
  { id: 'tp-ipas-3', grade_level: 3, subject_name: 'IPAS', code: 'TP 3.1', description: 'Mengidentifikasi siklus hidup hewan dan metamorfosis di lingkungan sekitar sekolah.' },
  { id: 'tp-pai-1', grade_level: 1, subject_name: 'PAI & Budi Pekerti', code: 'TP 1.1P', description: 'Mengenal rukun Islam dan mempraktikkan tata cara wudhu dengan tertib.' },
];

export const SEED_GRADES: StudentGrade[] = [
  { id: 'gr-1', student_id: 's101', tp_id: 'tp-bi-1', score_formative: 92, score_summative: 95, notes: 'Penguasaan bunyi huruf sangat sempurna' },
  { id: 'gr-2', student_id: 's101', tp_id: 'tp-bi-2', score_formative: 88, score_summative: 90, notes: 'Membaca lancar' },
  { id: 'gr-3', student_id: 's201', tp_id: 'tp-mtk-2', score_formative: 85, score_summative: 88, notes: 'Memahami konsep puluhan dengan baik melalui media' },
  { id: 'gr-4', student_id: 's201', tp_id: 'tp-mtk-2b', score_formative: 78, score_summative: 80, notes: 'Perlu latihan bertahap pada pengurangan' },
];

export const SEED_FEE_SPP: FeeSppRecord[] = [
  { id: 'spp-1', student_id: 's101', academic_year_id: 'ay-2026', month: 'Juli', nominal: 350000, status: 'Lunas', paid_date: '2026-07-08T09:12:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-07-001', proof_file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300' },
  { id: 'spp-2', student_id: 's101', academic_year_id: 'ay-2026', month: 'Agustus', nominal: 350000, status: 'Lunas', paid_date: '2026-08-05T10:00:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-08-014', proof_file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300' },
  { id: 'spp-3', student_id: 's101', academic_year_id: 'ay-2026', month: 'September', nominal: 350000, status: 'Lunas', paid_date: '2026-09-09T08:30:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-09-021' },
  { id: 'spp-4', student_id: 's101', academic_year_id: 'ay-2026', month: 'Oktober', nominal: 350000, status: 'Lunas', paid_date: '2026-10-06T11:20:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-10-008' },
  { id: 'spp-5', student_id: 's101', academic_year_id: 'ay-2026', month: 'November', nominal: 350000, status: 'Lunas', paid_date: '2026-11-04T09:40:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-11-003' },
  { id: 'spp-6', student_id: 's101', academic_year_id: 'ay-2026', month: 'Desember', nominal: 350000, status: 'Belum Lunas' },

  // Ahmad Fauzi
  { id: 'spp-201-1', student_id: 's201', academic_year_id: 'ay-2026', month: 'Juli', nominal: 450000, status: 'Lunas', paid_date: '2026-07-10T14:00:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-07-089' },
  { id: 'spp-201-2', student_id: 's201', academic_year_id: 'ay-2026', month: 'Agustus', nominal: 450000, status: 'Lunas', paid_date: '2026-08-11T13:10:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-08-090' },
  { id: 'spp-201-3', student_id: 's201', academic_year_id: 'ay-2026', month: 'September', nominal: 450000, status: 'Lunas', paid_date: '2026-09-10T10:15:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-09-078' },
  { id: 'spp-201-4', student_id: 's201', academic_year_id: 'ay-2026', month: 'Oktober', nominal: 450000, status: 'Lunas', paid_date: '2026-10-10T12:00:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-10-092' },
  { id: 'spp-201-5', student_id: 's201', academic_year_id: 'ay-2026', month: 'November', nominal: 450000, status: 'Lunas', paid_date: '2026-11-02T08:00:00Z', payment_method: 'Transfer Bank', receipt_number: 'SPP-2026-11-011' },
];

export const SEED_FEE_ANNUAL_SUMMARY: FeeAnnualSummary[] = [
  { id: 'fas-1', student_id: 's101', academic_year_id: 'ay-2026', target_amount: 3500000, total_paid: 2500000, percentage_paid: 71.4, status: 'Sebagian' },
  { id: 'fas-2', student_id: 's201', academic_year_id: 'ay-2026', target_amount: 4000000, total_paid: 3000000, percentage_paid: 75.0, status: 'Sebagian' },
  { id: 'fas-3', student_id: 's301', academic_year_id: 'ay-2026', target_amount: 3500000, total_paid: 3500000, percentage_paid: 100.0, status: 'Lunas' },
  { id: 'fas-4', student_id: 's401', academic_year_id: 'ay-2026', target_amount: 3500000, total_paid: 1000000, percentage_paid: 28.5, status: 'Sebagian' },
];

export const SEED_FEE_ANNUAL_INSTALLMENTS: FeeAnnualInstallment[] = [
  { id: 'fai-1', student_id: 's101', installment_number: 1, nominal: 1500000, paid_date: '2026-07-05', payment_method: 'Transfer Bank', receipt_number: 'THN-2026-001', notes: 'Cicilan 1 Saat Daftar Ulang', proof_file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300' },
  { id: 'fai-2', student_id: 's101', installment_number: 2, nominal: 1000000, paid_date: '2026-09-15', payment_method: 'Transfer Bank', receipt_number: 'THN-2026-042', notes: 'Cicilan 2' },
  { id: 'fai-3', student_id: 's201', installment_number: 1, nominal: 2000000, paid_date: '2026-07-06', payment_method: 'Transfer Bank', receipt_number: 'THN-2026-003', notes: 'Cicilan 1' },
  { id: 'fai-4', student_id: 's201', installment_number: 2, nominal: 1000000, paid_date: '2026-10-18', payment_method: 'Transfer Bank', receipt_number: 'THN-2026-077', notes: 'Cicilan 2 via Telegram' },
  { id: 'fai-5', student_id: 's301', installment_number: 1, nominal: 3500000, paid_date: '2026-07-04', payment_method: 'Transfer Bank', receipt_number: 'THN-2026-002', notes: 'Pelunasan Penuh di Awal Tahun' },
];

export const SEED_FINANCE_TRANSACTIONS: FinanceTransaction[] = [
  { id: 'ft-1', transaction_number: 'TRX-2026-001', date: '2026-11-01', type: 'Pemasukan', pos_keuangan: 'Kas SPP / Operasional', category: 'Penerimaan SPP Bulan November', amount: 18900000, description: 'Rekap penerimaan SPP Kelas 1 - 6 awal bulan November', is_draft: false, recorded_by: 'u-nurul' },
  { id: 'ft-2', transaction_number: 'TRX-2026-002', date: '2026-11-03', type: 'Pengeluaran', pos_keuangan: 'Kas SPP / Operasional', category: 'Listrik & Internet Sekolah', amount: 2450000, description: 'Pembayaran tagihan PLN Pascabayar dan IndiHome sekolah', is_draft: false, recorded_by: 'u-nurul' },
  { id: 'ft-3', transaction_number: 'TRX-2026-003', date: '2026-10-25', type: 'Pemasukan', pos_keuangan: 'Dana BOS', category: 'Pencairan BOS Tahap 2', amount: 48600000, description: 'Penyaluran Dana BOS Reguler Kemendikbudristek Tahap 2 Tahun 2026', is_draft: false, recorded_by: 'u-nurul' },
  { id: 'ft-4', transaction_number: 'TRX-2026-004', date: '2026-10-28', type: 'Pengeluaran', pos_keuangan: 'Dana BOS', category: 'Pengadaan Buku Kurikulum Merdeka', amount: 14200000, description: 'Pembelian buku teks utama siswa dan pegangan guru kelas 1-6', is_draft: false, recorded_by: 'u-nurul' },
  { id: 'ft-5', transaction_number: 'TRX-2026-005', date: '2026-11-05', type: 'Pemasukan', pos_keuangan: 'Kas Kegiatan / Ekstrakurikuler', category: 'Iuran Peringatan Hari Pahlawan', amount: 4500000, description: 'Iuran kegiatan field trip & parade kostum Hari Pahlawan', is_draft: false, recorded_by: 'u-nurul' },
  // Automated draft from Sarpras ticket approved by Kepsek!
  { id: 'ft-draft-1', transaction_number: 'TRX-DRAFT-089', date: '2026-11-09', type: 'Pengeluaran', pos_keuangan: 'Kas SPP / Operasional', category: 'Perbaikan Sarpras Terjadwal', amount: 450000, description: '[DRAF OTOMATIS SARPRAS] Penggantian Kipas Angin Dinding Ruang Kelas 3 Rusak (Disetujui Kepala Sekolah)', is_draft: true, sarpras_ticket_id: 'tkt-001', recorded_by: 'u-nurul' },
];

export const SEED_LETTER_TEMPLATES: LetterTemplate[] = [
  { id: 'lt-1', code: 'UND', title: 'Surat Undangan Rapat / Wali Murid', numbering_format: '{nomor}/SD-KR/UND/{romawi}/{tahun}', body_template: 'Dengan hormat, sehubungan dengan agenda persiapan evaluasi tengah semester dan koordinasi program tahfidz siswa, kami mengundang Bapak/Ibu untuk hadir pada...' },
  { id: 'lt-2', code: 'KET', title: 'Surat Keterangan Aktif Siswa', numbering_format: '{nomor}/SD-KR/KET/{romawi}/{tahun}', body_template: 'Yang bertanda tangan di bawah ini Kepala SD Khoirur Rooziqiin Bandung menerangkan bahwa siswa tersebut di bawah ini benar-benar terdaftar aktif pada tahun ajaran...' },
  { id: 'lt-3', code: 'TGS', title: 'Surat Tugas Pembimbing / Guru', numbering_format: '{nomor}/SD-KR/ST/{romawi}/{tahun}', body_template: 'Memberikan tugas kepada guru/staf berikut untuk mewakili SD Khoirur Rooziqiin Bandung dalam rangka...' },
];

export const SEED_LETTER_ARCHIVES: LetterArchive[] = [
  { id: 'la-1', letter_number: '048/SD-KR/UND/XI/2026', letter_type: 'Keluar', category_code: 'UND', date: '2026-11-08', recipient_or_sender: 'Seluruh Wali Murid Kelas 1 - 6', subject: 'Undangan Parenting & Sosialisasi Pembiasaan Sholat Dhuha', body_content: 'Mengharap kehadiran orang tua siswa dalam rangka pembinaan karakter...', created_by: 'u-nurul' },
  { id: 'la-2', letter_number: '047/SD-KR/KET/XI/2026', letter_type: 'Keluar', category_code: 'KET', date: '2026-11-06', recipient_or_sender: 'Orang Tua Ahmad Fauzi', subject: 'Surat Keterangan Pendampingan Khusus Siswa', body_content: 'Menerangkan bahwa Ananda Ahmad Fauzi mendapatkan pendampingan guru bayang...', created_by: 'u-nurul' },
  { id: 'la-3', letter_number: '421.2/1204-Disdik/2026', letter_type: 'Masuk', category_code: 'DINAS', date: '2026-11-04', recipient_or_sender: 'Dinas Pendidikan Kota Bandung', subject: 'Himbauan Penguatan Literasi & Numerasi Berbasis PBT', file_url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=300', created_by: 'u-nurul' },
];

export const SEED_SARPRAS_ITEMS: SarprasItem[] = [
  { id: 'inv-k1-1', code: 'INV-K1-001', name: 'Meja & Kursi Siswa Kayu Solid', room_name: 'Kelas 1', quantity: 18, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-k1-2', code: 'INV-K1-002', name: 'Whiteboard Magnetik 120x240cm', room_name: 'Kelas 1', quantity: 1, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-k1-3', code: 'INV-K1-003', name: 'Kipas Angin Dinding Tornado', room_name: 'Kelas 1', quantity: 2, condition: 'Baik', last_checked_date: '2026-11-01' },

  { id: 'inv-k2-1', code: 'INV-K2-001', name: 'Meja Belajar Inklusif & Kursi Ergonomis', room_name: 'Kelas 2', quantity: 18, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-k2-2', code: 'INV-K2-002', name: 'Proyektor Epson EB-X500', room_name: 'Kelas 2', quantity: 1, condition: 'Baik', last_checked_date: '2026-11-01' },

  { id: 'inv-k3-1', code: 'INV-K3-001', name: 'Kipas Angin Dinding Cosmos (Kanan)', room_name: 'Kelas 3', quantity: 1, condition: 'Perlu Diganti', last_checked_date: '2026-11-08' },
  { id: 'inv-k3-2', code: 'INV-K3-002', name: 'Papan Tulis Whiteboard', room_name: 'Kelas 3', quantity: 1, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-k3-3', code: 'INV-K3-003', name: 'Lampu LED Philips 18W', room_name: 'Kelas 3', quantity: 4, condition: 'Rusak Ringan', last_checked_date: '2026-11-08' },

  { id: 'inv-rg-1', code: 'INV-RG-001', name: 'AC Split Daikin 1.5 PK', room_name: 'Ruang Guru', quantity: 2, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-ms-1', code: 'INV-MS-001', name: 'Karpet Sajadah Tebal Turki', room_name: 'Mushola', quantity: 6, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-ms-2', code: 'INV-MS-002', name: 'Sound System Wireless & Mic Sholat', room_name: 'Mushola', quantity: 1, condition: 'Baik', last_checked_date: '2026-11-01' },
  { id: 'inv-uks-1', code: 'INV-UKS-001', name: 'Tempat Tidur Pasien & Selimut Medis', room_name: 'UKS', quantity: 2, condition: 'Baik', last_checked_date: '2026-11-01' },
];

export const SEED_SARPRAS_TICKETS: SarprasTicket[] = [
  {
    id: 'tkt-001',
    ticket_number: 'TKT-2026-001',
    item_id: 'inv-k3-1',
    item_name: 'Kipas Angin Dinding Cosmos (Kanan)',
    room_name: 'Kelas 3',
    reported_by_id: 'u-maryam',
    reported_date: '2026-11-08T10:30:00Z',
    issue_description: 'Motor kipas bergetar keras dan keluar bau gosong saat dinyalakan lebih dari 10 menit. Khawatir korsleting.',
    photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300',
    status: 'Disetujui',
    estimated_cost: 450000,
    sarpras_notes: 'Rekomendasi ganti baru dengan merk Miyako Industrial Grade agar tahan menyala seharian.',
    approved_by_id: 'u-salman',
    approved_date: '2026-11-09T08:15:00Z',
    finance_transaction_id: 'ft-draft-1',
  },
  {
    id: 'tkt-002',
    ticket_number: 'TKT-2026-002',
    item_id: 'inv-k3-3',
    item_name: 'Lampu LED Philips 18W',
    room_name: 'Kelas 3',
    reported_by_id: 'u-maryam',
    reported_date: '2026-11-09T11:00:00Z',
    issue_description: '1 lampu bagian belakang berkedip-kedip dan mengganggu konsentrasi belajar siswa.',
    status: 'Menunggu Persetujuan Kepsek',
    estimated_cost: 65000,
    sarpras_notes: 'Tersedia stok cadangan bohlam di gudang TU, hanya perlu konfirmasi biaya penggantian starter/fitting.',
  },
];

export const SEED_PIKET_CHECKLIST: PiketLapanganChecklist = {
  id: 'plc-20261110',
  date: '2026-11-10',
  teacher_id: 'u-fatimah',
  sapa_pagi_completed: true,
  dhuha_supervised: true,
  tahfidz_orderliness: true,
  istirahat_patrol: false,
  facility_cleanliness_check: true,
  late_students_count: 2,
  late_students_notes: '1 siswa kelas 4 dan 1 siswa kelas 6 terlambat 7 menit karena hujan lokal di wilayah Antapani.',
  incident_notes: 'Kondisi gerbang dan mushola kondusif, siswa antre tertib saat berwudhu.',
};

export const SEED_GUEST_BOOK: GuestBookEntry[] = [
  {
    id: 'gb-1',
    date: '2026-11-10',
    time: '08:45',
    guest_name: 'H. Sudrajat, S.Sos.',
    institution_or_relation: 'Pengawas Bina SD Disdik Kota Bandung',
    purpose: 'Monitoring Rutin Pelaksanaan Kurikulum Merdeka & Sholat Dhuha Pagi',
    person_to_meet: 'Kepala Sekolah (Dr. H. Salman Farisi, M.Pd.)',
    phone_number: '08122001992',
    recorded_by_id: 'u-dedi',
  },
  {
    id: 'gb-2',
    date: '2026-11-09',
    time: '09:30',
    guest_name: 'Ibu Ratna Dewi',
    institution_or_relation: 'Orang Tua Murid Calon Peserta Didik Baru',
    purpose: 'Konsultasi Pendaftaran Kelas 1 Tahun Ajaran 2027/2028',
    person_to_meet: 'Tata Usaha (Ibu Nurul Hidayati)',
    phone_number: '081321456789',
    recorded_by_id: 'u-dedi',
  },
];
