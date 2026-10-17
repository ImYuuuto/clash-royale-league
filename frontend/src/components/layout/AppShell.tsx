import React from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { Topbar } from './Topbar';

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
  return (
    <div className="flex min-h-screen bg-[#f4f6fa] text-slate-800 antialiased selection:bg-blue-500/20 selection:text-blue-900">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
