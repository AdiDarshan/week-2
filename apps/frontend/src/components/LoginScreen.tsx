import { useLogin } from '../hooks/useLogin';
import { LoginScreenView } from './LoginScreenView';

export function LoginScreen() {
  const {
    mode,
    email,
    password,
    name,
    error,
    isPending,
    canSubmit,
    setEmail,
    setPassword,
    setName,
    toggleMode,
    handleSubmit,
  } = useLogin();

  return (
    <LoginScreenView
      mode={mode}
      email={email}
      password={password}
      name={name}
      error={error}
      isPending={isPending}
      canSubmit={canSubmit}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onNameChange={setName}
      onToggleMode={toggleMode}
      onSubmit={handleSubmit}
    />
  );
}
