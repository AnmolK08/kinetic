import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMe } from '@/lib/session';
import {
  fetchToday,
  updateTaskLog,
  createRoutine,
  activateRoutine,
  fetchWeeklyAnalytics,
} from '@/lib/api';
import { browserTodayIso } from '@/lib/dates';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import TodayPanel from '@/components/dashboard/TodayPanel';
import StreakPanel from '@/components/dashboard/StreakPanel';
import MovementPanel from '@/components/dashboard/MovementPanel';
import QuotePanel from '@/components/dashboard/QuotePanel';
import RoutineModal from '@/components/dashboard/RoutineModal';
import ProgressView from '@/components/dashboard/ProgressView';
import RoutinesView from '@/components/dashboard/RoutinesView';

export default function KineticDashboard() {
  const { data: user } = useMe();
  const qc = useQueryClient();
  const [view, setView] = useState('today');
  const [showAdd, setShowAdd] = useState(false);

  // ── Fetch today's routine + task logs ──
  const {
    data: todayData,
    isLoading: todayLoading,
  } = useQuery({
    queryKey: ['today-routine'],
    queryFn: () => fetchToday(browserTodayIso()),
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  const routineDay = todayData?.routineDay;
  const activeRoutine = todayData?.activeRoutine;
  const taskLogs = routineDay?.taskLogs || [];
  const completedCount = taskLogs.filter((l) => l.status === 'COMPLETED').length;
  const totalCount = taskLogs.length;

  // ── Fetch weekly analytics for sidebar + panels ──
  const { data: weeklyStats } = useQuery({
    queryKey: ['weekly-analytics'],
    queryFn: () => fetchWeeklyAnalytics(),
    staleTime: 30_000,
  });

  // ── Toggle task log status ──
  const toggleMutation = useMutation({
    mutationFn: async ({ dayId, taskLogId, currentStatus }) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      return updateTaskLog(dayId, taskLogId, newStatus);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update task'),
  });

  const handleToggleTask = useCallback(
    (taskLog) => {
      if (!routineDay?.id) return;
      toggleMutation.mutate({
        dayId: routineDay.id,
        taskLogId: taskLog.id,
        currentStatus: taskLog.status,
      });
    },
    [routineDay?.id, toggleMutation],
  );

  // ── Create new routine via modal ──
  const createMutation = useMutation({
    mutationFn: async ({ name, description, tasks }) => {
      const routine = await createRoutine({ name, description, tasks });
      // Automatically activate the newly created routine
      await activateRoutine(routine.id);
      return routine;
    },
    onSuccess: (routine) => {
      toast.success(`Created & activated "${routine.name}"!`);
      setShowAdd(false);
      void qc.invalidateQueries({ queryKey: ['today-routine'] });
      void qc.invalidateQueries({ queryKey: ['routines'] });
      void qc.invalidateQueries({ queryKey: ['weekly-analytics'] });
      void qc.invalidateQueries({ queryKey: ['suggestions'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to create routine'),
  });

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return (
    <main className="dashboard-page">
      <DashboardHeader user={user} />

      <div className="dashboard-layout">
        <DashboardSidebar
          view={view}
          setView={setView}
          streak={weeklyStats?.currentStreak ?? 0}
          score={weeklyStats?.weeklyScore ?? 0}
        />

        <section className="dash-content">
          <div className="dash-heading">
            <div>
              <p className="eyebrow">
                {view === 'progress'
                  ? 'YOUR MOMENTUM'
                  : view === 'routines'
                    ? 'BLUEPRINTS & HABITS'
                    : `${dayName} ENERGY`}
              </p>

              <h1>
                {view === 'progress' ? (
                  <>Progress looks good<span>!</span></>
                ) : view === 'routines' ? (
                  <>Routines &amp; <span>Habits</span></>
                ) : (
                  <>Good morning, {user?.name || 'Alex'}<span>!</span></>
                )}
              </h1>

              <p className="dash-subtitle">
                {view === 'progress'
                  ? 'Every small action is adding up across your week.'
                  : view === 'routines'
                    ? 'Automate daily habits and remove decision fatigue.'
                    : "You're building great momentum. Keep showing up."}
              </p>
            </div>

            {view !== 'routines' && (
              <button
                type="button"
                className="neo-button add-button"
                onClick={() => setShowAdd(true)}
                data-testid="add-routine-button"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Add routine</span>
              </button>
            )}
          </div>

          {view === 'progress' ? (
            <ProgressView
              weeklyStats={weeklyStats}
              done={completedCount}
              total={totalCount}
              onBack={() => setView('today')}
            />
          ) : view === 'routines' ? (
            <RoutinesView
              onBack={() => setView('today')}
              onOpenCreateModal={() => setShowAdd(true)}
            />
          ) : (
            <div className="dash-grid">
              <TodayPanel
                taskLogs={taskLogs}
                loading={todayLoading}
                onToggle={handleToggleTask}
                onViewAll={() => setView('routines')}
                activeRoutine={activeRoutine}
                onOpenCreate={() => setShowAdd(true)}
              />
              <StreakPanel
                currentStreak={weeklyStats?.currentStreak ?? 0}
                days={weeklyStats?.days || []}
              />
              <MovementPanel
                movementMinutesToday={weeklyStats?.movementMinutesToday ?? 0}
                days={weeklyStats?.days || []}
              />
              <QuotePanel />
            </div>
          )}
        </section>
      </div>

      <RoutineModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={createMutation.mutate}
        isSubmitting={createMutation.isPending}
      />
    </main>
  );
}
