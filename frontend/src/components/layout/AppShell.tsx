import React, { useState } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { Topbar } from './Topbar';
import { DatabaseModal } from './DatabaseModal';

interface AppShellProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  pageTitle: string;
  pageDescription?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  pageTitle,
  pageDescription,
  children,
}) => {
  const [dbModalOpen, setDbModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0d14] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          onOpenDatabaseSetup={() => setDbModalOpen(true)}
        />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Database Setup Modal */}
      <DatabaseModal isOpen={dbModalOpen} onClose={() => setDbModalOpen(false)} />
    </div>
  );
};
