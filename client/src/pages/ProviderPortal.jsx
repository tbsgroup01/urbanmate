import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  FileCheck2,
  Plus,
  Save,
  ShieldCheck,
  Wallet,
  Wrench
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
import { api, getErrorMessage } from '../lib/api';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const activeStatuses = ['confirmed', 'in_progress', 'provider_completed'];

function StatusBadge({ status }) {
  const tone = status === 'completed' ? 'green'
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
  useEffect(() => { load(); }, []);

  const requests = bookings.filter((booking) => booking.status === 'assigned');
  const active = bookings.filter((booking) => activeStatuses.includes(booking.status));
  const currencyEntries = Object.entries(earnings?.currencies || {});
  const pendingTotal = currencyEntries.reduce((sum, [, value]) => sum + Number(value.pending || 0), 0);

  if (loading) return <PageLoader label="Loading your work overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-7">
      <SectionHeading eyebrow="Your work at a glance" title={`Good to see you, ${user.fullName?.split(' ')[0] || 'partner'}.`} description="Here’s what’s happening with your Urbanmate work today." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'New requests', value: requests.length, sub: 'Need your response', icon: CalendarDays, color: 'bg-amber-50 text-amber-700', tab: 'requests' },
          { title: 'Active jobs', value: active.length, sub: 'Confirmed or underway', icon: Wrench, color: 'bg-sky-50 text-sky-700', tab: 'active' },
          { title: 'Pending earnings', value: currency(pendingTotal), sub: 'Across all currencies', icon: Wallet, color: 'bg-emerald-50 text-emerald-700', tab: 'earnings' },
          { title: 'Jobs completed', value: bookings.filter((booking) => booking.status === 'completed').length, sub: 'Service history', icon: BadgeCheck, color: 'bg-violet-50 text-violet-700', tab: 'history' }
        ].map(({ title, value, sub, icon: Icon, color, tab }) => (
          <Card key={title} className="p-5">
            <div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon size={19} /></span><button type="button" onClick={() => onNavigate(tab)} className="text-slate-400 hover:text-emerald-700"><ArrowUpRight size={17} /></button></div>
            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">Next up</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">Your latest requests</h2></div><button type="button" onClick={() => onNavigate('requests')} className="text-xs font-bold text-emerald-700">See all →</button></div>
          {requests.length ? (
            <div className="divide-y divide-slate-100">
              {requests.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between gap-3 py-3">
                  <div><p className="text-sm font-bold text-slate-800">{booking.serviceNameSnapshot || booking.service?.name}</p><p className="mt-1 text-xs text-slate-400">{new Date(booking.scheduledStart).toLocaleString()}</p></div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-slate-400">You’re all caught up. New requests will show here.</p>}
        </Card>
        <Card className="bg-[#173f32] p-6 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-emerald-200"><ShieldCheck size={21} /></span>
          <h2 className="mt-4 text-lg font-extrabold">Your profile is your first impression.</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50/70">Keep your services, availability, and verification documents up to date to build trust with customers.</p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => onNavigate('profile')}>Review profile <ArrowUpRight size={14} /></Button>
        </Card>
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
  useEffect(() => { load(); }, []);

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
    <div>
      <SectionHeading eyebrow="My bookings" title={headings[mode][0]} description={headings[mode][1]} />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length ? (
        <div className="space-y-3">
          {visible.map((booking) => (
            <Card key={booking.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarDays size={19} /></span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-slate-900">{booking.serviceNameSnapshot || booking.service?.name}</h3><StatusBadge status={booking.status} /></div>
                    <p className="mt-1 text-xs text-slate-500">{booking.bookingNumber} · {new Date(booking.scheduledStart).toLocaleString()}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{currency(booking.total, booking.currency)} <span className="font-normal text-slate-400">· Customer booking</span></p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {booking.status === 'assigned' && (
                    <>
                      <Button size="sm" disabled={busy === booking.id} onClick={() => action(booking.id, 'accept')}><Check size={14} /> Accept</Button>
                      <Button size="sm" variant="danger" disabled={busy === booking.id} onClick={() => action(booking.id, 'reject', { reason: 'Unable to take this booking' })}>Decline</Button>
                    </>
                  )}
                  {booking.status === 'confirmed' && <Button size="sm" disabled={busy === booking.id} onClick={() => action(booking.id, 'start')}>Start job</Button>}
                  {booking.status === 'in_progress' && <Button size="sm" disabled={busy === booking.id} onClick={() => action(booking.id, 'complete')}>Mark complete</Button>}
                  {booking.status === 'provider_completed' && <span className="self-center text-xs font-semibold text-amber-700">Waiting for customer confirmation</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={mode === 'requests' ? Bell : CalendarDays} title={mode === 'requests' ? 'No new requests' : mode === 'active' ? 'No active jobs' : 'Your history is clear'} description={mode === 'requests' ? 'When a customer books your services, you can respond here.' : 'Your bookings will appear here as they move through your schedule.'} />}
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
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><input type="checkbox" checked={window.isAvailable} onChange={(event) => change(index, 'isAvailable', event.target.checked)} className="accent-emerald-700" /> Available</label>
              <button type="button" onClick={() => setWindows((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-bold text-rose-600 hover:text-rose-800">Remove</button>
            </div>
          </div>
        )) : <EmptyState icon={Clock3} title="Set your working hours" description="Add one or more weekly time windows so eligible customers can find you." />}
      </Card>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {saved && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Your availability has been updated.</p>}
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save availability'} <Save size={15} /></Button></div>
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
  return (
    <div>
      <SectionHeading eyebrow="Your business" title="Earnings" description="A clear breakdown of booking earnings and settlement status." />
      {currencies.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {currencies.map(([code, value]) => (
            <Card key={code} className="p-6">
              <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{code} earnings</p><p className="mt-1 text-2xl font-black text-slate-900">{currency(Number(value.pending || 0) + Number(value.payable || 0) + Number(value.paid || 0), code)}</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Wallet size={21} /></span></div>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                {[['Pending', value.pending], ['Available', value.payable], ['Paid out', value.paid]].map(([label, amount]) => <div key={label}><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-800">{currency(amount, code)}</p></div>)}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={Wallet} title="Your first earning is on its way" description="Once your first completed booking is paid, your earnings will be tracked here." />}
      <Card className="mt-5 flex flex-col gap-4 bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><FileCheck2 size={19} /></span>
        <div><h3 className="text-sm font-extrabold text-slate-800">Transparent earnings</h3><p className="mt-1 text-xs leading-5 text-slate-500">Provider earnings are recorded against completed, paid bookings. Contact support if a settlement needs review.</p></div>
      </Card>
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

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api.patch('/providers/me/profile', {
        displayName: profile.displayName,
        businessName: profile.businessName || null,
        professionalTitle: profile.professionalTitle || null,
        bio: profile.bio || null
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
        <Card className="p-5 sm:p-6">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name"><Input value={profile.displayName || ''} onChange={(event) => update('displayName', event.target.value)} required minLength={2} /></Field>
              <Field label="Professional title"><Input value={profile.professionalTitle || ''} onChange={(event) => update('professionalTitle', event.target.value)} placeholder="e.g. Home cleaning specialist" /></Field>
            </div>
            <Field label="Business name"><Input value={profile.businessName || ''} onChange={(event) => update('businessName', event.target.value)} placeholder="Optional" /></Field>
            <Field label="About your work"><Textarea rows={5} value={profile.bio || ''} onChange={(event) => update('bio', event.target.value)} maxLength={5000} placeholder="Share your experience, approach and the work you enjoy…" /></Field>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <Badge tone={profile.approvalStatus === 'approved' ? 'green' : 'amber'}>{profile.approvalStatus || 'pending review'}</Badge>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'} <Save size={15} /></Button>
            </div>
          </form>
        </Card>
        <div className="space-y-5">
          <EmailVerification user={user} onVerified={onUserUpdate} />
          <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h3 className="font-extrabold text-slate-900">Verification documents</h3><p className="mt-1 text-xs text-slate-500">Private, secure upload · JPEG, PNG or PDF up to 10 MB</p></div><ShieldCheck className="text-emerald-700" size={20} /></div>
          <div className="mt-4 space-y-2">
            {(profile.documents || []).map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div><p className="text-xs font-bold capitalize text-slate-700">{document.documentType.replaceAll('_', ' ')}</p><p className="mt-1 text-[10px] text-slate-400">Uploaded {new Date(document.createdAt).toLocaleDateString()}</p></div>
                <Badge tone={document.status === 'approved' ? 'green' : document.status === 'rejected' ? 'rose' : 'amber'}>{document.status}</Badge>
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
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">
              <Plus size={16} /> {uploading ? 'Uploading securely…' : 'Choose a document'}
              <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={uploadDocument} disabled={uploading} />
            </label>
          </form>
          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          {message && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProviderPortal({ user, active, onTabChange, onUserUpdate }) {
  const content = useMemo(() => {
    if (active === 'requests' || active === 'active' || active === 'history') return <BookingList mode={active} />;
    if (active === 'availability') return <AvailabilityEditor />;
    if (active === 'earnings') return <Earnings />;
    if (active === 'profile') return <ProviderProfile user={user} onUserUpdate={onUserUpdate} />;
    return <Overview user={user} onNavigate={onTabChange} />;
  }, [active, user, onTabChange, onUserUpdate]);
  return content;
}
