import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Broom,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Coins,
  Droplets,
  FileCheck2,
  FileText,
  Hourglass,
  IndianRupee,
  Layers,
  MapPin,
  Paintbrush,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Tv,
  UploadCloud,
  UserRound,
  Wallet,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageLoader,
  SectionHeading,
  Select,
  Textarea,
  currency
} from '../components/ui';
import EmailVerification from '../components/EmailVerification';
import { api, getErrorMessage, resolveMediaUrl } from '../lib/api';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const activeStatuses = ['confirmed', 'in_progress', 'provider_completed'];

function StatusBadge({ status }) {
  const tone = status === 'completed' ? 'violet'
    : ['cancelled', 'rejected'].includes(status) ? 'rose'
      : status === 'assigned' ? 'amber' : 'blue';
  return <Badge tone={tone}>{status?.replaceAll('_', ' ')}</Badge>;
}

function Overview({ user, onNavigate }) {
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bookingData, earningData] = await Promise.all([
        api.get('/bookings', { page: '1', limit: '100' }),
        api.get('/providers/me/earnings')
      ]);
      setBookings(bookingData);
      setEarnings(earningData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      api.get('/bookings', { page: '1', limit: '100' })
        .then(setBookings)
        .catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const requests = bookings.filter((booking) => booking.status === 'assigned');
  const active = bookings.filter((booking) => activeStatuses.includes(booking.status));
  const completed = bookings.filter((booking) => booking.status === 'completed');
  const currencyEntries = Object.entries(earnings?.currencies || {});
  const totalEarnings = currencyEntries.reduce(
    (sum, [, value]) => sum + Number(value.pending || 0) + Number(value.payable || 0) + Number(value.paid || 0),
    0
  );
  const payableTotal = currencyEntries.reduce((sum, [, value]) => sum + Number(value.payable || 0), 0);

  if (loading) return <PageLoader label="Loading your work overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const firstName = user?.fullName?.split(' ')[0] || 'Jane';
  const avatarInitials = user?.fullName?.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'JP';

  const statCards = [
    {
      title: 'New requests',
      value: requests.length,
      sub: 'Need your response',
      icon: CalendarDays,
      iconBg: 'bg-[#ffedd5] text-[#ea580c]',
      arrowColor: 'text-[#f97316]',
      border: 'border-amber-100/80',
      bg: 'bg-gradient-to-br from-white via-white to-amber-50/30',
      wave: 'text-[#fed7aa]/50',
      tab: 'requests'
    },
    {
      title: 'Active jobs',
      value: active.length,
      sub: 'Confirmed or underway',
      icon: Wrench,
      iconBg: 'bg-[#e0f2fe] text-[#0284c7]',
      arrowColor: 'text-[#0ea5e9]',
      border: 'border-sky-100/80',
      bg: 'bg-gradient-to-br from-white via-white to-sky-50/30',
      wave: 'text-[#bae6fd]/50',
      tab: 'active'
    },
    {
      title: 'Total earnings',
      value: currency(totalEarnings),
      sub: payableTotal > 0 ? `${currency(payableTotal)} ready to payout` : 'Across all jobs',
      icon: Wallet,
      iconBg: 'bg-[#ede9fe] text-[#7c3aed]',
      arrowColor: 'text-[#8b5cf6]',
      border: 'border-violet-100/80',
      bg: 'bg-gradient-to-br from-white via-white to-violet-50/30',
      wave: 'text-[#ddd6fe]/50',
      tab: 'earnings'
    },
    {
      title: 'Jobs completed',
      value: completed.length,
      sub: 'Service history',
      icon: BadgeCheck,
      iconBg: 'bg-[#f3e8ff] text-[#9333ea]',
      arrowColor: 'text-[#a855f7]',
      border: 'border-purple-100/80',
      bg: 'bg-gradient-to-br from-white via-white to-purple-50/30',
      wave: 'text-[#e9d5ff]/50',
      tab: 'history'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Profile / Work at a glance row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#ede9fe] text-lg font-black text-[#6d28d9] shadow-xs ring-1 ring-violet-200/60 overflow-hidden">
            {user?.avatarUrl ? (
              <img
                src={resolveMediaUrl(user.avatarUrl)}
                alt={user.fullName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }
                }}
              />
            ) : null}
            <span style={{ display: user?.avatarUrl ? 'none' : 'block' }}>
              {avatarInitials}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">YOUR WORK AT A GLANCE</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-[28px]">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
              Here’s what’s happening with your Urbanmate work today.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Wrench size={14} className="text-slate-700" /> My services
          </button>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Camera size={14} className="text-slate-700" /> Photo & profile
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ title, value, sub, icon: Icon, iconBg, arrowColor, border, bg, wave, tab }) => (
          <div
            key={title}
            onClick={() => onNavigate(tab)}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[26px] border ${border} ${bg} p-5 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer`}
          >
            {/* Smooth SVG bottom wave */}
            <svg
              className={`pointer-events-none absolute -bottom-0.5 -right-0.5 h-20 w-36 ${wave} transition-transform duration-300 group-hover:scale-105`}
              viewBox="0 0 144 80"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              <path d="M0,80 C35,80 55,50 85,42 C115,34 128,15 144,0 L144,80 Z" />
            </svg>

            <div className="relative z-10 flex items-start justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-2xl ${iconBg} shadow-xs`}>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className={`${arrowColor} transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}>
                <ArrowUpRight size={18} strokeWidth={2.4} />
              </span>
            </div>

            <div className="relative z-10 mt-5">
              <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{title}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row: Latest requests (Left) & Verification trust card (Right) */}
      <div className="grid gap-5 lg:grid-cols-12 items-stretch">
        {/* Left: Your latest requests */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] lg:col-span-8">
          {/* Subtle lavender bottom wave */}
          <svg
            className="pointer-events-none absolute -bottom-0.5 inset-x-0 h-16 w-full text-indigo-50/40"
            viewBox="0 0 600 60"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,60 C150,60 250,22 400,32 C500,40 550,55 600,60 L600,60 L0,60 Z" />
          </svg>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">NEXT UP</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">Your latest requests</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('requests')}
                className="text-xs font-bold text-violet-700 hover:text-violet-800 transition cursor-pointer"
              >
                See all →
              </button>
            </div>

            {requests.length ? (
              <div className="mt-4 divide-y divide-slate-100">
                {requests.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-3 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{booking.serviceNameSnapshot || booking.service?.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{new Date(booking.scheduledStart).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[160px] items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-slate-400">You’re all caught up. New requests will show here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Verification documents / Trust Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] lg:col-span-4">
          {/* Subtle mint bottom-right wave */}
          <svg
            className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-24 w-44 text-violet-100/40"
            viewBox="0 0 160 80"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,80 C50,80 80,42 120,32 C140,26 155,10 160,0 L160,80 Z" />
          </svg>

          <div className="relative z-10">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-600 border border-violet-100/80 shadow-xs">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </span>
            <p className="mt-5 text-sm font-medium leading-relaxed text-slate-500">
              Keep your services, availability, and verification documents up to date to build trust with customers.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Review profile <ArrowUpRight size={14} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingList({ mode }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setBookings(await api.get('/bookings', { page: '1', limit: '100' }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      api.get('/bookings', { page: '1', limit: '100' })
        .then(setBookings)
        .catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const visible = bookings.filter((booking) => mode === 'requests'
    ? booking.status === 'assigned'
    : mode === 'active'
      ? activeStatuses.includes(booking.status)
      : ['completed', 'cancelled', 'rejected'].includes(booking.status));

  async function action(bookingId, name, body) {
    setBusy(bookingId);
    setError('');
    try {
      await api.post(`/bookings/${bookingId}/${name}`, body);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  const headings = {
    requests: ['Booking requests', 'Review and respond to new service requests.'],
    active: ['Active jobs', 'The work you have accepted or started.'],
    history: ['Job history', 'A record of your completed and closed jobs.']
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">MY BOOKINGS</p>
        <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {headings[mode][0]}
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
          {headings[mode][1]}
        </p>
      </div>

      {loading ? (
        <PageLoader label="Loading jobs…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length ? (
        <div className="space-y-4">
          {visible.map((booking) => {
            const formattedDate = new Date(booking.scheduledStart).toLocaleString('en-US', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });

            const isHistory = mode === 'history';
            const isCompleted = booking.status === 'completed';
            const isCancelled = ['cancelled', 'rejected'].includes(booking.status);

            const waveColor = isHistory
              ? isCompleted
                ? 'text-violet-100/50'
                : 'text-rose-100/50'
              : 'text-purple-100/50';

            return (
              <div
                key={booking.id}
                className="relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition-all hover:shadow-md"
              >
                {/* Soft colored curved bottom wave */}
                <svg
                  className={`pointer-events-none absolute -bottom-1 -right-1 h-24 w-64 ${waveColor}`}
                  viewBox="0 0 240 80"
                  fill="currentColor"
                  preserveAspectRatio="none"
                >
                  <path d="M0,80 C60,80 100,35 160,30 C200,26 220,10 240,0 L240,80 Z" />
                </svg>

                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Purple Calendar Icon box */}
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
                      <CalendarDays size={22} strokeWidth={2.2} />
                    </div>

                    <div>
                      {/* Service Title and Status Badge */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                          {booking.serviceNameSnapshot || booking.service?.name}
                        </h3>
                        {isHistory ? (
                          isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200/80 px-3 py-0.5 text-xs font-bold text-violet-700 ml-1">
                              <Check size={12} strokeWidth={3} /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-3 py-0.5 text-xs font-bold text-rose-700 ml-1">
                              <X size={12} strokeWidth={3} /> Cancelled
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-bold text-purple-800 capitalize">
                            {booking.status === 'provider_completed' ? 'Provider Completed' : booking.status.replaceAll('_', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Booking Code and Date */}
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Booking {booking.bookingNumber} · <span className="font-semibold text-slate-700">{formattedDate}</span>
                      </p>

                      {/* Earning */}
                      <p className="mt-1.5 text-sm font-black text-slate-900">
                        {currency(booking.total, booking.currency || 'INR')}{' '}
                        <span className="text-xs font-normal text-slate-400">· Service earning</span>
                      </p>

                      {/* Customer info bar pill */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-slate-100 bg-[#f8f9fa] px-4 py-2.5 text-xs text-slate-700 shadow-2xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <UserRound size={14} className="text-slate-500" />
                          {booking.customer?.fullName || 'Customer'}
                        </span>
                        {booking.customer?.phone && (
                          <a href={`tel:${booking.customer.phone}`} className="flex items-center gap-1.5 font-bold text-purple-700 hover:underline">
                            <Phone size={14} className="text-purple-600" />
                            {booking.customer.phone}
                          </a>
                        )}
                        {booking.address && (
                          <span className="flex items-center gap-1.5 font-medium text-slate-600">
                            <MapPin size={14} className="text-rose-500" />
                            {booking.address.line1}{booking.address.city ? `, ${booking.address.city}` : ''} {booking.address.postalCode || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action or Status Pill on right */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
                    {isHistory ? (
                      isCompleted ? (
                        <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-violet-500 text-violet-600 bg-white shadow-xs">
                          <Check size={24} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-rose-500 text-rose-600 bg-white shadow-xs">
                          <X size={24} strokeWidth={2.5} />
                        </div>
                      )
                    ) : (
                      <>
                        {booking.status === 'assigned' && (
                          <>
                            <button
                              type="button"
                              disabled={busy === booking.id}
                              onClick={() => action(booking.id, 'accept')}
                              className="flex items-center gap-1.5 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 text-xs font-bold shadow-xs transition disabled:opacity-60 cursor-pointer"
                            >
                              <Check size={14} strokeWidth={2.5} /> Accept Request
                            </button>
                            <button
                              type="button"
                              disabled={busy === booking.id}
                              onClick={() => action(booking.id, 'reject', { reason: 'Unable to take this booking' })}
                              className="rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 text-xs font-bold transition disabled:opacity-60 cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={busy === booking.id}
                            onClick={() => action(booking.id, 'start')}
                            className="rounded-2xl bg-violet-700 hover:bg-violet-800 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition disabled:opacity-60 cursor-pointer"
                          >
                            Start job
                          </button>
                        )}
                        {booking.status === 'in_progress' && (
                          <button
                            type="button"
                            disabled={busy === booking.id}
                            onClick={() => action(booking.id, 'complete')}
                            className="rounded-2xl bg-violet-700 hover:bg-violet-800 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition disabled:opacity-60 cursor-pointer"
                          >
                            Mark complete
                          </button>
                        )}
                        {booking.status === 'provider_completed' && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50/90 px-4 py-2 text-xs font-bold text-amber-800 shadow-2xs">
                            <Clock3 size={15} className="text-amber-600" />
                            Waiting for customer confirmation
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={mode === 'requests' ? Bell : CalendarDays}
          title={mode === 'requests' ? 'No new requests' : mode === 'active' ? 'No active jobs' : 'Your history is clear'}
          description={mode === 'requests' ? 'When a customer books your services, you can respond here.' : 'Your bookings will appear here as they move through your schedule.'}
        />
      )}
    </div>
  );
}

function AvailabilityEditor() {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const current = await api.get('/providers/me/availability');
      setWindows(current.map((item) => ({
        weekday: item.weekday,
        startTime: item.startTime.slice(0, 5),
        endTime: item.endTime.slice(0, 5),
        timezone: item.timezone || 'Asia/Kolkata',
        isAvailable: item.isAvailable,
        effectiveFrom: item.effectiveFrom || null,
        effectiveUntil: item.effectiveUntil || null
      })));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function change(index, key, value) {
    setWindows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await api.put('/providers/me/availability', { availability: windows });
      setSaved(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  return (
    <div>
      <SectionHeading
        eyebrow="Set your hours"
        title="Availability"
        description="Tell customers when you can take on a booking. Times are saved in your selected timezone."
        action={<Button onClick={() => setWindows((current) => [...current, { weekday: 1, startTime: '09:00', endTime: '17:00', timezone: 'Asia/Kolkata', isAvailable: true }])}><Plus size={16} /> Add time window</Button>}
      />
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_0.7fr_0.7fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 sm:grid">
          <span>Day</span><span>From</span><span>Until</span><span>Timezone</span><span />
        </div>
        {windows.length ? windows.map((window, index) => (
          <div key={`${window.weekday}-${index}`} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[1.1fr_0.7fr_0.7fr_1fr_auto] sm:items-center">
            <Field label="Day"><Select value={window.weekday} onChange={(event) => change(index, 'weekday', Number(event.target.value))}>{weekdays.map((day, value) => <option value={value} key={day}>{day}</option>)}</Select></Field>
            <Field label="From"><Input type="time" value={window.startTime} onChange={(event) => change(index, 'startTime', event.target.value)} /></Field>
            <Field label="Until"><Input type="time" value={window.endTime} onChange={(event) => change(index, 'endTime', event.target.value)} /></Field>
            <Field label="Timezone"><Input value={window.timezone} onChange={(event) => change(index, 'timezone', event.target.value)} placeholder="Asia/Kolkata" /></Field>
            <div className="flex items-center gap-3 sm:mt-5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><input type="checkbox" checked={window.isAvailable} onChange={(event) => change(index, 'isAvailable', event.target.checked)} className="accent-violet-700" /> Available</label>
              <button type="button" onClick={() => setWindows((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-bold text-rose-600 hover:text-rose-800">Remove</button>
            </div>
          </div>
        )) : <EmptyState icon={Clock3} title="Set your working hours" description="Add one or more weekly time windows so eligible customers can find you." />}
      </Card>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {saved && <p role="status" className="mt-4 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-800">Your availability has been updated.</p>}
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save availability'} <Save size={15} /></Button></div>
    </div>
  );
}

function getServiceTheme(service) {
  const cat = (service.category?.name || service.name || '').toLowerCase();
  if (cat.includes('paint') || cat.includes('wall')) {
    return {
      icon: Paintbrush,
      badge: 'bg-orange-50 text-orange-700 border-orange-100',
      wave: 'text-orange-100/50'
    };
  }
  if (cat.includes('electr')) {
    return {
      icon: Zap,
      badge: 'bg-blue-50 text-blue-700 border-blue-100',
      wave: 'text-blue-100/50'
    };
  }
  if (cat.includes('plumb')) {
    return {
      icon: Droplets,
      badge: 'bg-violet-50 text-violet-700 border-violet-100',
      wave: 'text-violet-100/50'
    };
  }
  if (cat.includes('ac') || cat.includes('appliance')) {
    return {
      icon: Tv,
      badge: 'bg-sky-50 text-sky-700 border-sky-100',
      wave: 'text-sky-100/50'
    };
  }
  if (cat.includes('clean') || cat.includes('home')) {
    return {
      icon: Sparkles,
      badge: 'bg-purple-50 text-purple-700 border-purple-100',
      wave: 'text-purple-100/50'
    };
  }
  return {
    icon: Wrench,
    badge: 'bg-violet-50 text-violet-700 border-violet-100',
    wave: 'text-violet-100/50'
  };
}

function ProviderServices() {
  const [catalogServices, setCatalogServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({}); // map of serviceId -> { customPrice, isActive }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [allServices, myServices] = await Promise.all([
        api.get('/catalog/services', { limit: '100' }),
        api.get('/providers/me/services')
      ]);

      setCatalogServices(allServices || []);

      const map = {};
      (myServices || []).forEach((item) => {
        map[item.serviceId] = {
          customPrice: item.customPrice != null ? item.customPrice : '',
          isActive: item.isActive !== false
        };
      });
      setSelectedServices(map);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleService(serviceId) {
    setSelectedServices((prev) => {
      const copy = { ...prev };
      if (copy[serviceId]) {
        delete copy[serviceId];
      } else {
        copy[serviceId] = {
          customPrice: '',
          isActive: true
        };
      }
      return copy;
    });
    setMessage('');
  }

  function updatePrice(serviceId, customPrice) {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { isActive: true }),
        customPrice
      }
    }));
    setMessage('');
  }

  function updateActive(serviceId, isActive) {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { customPrice: '' }),
        isActive
      }
    }));
    setMessage('');
  }

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = Object.entries(selectedServices).map(([serviceId, conf]) => ({
        serviceId,
        customPrice: conf.customPrice !== '' && !isNaN(Number(conf.customPrice)) ? Number(conf.customPrice) : null,
        isActive: conf.isActive !== false
      }));

      await api.put('/providers/me/services', { services: payload });
      setMessage('Your services and pricing have been saved successfully.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const categories = useMemo(() => {
    const map = new Map();
    catalogServices.forEach((s) => {
      if (s.category) map.set(s.category.id, s.category.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [catalogServices]);

  const filteredServices = useMemo(() => {
    return catalogServices.filter((s) => {
      const matchesSearch = !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || s.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalogServices, search, selectedCategory]);

  const selectedCount = Object.keys(selectedServices).length;

  if (loading) return <PageLoader label="Loading marketplace services…" />;
  if (error && !catalogServices.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">MARKETPLACE OFFERINGS</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            My services & rates
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Select the services you provide to customers. You can use standard platform pricing or set your own competitive custom rate.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex items-center gap-2 rounded-2xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition disabled:opacity-60 cursor-pointer self-start sm:self-center shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          {busy ? 'Saving…' : 'Save services'}
        </button>
      </div>

      {/* Top Banner & Stats */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden rounded-[24px] border border-violet-200/80 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 p-4 sm:p-5 shadow-xs">
        <svg className="pointer-events-none absolute -bottom-1 inset-x-0 h-12 w-full text-violet-100/50" viewBox="0 0 600 50" fill="currentColor" preserveAspectRatio="none">
          <path d="M0,50 C150,50 250,15 400,25 C500,32 550,45 600,50 L600,50 L0,50 Z" />
        </svg>

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#8b5cf6] text-white shadow-xs">
            <Wrench size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {selectedCount} of {catalogServices.length} services selected
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Admins and customers will only see the services you enable below.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-2xl bg-[#6d28d9] hover:bg-[#5b21b6] text-white px-6 py-2.5 text-xs font-bold shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            {busy ? 'Saving…' : 'Save services'}
          </button>
        </div>
      </div>

      {message && <p role="status" className="rounded-2xl bg-violet-50 border border-violet-200 p-4 text-xs font-bold text-violet-800">{message}</p>}
      {error && <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700">{error}</p>}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services by title or description…"
            className="w-full rounded-[20px] border border-slate-200/90 bg-white py-3 pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-violet-500 focus:outline-none"
          />
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-60 rounded-[20px] border border-slate-200/90 bg-white py-3 px-4 text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All categories ({catalogServices.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => {
          const isSelected = Boolean(selectedServices[service.id]);
          const config = selectedServices[service.id] || { customPrice: '', isActive: true };
          const theme = getServiceTheme(service);
          const CategoryIcon = theme.icon;

          return (
            <div
              key={service.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-[26px] border bg-white p-5 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition-all ${
                isSelected ? 'border-slate-200/90 ring-1 ring-slate-100' : 'border-slate-100 opacity-75'
              }`}
            >
              {/* Top-right subtle pastel wave */}
              <svg
                className={`pointer-events-none absolute -top-1 -right-1 h-20 w-36 ${theme.wave}`}
                viewBox="0 0 144 80"
                fill="currentColor"
                preserveAspectRatio="none"
              >
                <path d="M0,0 C35,0 55,30 85,38 C115,46 128,65 144,80 L144,0 Z" />
              </svg>

              <div className="relative z-10">
                {/* Category badge & checkbox */}
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${theme.badge}`}>
                    <CategoryIcon size={12} strokeWidth={2.4} />
                    {service.category?.name || 'SERVICE'}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition shadow-xs cursor-pointer ${
                      isSelected ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                    }`}
                    aria-label={isSelected ? 'Deselect service' : 'Select service'}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </button>
                </div>

                {/* Service Name */}
                <h4 className="mt-3 text-base font-extrabold text-slate-900 tracking-tight line-clamp-1" title={service.name}>
                  {service.name}
                </h4>

                {/* Description */}
                <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-2 min-h-[32px] leading-relaxed">
                  {service.description || 'Professional doorstep service by verified specialists.'}
                </p>

                {/* Standard platform rate */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Standard platform rate</span>
                  <span className="font-extrabold text-slate-900 text-sm">{currency(service.basePrice, 'INR')}</span>
                </div>

                {/* Your Price Input */}
                <div className="mt-3 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Your price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(service.basePrice || '')}
                    value={config.customPrice !== '' ? config.customPrice : (service.basePrice != null ? service.basePrice : '')}
                    onChange={(e) => updatePrice(service.id, e.target.value)}
                    className="w-28 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-right text-sm font-bold text-slate-800 shadow-2xs focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active status */}
              <div className="relative z-10 mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-slate-600">Active status</span>
                <button
                  type="button"
                  onClick={() => updateActive(service.id, !config.isActive)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                    isSelected && config.isActive !== false
                      ? 'bg-[#ede9fe] text-[#6d28d9]'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isSelected && config.isActive !== false ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setEarnings(await api.get('/providers/me/earnings'));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader label="Loading your earnings…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const currencies = Object.entries(earnings?.currencies || {});
  const items = earnings?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-700">PROVIDER WORKSPACE</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Your jobs, schedule, and business — all in one place.</p>
        </div>
        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">YOUR BUSINESS</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Earnings & payouts</h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            A clear breakdown of booking earnings, available balances, and settlement ledger.
          </p>
        </div>
      </div>

      {currencies.length ? (
        <div className="space-y-4">
          {currencies.map(([code, value]) => {
            const total = Number(value.pending || 0) + Number(value.payable || 0) + Number(value.paid || 0);
            return (
              <div
                key={code}
                className="relative overflow-hidden rounded-[28px] border border-purple-100/70 bg-gradient-to-r from-purple-50/20 via-white to-purple-50/30 p-6 sm:p-7 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-purple-200/80 bg-purple-50 text-purple-600 shadow-xs">
                      <Wallet size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-purple-900/60">{code} EARNINGS</p>
                      <p className="mt-0.5 text-3xl font-black text-slate-900">{currency(total, code)}</p>
                    </div>
                  </div>

                  {/* 3D Wallet Graphic */}
                  <div className="hidden sm:flex items-center justify-end relative pr-6">
                    <div className="relative">
                      {/* Floating Rupee Coin */}
                      <div className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-black text-amber-950 shadow-md ring-2 ring-white">
                        ₹
                      </div>
                      {/* Cute Wallet Container */}
                      <div className="relative flex h-14 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 p-2 shadow-lg shadow-purple-500/25 ring-4 ring-purple-100/60">
                        {/* Wallet flap & clasp */}
                        <div className="absolute right-1 top-4 h-6 w-5 rounded-l-lg bg-amber-400 shadow-xs flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-amber-700/60" />
                        </div>
                        <Wallet size={26} className="text-white/80" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Sub-stat Cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 border-t border-purple-50/80 pt-5">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f5f3ff] border border-[#ede9fe] p-3.5 shadow-2xs">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
                      <Coins size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">Available to payout</p>
                      <p className="text-base font-black text-violet-700">{currency(value.payable, code)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] p-3.5 shadow-2xs">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                      <Hourglass size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">Pending in-progress</p>
                      <p className="text-base font-black text-amber-700">{currency(value.pending, code)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#f5f3ff] border border-[#ede9fe] p-3.5 shadow-2xs">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700">
                      <Check size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">Paid out</p>
                      <p className="text-base font-black text-slate-900">{currency(value.paid, code)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title="Your first earning is on its way"
          description="Once your first completed booking is recorded, your earnings will be tracked here."
        />
      )}

      {/* Itemized Service Earnings Ledger */}
      <div className="mt-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Service earnings ledger</h3>
            <p className="text-xs text-slate-500">Every completed job credited to your provider balance.</p>
          </div>
          {items.length > 0 && (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-purple-50 border border-purple-200/80 px-3 py-1 text-xs font-bold text-purple-700">
              <Layers size={13} />
              {items.length} {items.length === 1 ? 'transaction' : 'transactions'}
            </span>
          )}
        </div>

        {items.length ? (
          <div className="space-y-3.5">
            {items.map((item) => {
              const isPayable = item.status === 'payable';
              const isPending = item.status === 'pending';
              const isReversed = item.status === 'reversed';

              const waveColor = isPayable
                ? 'text-violet-100/50'
                : isPending
                ? 'text-amber-100/50'
                : 'text-rose-100/50';

              const iconBoxClass = isPayable
                ? 'bg-violet-100 text-violet-700'
                : isPending
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700';

              const formattedDate = new Date(item.completedAt || item.scheduledStart || item.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              });

              const isCleaning = (item.serviceName || '').toLowerCase().includes('clean');

              return (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition hover:shadow-md"
                >
                  {/* Soft colored bottom wave */}
                  <svg
                    className={`pointer-events-none absolute -bottom-1 -right-1 h-20 w-60 ${waveColor}`}
                    viewBox="0 0 240 80"
                    fill="currentColor"
                    preserveAspectRatio="none"
                  >
                    <path d="M0,80 C60,80 100,35 160,30 C200,26 220,10 240,0 L240,80 Z" />
                  </svg>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconBoxClass} shadow-xs`}>
                        {isCleaning ? <Broom size={20} /> : <Zap size={20} />}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black tracking-tight text-slate-900">
                            {item.serviceName || 'Service booking'}
                          </h4>
                          {isPending && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                              Pending Job
                            </span>
                          )}
                          {isReversed && (
                            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                              Reversed
                            </span>
                          )}
                          {isPayable && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                              Available For Payout
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Booking {item.bookingNumber} · <span className="font-semibold text-slate-700">{formattedDate}</span>
                        </p>

                        {item.customerName && (
                          <p className="mt-1 text-xs text-slate-400">
                            Customer: <span className="font-semibold text-slate-700">{item.customerName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-base sm:text-lg font-black text-violet-700">
                        +{currency(item.amount, item.currency)}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400">
                        {isPayable ? 'Ready in balance' : isPending ? 'Awaiting completion' : 'Refunded'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
            <p className="text-sm font-bold text-slate-700">No earnings transactions yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Complete a service job and have the customer confirm completion to record your first earning.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-purple-100/80 bg-purple-50/40 p-5 shadow-2xs">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-purple-700 border border-purple-100 shadow-xs">
          <FileText size={18} strokeWidth={2.2} />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">Transparent & prompt settlements</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Provider earnings are recorded automatically upon completed services. Payout balances are scheduled for direct transfer to your registered account.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProviderProfile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setProfile(await api.get('/providers/me/profile'));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function update(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp|gif)$/i)) {
      setAvatarError('Please select a PNG, JPG, WebP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile photo must be 5MB or less.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarError('');
    setAvatarMessage('');

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const res = await api.post('/providers/me/avatar', { dataUrl });
      const newAvatarUrl = res.avatarUrl;
      setProfile((current) => ({ ...current, avatarUrl: newAvatarUrl }));
      setAvatarMessage('Profile photo updated successfully!');
      if (onUserUpdate) {
        onUserUpdate({ ...user, avatarUrl: newAvatarUrl });
      }
    } catch (requestError) {
      setAvatarError(getErrorMessage(requestError));
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api.patch('/providers/me/profile', {
        displayName: profile.displayName,
        businessName: profile.businessName || null,
        professionalTitle: profile.professionalTitle || null,
        bio: profile.bio || null,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {})
      });
      setProfile((current) => ({ ...current, ...updated }));
      setMessage('Your professional profile has been saved.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const contentType = file.type;
      const documentType = event.target.form?.elements.documentType?.value || 'identity_front';
      const upload = await api.post('/providers/me/documents/upload', {
        documentType,
        contentType,
        fileSizeBytes: file.size
      });
      const response = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: upload.headers,
        body: file
      });
      if (!response.ok) throw new Error('The secure document upload did not complete.');
      await api.post(`/providers/me/documents/${upload.document.id}/complete`, {});
      setMessage('Your document was uploaded and is waiting for review.');
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  if (loading) return <PageLoader />;
  if (error && !profile) return <ErrorState message={error} onRetry={load} />;
  return (
    <div>
      <SectionHeading eyebrow="Your professional profile" title="Profile & documents" description="Help customers understand the services and experience you bring." />
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6 space-y-5">
          {/* Profile Photo Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-100">
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={resolveMediaUrl(profile.avatarUrl)}
                  alt={profile.displayName}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-violet-300 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'grid';
                    }
                  }}
                />
              ) : null}
              <div
                style={{ display: profile.avatarUrl ? 'none' : 'grid' }}
                className="h-20 w-20 place-items-center rounded-2xl bg-violet-50 text-xl font-black text-violet-800 border-2 border-dashed border-violet-200"
              >
                {profile.displayName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P'}
              </div>
              <label
                className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-violet-600 text-white shadow-md hover:bg-violet-700 transition"
                title="Change photo"
              >
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={uploadAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
              <h3 className="font-extrabold text-slate-900">Profile photo</h3>
              <p className="text-xs text-slate-500">
                A clear profile picture helps customers identify you and builds confidence. JPEG, PNG, or WebP up to 5 MB.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50/70 px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-100 transition">
                  <UploadCloud size={14} />
                  {uploadingAvatar ? 'Uploading…' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={uploadAvatar}
                    disabled={uploadingAvatar}
                  />
                </label>
                {avatarMessage && <span className="text-xs font-bold text-violet-700">{avatarMessage}</span>}
              </div>
              {avatarError && <p className="text-xs text-rose-600 font-medium">{avatarError}</p>}
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name"><Input value={profile.displayName || ''} onChange={(event) => update('displayName', event.target.value)} required minLength={2} /></Field>
              <Field label="Professional title"><Input value={profile.professionalTitle || ''} onChange={(event) => update('professionalTitle', event.target.value)} placeholder="e.g. Home cleaning specialist" /></Field>
            </div>
            <Field label="Business name"><Input value={profile.businessName || ''} onChange={(event) => update('businessName', event.target.value)} placeholder="Optional" /></Field>
            <Field label="About your work"><Textarea rows={5} value={profile.bio || ''} onChange={(event) => update('bio', event.target.value)} maxLength={5000} placeholder="Share your experience, approach and the work you enjoy…" /></Field>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <Badge tone={profile.approvalStatus === 'approved' ? 'violet' : 'amber'}>{profile.approvalStatus || 'pending review'}</Badge>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'} <Save size={15} /></Button>
            </div>
          </form>
        </Card>
        <div className="space-y-5">
          <EmailVerification user={user} onVerified={onUserUpdate} />
          <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h3 className="font-extrabold text-slate-900">Verification documents</h3><p className="mt-1 text-xs text-slate-500">Private, secure upload · JPEG, PNG or PDF up to 10 MB</p></div><ShieldCheck className="text-violet-700" size={20} /></div>
          <div className="mt-4 space-y-2">
            {(profile.documents || []).map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div><p className="text-xs font-bold capitalize text-slate-700">{document.documentType.replaceAll('_', ' ')}</p><p className="mt-1 text-[10px] text-slate-400">Uploaded {new Date(document.createdAt).toLocaleDateString()}</p></div>
                <Badge tone={document.status === 'approved' ? 'violet' : document.status === 'rejected' ? 'rose' : 'amber'}>{document.status}</Badge>
              </div>
            ))}
            {!profile.documents?.length && <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Identity verification helps customers book with confidence. Your documents are kept private.</p>}
          </div>
          <form className="mt-5 space-y-3">
            <Field label="Document type">
              <Select name="documentType" defaultValue="identity_front">
                <option value="identity_front">Identity — front</option>
                <option value="identity_back">Identity — back</option>
                <option value="professional_license">Professional license</option>
                <option value="proof_of_address">Proof of address</option>
                <option value="business_license">Business license</option>
              </Select>
            </Field>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/40 px-4 py-3 text-sm font-bold text-violet-800 hover:bg-violet-50">
              <Plus size={16} /> {uploading ? 'Uploading securely…' : 'Choose a document'}
              <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={uploadDocument} disabled={uploading} />
            </label>
          </form>
          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          {message && <p role="status" className="mt-3 rounded-xl bg-violet-50 p-3 text-xs text-violet-800">{message}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProviderPortal({ user, active, onTabChange, onUserUpdate }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function check() {
      api.get('/bookings', { page: '1', limit: '100' })
        .then((items) => {
          const list = Array.isArray(items) ? items : (items?.items || []);
          const pending = list.filter((b) => b.status === 'assigned').length;
          setPendingCount(pending);
        })
        .catch(() => {});
    }
    check();
    const interval = setInterval(check, 3500);
    return () => clearInterval(interval);
  }, []);

  const content = useMemo(() => {
    if (active === 'requests' || active === 'active' || active === 'history') return <BookingList mode={active} />;
    if (active === 'services') return <ProviderServices />;
    if (active === 'availability') return <AvailabilityEditor />;
    if (active === 'earnings') return <Earnings />;
    if (active === 'profile') return <ProviderProfile user={user} onUserUpdate={onUserUpdate} />;
    return <Overview user={user} onNavigate={onTabChange} />;
  }, [active, user, onTabChange, onUserUpdate]);

  return (
    <div>
      {pendingCount > 0 && active !== 'requests' && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border-2 border-violet-400 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 p-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-700 text-white shadow-xs">
              <Bell size={20} />
            </span>
            <div>
              <h3 className="font-black text-sm text-violet-950">
                You have {pendingCount} new service booking request{pendingCount > 1 ? 's' : ''} waiting!
              </h3>
              <p className="text-xs text-violet-800">Review customer details and accept the request to secure this appointment.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => onTabChange('requests')}>
            Review &amp; Accept →
          </Button>
        </div>
      )}

      {user?.providerApprovalStatus === 'pending' && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <div>
              <h3 className="font-extrabold text-amber-950">Application Pending Review</h3>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Your provider account is awaiting administrator approval. You can still set up your profile, working hours, and upload verification documents in the &quot;Profile &amp; documents&quot; tab. Once approved by an admin, you will be able to receive booking requests and go online.
              </p>
            </div>
          </div>
        </div>
      )}
      {content}
    </div>
  );
}
