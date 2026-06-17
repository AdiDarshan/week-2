import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLoginForm } from './useLoginForm';

describe('useLoginForm', () => {
  it('starts in login mode with empty fields', () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.mode).toBe('login');
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.name).toBe('');
    expect(result.current.canSubmitFields).toBe(false);
  });

  it('toggleMode switches between login and signup', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe('signup');

    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe('login');
  });

  it('in login mode, canSubmitFields requires email and password only', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.setEmail('alice@example.com'));
    expect(result.current.canSubmitFields).toBe(false);

    act(() => result.current.setPassword('pw'));
    expect(result.current.canSubmitFields).toBe(true);
  });

  it('in signup mode, canSubmitFields also requires a name', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.toggleMode());
    act(() => result.current.setEmail('alice@example.com'));
    act(() => result.current.setPassword('pw'));
    expect(result.current.canSubmitFields).toBe(false);

    act(() => result.current.setName('Alice'));
    expect(result.current.canSubmitFields).toBe(true);
  });

  it('treats whitespace-only email and name as empty', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => result.current.toggleMode());
    act(() => result.current.setEmail('   '));
    act(() => result.current.setPassword('pw'));
    act(() => result.current.setName('   '));

    expect(result.current.canSubmitFields).toBe(false);
  });
});
