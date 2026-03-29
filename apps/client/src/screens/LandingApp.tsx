import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { IconBrainSpark } from '../components/icons/index.js';

export function LandingApp() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg dark:bg-bg-dark px-6">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
        <IconBrainSpark size={34} className="text-accent" title="LearnFlow" />
      </div>

      <h1 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2">
        LearnFlow
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        Welcome to the LearnFlow app.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => nav('/login')}>Log in</Button>
        <Button variant="secondary" onClick={() => nav('/register')}>
          Create account
        </Button>
      </div>

      <div className="mt-8 text-xs text-gray-400 dark:text-gray-500 text-center max-w-md">
        Note: Billing and checkout flows are mock in this MVP. Marketing pages are served by a
        separate web app in this repository.
      </div>
    </div>
  );
}
