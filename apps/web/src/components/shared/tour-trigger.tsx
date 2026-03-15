'use client';

import { useTour } from '@/lib/hooks/use-tour';
import { GuidedTour, LANDING_TOUR_STEPS, DASHBOARD_TOUR_STEPS } from '@/components/shared/guided-tour';
import { Button } from '@/components/ui/button';
import { HelpCircle, Navigation } from 'lucide-react';
import type { TourStep } from '@/lib/hooks/use-tour';

// ---------------------------------------------------------------------------
// Landing Page Tour Trigger
// ---------------------------------------------------------------------------

export function LandingTourTrigger() {
  const tour = useTour('landing');

  return (
    <>
      {!tour.isActive && (
        <button
          onClick={tour.startTour}
          className="group inline-flex items-center gap-2 px-6 py-2.5 border border-[#d4a853]/40 text-[#d4a853] font-medium rounded-lg transition-all duration-300 hover:border-[#d4a853]/70 hover:bg-[#d4a853]/10 text-sm"
          aria-label="Take a guided tour"
        >
          <Navigation className="w-4 h-4 transition-transform group-hover:rotate-12" />
          Take a Tour
        </button>
      )}

      {tour.isActive && (
        <GuidedTour
          steps={LANDING_TOUR_STEPS}
          currentStep={tour.currentStep}
          onNext={() => tour.nextStep(LANDING_TOUR_STEPS.length)}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Tour Trigger
// ---------------------------------------------------------------------------

export function DashboardTourTrigger() {
  const tour = useTour('dashboard');

  return (
    <>
      {!tour.isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={tour.startTour}
          className="gap-1.5 text-xs"
          aria-label="Take a guided tour of the dashboard"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Take a Tour
        </Button>
      )}

      {tour.isActive && (
        <GuidedTour
          steps={DASHBOARD_TOUR_STEPS}
          currentStep={tour.currentStep}
          onNext={() => tour.nextStep(DASHBOARD_TOUR_STEPS.length)}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Generic Tour Trigger (reusable for custom tours)
// ---------------------------------------------------------------------------

interface CustomTourTriggerProps {
  tourId: string;
  steps: TourStep[];
  label?: string;
  variant?: 'landing' | 'dashboard';
}

export function CustomTourTrigger({
  tourId,
  steps,
  label = 'Take a Tour',
  variant = 'dashboard',
}: CustomTourTriggerProps) {
  const tour = useTour(tourId);

  return (
    <>
      {!tour.isActive && variant === 'dashboard' && (
        <Button
          variant="outline"
          size="sm"
          onClick={tour.startTour}
          className="gap-1.5 text-xs"
          aria-label={label}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {label}
        </Button>
      )}

      {!tour.isActive && variant === 'landing' && (
        <button
          onClick={tour.startTour}
          className="group inline-flex items-center gap-2 px-6 py-2.5 border border-[#d4a853]/40 text-[#d4a853] font-medium rounded-lg transition-all duration-300 hover:border-[#d4a853]/70 hover:bg-[#d4a853]/10 text-sm"
          aria-label={label}
        >
          <Navigation className="w-4 h-4 transition-transform group-hover:rotate-12" />
          {label}
        </button>
      )}

      {tour.isActive && (
        <GuidedTour
          steps={steps}
          currentStep={tour.currentStep}
          onNext={() => tour.nextStep(steps.length)}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
        />
      )}
    </>
  );
}
