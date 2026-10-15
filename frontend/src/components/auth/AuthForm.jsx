import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSignIn, useSignUp } from '@/features/auth/hooks';
import { apiErrorMessage } from '@/lib/utils';

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signIn = useSignIn();
  const signUp = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const pending = isSignup ? signUp.isPending : signIn.isPending;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (isSignup) {
      if (!name.trim()) {
        toast.error('Please enter your name');
        return;
      }
      signUp.mutate(
        { email: email.trim(), password, name: name.trim() },
        {
          onSuccess: () => {
            toast.success('Account created — welcome to KINETIC');
            navigate('/dashboard');
          },
          onError: (err) => toast.error(apiErrorMessage(err, 'Could not create account')),
        },
      );
    } else {
      signIn.mutate(
        { email: email.trim(), password },
        {
          onSuccess: () => {
            toast.success('Welcome back');
            navigate('/dashboard');
          },
          onError: (err) => toast.error(apiErrorMessage(err, 'Invalid email or password')),
        },
      );
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('kinetic-demo-mode', 'true');
    queryClient.setQueryData(['me'], {
      id: 'demo-user-01',
      email: 'demo@kinetic.app',
      name: 'Alex',
    });
    toast.success('Welcome to Kinetic Demo Mode!');
    navigate('/dashboard');
  };

  return (
    <div className="auth-form-wrap">
      <div className="auth-form">
        <Link to="/" className="back-link" data-testid="login-back-link">
          ← Back home
        </Link>

        <p className="eyebrow">YOUR ACCOUNT</p>
        <h2>{isSignup ? 'Create your account' : 'Log in to Kinetic'}</h2>
        <p className="form-subtitle">
          {isSignup
            ? 'Start tracking your routines today.'
            : 'Pick up exactly where you left off.'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <div className="form-group">
              <label htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="auth-name-input"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password-input"
              required
            />
          </div>

          <button
            type="submit"
            className="neo-button primary-button full-button"
            disabled={pending}
            data-testid="login-submit-button"
          >
            <span>{pending ? 'Loading…' : isSignup ? 'Create account' : 'Log in'}</span>
            {!pending && <ArrowUpRight size={18} strokeWidth={2.5} />}
          </button>
        </form>

        <div className="or-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="neo-button social-button"
          onClick={handleDemoLogin}
          data-testid="continue-demo-button"
        >
          <span>Continue with demo</span>
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        <p className="signup-prompt">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link
            to={isSignup ? '/login' : '/signup'}
            data-testid="create-account-link"
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  );
}
