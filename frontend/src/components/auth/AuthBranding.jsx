import Brand from '@/components/common/Brand';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function AuthBranding({ isSignup }) {
  return (
    <div className="auth-side">
      <div className="auth-top-row">
        <Brand dark />
        <ThemeToggle className="auth-theme-toggle" showLabel={false} />
      </div>

      <div className="auth-message">
        <p className="eyebrow">
          {isSignup ? 'JOIN KINETIC' : 'WELCOME BACK'}
        </p>

        <h1>
          Ready to
          {isSignup && (
            <>
              <br />
              <span>get moving?</span>
            </>
          )}
        </h1>

        <p className="auth-sub">Your next win is one check-in away.</p>
      </div>

      <div className="auth-scribble" aria-hidden="true">
        ✳ KEEP
        <br />
        GOING →
      </div>
    </div>
  );
}
