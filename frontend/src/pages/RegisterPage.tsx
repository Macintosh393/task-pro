import axios from 'axios';
import { useState } from 'react';
import { Button, FormField, Input } from '../components/ui';
import { registerUser } from '../services/authService';
import eyeIcon from '../assets/eye.svg';
import './RegisterPage.css';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await registerUser({ name, email, password });

      setSuccess(true);
      setPassword('');
      setShowPassword(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setError('Email is already registered.');
      } else if (axios.isAxiosError(error) && error.response?.status === 400) {
        setError('Please check your registration details.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card" aria-label="Registration">
        <div className="register-tabs">
          <h1 className="register-tab-active">Registration</h1>
          <span className="register-tab">Log In</span>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <FormField label="Name">
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={32}
              autoComplete="name"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Email">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
              autoComplete="email"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Password">
            <div className="register-password-field">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={isLoading}
              />

              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isLoading}
              >
                <img src={eyeIcon} alt="" />
              </button>
            </div>
          </FormField>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register Now'}
          </Button>

          {error && (
            <p className="register-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="register-success" role="status">
              Registration successful!
            </p>
          )}
        </form>
      </section>
    </main>
  );
}