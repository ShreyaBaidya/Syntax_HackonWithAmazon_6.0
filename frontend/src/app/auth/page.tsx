'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmail, loginWithGoogle } from '@/lib/api';

// ── Demo credentials hint (shown below the form) ──────────────────────────────
const DEMO_USERS = [
  { name: 'Ravi Kumar', email: 'ravi@example.com', password: 'Amazon@123' },
  { name: 'Priya Sharma', email: 'priya@example.com', password: 'Prime#456' },
];

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoHint, setShowDemoHint] = useState(false);

  // If already logged in, skip to home
  useEffect(() => {
    try {
      const user = localStorage.getItem('amazon_now_user');
      if (user) router.replace('/');
    } catch { /* ignore */ }
  }, [router]);

  // ── Email / password login ────────────────────────────────────────────────
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      localStorage.setItem('amazon_now_user', JSON.stringify(user));
      localStorage.setItem('my_name', user.name);
      sessionStorage.setItem('my_name', user.name);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Mock Google login ─────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setError('');
    setGoogleLoading(true);
    // In a real app: open Google OAuth popup → get ID token → send to backend.
    // Here we simulate a click by using the first demo user's email so the
    // demo always works without a real Google project configured.
    const mockGoogleEmail = 'ravi@example.com';
    const mockGoogleName = 'Ravi Kumar';
    try {
      const user = await loginWithGoogle(mockGoogleEmail, mockGoogleName);
      localStorage.setItem('amazon_now_user', JSON.stringify(user));
      localStorage.setItem('my_name', user.name);
      sessionStorage.setItem('my_name', user.name);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Fill demo credentials ─────────────────────────────────────────────────
  function fillDemo(u: (typeof DEMO_USERS)[0]) {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
    setShowDemoHint(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* ── Amazon-style header ── */}
      <div style={{
        width: '100%',
        background: '#131921',
        padding: '12px 0',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 28,
      }}>
        {/* Amazon wordmark — pure CSS so no image dependency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#FF9900',
            fontFamily: 'Georgia, serif',
            letterSpacing: -1,
          }}>amazon</span>
          <div style={{
            background: '#FF9900',
            color: '#131921',
            fontSize: 9,
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: 3,
            marginTop: 2,
          }}>now</div>
        </div>
      </div>

      {/* ── Login card ── */}
      <div style={{
        width: '100%',
        maxWidth: 348,
        border: '1px solid #D5D9D9',
        borderRadius: 8,
        padding: '24px 30px 28px',
        background: 'white',
        marginBottom: 18,
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 400,
          color: '#0F1111',
          margin: '0 0 20px',
        }}>Sign in</h1>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#FFF3CD',
            border: '1px solid #FFC107',
            borderLeft: '4px solid #E77600',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: '#5A3E00',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Email / password form */}
        <form onSubmit={handleEmailLogin}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="Enter email"
            required
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 10 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
              required
              style={{ ...inputStyle, paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#007185', fontSize: 12, padding: 0,
                boxShadow: 'none',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={primaryBtnStyle(loading)}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={spinnerStyle} /> Signing in…
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
          <span style={{ fontSize: 12, color: '#767676', whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
        </div>

        {/* Google login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 4,
            border: '1px solid #D5D9D9',
            background: googleLoading ? '#F7F7F7' : 'white',
            cursor: googleLoading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 500, color: '#0F1111',
            transition: 'background 0.15s',
          }}
        >
          {googleLoading ? (
            <>
              <span style={spinnerStyle} />
              Signing in with Google…
            </>
          ) : (
            <>
              {/* Google G icon */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Fine print */}
        <p style={{
          fontSize: 11, color: '#767676', margin: '18px 0 0', lineHeight: 1.6,
        }}>
          By continuing, you agree to Amazon&apos;s{' '}
          <span style={{ color: '#007185', cursor: 'pointer' }}>Conditions of Use</span>{' '}
          and{' '}
          <span style={{ color: '#007185', cursor: 'pointer' }}>Privacy Notice</span>.
        </p>
      </div>

      {/* ── Demo credentials helper ── */}
      <div style={{
        width: '100%',
        maxWidth: 348,
        border: '1px solid #D5D9D9',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'white',
        marginBottom: 40,
      }}>
        <button
          onClick={() => setShowDemoHint(v => !v)}
          style={{
            width: '100%', padding: '12px 16px',
            background: '#F7FAFA', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0F1111',
            boxShadow: 'none',
          }}
        >
          <span>🔑 Demo login credentials</span>
          <span style={{ fontSize: 11, color: '#767676' }}>
            {showDemoHint ? '▲ Hide' : '▼ Show'}
          </span>
        </button>

        {showDemoHint && (
          <div style={{ borderTop: '1px solid #E8E8E8' }}>
            {DEMO_USERS.map(u => (
              <div
                key={u.email}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F5F5F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F1111' }}>{u.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>{u.email}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: '#888' }}>
                    Password: <code style={{ background: '#F5F5F5', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>{u.password}</code>
                  </p>
                </div>
                <button
                  onClick={() => fillDemo(u)}
                  style={{
                    background: '#FFD814',
                    border: '1px solid #F0C000',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    color: '#0F1111',
                    flexShrink: 0,
                  }}
                >
                  Use →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer divider ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        width: '100%', maxWidth: 348,
      }}>
        <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
        <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
          <text x="0" y="15" fontSize="13" fontWeight="700" fill="#767676"
            fontFamily="Georgia, serif">amazon</text>
        </svg>
        <div style={{ flex: 1, height: 1, background: '#E0E0E0' }} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {['Conditions of Use', 'Privacy Notice', 'Help'].map(t => (
          <span key={t} style={{ fontSize: 11, color: '#007185', cursor: 'pointer' }}>{t}</span>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#767676', marginBottom: 40 }}>
        © 1996–2026, Amazon.com, Inc. or its affiliates
      </p>
    </div>
  );
}

// ── Shared micro-styles ────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#0F1111',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #888',
  borderRadius: 4,
  fontSize: 14,
  color: '#0F1111',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  marginTop: 18,
  padding: '9px 0',
  background: disabled ? '#F7D078' : 'linear-gradient(to bottom, #f7dfa5, #f0c14b)',
  border: '1px solid',
  borderColor: disabled ? '#D5A429' : '#a88734 #9c7e31 #846a29',
  borderRadius: 4,
  fontSize: 14,
  fontWeight: 400,
  color: '#111',
  cursor: disabled ? 'wait' : 'pointer',
  letterSpacing: 0.3,
  boxShadow: '0 1px 0 rgba(255,255,255,.4) inset',
});

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 14,
  height: 14,
  border: '2px solid #C89411',
  borderTop: '2px solid transparent',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};
