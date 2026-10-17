import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Database, Server, Check, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useTournament } from '../../context/TournamentContext';

export interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const { showNotification } = useNotifications();
  const { refreshAll } = useTournament();

  const [settings, setSettings] = useState({
    DB_HOST: 'localhost',
    DB_PORT: '3306',
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'cr_league',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (window.desktop && isOpen) {
      window.desktop.getDatabaseSettings().then((saved) => {
        if (saved) {
          setSettings((prev) => ({
            ...prev,
            ...saved,
          }));
        }
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!window.desktop) {
      setErrorMessage(
        'Database credentials saving via IPC is only active in the Electron Desktop App. For browser dev, configure backend/.env.'
      );
      showNotification('warning', 'Web Mode Detected', 'Database settings are managed by backend/.env when running outside Electron.');
      return;
    }

    setLoading(true);
    try {
      const res = await window.desktop.saveDatabaseSettings(settings);
      if (!res.success) {
        setErrorMessage(res.message || 'Could not connect to MySQL.');
        showNotification('error', 'Database Connection Failed', res.message);
      } else {
        showNotification('success', 'Connected', 'MySQL settings saved and verified successfully.');
        await refreshAll();
        onClose();
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MySQL Database Configuration"
      description="Configure local MySQL parameters for the CR League Manager Express server."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <Database className="w-4 h-4" />
            <span>Local Database Storage</span>
          </div>
          <p>
            Credentials are securely written to your local Electron <code>userData/database.json</code> and passed to the backend process.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">HOST</label>
            <input
              type="text"
              required
              value={settings.DB_HOST}
              onChange={(e) => setSettings({ ...settings, DB_HOST: e.target.value })}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">PORT</label>
            <input
              type="number"
              required
              min={1}
              max={65535}
              value={settings.DB_PORT}
              onChange={(e) => setSettings({ ...settings, DB_PORT: e.target.value })}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="3306"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">USERNAME</label>
            <input
              type="text"
              required
              value={settings.DB_USER}
              onChange={(e) => setSettings({ ...settings, DB_USER: e.target.value })}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="root"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">PASSWORD</label>
            <input
              type="password"
              value={settings.DB_PASSWORD}
              onChange={(e) => setSettings({ ...settings, DB_PASSWORD: e.target.value })}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">DATABASE NAME</label>
          <input
            type="text"
            required
            value={settings.DB_NAME}
            onChange={(e) => setSettings({ ...settings, DB_NAME: e.target.value })}
            className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            placeholder="cr_league"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} icon={<Check className="w-4 h-4" />}>
            Save & Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
};
