import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'gold';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`p-3 rounded-xl shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-sm text-slate-600 leading-relaxed pt-1">
          {message}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'primary' ? 'primary' : variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
