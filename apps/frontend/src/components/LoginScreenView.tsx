import type { FormEvent } from 'react';
import type { AuthMode } from '../hooks/useLoginForm';

export type LoginScreenViewProps = {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  error: string | null;
  isPending: boolean;
  canSubmit: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onToggleMode: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginScreenView({
  mode,
  email,
  password,
  name,
  error,
  isPending,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onToggleMode,
  onSubmit,
}: LoginScreenViewProps) {
  const isSignup = mode === 'signup';
  const heading = isSignup ? 'Create your account' : 'Welcome back';
  const submitLabel = isPending
    ? isSignup
      ? 'Creating account…'
      : 'Signing in…'
    : isSignup
      ? 'Create account'
      : 'Sign in';
  const toggleLabel = isSignup
    ? 'Already have an account? Sign in'
    : "Don't have an account? Create one";

  return (
    <div className="login-screen">
      <h1>{heading}</h1>
      <form className="login-form" onSubmit={onSubmit}>
        {isSignup && (
          <input
            type="text"
            name="name"
            autoFocus
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            disabled={isPending}
            aria-label="Name"
          />
        )}
        <input
          type="email"
          name="email"
          autoFocus={!isSignup}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          disabled={isPending}
          aria-label="Email"
        />
        <input
          type="password"
          name="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={isPending}
          aria-label="Password"
        />
        <button type="submit" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </form>
      <button
        type="button"
        className="login-mode-toggle"
        onClick={onToggleMode}
        disabled={isPending}
      >
        {toggleLabel}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
