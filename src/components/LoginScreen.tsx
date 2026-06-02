import { useLogin } from '../hooks/useLogin';

export function LoginScreen() {
  const { username, setUsername, error, isPending, canSubmit, handleSubmit } = useLogin();

  return (
    <div className="login-screen">
      <h1>Who are you?</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          autoFocus
          autoComplete="username"
          placeholder="Enter your username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={isPending}
          aria-label="Username"
        />
        <button type="submit" disabled={!canSubmit}>
          {isPending ? 'Signing in…' : 'Continue'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
