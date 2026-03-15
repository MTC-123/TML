'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TourStep } from '@/lib/hooks/use-tour';

// ---------------------------------------------------------------------------
// Tour step definitions
// ---------------------------------------------------------------------------

export const LANDING_TOUR_STEPS: TourStep[] = [
  {
    target: '[aria-label="Hero"]',
    title: 'Welcome to TML',
    description:
      'TML ensures transparency in Morocco\'s public infrastructure spending through cryptographic attestations and verifiable certificates.',
    position: 'bottom',
  },
  {
    target: '[aria-label="Security features"]',
    title: 'Cryptographic Security',
    description:
      'Multi-party attestation with Ed25519 signatures and CNIE-verified identities ensures tamper-proof accountability.',
    position: 'top',
  },
  {
    target: '[aria-label="How it works"]',
    title: 'How It Works',
    description:
      'Follow the complete attestation flow: contractor submits, auditor verifies, citizens approve before funds are released.',
    position: 'top',
  },
  {
    target: '#verify-section',
    title: 'Verify Certificates',
    description:
      'Anyone can verify a Payment Clearance Certificate by entering its hash or scanning a QR code.',
    position: 'top',
  },
];

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: '.grid.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-4',
    title: 'Key Metrics',
    description:
      'Real-time overview of active projects, pending attestations, issued certificates, and open disputes.',
    position: 'bottom',
  },
  {
    target: '[data-tour="projects-table"]',
    title: 'Projects Overview',
    description:
      'Track all infrastructure projects and their milestone progress in one place.',
    position: 'top',
  },
  {
    target: '[data-tour="nav-attestations"], [href*="attestations"]',
    title: 'Attestations',
    description:
      'Submit and verify attestations with geofenced location proof for each project milestone.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-certificates"], [href*="certificates"]',
    title: 'Payment Certificates',
    description:
      'Payment Clearance Certificates are generated automatically after the required quorum of attestations is met.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-disputes"], [href*="disputes"]',
    title: 'Dispute Resolution',
    description:
      'Citizens can file disputes if work quality is unsatisfactory, triggering an independent review process.',
    position: 'right',
  },
  {
    target: '[data-tour="language-switcher"], [aria-label="Language"], [aria-label="Select language"]',
    title: 'Multi-language Support',
    description:
      'TML is available in French, Arabic, Amazigh, and English to serve all communities across Morocco.',
    position: 'bottom',
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GuidedTourProps {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuidedTour({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
}: GuidedTourProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Only render in browser
  useEffect(() => {
    setMounted(true);
  }, []);

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (currentStep < 0 || currentStep >= steps.length) return;

    const step = steps[currentStep];
    if (!step) return;

    const el = document.querySelector(step.target);
    if (!el) {
      // Target not found — skip to next step automatically
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;

    setTargetRect({
      top: rect.top + window.scrollY - padding,
      left: rect.left + window.scrollX - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentStep, steps]);

  // Position the tooltip relative to the target
  const positionTooltip = useCallback(() => {
    if (!targetRect || !tooltipRef.current) return;

    const step = steps[currentStep];
    if (!step) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const gap = 16;

    let position = step.position || 'bottom';

    // Target position in viewport coords
    const targetViewportTop = targetRect.top - scrollY;
    const targetViewportBottom = targetViewportTop + targetRect.height;
    const targetCenterX = targetRect.left - scrollX + targetRect.width / 2;

    // Auto-adjust position if not enough space
    if (position === 'bottom' && targetViewportBottom + gap + tooltipRect.height > viewportH) {
      position = 'top';
    }
    if (position === 'top' && targetViewportTop - gap - tooltipRect.height < 0) {
      position = 'bottom';
    }
    if (position === 'right' && targetRect.left + targetRect.width + gap + tooltipRect.width > viewportW + scrollX) {
      position = 'left';
    }
    if (position === 'left' && targetRect.left - gap - tooltipRect.width < scrollX) {
      position = 'right';
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10002,
      maxWidth: 320,
    };

    switch (position) {
      case 'bottom':
        style.top = targetRect.top + targetRect.height + gap;
        style.left = Math.max(
          16,
          Math.min(targetCenterX + scrollX - tooltipRect.width / 2, viewportW + scrollX - tooltipRect.width - 16)
        );
        break;
      case 'top':
        style.top = targetRect.top - tooltipRect.height - gap;
        style.left = Math.max(
          16,
          Math.min(targetCenterX + scrollX - tooltipRect.width / 2, viewportW + scrollX - tooltipRect.width - 16)
        );
        break;
      case 'right':
        style.top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        style.left = targetRect.left + targetRect.width + gap;
        break;
      case 'left':
        style.top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        style.left = targetRect.left - tooltipRect.width - gap;
        break;
    }

    // Clamp within viewport vertically
    if (typeof style.top === 'number') {
      style.top = Math.max(scrollY + 16, Math.min(style.top, scrollY + viewportH - tooltipRect.height - 16));
    }

    setTooltipStyle(style);
  }, [targetRect, currentStep, steps]);

  // Measure on step change
  useEffect(() => {
    if (currentStep < 0) return;

    // Small delay to let DOM settle after scroll
    const timer = setTimeout(() => {
      measureTarget();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep, measureTarget]);

  // Position tooltip after target is measured
  useEffect(() => {
    if (!targetRect) return;

    requestAnimationFrame(() => {
      positionTooltip();
    });
  }, [targetRect, positionTooltip]);

  // Reposition on resize/scroll
  useEffect(() => {
    if (currentStep < 0) return;

    const handleReposition = () => {
      measureTarget();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [currentStep, measureTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (currentStep < 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
          onNext();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, onNext, onPrev, onSkip]);

  if (!mounted || currentStep < 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const highlightStyle: React.CSSProperties = targetRect
    ? {
        position: 'absolute',
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        border: '2px solid #d4a853',
        borderRadius: 8,
        zIndex: 10001,
        pointerEvents: 'none',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s ease',
      }
    : {};

  const overlay = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
      aria-modal="true"
      role="dialog"
      aria-label={`Tour step ${currentStep + 1} of ${steps.length}: ${step.title}`}
    >
      {/* Click on overlay background to skip */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
        }}
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Highlight cutout */}
      {targetRect && <div style={highlightStyle} />}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          ...tooltipStyle,
          position: 'absolute',
          zIndex: 10002,
          maxWidth: 320,
          width: 'calc(100vw - 32px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-lg shadow-lg p-4"
          style={{ border: '1px solid #e5e7eb' }}
        >
          {/* Header with title and close button */}
          <div className="flex items-start justify-between mb-2">
            <h3
              className="text-base font-semibold"
              style={{ color: '#1e3a5f' }}
            >
              {step.title}
            </h3>
            <button
              onClick={onSkip}
              className="ml-2 p-0.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Close tour"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Footer: step counter + nav buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Previous
                </Button>
              )}

              <Button
                size="sm"
                onClick={onNext}
                className="h-8 px-3 text-xs"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  'Finish'
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                backgroundColor: '#d4a853',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
