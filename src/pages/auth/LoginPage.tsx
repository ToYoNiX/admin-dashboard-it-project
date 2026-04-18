import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { signInWithPassword } from '../../services/authService';
import { AuthShell } from './AuthShell';

export function LoginPage() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithPassword(loginIdentifier.trim(), password);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to login.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Login">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Username or Email"
          type="text"
          value={loginIdentifier}
          onChange={(event) => setLoginIdentifier(event.target.value)}
          placeholder="username or advisor@must.edu.eg"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </Button>
      </form>
    </AuthShell>
  );
}
