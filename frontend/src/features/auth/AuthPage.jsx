import { Navigate } from 'react-router-dom';
import { useMe } from '@/lib/session';
import AuthBranding from '@/components/auth/AuthBranding';
import AuthForm from '@/components/auth/AuthForm';

export default function AuthPage({ mode }) {
  const { data: user, isPending: loadingUser } = useMe();

  if (loadingUser) {
    return (
      <div className="auth-loading">
        <p className="eyebrow">LOADING…</p>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const isSignup = mode === 'signup';

  return (
    <main className="auth-page">
      <AuthBranding isSignup={isSignup} />
      <AuthForm mode={mode} />
    </main>
  );
}
