import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import {
  BLOCKED_MESSAGE,
  MAX_FAILED_ATTEMPTS,
  submitPasswordAttempt,
  type AuthState,
} from '../utils/auth.ts';

interface PasswordGateProps {
  authState: AuthState;
  onAuthChange: (nextState: AuthState) => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ authState, onAuthChange }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [hasSubmittedError, setHasSubmittedError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authState.isBlocked) return;

    const nextState = submitPasswordAttempt(passwordInput);
    onAuthChange(nextState);
    if (!nextState.isUnlocked) {
      setHasSubmittedError(true);
      setPasswordInput('');
    }
  };

  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - authState.failedAttempts);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-primary font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`p-3.5 rounded-2xl shadow-sm ${
              authState.isBlocked
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
            }`}
          >
            {authState.isBlocked ? (
              <ShieldAlert className="h-8 w-8" />
            ) : (
              <Lock className="h-8 w-8" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-primary">
            Macro-Constrained Menu Generator
          </h1>
          <p className="text-xs text-slate-500">
            {authState.isBlocked
              ? 'Access to this application has been restricted.'
              : 'Enter the access password to continue to your meal plans.'}
          </p>
        </div>

        {authState.isBlocked ? (
          <div
            role="alert"
            className="bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-xl p-4 text-center text-sm font-bold"
          >
            {BLOCKED_MESSAGE}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="app-password-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
              >
                Password
              </label>
              <input
                id="app-password-input"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                required
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-primary outline-none transition"
              />
            </div>

            {(hasSubmittedError || authState.failedAttempts > 0) && (
              <p role="alert" className="text-xs font-semibold text-rose-600">
                Incorrect password. {remainingAttempts}{' '}
                {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Unlock Menu Builder
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
