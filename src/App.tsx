import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardBersama } from './components/dashboard/DashboardBersama';
import { GuruModule } from './components/guru/GuruModule';
import { ShadowTeacherModule } from './components/shadow/ShadowTeacherModule';
import { PiketModule } from './components/piket/PiketModule';
import { AdminFinanceModule } from './components/admin/AdminFinanceModule';
import { SarprasModule } from './components/sarpras/SarprasModule';
import { KepsekModule } from './components/kepsek/KepsekModule';
import { DeveloperModule } from './components/developer/DeveloperModule';
import { TelegramBotSimulator } from './components/telegram/TelegramBotSimulator';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="flex-1 min-w-0 bg-[#F8FAFC] p-4 lg:p-6 overflow-y-auto max-h-[calc(100vh-65px)]">
      {activeTab === 'dashboard_bersama' && <DashboardBersama />}
      {activeTab === 'guru_akademik' && <GuruModule />}
      {activeTab === 'shadow_teacher' && <ShadowTeacherModule />}
      {activeTab === 'piket' && <PiketModule />}
      {activeTab === 'administrator_finance' && <AdminFinanceModule />}
      {activeTab === 'sarpras' && <SarprasModule />}
      {activeTab === 'kepala_sekolah' && <KepsekModule />}
      {activeTab === 'developer_mode' && <DeveloperModule />}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
        <TelegramBotSimulator />
      </div>
    </AppProvider>
  );
}

export default App;
