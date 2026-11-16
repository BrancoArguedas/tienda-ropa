import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Field';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  withComment?: boolean;
  loading?: boolean;
  onConfirm: (comment?: string) => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, tone = 'primary', withComment, loading, onConfirm, onClose }: ConfirmDialogProps) {
  const [comment, setComment] = useState('');

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-soft">{message}</p>
      {withComment && (
        <div className="mt-4">
          <label htmlFor="confirm-comment" className="field-label">Comentario (opcional)</label>
          <Textarea id="confirm-comment" rows={3} value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder="Ej: pagó por transferencia" />
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Volver</Button>
        <Button variant={tone} loading={loading} onClick={() => onConfirm(comment.trim() || undefined)}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
