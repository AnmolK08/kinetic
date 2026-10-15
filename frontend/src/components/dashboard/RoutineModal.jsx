import { useState } from 'react';
import { X, Plus, Trash2, Clock, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'MOVE', label: 'MOVE', color: 'var(--cyan)' },
  { id: 'FOCUS', label: 'FOCUS', color: 'var(--yellow)' },
  { id: 'ENERGY', label: 'ENERGY', color: 'var(--pink)' },
  { id: 'GENERAL', label: 'HABIT', color: 'var(--purple)' },
];

export default function RoutineModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState([
    {
      title: 'Hydrate & Morning Sunlight',
      startTime: '07:00',
      endTime: '07:15',
      category: 'ENERGY',
    },
    {
      title: '20 Min Mobility & Movement',
      startTime: '07:15',
      endTime: '07:35',
      category: 'MOVE',
    },
    {
      title: '90m Deep Focus Work Sprint',
      startTime: '09:00',
      endTime: '10:30',
      category: 'FOCUS',
    },
  ]);

  if (!isOpen) return null;

  const handleAddTaskField = () => {
    setTasks([
      ...tasks,
      {
        title: '',
        startTime: '08:00',
        endTime: '08:30',
        category: 'FOCUS',
      },
    ]);
  };

  const handleRemoveTaskField = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index, field, value) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Routine name is required');
      return;
    }

    // Filter valid tasks
    const validTasks = tasks
      .filter((t) => t.title.trim() !== '')
      .map((t) => ({
        title: t.title.trim(),
        startTime: t.startTime || '08:00',
        endTime: t.endTime || '08:30',
        category: t.category || 'FOCUS',
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      }));

    if (validTasks.length === 0) {
      toast.error('Please add at least one task to your routine');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      tasks: validTasks,
    });
  };

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
        style={{
          width: 'min(580px, calc(100% - 32px))',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <span className="panel-label">ROUTINE ARCHITECT</span>
        <h2 id="modal-title">Design Your Routine</h2>
        <p>Build a bulletproof sequence of habits to power your day.</p>

        <form onSubmit={handleSubmit}>
          {/* Routine Name */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                font: '700 12px "DM Mono", monospace',
                marginBottom: '6px',
                color: 'var(--ink-subtle)',
              }}
            >
              ROUTINE NAME *
            </label>
            <input
              type="text"
              placeholder="e.g., Morning Surge, Deep Focus Rhythm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              data-testid="routine-name-input"
              style={{ margin: 0 }}
            />
          </div>

          {/* Routine Description */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                font: '700 12px "DM Mono", monospace',
                marginBottom: '6px',
                color: 'var(--ink-subtle)',
              }}
            >
              DESCRIPTION (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="What state of mind or goal does this achieve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          {/* Routine Tasks */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <label
                style={{
                  font: '700 12px "DM Mono", monospace',
                  color: 'var(--ink-subtle)',
                }}
              >
                HABIT BLOCKS ({tasks.length})
              </label>

              <button
                type="button"
                onClick={handleAddTaskField}
                style={{
                  background: 'none',
                  border: 0,
                  color: 'var(--ink)',
                  font: '800 12px "Plus Jakarta Sans", sans-serif',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add habit</span>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '2px solid var(--ink)',
                    padding: '12px',
                    background: 'var(--paper)',
                    display: 'grid',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={`Habit #${idx + 1} title`}
                      value={task.title}
                      onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                      required
                      style={{
                        margin: 0,
                        flex: 1,
                        padding: '8px 10px',
                        fontSize: '13px',
                        background: 'var(--paper-card)',
                        color: 'var(--ink)',
                        border: '2px solid var(--ink)',
                      }}
                    />

                    <select
                      value={task.category}
                      onChange={(e) => handleTaskChange(idx, 'category', e.target.value)}
                      style={{
                        border: '2px solid var(--ink)',
                        padding: '8px',
                        font: 'inherit',
                        fontWeight: 700,
                        fontSize: '12px',
                        background: 'var(--paper-card)',
                        color: 'var(--ink)',
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id} style={{ background: 'var(--paper-card)', color: 'var(--ink)' }}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskField(idx)}
                        style={{
                          background: 'none',
                          border: 0,
                          color: 'var(--ink)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Remove habit"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} />
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>Start:</span>
                      <input
                        type="time"
                        value={task.startTime}
                        onChange={(e) => handleTaskChange(idx, 'startTime', e.target.value)}
                        required
                        style={{
                          margin: 0,
                          padding: '4px 6px',
                          fontSize: '12px',
                          width: 'auto',
                          background: 'var(--paper-card)',
                          color: 'var(--ink)',
                          border: '1.5px solid var(--ink)',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>End:</span>
                      <input
                        type="time"
                        value={task.endTime}
                        onChange={(e) => handleTaskChange(idx, 'endTime', e.target.value)}
                        required
                        style={{
                          margin: 0,
                          padding: '4px 6px',
                          fontSize: '12px',
                          width: 'auto',
                          background: 'var(--paper-card)',
                          color: 'var(--ink)',
                          border: '1.5px solid var(--ink)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="neo-button primary-button full-button"
            disabled={isSubmitting}
            data-testid="create-routine-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Creating Routine…</span>
              </>
            ) : (
              <span>Create Routine &amp; Activate</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
