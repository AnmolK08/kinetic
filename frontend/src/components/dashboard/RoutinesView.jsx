import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  CheckCircle2,
  Trash2,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronLeft,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchRoutines,
  activateRoutine,
  deleteRoutine,
  createRoutine,
  deleteTask,
  addTask,
  fetchSuggestions,
} from '@/lib/api';

const CATEGORY_TAGS = {
  MOVE: { label: 'MOVE', color: 'var(--cyan)' },
  FOCUS: { label: 'FOCUS', color: 'var(--yellow)' },
  ENERGY: { label: 'ENERGY', color: 'var(--pink)' },
  GENERAL: { label: 'HABIT', color: 'var(--purple)' },
};

export default function RoutinesView({ onBack, onOpenCreateModal }) {
  const qc = useQueryClient();
  const [addingTaskRoutineId, setAddingTaskRoutineId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('FOCUS');
  const [newTaskStartTime, setNewTaskStartTime] = useState('08:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('08:30');

  // ── Fetch user's routines ──
  const {
    data: routines = [],
    isLoading: routinesLoading,
  } = useQuery({
    queryKey: ['routines'],
    queryFn: fetchRoutines,
  });

  // ── Fetch routine recommendations & smart tips ──
  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 60_000,
  });

  // ── Activate routine mutation ──
  const activateMutation = useMutation({
    mutationFn: (routineId) => activateRoutine(routineId),
    onSuccess: (updated) => {
      toast.success(`"${updated.name}" is now your active routine!`);
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to activate routine'),
  });

  // ── Delete / archive routine mutation ──
  const deleteMutation = useMutation({
    mutationFn: (routineId) => deleteRoutine(routineId),
    onSuccess: () => {
      toast.success('Routine removed');
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete routine'),
  });

  // ── Delete single task mutation ──
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => {
      toast.success('Task removed');
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete task'),
  });

  // ── Add single task to routine mutation ──
  const addTaskMutation = useMutation({
    mutationFn: ({ routineId, taskData }) => addTask(routineId, taskData),
    onSuccess: () => {
      toast.success('Task added to routine!');
      setAddingTaskRoutineId(null);
      setNewTaskTitle('');
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to add task'),
  });

  // ── Quick adopt template routine ──
  const adoptTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const routine = await createRoutine({
        name: template.name,
        description: template.description,
        tasks: template.suggestedTasks.map((t) => ({
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          category: t.category,
          daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        })),
      });
      // Activate the newly created routine
      await activateRoutine(routine.id);
      return routine;
    },
    onSuccess: (routine) => {
      toast.success(`Adopted "${routine.name}" as active routine!`);
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to adopt template'),
  });

  const handleAddTaskSubmit = (e, routineId) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    addTaskMutation.mutate({
      routineId,
      taskData: {
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        startTime: newTaskStartTime,
        endTime: newTaskEndTime,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      },
    });
  };

  const templates = suggestionsData?.recommendations || [];
  const tips = suggestionsData?.tips || [];

  return (
    <div className="routines-view" data-testid="routines-view" style={{ display: 'grid', gap: '24px' }}>
      {/* ── Top Bar / Action ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="back-today"
          onClick={onBack}
          data-testid="routines-back-button"
        >
          <ChevronLeft size={17} strokeWidth={2.5} />
          <span>Back to today</span>
        </button>

        <button
          type="button"
          className="neo-button add-button"
          onClick={onOpenCreateModal}
          data-testid="create-new-routine-button"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New routine</span>
        </button>
      </div>

      {/* ── AI Smart Habit Tips (if available) ── */}
      {tips.length > 0 && (
        <div
          style={{
            border: '3px solid var(--ink)',
            background: 'var(--yellow)',
            color: '#171717',
            padding: '16px 20px',
            boxShadow: '4px 4px 0 #171717',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <Sparkles size={24} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ font: '800 11px "DM Mono", monospace', letterSpacing: '0.08em' }}>
              SMART HABIT INSIGHT
            </div>
            <div style={{ font: '700 14px "Plus Jakarta Sans", sans-serif', marginTop: '2px' }}>
              {tips[0]?.message}
            </div>
          </div>
        </div>
      )}

      {/* ── User's Routine Collection ── */}
      <div>
        <span className="panel-label">YOUR ROUTINE BLUEPRINTS</span>
        <h2 style={{ font: '800 28px "Space Grotesk", sans-serif', margin: '4px 0 18px' }}>
          Configured Routines
        </h2>

        {routinesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={32} className="spin-icon" />
          </div>
        ) : routines.length === 0 ? (
          <div
            className="neo-panel-card"
            style={{ textAlign: 'center', padding: '48px 24px' }}
          >
            <h3 style={{ font: '800 24px "Space Grotesk", sans-serif', margin: '0 0 8px' }}>
              No routines yet
            </h3>
            <p style={{ color: 'var(--ink-subtle)', maxWidth: '440px', margin: '0 auto 24px' }}>
              Create your custom routine or choose from science-backed templates below to jumpstart your daily rhythm.
            </p>
            <button
              type="button"
              className="neo-button primary-button"
              onClick={onOpenCreateModal}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create your first routine</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {routines.map((routine) => {
              const isActive = routine.isActive;
              const tasks = routine.tasks || [];
              const isAdding = addingTaskRoutineId === routine.id;

              return (
                <div
                  key={routine.id}
                  className="neo-panel-card"
                  style={{
                    border: isActive ? '3.5px solid var(--ink)' : '2.5px solid var(--ink)',
                    boxShadow: isActive ? '8px 8px 0 var(--cyan)' : 'var(--shadow)',
                    position: 'relative',
                  }}
                >
                  {/* Routine Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3
                          style={{
                            font: '800 24px "Space Grotesk", sans-serif',
                            margin: 0,
                          }}
                        >
                          {routine.name}
                        </h3>
                        {isActive ? (
                          <span
                            style={{
                              background: 'var(--cyan)',
                              color: '#171717',
                              border: '2px solid #171717',
                              padding: '3px 8px',
                              font: '800 10px "DM Mono", monospace',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={12} strokeWidth={3} />
                            ACTIVE FOR TODAY
                          </span>
                        ) : null}
                      </div>

                      {routine.description && (
                        <p style={{ color: 'var(--ink-subtle)', margin: '4px 0 0', fontSize: '14px' }}>
                          {routine.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!isActive && (
                        <button
                          type="button"
                          className="neo-button"
                          style={{
                            background: 'var(--paper)',
                            border: '2px solid var(--ink)',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => activateMutation.mutate(routine.id)}
                          disabled={activateMutation.isPending}
                        >
                          Activate
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Archive routine "${routine.name}"?`)) {
                            deleteMutation.mutate(routine.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 0,
                          color: 'var(--ink-subtle)',
                          cursor: 'pointer',
                          padding: '6px',
                        }}
                        title="Delete routine"
                        aria-label="Delete routine"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Tasks List within Routine */}
                  <div style={{ borderTop: '2px solid var(--ink)', paddingTop: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span className="panel-label">
                        ROUTINE TASKS ({tasks.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setAddingTaskRoutineId(isAdding ? null : routine.id)}
                        style={{
                          background: 'none',
                          border: 0,
                          color: 'var(--ink)',
                          font: '700 12px "Plus Jakarta Sans", sans-serif',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>{isAdding ? 'Cancel' : 'Add task'}</span>
                      </button>
                    </div>

                    {/* Inline Task Form */}
                    {isAdding && (
                      <form
                        onSubmit={(e) => handleAddTaskSubmit(e, routine.id)}
                        style={{
                          border: '2px dashed var(--ink)',
                          padding: '14px',
                          background: 'var(--paper)',
                          marginBottom: '14px',
                          display: 'grid',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Task title (e.g., 20m Morning Run)"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            required
                            style={{
                              flex: 1,
                              minWidth: '200px',
                              border: '2px solid var(--ink)',
                              padding: '8px 12px',
                              font: 'inherit',
                              background: 'var(--paper-card)',
                              color: 'var(--ink)',
                            }}
                          />
                          <select
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value)}
                            style={{
                              border: '2px solid var(--ink)',
                              padding: '8px 10px',
                              font: 'inherit',
                              fontWeight: 700,
                              background: 'var(--paper-card)',
                              color: 'var(--ink)',
                            }}
                          >
                            <option value="MOVE">MOVE</option>
                            <option value="FOCUS">FOCUS</option>
                            <option value="ENERGY">ENERGY</option>
                            <option value="GENERAL">HABIT</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Start:</span>
                            <input
                              type="time"
                              value={newTaskStartTime}
                              onChange={(e) => setNewTaskStartTime(e.target.value)}
                              required
                              style={{
                                border: '2px solid var(--ink)',
                                padding: '4px 8px',
                                font: 'inherit',
                                background: 'var(--paper-card)',
                                color: 'var(--ink)',
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>End:</span>
                            <input
                              type="time"
                              value={newTaskEndTime}
                              onChange={(e) => setNewTaskEndTime(e.target.value)}
                              required
                              style={{
                                border: '2px solid var(--ink)',
                                padding: '4px 8px',
                                font: 'inherit',
                                background: 'var(--paper-card)',
                                color: 'var(--ink)',
                              }}
                            />
                          </div>

                          <button
                            type="submit"
                            className="neo-button"
                            disabled={addTaskMutation.isPending}
                            style={{
                              marginLeft: 'auto',
                              background: 'var(--yellow)',
                              color: '#171717',
                              border: '2px solid #171717',
                              padding: '6px 14px',
                              fontWeight: 800,
                              fontSize: '12px',
                            }}
                          >
                            Save Task
                          </button>
                        </div>
                      </form>
                    )}

                    {tasks.length === 0 ? (
                      <p style={{ color: 'var(--ink-subtle)', fontSize: '13px', margin: '8px 0' }}>
                        No tasks in this routine yet. Add tasks above to populate daily logs.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {tasks.map((task) => {
                          const catInfo = CATEGORY_TAGS[task.category?.toUpperCase()] || CATEGORY_TAGS.GENERAL;

                          return (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'var(--paper)',
                                border: '1.5px solid var(--ink)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    background: catInfo.color,
                                    color: '#171717',
                                    border: '1.5px solid #171717',
                                    padding: '2px 6px',
                                    font: '800 10px "DM Mono", monospace',
                                  }}
                                >
                                  {catInfo.label}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: '14px' }}>
                                  {task.title}
                                </span>
                                <span
                                  style={{
                                    font: '500 12px "DM Mono", monospace',
                                    color: 'var(--ink-subtle)',
                                  }}
                                >
                                  {task.startTime} – {task.endTime}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                style={{
                                  background: 'none',
                                  border: 0,
                                  color: 'var(--ink-subtle)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                }}
                                title="Delete task"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AI Routine Recommendations ── */}
      {templates.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <span className="panel-label">INTELLIGENT TEMPLATES</span>
          <h2 style={{ font: '800 24px "Space Grotesk", sans-serif', margin: '4px 0 16px' }}>
            Recommended Routine Blueprints
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="neo-panel-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '2.5px solid var(--ink)',
                }}
              >
                <div>
                  <span
                    style={{
                      background:
                        tpl.category === 'ENERGY'
                          ? 'var(--pink)'
                          : tpl.category === 'FOCUS'
                          ? 'var(--yellow)'
                          : 'var(--cyan)',
                      color: '#171717',
                      border: '1.5px solid #171717',
                      padding: '2px 8px',
                      font: '800 10px "DM Mono", monospace',
                    }}
                  >
                    {tpl.category}
                  </span>
                  <h4
                    style={{
                      font: '800 20px "Space Grotesk", sans-serif',
                      margin: '10px 0 6px',
                    }}
                  >
                    {tpl.name}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--ink-subtle)', margin: '0 0 14px' }}>
                    {tpl.description}
                  </p>

                  <div style={{ display: 'grid', gap: '6px', marginBottom: '16px' }}>
                    {tpl.suggestedTasks.map((st, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--ink)',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ color: 'var(--ink-subtle)', font: '600 11px "DM Mono", monospace' }}>
                          {st.startTime}
                        </span>
                        <span>{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="neo-button"
                  style={{
                    width: '100%',
                    background: 'var(--paper)',
                    border: '2px solid var(--ink)',
                    padding: '8px',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={() => adoptTemplateMutation.mutate(tpl)}
                  disabled={adoptTemplateMutation.isPending}
                >
                  <span>Adopt Blueprint</span>
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
