import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreenView, type LoginScreenViewProps } from './LoginScreenView';

function makeProps(
  overrides: Partial<LoginScreenViewProps> = {},
): LoginScreenViewProps {
  return {
    mode: 'login',
    email: '',
    password: '',
    name: '',
    error: null,
    isPending: false,
    canSubmit: true,
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onNameChange: vi.fn(),
    onToggleMode: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    ...overrides,
  };
}

describe('<LoginScreenView />', () => {
  it('renders the login heading and hides the name field by default', () => {
    render(<LoginScreenView {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the signup heading and shows the name field in signup mode', () => {
    render(<LoginScreenView {...makeProps({ mode: 'signup' })} />);

    expect(
      screen.getByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeInTheDocument();
  });

  it('shows a pending submit label and disables the toggle while pending', () => {
    render(
      <LoginScreenView {...makeProps({ isPending: true, canSubmit: false })} />,
    );

    expect(
      screen.getByRole('button', { name: 'Signing in…' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: "Don't have an account? Create one",
      }),
    ).toBeDisabled();
  });

  it('disables the submit button when canSubmit is false', () => {
    render(<LoginScreenView {...makeProps({ canSubmit: false })} />);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('renders the error message inside a role="alert" when error is set', () => {
    render(<LoginScreenView {...makeProps({ error: 'Invalid credentials' })} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid credentials');
  });

  it('calls onSubmit when the form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(<LoginScreenView {...makeProps({ onSubmit })} />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('forwards typing in each field through onEmailChange / onPasswordChange / onNameChange', async () => {
    const user = userEvent.setup();
    const onEmailChange = vi.fn();
    const onPasswordChange = vi.fn();
    const onNameChange = vi.fn();

    render(
      <LoginScreenView
        {...makeProps({
          mode: 'signup',
          onEmailChange,
          onPasswordChange,
          onNameChange,
        })}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'A');
    await user.type(screen.getByLabelText('Email'), 'b');
    await user.type(screen.getByLabelText('Password'), 'c');

    expect(onNameChange).toHaveBeenCalledWith('A');
    expect(onEmailChange).toHaveBeenCalledWith('b');
    expect(onPasswordChange).toHaveBeenCalledWith('c');
  });

  it('calls onToggleMode when the mode toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMode = vi.fn();

    render(<LoginScreenView {...makeProps({ onToggleMode })} />);

    await user.click(
      screen.getByRole('button', {
        name: "Don't have an account? Create one",
      }),
    );

    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });
});
