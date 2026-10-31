// @vitest-environment jsdom
import { act } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LoginForm } from './login-form';
import { setupDomTest } from '../../../test/setupDomTest';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const dom = setupDomTest();

function setInputValue(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  if (nativeSetter) {
    nativeSetter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input, password input, and submit button', () => {
    act(() => {
      dom.root.render(<LoginForm />);
    });

    const emailInput = dom.host.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = dom.host.querySelector('input[type="password"]') as HTMLInputElement;
    const submitBtn = dom.host.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitBtn).not.toBeNull();
    expect(submitBtn.textContent).toContain('Log In Now');
  });

  it('allows entering credentials and submits the form', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    act(() => {
      dom.root.render(<LoginForm redirectTo="/home" />);
    });

    const emailInput = dom.host.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = dom.host.querySelector('input[type="password"]') as HTMLInputElement;
    const form = dom.host.querySelector('form') as HTMLFormElement;

    act(() => {
      setInputValue(emailInput, 'user@example.com');
    });

    act(() => {
      setInputValue(passwordInput, 'mypassword123');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      // Allow async microtasks
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'mypassword123',
      pass: 'mypassword123',
    });
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' });
  });
});
