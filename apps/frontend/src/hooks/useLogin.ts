import { useState } from 'react';
import type { FormEvent } from 'react';
import { login } from '../api/auth';
import { useAuth } from './useAuth';

export function useLogin() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { setAuth } = useAuth();

  const canSubmit = username.trim().length > 0 && !isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const handle = username.trim();
    if (!handle) {
      setError('Please enter a username');
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const result = await login(handle);
      setAuth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsPending(false);
    }
  }

  return {
    username,
    setUsername,
    error,
    isPending,
    canSubmit,
    handleSubmit,
  };
}
