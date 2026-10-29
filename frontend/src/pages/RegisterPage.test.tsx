// @vitest-environment jsdom
import axios from 'axios';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupDomTest } from '../test/setupDomTest';
import { registerUser } from '../services/authService';
import { RegisterPage } from './RegisterPage';

vi.mock('../services/authService', () => ({
  registerUser: vi.fn(),
}));

const dom = setupDomTest();

const user = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
};

function fillInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;

  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillForm() {
  const inputs = dom.host.querySelectorAll('input');

  act(() => {
    fillInput(inputs[0], 'Test User');
    fillInput(inputs[1], 'test@example.com');
    fillInput(inputs[2], 'TestPassword123!');
  });
}

async function submitForm() {
  const form = dom.host.querySelector('form')!;

  await act(async () => {
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  });
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders registration fields', () => {
    act(() => {
      dom.root.render(<RegisterPage />);
    });

    const inputs = dom.host.querySelectorAll('input');

    expect(inputs).toHaveLength(3);
    expect(inputs[0].type).toBe('text');
    expect(inputs[1].type).toBe('email');
    expect(inputs[2].type).toBe('password');
    expect(dom.host.textContent).toContain('Register Now');
  });

  it('submits registration data', async () => {
    vi.mocked(registerUser).mockResolvedValue(user);

    act(() => {
      dom.root.render(<RegisterPage />);
    });

    fillForm();
    await submitForm();

    expect(registerUser).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
    });
  });

  it('shows a success message after registration', async () => {
    vi.mocked(registerUser).mockResolvedValue(user);

    act(() => {
      dom.root.render(<RegisterPage />);
    });

    fillForm();
    await submitForm();

    expect(dom.host.textContent).toContain('Registration successful!');
    expect(dom.host.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe('');
  });

  it('shows an error when email is already registered', async () => {
    const error = Object.assign(new Error('Conflict'), {
      isAxiosError: true,
      response: { status: 409 },
    });

    vi.mocked(registerUser).mockRejectedValue(error);

    act(() => {
      dom.root.render(<RegisterPage />);
    });

    fillForm();
    await submitForm();

    expect(axios.isAxiosError(error)).toBe(true);
    expect(dom.host.textContent).toContain('Email is already registered.');
  });

  it('toggles password visibility', () => {
    act(() => {
      dom.root.render(<RegisterPage />);
    });

    const toggle = dom.host.querySelector<HTMLButtonElement>(
      '[aria-label="Show password"]',
    )!;

    const passwordInput = dom.host.querySelectorAll('input')[2];

    expect(passwordInput.type).toBe('password');

    act(() => {
      toggle.click();
    });

    expect(passwordInput.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');

    act(() => {
      toggle.click();
    });

    expect(passwordInput.type).toBe('password');
  });
});