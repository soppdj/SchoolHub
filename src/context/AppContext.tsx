import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  UserProfile,
  UserRole,
  SchoolClass,
  Student,
  MasterScheduleItem,
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
  PiketSchedule,
  PiketLapanganChecklist,
  GuestBookEntry,
  PrincipalAgendaItem,
} from '../types';
import { db, initializeLocalDatabase, flushOfflineSyncQueue } from '../lib/db';
import { realtimeHub, RealtimeEvent, isFirebaseConfigured, firestore } from '../lib/firebase';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  allStaff: UserProfile[];
  activeRoles: UserRole[];
  toggleActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  networkStatus: 'online' | 'offline' | 'syncing';
  triggerSync: () => Promise<void>;
  pendingSyncCount: number;

  // Master Data
  classes: SchoolClass[];
  students: Student[];
  schedules: MasterScheduleItem[];
  staffAttendance: StaffAttendance[];
  teachingJournals: TeachingJournal[];
  shadowJournals: ShadowTeacherJournal[];
  tahfidzProgress: TahfidzProgress[];
  kurikulumTps: KurikulumTP[];
  studentGrades: StudentGrade[];
  feeSppRecords: FeeSppRecord[];
  feeAnnualSummaries: FeeAnnualSummary[];
  feeAnnualInstallments: FeeAnnualInstallment[];
  financeTransactions: FinanceTransaction[];
  letterTemplates: LetterTemplate[];
  letterArchives: LetterArchive[];
  sarprasItems: SarprasItem[];
  sarprasTickets: SarprasTicket[];
  piketSchedules: PiketSchedule[];
  piketChecklists: PiketLapanganChecklist[];
  guestBookEntries: GuestBookEntry[];
  principalAgendas: PrincipalAgendaItem[];

  // Live simulation states for Dashboard Bersama
  simulatedTime: string; // e.g. "08:40"
  setSimulatedTime: (time: string) => void;
  simulatedDay: number; // 1 to 5
  setSimulatedDay: (day: number) => void;
  isSimulatingRedState: boolean;
  setIsSimulatingRedState: (val: boolean) => void;

  // Telegram Drawer
  isTelegramDrawerOpen: boolean;
  setIsTelegramDrawerOpen: (val: boolean) => void;

  // Actions
  recordTeachingJournal: (journal: Omit<TeachingJournal, 'id' | 'created_at'>) => Promise<void>;
  recordShadowJournal: (journal: Omit<ShadowTeacherJournal, 'id' | 'created_at'>) => Promise<void>;
  assignSubstituteTeacher: (classId: string, scheduleId: string, substituteTeacherId: string) => Promise<void>;
  reportSarprasTicket: (ticket: Omit<SarprasTicket, 'id' | 'ticket_number' | 'reported_date' | 'status'>) => Promise<void>;
  approveSarprasTicket: (ticketId: string, estimatedCost: number) => Promise<void>;
  rejectSarprasTicket: (ticketId: string, reason: string) => Promise<void>;
  settleFinanceDraft: (transactionId: string, pos: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeRoles, setActiveRoles] = useState<UserRole[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard_bersama');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isTelegramDrawerOpen, setIsTelegramDrawerOpen] = useState<boolean>(false);

  // Live Simulation state
  const [simulatedTime, setSimulatedTime] = useState<string>('08:35');
  const [simulatedDay, setSimulatedDay] = useState<number>(2); // 2 = Tuesday / Selasa
  const [isSimulatingRedState, setIsSimulatingRedState] = useState<boolean>(false);

  // Initialize database
  useEffect(() => {
    initializeLocalDatabase();
  }, []);

  // Network online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('syncing');
      flushOfflineSyncQueue().then(() => {
        setNetworkStatus('online');
      });
    };
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live queries from Dexie.js
  const allStaff = useLiveQuery(() => db.profiles.toArray()) || [];
  const classes = useLiveQuery(() => db.classes.orderBy('grade_level').toArray()) || [];
  const students = useLiveQuery(() => db.students.toArray()) || [];
  const schedules = useLiveQuery(() => db.schedules.toArray()) || [];
  const staffAttendance = useLiveQuery(() => db.staff_attendance.toArray()) || [];
  const teachingJournals = useLiveQuery(() => db.teaching_journals.toArray()) || [];
  const shadowJournals = useLiveQuery(() => db.shadow_journals.toArray()) || [];
  const tahfidzProgress = useLiveQuery(() => db.tahfidz_progress.toArray()) || [];
  const kurikulumTps = useLiveQuery(() => db.kurikulum_tp.toArray()) || [];
  const studentGrades = useLiveQuery(() => db.student_grades.toArray()) || [];
  const feeSppRecords = useLiveQuery(() => db.fee_spp.toArray()) || [];
  const feeAnnualSummaries = useLiveQuery(() => db.fee_annual_summary.toArray()) || [];
  const feeAnnualInstallments = useLiveQuery(() => db.fee_annual_installments.toArray()) || [];
  const financeTransactions = useLiveQuery(() => db.finance_transactions.toArray()) || [];
  const letterTemplates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const letterArchives = useLiveQuery(() => db.letter_archives.toArray()) || [];
  const sarprasItems = useLiveQuery(() => db.sarpras_items.toArray()) || [];
  const sarprasTickets = useLiveQuery(() => db.sarpras_tickets.toArray()) || [];
  const piketSchedules = useLiveQuery(() => db.piket_schedules.toArray()) || [];
  const piketChecklists = useLiveQuery(() => db.piket_checklists.toArray()) || [];
  const guestBookEntries = useLiveQuery(() => db.guest_book.toArray()) || [];
  const principalAgendas = useLiveQuery(() => db.principal_agenda.toArray()) || [];

  // Update pending sync count
  useEffect(() => {
    db.offline_sync_queue.where('synced').equals(0).count().then(count => {
      setPendingSyncCount(count);
    });
  }, [teachingJournals, shadowJournals, sarprasTickets, financeTransactions]);

  // Set default current user once staff is loaded
  useEffect(() => {
    if (allStaff.length > 0 && !currentUser) {
      // Default to Developer/Guru Mapel or Kepala Sekolah
      const dev = allStaff.find(s => s.roles.includes('Developer')) || allStaff[0];
      setCurrentUser(dev);
      setActiveRoles(dev.roles);
    }
  }, [allStaff, currentUser]);

  // When user changes, sync their active roles
  const handleSetCurrentUser = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveRoles(user.roles);
  };

  // Additive multi-role toggle
  const toggleActiveRole = (role: UserRole) => {
    setActiveRoles(prev => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const triggerSync = async () => {
    setNetworkStatus('syncing');
    await flushOfflineSyncQueue();
    setTimeout(() => {
      setNetworkStatus('online');
      setPendingSyncCount(0);
    }, 600);
  };

  // 1. Record Teaching Journal (Instantly flips panel to Green)
  const recordTeachingJournal = async (journalData: Omit<TeachingJournal, 'id' | 'created_at'>) => {
    const id = `tj-${Date.now()}`;
    const newJournal: TeachingJournal = {
      ...journalData,
      id,
      created_at: new Date().toISOString(),
    };
    await db.teaching_journals.put(newJournal);
    realtimeHub.broadcast({
      table: 'teaching_journals',
      eventType: 'INSERT',
      newRecord: newJournal,
    });
  };

  // 2. Record Shadow Teacher Journal
  const recordShadowJournal = async (journalData: Omit<ShadowTeacherJournal, 'id' | 'created_at'>) => {
    const id = `sh-${Date.now()}`;
    const newJournal: ShadowTeacherJournal = {
      ...journalData,
      id,
      created_at: new Date().toISOString(),
    };
    await db.shadow_journals.put(newJournal);
    realtimeHub.broadcast({
      table: 'shadow_journals',
      eventType: 'INSERT',
      newRecord: newJournal,
    });
  };

  // 3. Assign Substitute Teacher (Red panel -> Green with Guru Pengganti)
  const assignSubstituteTeacher = async (classId: string, scheduleId: string, substituteTeacherId: string) => {
    const sched = schedules.find(s => s.id === scheduleId) || {
      subject_name: 'Pelajaran Terjadwal',
      period_number: 2,
    };
    const id = `tj-sub-${Date.now()}`;
    const newJournal: TeachingJournal = {
      id,
      schedule_id: scheduleId,
      class_id: classId,
      date: '2026-11-10',
      period_number: sched.period_number,
      subject_name: sched.subject_name,
      teacher_id: substituteTeacherId,
      is_substitute: true,
      original_teacher_id: 'teacher_id' in sched ? sched.teacher_id : undefined,
      topic: 'Pendampingan & Pembahasan Tugas oleh Guru Pengganti',
      learning_activity: 'Membahas modul latihan dan penugasan mandiri terbimbing.',
      notes: 'Ditugaskan oleh Guru Piket Lapangan karena guru utama berhalangan.',
      present_count: 18,
      sick_count: 0,
      permitted_count: 0,
      absent_count: 0,
      created_at: new Date().toISOString(),
    };
    await db.teaching_journals.put(newJournal);
    realtimeHub.broadcast({
      table: 'teaching_journals',
      eventType: 'INSERT',
      newRecord: newJournal,
    });
  };

  // 4. Report Sarpras Ticket
  const reportSarprasTicket = async (ticketData: Omit<SarprasTicket, 'id' | 'ticket_number' | 'reported_date' | 'status'>) => {
    const id = `tkt-${Date.now().toString().slice(-4)}`;
    const ticketNo = `TKT-2026-${Date.now().toString().slice(-4)}`;
    const newTicket: SarprasTicket = {
      ...ticketData,
      id,
      ticket_number: ticketNo,
      reported_date: new Date().toISOString(),
      status: 'Dilaporkan',
    };
    await db.sarpras_tickets.put(newTicket);
    // Also update item condition
    const item = sarprasItems.find(i => i.id === ticketData.item_id);
    if (item) {
      await db.sarpras_items.update(item.id, { condition: 'Perlu Diganti' });
    }
    realtimeHub.broadcast({
      table: 'sarpras_tickets',
      eventType: 'INSERT',
      newRecord: newTicket,
    });
  };

  // 5. Approve Sarpras Ticket (Kepsek approves -> AUTOMATICALLY creates Draft Expense in Administrator module!)
  const approveSarprasTicket = async (ticketId: string, estimatedCost: number) => {
    const ticket = sarprasTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Create Draft Expense
    const draftId = `ft-draft-${Date.now()}`;
    const draftNumber = `TRX-DRAFT-${Date.now().toString().slice(-4)}`;
    const newDraft: FinanceTransaction = {
      id: draftId,
      transaction_number: draftNumber,
      date: new Date().toISOString().slice(0, 10),
      type: 'Pengeluaran',
      pos_keuangan: 'Kas SPP / Operasional',
      category: 'Perbaikan Sarpras Terjadwal',
      amount: estimatedCost,
      description: `[DRAF OTOMATIS SARPRAS] ${ticket.item_name} di ${ticket.room_name} (Disetujui Kepala Sekolah)`,
      is_draft: true,
      sarpras_ticket_id: ticketId,
      recorded_by: currentUser?.id || 'u-nurul',
    };

    await db.finance_transactions.put(newDraft);

    // Update ticket status
    await db.sarpras_tickets.update(ticketId, {
      status: 'Disetujui',
      estimated_cost: estimatedCost,
      approved_by_id: currentUser?.id || 'u-salman',
      approved_date: new Date().toISOString(),
      finance_transaction_id: draftId,
    });

    realtimeHub.broadcast({
      table: 'sarpras_tickets',
      eventType: 'UPDATE',
      newRecord: { id: ticketId, status: 'Disetujui' },
    });
    realtimeHub.broadcast({
      table: 'finance_transactions',
      eventType: 'INSERT',
      newRecord: newDraft,
    });
  };

  // Reject ticket
  const rejectSarprasTicket = async (ticketId: string, reason: string) => {
    await db.sarpras_tickets.update(ticketId, {
      status: 'Ditolak',
      sarpras_notes: `Ditolak Kepala Sekolah: ${reason}`,
    });
    realtimeHub.broadcast({
      table: 'sarpras_tickets',
      eventType: 'UPDATE',
      newRecord: { id: ticketId, status: 'Ditolak' },
    });
  };

  // 6. Settle Finance Draft (Administrator selects POS and confirms)
  const settleFinanceDraft = async (transactionId: string, pos: any) => {
    await db.finance_transactions.update(transactionId, {
      pos_keuangan: pos,
      is_draft: false,
      transaction_number: `TRX-${Date.now().toString().slice(-6)}`,
    });
    realtimeHub.broadcast({
      table: 'finance_transactions',
      eventType: 'UPDATE',
      newRecord: { id: transactionId, is_draft: false },
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F2942] text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-school-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-lg font-bold">School Hub — SD Khoirur Rooziqiin Bandung</h2>
          <p className="text-xs text-slate-300">Memuat data dan inisialisasi offline cache...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        allStaff,
        activeRoles,
        toggleActiveRole,
        activeTab,
        setActiveTab,
        networkStatus,
        triggerSync,
        pendingSyncCount,
        classes,
        students,
        schedules,
        staffAttendance,
        teachingJournals,
        shadowJournals,
        tahfidzProgress,
        kurikulumTps,
        studentGrades,
        feeSppRecords,
        feeAnnualSummaries,
        feeAnnualInstallments,
        financeTransactions,
        letterTemplates,
        letterArchives,
        sarprasItems,
        sarprasTickets,
        piketSchedules,
        piketChecklists,
        guestBookEntries,
        principalAgendas,
        simulatedTime,
        setSimulatedTime,
        simulatedDay,
        setSimulatedDay,
        isSimulatingRedState,
        setIsSimulatingRedState,
        isTelegramDrawerOpen,
        setIsTelegramDrawerOpen,
        recordTeachingJournal,
        recordShadowJournal,
        assignSubstituteTeacher,
        reportSarprasTicket,
        approveSarprasTicket,
        rejectSarprasTicket,
        settleFinanceDraft,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
