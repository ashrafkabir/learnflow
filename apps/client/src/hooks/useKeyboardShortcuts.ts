import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const nav = useNavigate();

  const handleKey = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;

    // Ctrl/Cmd + K → go to conversation
    if (mod && e.key === 'k') {
      e.preventDefault();
      nav('/conversation');
    }

    // Ctrl/Cmd + / → toggle shortcuts help
    if (mod && e.key === '/') {
      e.preventDefault();
      setShowHelp(prev => !prev);
    }

    // Escape → close help modal
    if (e.key === 'Escape') {
      setShowHelp(false);
    }
  }, [nav]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return { showHelp, setShowHelp };
}

export const SHORTCUTS = [
  { keys: '⌘/Ctrl + K', description: 'Go to Conversation' },
  { keys: '⌘/Ctrl + /', description: 'Show keyboard shortcuts' },
  { keys: 'Escape', description: 'Close modal / drawer' },
];
