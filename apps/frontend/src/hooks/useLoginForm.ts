import { useCallback, useState } from 'react';

export type AuthMode = 'login' | 'signup';

export type LoginFormState = {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  canSubmitFields: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setName: (value: string) => void;
  toggleMode: () => void;
};

export function useLoginForm(): LoginFormState {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const emailFilled = email.trim().length > 0;
  const passwordFilled = password.length > 0;
  const nameFilled = name.trim().length > 0;
  const canSubmitFields =
    emailFilled && passwordFilled && (mode === 'login' || nameFilled);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  }, []);

  return {
    mode,
    email,
    password,
    name,
    canSubmitFields,
    setEmail,
    setPassword,
    setName,
    toggleMode,
  };
}
