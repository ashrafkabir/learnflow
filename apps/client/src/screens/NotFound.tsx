import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';

export function NotFound() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="text-9xl font-black text-accent/20 select-none mb-2">404</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => nav('/')} variant="secondary">Go Home</Button>
        <Button onClick={() => nav('/dashboard')}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
