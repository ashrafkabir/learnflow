import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../context/AppContext.js';
import { Button } from '../components/Button.js';
import { IconBrainSpark, IconEye, IconEyeOff } from '../components/icons/index.js';

export function RegisterScreen() {
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const devAuth = useMemo(() => {
    const runtimeEnv =
      (globalThis as any)?.__LEARNFLOW_ENV__ &&
      typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
        ? ((globalThis as any).__LEARNFLOW_ENV__ as Record<string, string | undefined>)
        : null;

    const clientBypassEnabled =
      runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1' ||
      (import.meta as any)?.env?.VITE_DEV_AUTH_BYPASS === '1';
    const serverOptInEnabled =
      runtimeEnv?.LEARNFLOW_DEV_AUTH === '1' || runtimeEnv?.LEARNFLOW_DEV_AUTH === 'true';

    return { clientBypassEnabled, serverOptInEnabled };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/auth/register', { email, password, displayName });
      localStorage.setItem('learnflow-token', data.accessToken);
      localStorage.setItem('learnflow-refresh', data.refreshToken);
      localStorage.setItem('learnflow-user', JSON.stringify(data.user));
      nav(data?.user?.onboardingCompletedAt ? '/dashboard' : '/onboarding/welcome');
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevDemoLogin = async () => {
    setError('');

    if (!devAuth.clientBypassEnabled) {
      setError('Dev Demo Login is disabled. Set VITE_DEV_AUTH_BYPASS=1 and reload.');
      return;
    }

    if (!devAuth.serverOptInEnabled) {
      setError(
        'Dev Demo Login requires the API to opt in. Start the API with LEARNFLOW_DEV_AUTH=1 (and keep NODE_ENV != production).',
      );
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('learnflow-token', 'dev');
      localStorage.removeItem('learnflow-refresh');
      localStorage.setItem(
        'learnflow-user',
        JSON.stringify({ email: 'dev@learnflow', name: 'Dev Demo', onboardingCompletedAt: null }),
      );
      nav('/dashboard');
    } catch {
      setError('Dev Demo Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      data-screen="register"
      className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <IconBrainSpark size={26} className="text-accent" title="LearnFlow" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-sm text-gray-800/80 dark:text-gray-200 mt-1">
            Start learning with LearnFlow
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              name="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Min 8 characters"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <IconEyeOff size={18} className="text-gray-800/80 dark:text-gray-200" />
                ) : (
                  <IconEye size={18} className="text-gray-800/80 dark:text-gray-200" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={loading} variant="primary" size="large" fullWidth>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          {devAuth.clientBypassEnabled && (
            <div className="space-y-2">
              <Button
                type="button"
                disabled={loading}
                variant="secondary"
                size="large"
                fullWidth
                onClick={handleDevDemoLogin}
              >
                {loading ? 'Starting demo…' : 'Dev Demo Login'}
              </Button>
              {!devAuth.serverOptInEnabled && (
                <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  Server dev auth is not enabled. Start API with <code>LEARNFLOW_DEV_AUTH=1</code>{' '}
                  to use Dev Demo Login.
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 p-3">
            <div className="text-xs text-gray-700/80 dark:text-gray-200">
              Social sign-in (Google/GitHub/Apple) is not available in this MVP. Use email +
              password.
            </div>
          </div>
        </form>

        <p className="text-center text-sm text-gray-800/80 dark:text-gray-200 mt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
