import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  UserRound
} from 'lucide-react';
import { api, getErrorMessage, setAccessToken } from '../lib/api';
import { Button, Field, Input, Textarea } from './ui';

const roles = [
  { value: 'customer', label: 'Customer', icon: UserRound },
  { value: 'provider', label: 'Provider', icon: BriefcaseBusiness }
];

const passwordModes = new Set(['login', 'register', 'reset']);

export default function AuthDialog({
  onSuccess,
  onResetComplete,
  initialRole = 'customer',
  initialMode = 'login',
  resetToken = ''
}) {
  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [providerDetailsOpen, setProviderDetailsOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    businessName: '',
    legalName: '',
    dateOfBirth: '',
    professionalTitle: '',
    businessType: '',
    bio: '',
    experienceYears: ''
  });

  const update = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setError('');
    setNotice('');
  };

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
    setShowPassword(false);
  }

  function optionalValue(key) {
    const value = values[key].trim();
    return value ? { [key]: value } : {};
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'forgot') {
        await api.post('/auth/password/forgot', { email: values.email });
        setNotice('If an account exists for that email, reset instructions will be sent.');
        return;
      }

      if (mode === 'reset') {
        if (!resetToken) {
          setError('This reset link is incomplete. Request a new password reset email.');
          return;
        }
        if (values.password !== values.confirmPassword) {
          setError('Your passwords do not match.');
          return;
        }
        await api.post('/auth/password/reset', { token: resetToken, password: values.password });
        setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
        onResetComplete?.();
        changeMode('login');
        setNotice('Your password has been reset. Sign in with your new password.');
        return;
      }

      if (mode === 'register') {
        if (values.password !== values.confirmPassword) {
          setError('Your passwords do not match.');
          return;
        }
        const body = {
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          ...optionalValue('phone')
        };
        let path = '/auth/register';
        if (role === 'provider') {
          path = '/auth/provider/register';
          Object.assign(body, {
            displayName: values.displayName,
            ...optionalValue('businessName'),
            ...optionalValue('legalName'),
            ...optionalValue('dateOfBirth'),
            ...optionalValue('professionalTitle'),
            ...optionalValue('businessType'),
            ...optionalValue('bio'),
            ...(values.experienceYears !== ''
              ? { experienceYears: Number(values.experienceYears) }
              : {})
          });
        }
        const session = await api.post(path, body);
        setAccessToken(session.accessToken);
        onSuccess(session.user);
        return;
      }

      const session = await api.post('/auth/login', { email: values.email, password: values.password });
      setAccessToken(session.accessToken);
      onSuccess(session.user);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const heading = {
    login: 'Welcome back',
    register: role === 'provider' ? 'Start your provider application' : 'Create your account',
    forgot: 'Reset your password',
    reset: 'Choose a new password'
  }[mode];
  const description = {
    login: 'Sign in once and we’ll open the right workspace for your account.',
    register: role === 'provider'
      ? 'Create your account and tell us a little about your work.'
      : 'A better home starts with a little help.',
    forgot: 'We’ll email a reset link if an account matches.',
    reset: 'Use at least 10 characters for your new password.'
  }[mode];

  return (
    <div key={mode} className="auth-step space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {role === 'provider' ? <BriefcaseBusiness size={19} /> : <Sparkles size={19} />}
        </span>
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-900">{heading}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>
      </div>

      {mode === 'register' && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" aria-label="Account type">
          {roles.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => {
                setRole(value);
                setError('');
                setNotice('');
              }}
              aria-pressed={role === value}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition ${
                role === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      <form className="space-y-4" onSubmit={submit}>
        {mode === 'register' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  value={values.fullName}
                  onChange={update('fullName')}
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </Field>
              <Field label="Phone number" hint="Optional">
                <Input
                  type="tel"
                  value={values.phone}
                  onChange={update('phone')}
                  minLength={7}
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Your phone number"
                />
              </Field>
            </div>
            {role === 'provider' && (
              <>
                <Field label="Professional or display name">
                  <Input
                    value={values.displayName}
                    onChange={update('displayName')}
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="How customers will see you"
                  />
                </Field>
                <details
                  className="group rounded-xl border border-slate-200 px-4 py-3"
                  open={providerDetailsOpen}
                  onToggle={(event) => setProviderDetailsOpen(event.currentTarget.open)}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700">
                    Add professional details <ChevronDown size={16} className="transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Business name">
                        <Input value={values.businessName} onChange={update('businessName')} maxLength={160} placeholder="Optional" />
                      </Field>
                      <Field label="Legal name">
                        <Input value={values.legalName} onChange={update('legalName')} minLength={2} maxLength={160} placeholder="Optional" />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Date of birth">
                        <Input type="date" value={values.dateOfBirth} onChange={update('dateOfBirth')} />
                      </Field>
                      <Field label="Professional title">
                        <Input value={values.professionalTitle} onChange={update('professionalTitle')} minLength={2} maxLength={120} placeholder="e.g. Home cleaning specialist" />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Business type">
                        <Input value={values.businessType} onChange={update('businessType')} maxLength={80} placeholder="Optional" />
                      </Field>
                      <Field label="Years of experience">
                        <Input type="number" value={values.experienceYears} onChange={update('experienceYears')} min={0} max={80} step={1} placeholder="0" />
                      </Field>
                    </div>
                    <Field label="About your work">
                      <Textarea value={values.bio} onChange={update('bio')} rows={3} maxLength={5000} placeholder="A short introduction (optional)" />
                    </Field>
                  </div>
                </details>
              </>
            )}
          </>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <Field label="Email address">
            <Input
              type="email"
              value={values.email}
              onChange={update('email')}
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
        )}

        {passwordModes.has(mode) && (
          <>
            <Field label="Password" hint={mode === 'login' ? undefined : '10+ characters; up to 72 UTF-8 bytes'}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={update('password')}
                  required
                  minLength={mode === 'login' ? 1 : 10}
                  maxLength={72}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'login' ? 'Enter your password' : 'At least 10 characters'}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            {(mode === 'register' || mode === 'reset') && (
              <Field label="Confirm password">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={values.confirmPassword}
                  onChange={update('confirmPassword')}
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                />
              </Field>
            )}
          </>
        )}

        {mode === 'reset' && !resetToken && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            This reset link is incomplete or expired. Request a new one to continue.
          </p>
        )}
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{notice}</p>}

        <Button
          type="submit"
          className="w-full"
          disabled={busy || (mode === 'reset' && !resetToken)}
        >
          {busy
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign in'
              : mode === 'register'
                ? role === 'provider' ? 'Create provider account' : 'Create account'
                : mode === 'forgot'
                  ? 'Send reset link'
                  : 'Reset password'}
          {!busy && <ArrowRight size={16} />}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-3 text-center">
        {mode === 'login' && (
          <button type="button" onClick={() => changeMode('forgot')} className="text-sm font-semibold text-slate-500 transition hover:text-emerald-700">
            Forgot your password?
          </button>
        )}
        {mode === 'login' && role !== 'admin' && (
          <button
            type="button"
            onClick={() => changeMode('register')}
            className="text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
          >
            New to Urbanmate? Create an account
          </button>
        )}
        {mode === 'register' && role !== 'admin' && (
          <button type="button" onClick={() => changeMode('login')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700">
            <ArrowLeft size={14} /> Back to sign in
          </button>
        )}
        {(mode === 'forgot' || mode === 'reset') && (
          <button type="button" onClick={() => changeMode('login')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700">
            <ArrowLeft size={14} /> Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
