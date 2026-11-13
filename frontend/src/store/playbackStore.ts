import { create } from 'zustand';
import type { Trace, Step } from '../types/vep';

export interface PlaybackState {
  trace: Trace | null;
  currentStep: number;
  isPlaying: boolean;
  speedMs: number;
  setTrace: (trace: Trace) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (ms: number) => void;
}

export const usePlaybackStore = create<PlaybackState>()((set, get) => ({
  trace: null,
  currentStep: 0,
  isPlaying: false,
  speedMs: 1500,

  setTrace: (trace: Trace) => {
    set({
      trace,
      currentStep: 0,
      isPlaying: false,
    });
  },

  nextStep: () => {
    const { trace, currentStep } = get();
    if (!trace || trace.steps.length === 0) {
      return;
    }
    const maxIndex = trace.steps.length - 1;
    if (currentStep < maxIndex) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (index: number) => {
    const { trace } = get();
    const maxIndex = trace && trace.steps.length > 0 ? trace.steps.length - 1 : 0;
    const clampedIndex = Math.max(0, Math.min(maxIndex, Math.floor(index)));
    set({ currentStep: clampedIndex });
  },

  reset: () => {
    set({
      currentStep: 0,
      isPlaying: false,
    });
  },

  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setSpeed: (ms: number) => {
    const clampedSpeed = Math.max(200, Math.min(5000, ms));
    set({ speedMs: clampedSpeed });
  },
}));

export const useCurrentStep = (): Step | null =>
  usePlaybackStore((state) => state.trace?.steps[state.currentStep] ?? null);

