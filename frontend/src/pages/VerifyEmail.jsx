import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function VerifyEmail() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <CheckCircle2 size={44} className="auth-icon" style={{ margin: '0 auto 18px' }} />
        <h1>Check your email</h1>
        <p>
          We&apos;ve sent a verification link to your email address. Please click the link to
          activate your account before signing in.
        </p>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/login" className="auth-button" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            Go to Login
          </Link>
          <Link to="/" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
