import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiBase } from '../context/AppContext.js';
import { Button } from '../components/Button.js';
import {
  IconApple,
  IconBrainSpark,
  IconEye,
  IconEyeOff,
  IconGitHub,
} from '../components/icons/index.js';

export function LoginScreen() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }
      localStorage.setItem('learnflow-token', data.accessToken);
      localStorage.setItem('learnflow-refresh', data.refreshToken);
      localStorage.setItem('learnflow-user', JSON.stringify(data.user));
      // If server says onboarding isn't complete, route to onboarding.
      if (data?.user && !data.user.onboardingCompletedAt) nav('/onboarding/welcome');
      else nav('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      data-screen="login"
      className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <IconBrainSpark size={26} className="text-accent" title="LearnFlow" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Sign in to LearnFlow</p>
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
              Email
            </label>
            <input
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
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
                  <IconEyeOff size={18} className="text-gray-600 dark:text-gray-300" />
                ) : (
                  <IconEye size={18} className="text-gray-600 dark:text-gray-300" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => alert('Password reset email sent! Check your inbox.')}
              className="text-xs text-accent hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" disabled={loading} variant="primary" size="large" fullWidth>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Social OAuth divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-500 dark:text-gray-300">or continue with</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Social login buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => alert('Google OAuth coming soon')}
              className="flex items-center justify-center gap-2"
            >
              <span
                className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"
                aria-hidden="true"
              />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => alert('GitHub OAuth coming soon')}
              className="flex items-center justify-center gap-2"
            >
              <IconGitHub size={18} className="text-gray-800 dark:text-gray-100" title="GitHub" />
              Continue with GitHub
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => alert('Apple OAuth coming soon')}
              className="flex items-center justify-center gap-2"
            >
              <IconApple size={18} className="text-gray-800 dark:text-gray-100" title="Apple" />
              Continue with Apple
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-3">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">
            Sign up
          </Link>
        </p>

        {import.meta.env.DEV && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-300 mt-2">
            <Link to="/dashboard" className="hover:underline opacity-50">
              Skip (dev mode) →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
