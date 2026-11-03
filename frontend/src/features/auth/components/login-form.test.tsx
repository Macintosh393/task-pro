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
    const labels = [...dom.host.querySelectorAll('label')];

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitBtn).not.toBeNull();
    expect(emailInput.placeholder).toBe('Enter your email');
    expect(passwordInput.placeholder).toBe('Enter your password');
    expect(labels.map((label) => label.textContent)).toEqual(['Email', 'Password']);
    expect(labels.every((label) => label.classList.contains('sr-only'))).toBe(true);
    expect(dom.host.querySelector('h1')?.textContent).toBe('Log In');
    expect(dom.host.textContent).toContain('Registration');
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
    });
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' });
  });

  it('does not submit invalid credentials', async () => {
    act(() => {
      dom.root.render(<LoginForm />);
    });

    const emailInput = dom.host.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = dom.host.querySelector('input[type="password"]') as HTMLInputElement;
    const form = dom.host.querySelector('form') as HTMLFormElement;

    act(() => {
      setInputValue(emailInput, 'not-an-email');
      setInputValue(passwordInput, 'short');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(dom.host.textContent).toContain('Please enter a valid email address');
    expect(dom.host.textContent).toContain('Password must be at least 6 characters');
  });
});
