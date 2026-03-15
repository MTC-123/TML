'use client';

import { useState, useCallback, useEffect } from 'react';

export interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourDefinition {
  id: string;
  name: string;
  steps: TourStep[];
}

export function useTour(tourId: string) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = tour not active
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(`tml-tour-${tourId}`);
    if (completed) setIsComplete(true);
  }, [tourId]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback((totalSteps: number) => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(-1);
      setIsComplete(true);
      localStorage.setItem(`tml-tour-${tourId}`, 'true');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, tourId]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    setCurrentStep(-1);
    setIsComplete(true);
    localStorage.setItem(`tml-tour-${tourId}`, 'true');
  }, [tourId]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(`tml-tour-${tourId}`);
    setIsComplete(false);
    setCurrentStep(-1);
  }, [tourId]);

  return {
    currentStep,
    isActive: currentStep >= 0,
    isComplete,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    resetTour,
  };
}
