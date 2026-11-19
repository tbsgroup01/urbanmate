import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  UserRound,
  Zap
} from 'lucide-react';
import { Brand, Button } from '../components/ui';
import { api, getErrorMessage, setAccessToken } from '../lib/api';

const accountTypes = [
  {
    id: 'customer',
    title: 'Customer',
    subtitle: 'I need services for my home',
    icon: UserRound
  },
  {
    id: 'provider',
    title: 'Service Partner',
    subtitle: 'I want to offer my services',
    icon: BriefcaseBusiness
  }
];

const customerPerks = [
  {
    icon: ShieldCheck,
    title: 'Verified & Background-Checked Pros',
    desc: 'Every specialist undergoes rigorous background screening and trade skill evaluation.'
  },
  {
    icon: Zap,
    title: 'Upfront, Transparent Rates',
    desc: 'Fixed standardized prices with zero unexpected add-ons or hidden charges.'
  },
  {
    icon: Star,
    title: '4.88★ Average Satisfaction',
    desc: 'Over 10,000+ completed home visits with dedicated quality assurance.'
  }
];

const providerPerks = [
  {
    icon: Zap,
    title: 'Earn More & Get Booked Fast',
    desc: 'Connect with verified homeowners in your local area without costly marketing.'
  },
  {
    icon: ShieldCheck,
    title: 'Next-Day Bank Settlements',
    desc: 'Guaranteed payouts deposited directly to your bank account with only 15% platform commission.'
  },
  {
    icon: Star,
    title: 'Work on Your Terms',
    desc: 'Full control of your schedule, service zones, and bookings.'
  }
];

export default function AuthPage({
  initialMode = 'login',
  initialRole = 'customer',
  resetToken = '',
  onSuccess,
  onResetComplete,
  onNavigateHome
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'reset'
  const [role, setRole] = useState(initialRole); // 'customer' | 'provider'
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

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
    setShowPassword(false);
  }

  function optionalValue(key) {
    const value = values[key]?.trim();
    return value ? { [key]: value } : {};
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'forgot') {
        await api.post('/auth/password/forgot', { email: values.email.trim() });
        setNotice('If an account exists for that email, password reset instructions have been sent.');
        return;
      }

      if (mode === 'reset') {
        if (!resetToken) {
          setError('This reset link is invalid or incomplete. Please request a new password reset email.');
          return;
        }
        if (values.password !== values.confirmPassword) {
          setError('Your passwords do not match.');
          return;
        }
        await api.post('/auth/password/reset', { token: resetToken, password: values.password });
        setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
        onResetComplete?.();
        switchMode('login');
        setNotice('Your password has been reset successfully! Please sign in with your new password.');
        return;
      }

      if (mode === 'register') {
        if (values.password !== values.confirmPassword) {
          setError('Your passwords do not match.');
          return;
        }
        if (values.password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }

        const body = {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
          ...optionalValue('phone')
        };

        let path = '/auth/register';
        if (role === 'provider') {
          path = '/auth/provider/register';
          Object.assign(body, {
            displayName: values.displayName.trim() || values.fullName.trim(),
            ...optionalValue('businessName'),
            ...optionalValue('legalName'),
            ...optionalValue('dateOfBirth'),
            ...optionalValue('professionalTitle'),
            ...optionalValue('businessType'),
            ...optionalValue('bio'),
            ...(values.experienceYears !== '' ? { experienceYears: Number(values.experienceYears) } : {})
          });
        }

        const session = await api.post(path, body);
        setAccessToken(session.accessToken);
        onSuccess?.(session.user);
        return;
      }

      // Default: login
      const session = await api.post('/auth/login', {
        email: values.email.trim(),
        password: values.password
      });
      setAccessToken(session.accessToken);
      onSuccess?.(session.user);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  // Quick helper to autofill demo credentials
  function fillDemo(email, password, roleChoice = 'customer') {
    setValues((prev) => ({
      ...prev,
      email,
      password,
      fullName: roleChoice === 'provider' ? 'Jane Plumbing Services' : 'Rajeev Aggarwal'
    }));
    setRole(roleChoice);
    setError('');
  }

  const perks = role === 'provider' ? providerPerks : customerPerks;

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-center">
      {/* Top Bar for easy navigation */}
      <div className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 group text-slate-600 hover:text-slate-900 transition"
          >
            <Brand />
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700 transition px-3 py-1.5 rounded-lg hover:bg-violet-50"
          >
            <ArrowLeft size={14} /> Back to marketplace
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-stretch">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center">
          
          {/* Left Hero / Brand Card (Desktop & Tablet) */}
          <div className="hidden lg:flex w-full lg:w-5/12 flex-col justify-between self-stretch rounded-3xl bg-gradient-to-br from-[#12092b] via-[#1f1142] to-[#0c1829] p-9 xl:p-12 text-white relative overflow-hidden shadow-2xl">
            {/* Ambient background glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-violet-200 mb-6">
                <Sparkles size={14} className="text-fuchsia-300" />
                <span>Urbanmate Trusted Marketplace</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
                {mode === 'register' && role === 'provider' ? (
                  <>Grow your service business with <span className="text-fuchsia-400">verified local bookings</span>.</>
                ) : (
                  <>Expert home care, <span className="text-fuchsia-400">delivered right</span> to your door.</>
                )}
              </h2>

              <p className="mt-4 text-sm xl:text-base text-violet-200/80 leading-relaxed max-w-md">
                {mode === 'register' && role === 'provider'
                  ? 'Join thousands of professional plumbers, cleaners, and electricians receiving quality bookings and instant payouts.'
                  : 'From sparkling deep cleaning to certified electrical repairs, book top-rated professionals in minutes.'}
              </p>

              {/* Value Perks List */}
              <div className="mt-8 space-y-4">
                {perks.map((perk, idx) => {
                  const Icon = perk.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3.5 bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                      <div className="p-2 rounded-xl bg-violet-500/20 text-fuchsia-300 shrink-0">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{perk.title}</h4>
                        <p className="text-xs text-violet-200/70 mt-0.5 leading-relaxed">{perk.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Testimonial Snippet */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-400 to-fuchsia-400 flex items-center justify-center font-bold text-slate-900 text-sm shadow-md">
                RA
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <span className="text-xs text-white/90 font-bold ml-1">5.0</span>
                </div>
                <p className="text-xs text-violet-200/80 italic mt-0.5">
                  &ldquo;Booking was instant and the pro was completely verified. Best home service experience yet!&rdquo;
                </p>
                <p className="text-[11px] font-semibold text-fuchsia-300 mt-1">Rajeev A. &bull; Verified Customer</p>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="w-full lg:w-7/12 max-w-xl">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 transition-all">
              
              {/* Header Mode Toggle (Sign In vs Create Account) */}
              {(mode === 'login' || mode === 'register') && (
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      mode === 'login'
                        ? 'bg-white text-violet-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      mode === 'register'
                        ? 'bg-white text-violet-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Title & Description */}
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {mode === 'login' && 'Welcome back to Urbanmate'}
                  {mode === 'register' && (role === 'provider' ? 'Partner with Urbanmate' : 'Join Urbanmate today')}
                  {mode === 'forgot' && 'Reset your password'}
                  {mode === 'reset' && 'Set a new password'}
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {mode === 'login' && 'Enter your credentials to access your account, bookings, and services.'}
                  {mode === 'register' && (role === 'provider'
                    ? 'Start taking on verified local jobs with top earnings and prompt payouts.'
                    : 'Create your free account to book top-tier professionals in seconds.')}
                  {mode === 'forgot' && 'Enter your registered email address and we’ll send you a password reset link.'}
                  {mode === 'reset' && 'Choose a strong password of at least 6 characters for your account.'}
                </p>
              </div>

              {/* Account Type Selector for Registration */}
              {mode === 'register' && (
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    I want to sign up as:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accountTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = role === type.id;
                      return (
                        <button
                          type="button"
                          key={type.id}
                          onClick={() => {
                            setRole(type.id);
                            setError('');
                            setNotice('');
                          }}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'border-violet-600 bg-violet-50/60 ring-2 ring-violet-600/10'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-bold ${isSelected ? 'text-violet-950' : 'text-slate-800'}`}>
                                {type.title}
                              </span>
                              {isSelected && <CheckCircle2 size={16} className="text-violet-700 shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{type.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Registration Fields */}
                {mode === 'register' && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={values.fullName}
                            onChange={update('fullName')}
                            required
                            minLength={2}
                            maxLength={120}
                            placeholder="e.g. Rajeev Sharma"
                            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                          />
                          <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={values.phone}
                            onChange={update('phone')}
                            placeholder="+91 98765 43210"
                            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                          />
                          <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Additional fields for Provider registration */}
                    {role === 'provider' && (
                      <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-4">
                        <div className="flex items-center gap-2 text-violet-900 font-bold text-xs uppercase tracking-wider">
                          <BriefcaseBusiness size={14} /> Professional Details
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Business or Public Display Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={values.displayName}
                            onChange={update('displayName')}
                            required
                            placeholder="e.g. Apex Plumbing & HVAC"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">This is the title customers will see on provider preference cards.</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Professional Title
                            </label>
                            <input
                              type="text"
                              value={values.professionalTitle}
                              onChange={update('professionalTitle')}
                              placeholder="e.g. Master Electrician"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Years of Experience
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={60}
                              value={values.experienceYears}
                              onChange={update('experienceYears')}
                              placeholder="e.g. 5"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                            />
                          </div>
                        </div>

                        {/* Expandable legal & bio section */}
                        <details
                          className="group border-t border-violet-200/60 pt-3"
                          open={providerDetailsOpen}
                          onToggle={(e) => setProviderDetailsOpen(e.currentTarget.open)}
                        >
                          <summary className="cursor-pointer text-xs font-bold text-violet-700 flex items-center justify-between">
                            <span>More details (Bio, Legal entity)</span>
                            <ChevronDown size={14} className="transition group-open:rotate-180" />
                          </summary>
                          <div className="mt-3 space-y-3 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Business Name (optional)</label>
                              <input
                                type="text"
                                value={values.businessName}
                                onChange={update('businessName')}
                                placeholder="Legal registered company name"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">About your work & expertise</label>
                              <textarea
                                rows={2}
                                value={values.bio}
                                onChange={update('bio')}
                                placeholder="Briefly describe your services, certifications, and experience."
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-600"
                              />
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </>
                )}

                {/* Email Field (Login, Register, Forgot) */}
                {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={values.email}
                        onChange={update('email')}
                        required
                        autoFocus={mode === 'login'}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                      />
                      <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Password Fields */}
                {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {mode === 'reset' ? 'New Password' : 'Password'} <span className="text-rose-500">*</span>
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs font-bold text-violet-700 hover:text-violet-800 transition"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={values.password}
                        onChange={update('password')}
                        required
                        minLength={mode === 'login' ? 1 : 6}
                        placeholder={mode === 'login' ? '••••••••' : 'At least 6 characters'}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                      />
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password (Register or Reset) */}
                {(mode === 'register' || mode === 'reset') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={values.confirmPassword}
                        onChange={update('confirmPassword')}
                        required
                        minLength={6}
                        placeholder="Re-enter your password"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                      />
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                    <span className="text-rose-500 mt-0.5">&bull;</span>
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                {/* Success Notice Banner */}
                {notice && (
                  <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="flex-1">{notice}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={busy || (mode === 'reset' && !resetToken)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold py-3 px-4 shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <span>Please wait…</span>
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Sign in to account'}
                        {mode === 'register' && (role === 'provider' ? 'Register as Service Partner' : 'Create Free Account')}
                        {mode === 'forgot' && 'Send password reset link'}
                        {mode === 'reset' && 'Save new password'}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Sign In links for Forgot / Reset */}
              {(mode === 'forgot' || mode === 'reset') && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-800"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              )}

              {/* Demo Quick-Fill Helper Pills */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2.5">
                  <span className="flex items-center gap-1"><Zap size={13} className="text-amber-500" /> Demo Quick Sign-in</span>
                  <span>Click to autofill</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      switchMode('login');
                      fillDemo('rocketremitt@gmail.com', 'Pass@123', 'customer');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200/80 text-[11px] font-semibold text-slate-600 text-left transition"
                  >
                    <span className="block font-bold text-slate-800">Customer Demo</span>
                    <span className="text-[10px] text-slate-400 truncate block">rocketremitt@gmail.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchMode('login');
                      fillDemo('jane@example.com', 'Pass@123', 'provider');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-violet-900 border border-slate-200/80 text-[11px] font-semibold text-slate-600 text-left transition"
                  >
                    <span className="block font-bold text-slate-800">Provider Demo</span>
                    <span className="text-[10px] text-slate-400 truncate block">jane@example.com</span>
                  </button>
                </div>
              </div>

              {/* Terms of Service notice */}
              <p className="mt-6 text-center text-[11px] text-slate-400 leading-normal">
                By continuing, you agree to Urbanmate’s{' '}
                <a href="#" onClick={(e) => e.preventDefault()} className="underline hover:text-slate-600">Terms of Service</a>
                {' '}and{' '}
                <a href="#" onClick={(e) => e.preventDefault()} className="underline hover:text-slate-600">Privacy Policy</a>.
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

