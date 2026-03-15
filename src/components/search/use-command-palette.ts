'use client';

import { useState, useEffect, useCallback } from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (others)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for custom event (from header button or other triggers)
  useEffect(() => {
    function handleOpenEvent() {
      setOpen(true);
    }

    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => window.removeEventListener('open-command-palette', handleOpenEvent);
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return { open, setOpen, toggle };
}
