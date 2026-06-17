import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { login, signup } from '../api/auth';
import { useAuth } from './useAuth';
import { useLoginForm } from './useLoginForm';
import type { AuthMode } from './useLoginForm';

export type { AuthMode };

export function useLogin() {
  const form = useLoginForm();
  const { setAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canSubmit = !isPending && form.canSubmitFields;

  const { toggleMode: formToggleMode } = form;
  const toggleMode = useCallback(() => {
    formToggleMode();
    setError(null);
  }, [formToggleMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const result =
        form.mode === 'login'
          ? await login(form.email, form.password)
          : await signup(form.email, form.password, form.name);
      setAuth(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : form.mode === 'login'
            ? 'Login failed'
            : 'Sign up failed',
      );
    } finally {
      setIsPending(false);
    }
  }

  return {
    mode: form.mode,
    email: form.email,
    password: form.password,
    name: form.name,
    setEmail: form.setEmail,
    setPassword: form.setPassword,
    setName: form.setName,
    toggleMode,
    error,
    isPending,
    canSubmit,
    handleSubmit,
  };
}
