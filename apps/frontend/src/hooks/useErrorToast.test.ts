import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useErrorToast } from './useErrorToast';

describe('useErrorToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toast visible', () => {
    const { result } = renderHook(() => useErrorToast());
    expect(result.current.toast).toBeNull();
  });

  it('showToast displays a message that auto-dismisses after 3 seconds', () => {
    const { result } = renderHook(() => useErrorToast());

    act(() => result.current.showToast('Something failed'));
    expect(result.current.toast).toBe('Something failed');

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.toast).toBe('Something failed');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toast).toBeNull();
  });

  it('a second showToast replaces the message and restarts the timer', () => {
    const { result } = renderHook(() => useErrorToast());

    act(() => result.current.showToast('first'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toast).toBe('first');

    act(() => result.current.showToast('second'));
    expect(result.current.toast).toBe('second');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toast).toBe('second');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toast).toBeNull();
  });

  it('clears its pending timeout when unmounted', () => {
    const { result, unmount } = renderHook(() => useErrorToast());

    act(() => result.current.showToast('still here?'));
    unmount();

    expect(() => {
      vi.advanceTimersByTime(10_000);
    }).not.toThrow();
  });
});
