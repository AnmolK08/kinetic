import { X } from 'lucide-react';

export default function RoutineModal({
  isOpen,
  onClose,
  onSubmit,
  newTask,
  setNewTask,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="routine-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <span className="panel-label">NEW ROUTINE</span>
        <h2 id="modal-title">What will you do?</h2>
        <p>Pick one small action you can easily repeat tomorrow.</p>

        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="e.g., Read 10 pages, Drink 500ml water"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            autoFocus
            required
            data-testid="new-task-input"
          />

          <button
            type="submit"
            className="neo-button primary-button full-button"
            data-testid="create-routine-button"
          >
            Add to today&apos;s routine
          </button>
        </form>
      </div>
    </div>
  );
}
