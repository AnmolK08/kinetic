import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '@/lib/session';

export default function ProtectedRoute() {
  const { data: user, isPending, isError } = useMe();
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('kinetic-demo-mode') === 'true';

  if (isPending && !isDemo) {
    return (
      <div className="auth-loading">
        <p className="eyebrow">LOADING KINETIC…</p>
      </div>
    );
  }

  if (!isDemo && (isError || !user)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
