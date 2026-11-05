import Modal from './Modal.jsx';

export default function ConfirmationDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel, loading = false, children }) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {children}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}
