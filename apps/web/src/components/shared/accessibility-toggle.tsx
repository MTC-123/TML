'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Eye, Type, Zap } from 'lucide-react';

export function AccessibilityToggle() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('tml-accessibility');
    if (saved) {
      const prefs = JSON.parse(saved);
      setHighContrast(prefs.highContrast || false);
      setLargeText(prefs.largeText || false);
      setReduceMotion(prefs.reduceMotion || false);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('high-contrast', highContrast);
    html.classList.toggle('large-text', largeText);
    html.classList.toggle('reduce-motion', reduceMotion);
    localStorage.setItem('tml-accessibility', JSON.stringify({ highContrast, largeText, reduceMotion }));
  }, [highContrast, largeText, reduceMotion]);

  const closePanel = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closePanel]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Accessibility settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Accessibility settings"
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility settings"
          className="absolute right-0 top-full mt-2 w-64 rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-900 dark:border-gray-700 z-50"
        >
          <h3 className="font-semibold mb-3 text-sm">Accessibility</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={highContrast} onChange={() => setHighContrast(!highContrast)} className="rounded" />
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">High Contrast</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={largeText} onChange={() => setLargeText(!largeText)} className="rounded" />
              <Type className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">Large Text</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={reduceMotion} onChange={() => setReduceMotion(!reduceMotion)} className="rounded" />
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">Reduce Motion</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
