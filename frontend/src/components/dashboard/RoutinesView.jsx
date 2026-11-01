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
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchRoutines,
  activateRoutine,
  deleteRoutine,
  createRoutine,
  deleteTask,
  addTask,
  updateTask,
  fetchSuggestions,
} from '@/lib/api';
import DayPicker from '@/components/common/DayPicker';
import { ALL_DAYS, formatDaysOfWeek } from '@/lib/dates';

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
  const [newTaskDaysOfWeek, setNewTaskDaysOfWeek] = useState(ALL_DAYS);

  // Editing habit state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskForm, setEditingTaskForm] = useState(null);

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
      void qc.invalidateQueries({ queryKey: ['monthly-analytics'] });
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
      void qc.invalidateQueries({ queryKey: ['monthly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete routine'),
  });

  // ── Delete single task mutation ──
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => {
      toast.success('Habit removed');
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
      void qc.invalidateQueries({ queryKey: ['monthly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to delete task'),
  });

  // ── Add single task to routine mutation ──
  const addTaskMutation = useMutation({
    mutationFn: ({ routineId, taskData }) => addTask(routineId, taskData),
    onSuccess: () => {
      toast.success('Habit added to routine!');
      setAddingTaskRoutineId(null);
      setNewTaskTitle('');
      setNewTaskDaysOfWeek(ALL_DAYS);
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
      void qc.invalidateQueries({ queryKey: ['monthly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to add task'),
  });

  // ── Update single task mutation ──
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, taskData }) => updateTask(taskId, taskData),
    onSuccess: () => {
      toast.success('Habit updated!');
      setEditingTaskId(null);
      setEditingTaskForm(null);
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
      void qc.invalidateQueries({ queryKey: ['monthly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update habit'),
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
          daysOfWeek: ALL_DAYS,
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
      void qc.invalidateQueries({ queryKey: ['monthly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to adopt template'),
  });

  const handleAddTaskSubmit = (e, routineId) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!newTaskDaysOfWeek || newTaskDaysOfWeek.length === 0) {
      toast.error('Please select at least one day for this habit');
      return;
    }
    addTaskMutation.mutate({
      routineId,
      taskData: {
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        startTime: newTaskStartTime,
        endTime: newTaskEndTime,
        daysOfWeek: newTaskDaysOfWeek,
      },
    });
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskForm({
      title: task.title,
      category: task.category || 'GENERAL',
      startTime: task.startTime || '08:00',
      endTime: task.endTime || '08:30',
      daysOfWeek: Array.isArray(task.daysOfWeek) && task.daysOfWeek.length > 0 ? task.daysOfWeek : ALL_DAYS,
    });
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editingTaskForm.title.trim()) {
      toast.error('Habit title cannot be empty');
      return;
    }
    if (!editingTaskForm.daysOfWeek || editingTaskForm.daysOfWeek.length === 0) {
      toast.error('Please select at least one day for this habit');
      return;
    }
    updateTaskMutation.mutate({
      taskId: editingTaskId,
      taskData: {
        title: editingTaskForm.title.trim(),
        category: editingTaskForm.category,
        startTime: editingTaskForm.startTime,
        endTime: editingTaskForm.endTime,
        daysOfWeek: editingTaskForm.daysOfWeek,
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
                    border: isActive ? '3.5px solid var(--border-color, #171717)' : '2.5px solid var(--border-color, #171717)',
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
                            background: 'var(--yellow)',
                            color: '#171717',
                            border: '2px solid var(--ink)',
                            boxShadow: '3px 3px 0 var(--ink)',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: 800,
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
                  <div style={{ borderTop: '2px solid var(--ink)', paddingTop: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            font: '800 17px "Space Grotesk", sans-serif',
                            margin: 0,
                            letterSpacing: '-0.02em',
                            color: 'var(--ink)',
                          }}
                        >
                          Routine Habits ({tasks.length})
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-subtle)' }}>
                          Add, edit, or delete individual habits inside this schedule
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(null);
                          setAddingTaskRoutineId(isAdding ? null : routine.id);
                        }}
                        style={{
                          background: isAdding ? 'var(--paper-card)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1.5px solid var(--ink)',
                          color: 'var(--ink)',
                          font: '700 12px "Plus Jakarta Sans", sans-serif',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>{isAdding ? 'Cancel' : 'Add Habit'}</span>
                      </button>
                    </div>

                    {/* Inline Add Habit Form */}
                    {isAdding && (
                      <form
                        onSubmit={(e) => handleAddTaskSubmit(e, routine.id)}
                        style={{
                          border: '2px solid var(--ink)',
                          boxShadow: 'var(--shadow-sm)',
                          padding: '16px 20px',
                          background: 'var(--paper)',
                          marginBottom: '14px',
                          display: 'grid',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '800 14px "Space Grotesk", sans-serif', color: 'var(--ink)' }}>
                            <Plus size={16} strokeWidth={2.5} />
                            <span>Add New Habit</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddingTaskRoutineId(null)}
                            style={{ background: 'none', border: 0, color: 'var(--ink-subtle)', cursor: 'pointer', padding: '2px' }}
                            aria-label="Cancel adding habit"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Habit title (e.g., Morning Wakeup)"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            required
                            style={{
                              flex: 2,
                              minWidth: '200px',
                              border: '2px solid var(--ink)',
                              background: 'var(--paper-card)',
                              color: 'var(--ink)',
                              padding: '8px 12px',
                              font: 'inherit',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          />
                          <select
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value)}
                            style={{
                              flex: 1,
                              minWidth: '160px',
                              border: '2px solid var(--ink)',
                              background: 'var(--paper-card)',
                              color: 'var(--ink)',
                              padding: '8px 12px',
                              font: 'inherit',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            <option value="MOVE">Health & Nutrition</option>
                            <option value="FOCUS">Deep Focus & Work</option>
                            <option value="ENERGY">Energy & Recovery</option>
                            <option value="GENERAL">General Habit</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              border: '2px solid var(--ink)',
                              padding: '4px 10px',
                              background: 'var(--paper-card)',
                            }}
                          >
                            <Clock size={14} color="var(--ink-subtle)" />
                            <input
                              type="time"
                              value={newTaskStartTime}
                              onChange={(e) => setNewTaskStartTime(e.target.value)}
                              required
                              style={{
                                border: 0,
                                background: 'transparent',
                                color: 'var(--ink)',
                                fontFamily: '"DM Mono", monospace',
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: 0,
                                margin: 0,
                              }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-subtle)', fontFamily: '"DM Mono", monospace' }}>
                              TO
                            </span>
                            <input
                              type="time"
                              value={newTaskEndTime}
                              onChange={(e) => setNewTaskEndTime(e.target.value)}
                              required
                              style={{
                                border: 0,
                                background: 'transparent',
                                color: 'var(--ink)',
                                fontFamily: '"DM Mono", monospace',
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: 0,
                                margin: 0,
                              }}
                            />
                            <Clock size={14} color="var(--ink-subtle)" />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <DayPicker
                              selectedDays={newTaskDaysOfWeek}
                              onChange={setNewTaskDaysOfWeek}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setAddingTaskRoutineId(null)}
                            style={{
                              background: 'none',
                              border: 0,
                              color: 'var(--ink-subtle)',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '6px 12px',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addTaskMutation.isPending}
                            className="neo-button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--yellow)',
                              color: '#171717',
                              border: '2px solid var(--ink)',
                              boxShadow: '3px 3px 0 var(--ink)',
                              padding: '7px 16px',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={14} strokeWidth={3} />
                            <span>Save Habit</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {tasks.length === 0 ? (
                      <p style={{ color: 'var(--ink-subtle)', fontSize: '13px', margin: '8px 0' }}>
                        No habits in this routine yet. Add habits above to populate daily logs.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {tasks.map((task) => {
                          const catInfo = CATEGORY_TAGS[task.category?.toUpperCase()] || CATEGORY_TAGS.GENERAL;
                          const isEditing = editingTaskId === task.id;

                          if (isEditing && editingTaskForm) {
                            return (
                              <div
                                key={task.id}
                                className="editing-habit-card"
                                style={{
                                  border: '2px solid var(--ink)',
                                  boxShadow: 'var(--shadow-sm)',
                                  padding: '16px 20px',
                                  background: 'var(--paper)',
                                  display: 'grid',
                                  gap: '12px',
                                }}
                              >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', font: '800 14px "Space Grotesk", sans-serif', color: 'var(--ink)' }}>
                                    <Pencil size={15} strokeWidth={2.5} />
                                    <span>Editing Habit</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(null)}
                                    style={{ background: 'none', border: 0, color: 'var(--ink-subtle)', cursor: 'pointer', padding: '2px' }}
                                    aria-label="Cancel editing"
                                  >
                                    <X size={16} strokeWidth={2.5} />
                                  </button>
                                </div>

                                {/* Inputs row */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                  <input
                                    type="text"
                                    value={editingTaskForm.title}
                                    onChange={(e) => setEditingTaskForm({ ...editingTaskForm, title: e.target.value })}
                                    placeholder="Habit title (e.g., Morning Wakeup)"
                                    required
                                    style={{
                                      flex: 2,
                                      minWidth: '200px',
                                      border: '2px solid var(--ink)',
                                      background: 'var(--paper-card)',
                                      color: 'var(--ink)',
                                      padding: '8px 12px',
                                      font: 'inherit',
                                      fontWeight: 600,
                                      fontSize: '13px',
                                    }}
                                  />

                                  <select
                                    value={editingTaskForm.category}
                                    onChange={(e) => setEditingTaskForm({ ...editingTaskForm, category: e.target.value })}
                                    style={{
                                      flex: 1,
                                      minWidth: '160px',
                                      border: '2px solid var(--ink)',
                                      background: 'var(--paper-card)',
                                      color: 'var(--ink)',
                                      padding: '8px 12px',
                                      font: 'inherit',
                                      fontWeight: 700,
                                      fontSize: '13px',
                                    }}
                                  >
                                    <option value="MOVE">Health & Nutrition</option>
                                    <option value="FOCUS">Deep Focus & Work</option>
                                    <option value="ENERGY">Energy & Recovery</option>
                                    <option value="GENERAL">General Habit</option>
                                  </select>
                                </div>

                                {/* Time and Days row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      border: '2px solid var(--ink)',
                                      padding: '4px 10px',
                                      background: 'var(--paper-card)',
                                    }}
                                  >
                                    <Clock size={14} color="var(--ink-subtle)" />
                                    <input
                                      type="time"
                                      value={editingTaskForm.startTime}
                                      onChange={(e) => setEditingTaskForm({ ...editingTaskForm, startTime: e.target.value })}
                                      required
                                      style={{
                                        border: 0,
                                        background: 'transparent',
                                        color: 'var(--ink)',
                                        fontFamily: '"DM Mono", monospace',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        padding: 0,
                                        margin: 0,
                                      }}
                                    />
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-subtle)', fontFamily: '"DM Mono", monospace' }}>
                                      TO
                                    </span>
                                    <input
                                      type="time"
                                      value={editingTaskForm.endTime}
                                      onChange={(e) => setEditingTaskForm({ ...editingTaskForm, endTime: e.target.value })}
                                      required
                                      style={{
                                        border: 0,
                                        background: 'transparent',
                                        color: 'var(--ink)',
                                        fontFamily: '"DM Mono", monospace',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        padding: 0,
                                        margin: 0,
                                      }}
                                    />
                                    <Clock size={14} color="var(--ink-subtle)" />
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <DayPicker
                                      selectedDays={editingTaskForm.daysOfWeek || ALL_DAYS}
                                      onChange={(newDays) => setEditingTaskForm({ ...editingTaskForm, daysOfWeek: newDays })}
                                    />
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTaskId(null)}
                                    style={{
                                      background: 'none',
                                      border: 0,
                                      color: 'var(--ink-subtle)',
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      padding: '6px 12px',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    disabled={updateTaskMutation.isPending}
                                    className="neo-button"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      background: 'var(--yellow)',
                                      color: '#171717',
                                      border: '2px solid var(--ink)',
                                      boxShadow: '3px 3px 0 var(--ink)',
                                      padding: '7px 16px',
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Check size={14} strokeWidth={3} />
                                    <span>Save Changes</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: 'var(--paper)',
                                border: '1.5px solid var(--ink)',
                                flexWrap: 'wrap',
                                gap: '10px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    background: catInfo.color,
                                    color: '#171717',
                                    border: '1.5px solid #171717',
                                    padding: '2px 7px',
                                    font: '800 10px "DM Mono", monospace',
                                  }}
                                >
                                  {catInfo.label}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
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

                                {/* Day badges */}
                                <span
                                  style={{
                                    font: '800 10.5px "DM Mono", monospace',
                                    color: 'var(--ink)',
                                    background: 'var(--paper-card)',
                                    border: '1.5px solid var(--ink)',
                                    padding: '2px 8px',
                                    boxShadow: '1.5px 1.5px 0 var(--ink)',
                                  }}
                                  title={`Active days: ${formatDaysOfWeek(task.daysOfWeek)}`}
                                >
                                  {formatDaysOfWeek(task.daysOfWeek)}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(task)}
                                  style={{
                                    background: 'none',
                                    border: 0,
                                    color: 'var(--ink)',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                  title="Edit habit"
                                  aria-label="Edit habit"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteTaskMutation.mutate(task.id)}
                                  style={{
                                    background: 'none',
                                    border: 0,
                                    color: 'var(--ink-subtle)',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                  title="Delete habit"
                                  aria-label="Delete habit"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
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
                  border: '2.5px solid var(--border-color, #171717)',
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
                    background: 'var(--yellow)',
                    color: '#171717',
                    border: '2px solid var(--ink)',
                    boxShadow: '4px 4px 0 var(--ink)',
                    padding: '10px 14px',
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
