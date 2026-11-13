import { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, UserRound } from 'lucide-react';
import { api, getErrorMessage, setAccessToken } from '../lib/api';
import { Button, Field, Input, Select } from './ui';

export default function AuthDialog({ onClose, onSuccess, initialRole = 'customer' }) {
  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    fullName: '',
    displayName: '',
    email: '',
    password: ''
  });

  const update = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      let path;
      let body = { email: values.email, password: values.password };
      if (mode === 'register') {
        path = role === 'provider' ? '/auth/provider/register' : '/auth/register';
        body = {
          ...body,
          fullName: values.fullName,
          ...(role === 'provider' ? { displayName: values.displayName } : {})
        };
      } else {
        path = role === 'provider'
          ? '/auth/provider/login'
          : role === 'admin'
            ? '/auth/admin/login'
            : '/auth/login';
      }
      const session = await api.post(path, body);
      setAccessToken(session.accessToken);
      onSuccess(session.user);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          {role === 'admin' ? <ShieldCheck size={19} /> : <UserRound size={19} />}
        </span>
        <div>
          <p className="text-sm font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
          <p className="mt-0.5 text-xs text-emerald-800/75">A better home starts with a little help.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {[
          ['customer', 'Customer'],
          ['provider', 'Provider'],
          ['admin', 'Admin']
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => {
              setRole(value);
              setMode('login');
              setError('');
            }}
            className={`rounded-lg px-2 py-2 text-xs font-bold transition ${role === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {mode === 'register' && (
          <>
            <Field label="Your name">
              <Input value={values.fullName} onChange={update('fullName')} required minLength={2} autoComplete="name" placeholder="e.g. Aanya Sharma" />
            </Field>
            {role === 'provider' && (
              <Field label="Business / display name">
                <Input value={values.displayName} onChange={update('displayName')} required minLength={2} placeholder="e.g. Aanya Home Care" />
              </Field>
            )}
          </>
        )}
        <Field label="Email address">
          <Input type="email" value={values.email} onChange={update('email')} required autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input type="password" value={values.password} onChange={update('password')} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" />
        </Field>
        {role === 'admin' && mode === 'register' && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Admin accounts are created by the system administrator. Public admin registration is disabled.</p>
        )}
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || (role === 'admin' && mode === 'register')}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create account'}
          {!busy && <ArrowRight size={16} />}
        </Button>
      </form>

      {role !== 'admin' && (
        <button
          type="button"
          onClick={() => {
            setMode((current) => current === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          {mode === 'login' ? 'New to Urbanmate? Create an account' : <><ArrowLeft size={14} /> Back to sign in</>}
        </button>
      )}
    </div>
  );
}
