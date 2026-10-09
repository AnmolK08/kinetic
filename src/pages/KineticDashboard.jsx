import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMe } from '@/lib/session';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import TodayPanel from '@/components/dashboard/TodayPanel';
import StreakPanel from '@/components/dashboard/StreakPanel';
import MovementPanel from '@/components/dashboard/MovementPanel';
import QuotePanel from '@/components/dashboard/QuotePanel';
import RoutineModal from '@/components/dashboard/RoutineModal';
import ProgressView from '@/components/dashboard/ProgressView';

const STARTER_TASKS = [
  { title: '10 min morning stretch', tag: 'MOVE', color: 'cyan' },
  { title: 'Write down 3 priorities', tag: 'FOCUS', color: 'yellow' },
  { title: 'Take a proper lunch break', tag: 'ENERGY', color: 'pink' },
  { title: 'Evening walk', tag: 'MOVE', color: 'orange' },
];

export default function KineticDashboard() {
  const { data: user } = useMe();
  const [view, setView] = useState('today');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState(STARTER_TASKS);
  const [done, setDone] = useState([0, 1]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { title: newTask.trim(), tag: 'FOCUS', color: 'purple' }]);
    setNewTask('');
    setShowAdd(false);
  };

  const toggleTask = (index) => {
    setDone((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index],
    );
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return (
    <main className="dashboard-page">
      <DashboardHeader user={user} />

      <div className="dashboard-layout">
        <DashboardSidebar view={view} setView={setView} />

        <section className="dash-content">
          <div className="dash-heading">
            <div>
              <p className="eyebrow">
                {view === 'progress'
                  ? 'YOUR MOMENTUM'
                  : view === 'routines'
                    ? 'YOUR ROUTINES'
                    : `${dayName} ENERGY`}
              </p>

              <h1>
                {view === 'progress' ? (
                  <>Progress looks good<span>!</span></>
                ) : view === 'routines' ? (
                  <>Active <span>routines</span></>
                ) : (
                  <>Good morning, {user?.name || 'Alex'}<span>!</span></>
                )}
              </h1>

              <p className="dash-subtitle">
                {view === 'progress'
                  ? 'Every small action is adding up.'
                  : view === 'routines'
                    ? 'Routines build automatic habits without willpower drain.'
                    : "You're building a great rhythm. Keep it rolling."}
              </p>
            </div>

            <button
              type="button"
              className="neo-button add-button"
              onClick={() => setShowAdd(true)}
              data-testid="add-routine-button"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Add routine</span>
            </button>
          </div>

          {view === 'progress' ? (
            <ProgressView
              done={done.length}
              total={tasks.length}
              onBack={() => setView('today')}
            />
          ) : (
            <div className="dash-grid">
              <TodayPanel
                tasks={tasks}
                done={done}
                toggle={toggleTask}
                onViewAll={() => setView('routines')}
              />
              <StreakPanel />
              <MovementPanel />
              <QuotePanel />
            </div>
          )}
        </section>
      </div>

      <RoutineModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={addTask}
        newTask={newTask}
        setNewTask={setNewTask}
      />
    </main>
  );
}
