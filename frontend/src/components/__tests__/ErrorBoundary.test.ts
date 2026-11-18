import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { ErrorBoundary } from '../ErrorBoundary.js';
import { renderHook, setupDomGlobals } from '../../api/__tests__/testUtils.js';

describe('ErrorBoundary Component', () => {
  setupDomGlobals();

  it('renders children normally when there is no error', async () => {
    let renderedChild = false;
    function SafeChild() {
      renderedChild = true;
      return React.createElement('div', null, 'Normal content');
    }

    const hook = await renderHook(() =>
      React.createElement(
        ErrorBoundary,
        null,
        React.createElement(SafeChild)
      )
    );

    expect(renderedChild).toBe(true);
    await hook.unmount();
  });

  it('catches render error and displays friendly fallback UI with reset button', async () => {
    // Suppress console.error in this test because ErrorBoundary logs the caught error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let shouldThrow = true;
    function ProblematicChild() {
      if (shouldThrow) {
        throw new Error('Test crash in child component');
      }
      return React.createElement('div', null, 'Recovered content');
    }

    let errorBoundaryRef: ErrorBoundary | null = null;
    const onReset = vi.fn();

    const hook = await renderHook(() =>
      React.createElement(
        ErrorBoundary,
        {
          ref: (ref: any) => {
            errorBoundaryRef = ref;
          },
          title: 'Custom Crash Title',
          onReset,
        },
        React.createElement(ProblematicChild)
      )
    );

    expect(errorBoundaryRef).not.toBeNull();
    expect((errorBoundaryRef as any).state.hasError).toBe(true);
    expect((errorBoundaryRef as any).state.error?.message).toBe(
      'Test crash in child component'
    );

    // Test reset
    shouldThrow = false;
    await act(async () => {
      (errorBoundaryRef as any).reset();
    });

    expect(onReset).toHaveBeenCalled();
    expect((errorBoundaryRef as any).state.hasError).toBe(false);

    spy.mockRestore();
    await hook.unmount();
  });
});
