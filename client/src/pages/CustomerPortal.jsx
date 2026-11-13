import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  House,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  X
} from 'lucide-react';
import AddressEditor from '../components/AddressEditor';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageLoader,
  SectionHeading,
  Select,
  Textarea,
  currency
} from '../components/ui';
import { api, getErrorMessage } from '../lib/api';

const serviceIcon = (name = '') => {
  const normalized = name.toLowerCase();
  if (normalized.includes('clean')) return Sparkles;
  if (normalized.includes('plumb') || normalized.includes('water')) return Wrench;
  if (normalized.includes('electric')) return Sparkles;
  if (normalized.includes('home')) return House;
  return Wrench;
};

const categoryColors = [
  'from-emerald-100 to-lime-50 text-emerald-800',
  'from-amber-100 to-orange-50 text-amber-800',
  'from-sky-100 to-cyan-50 text-sky-800',
  'from-violet-100 to-fuchsia-50 text-violet-800'
];

function useCities() {
  const [cities, setCities] = useState([]);
  useEffect(() => {
    api.get('/catalog/cities', { limit: '100' }).then(setCities).catch(() => setCities([]));
  }, []);
  return cities;
}

function ServiceCard({ service, index, onClick }) {
  const Icon = serviceIcon(service.name);
  return (
    <button type="button" onClick={onClick} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5">
      <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${categoryColors[index % categoryColors.length]}`}>
        <div className="absolute right-4 top-4 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-slate-600">LOCAL PROS</div>
        <span className="grid h-[74px] w-[74px] place-items-center rounded-[26px] bg-white/80 shadow-sm transition group-hover:rotate-[-5deg] group-hover:scale-105">
          <Icon size={34} strokeWidth={1.6} />
        </span>
        <div className="absolute -bottom-5 left-5 grid h-10 w-10 place-items-center rounded-xl border border-slate-100 bg-white text-amber-500 shadow-sm"><Star size={16} fill="currentColor" /></div>
      </div>
      <div className="p-5 pt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{service.category?.name || 'HOME SERVICE'}</p>
        <h3 className="mt-1.5 line-clamp-1 text-base font-extrabold text-slate-900">{service.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{service.shortDescription || service.description || 'Carefully matched professionals, ready when you need them.'}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-extrabold text-slate-900">from {currency(service.effectivePrice ?? service.basePrice, service.currency)}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:gap-2">View <ArrowRight size={14} /></span>
        </div>
      </div>
    </button>
  );
}

function CustomerHome({ user, onSignIn, onOpenService, onTabChange }) {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    api.get('/catalog/categories', { limit: '100' })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      api.get('/catalog/services', {
        limit: '12',
        ...(query.trim() ? { q: query.trim() } : {}),
        ...(categoryId ? { categoryId } : {})
      }).then((items) => {
        if (active) setServices(items);
      }).catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, categoryId]);

  useEffect(() => {
    if (!user) return;
    api.get('/bookings', { page: '1', limit: '100' })
      .then((items) => setBookingCount(items.length))
      .catch(() => setBookingCount(0));
  }, [user]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#173f32] px-6 py-7 text-white sm:px-9 sm:py-9">
        <div className="absolute -right-10 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-2 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative z-10 grid items-center gap-7 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">{user ? `A little easier today, ${user.fullName?.split(' ')[0] || 'friend'}` : 'A good day to get things done'}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Home care, without<br className="hidden sm:block" /> the to-do list.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/75">From quick fixes to a full reset, find the right local help for your home.</p>
            <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-black/10">
              <Search size={19} className="ml-2 shrink-0 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What can we help with today?" className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
              <Button size="sm" onClick={() => document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' })}>Find a pro</Button>
            </div>
          </div>
          <div className="hidden min-w-[210px] rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur md:block">
            <div className="flex items-center justify-between text-emerald-100"><span className="text-xs font-bold uppercase tracking-wider">Your home dashboard</span><House size={16} /></div>
            <div className="mt-5 flex items-end justify-between">
              <div><p className="text-4xl font-black">{bookingCount}</p><p className="mt-1 text-xs text-emerald-100/70">bookings on your account</p></div>
              <button type="button" onClick={() => onTabChange('bookings')} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-800 transition hover:scale-105"><ArrowUpRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">Browse by need</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">What needs a hand?</h2></div>
          {categories.length > 4 && <button type="button" onClick={() => onTabChange('services')} className="text-sm font-bold text-emerald-700 hover:text-emerald-900">All categories <ChevronRight size={15} className="inline" /></button>}
        </div>
        {categories.length ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button type="button" onClick={() => setCategoryId('')} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${!categoryId ? 'bg-emerald-800 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300'}`}>Everything</button>
            {categories.slice(0, 7).map((category, index) => (
              <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition ${categoryId === category.id ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'}`}>
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${['bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500'][index % 4]}`} />{category.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['Cleaning', 'Plumbing', 'Electrical', 'Appliance care'].map((name, index) => (
              <button key={name} onClick={() => setQuery(name)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-200 hover:shadow-sm">
                <span className={`mb-3 block h-8 w-8 rounded-xl bg-gradient-to-br ${categoryColors[index]}`} />
                <span className="text-sm font-bold text-slate-700">{name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section id="customer-services">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">Handpicked for your home</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{query ? `Results for “${query}”` : 'Popular services'}</h2></div>
          {services.length > 0 && <span className="text-xs font-semibold text-slate-400">{services.length} options</span>}
        </div>
        {loading ? <PageLoader label="Finding the right local services…" /> : error ? <ErrorState message={error} onRetry={() => setQuery((value) => `${value} `)} /> : services.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onClick={() => user ? onOpenService(service.id) : onSignIn()} />)}
          </div>
        ) : <EmptyState icon={CircleHelp} title="No services found" description="Try a different search or check back as more local services are added." />}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Good people, thoughtfully matched', text: 'Providers are reviewed and verified before they join the network.' },
          { icon: Clock3, title: 'Your time matters', text: 'Choose a time that works for your day and see who is available.' },
          { icon: Star, title: 'Care in the details', text: 'Real customer reviews help every great local expert stand out.' }
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="flex gap-4 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={19} /></span>
            <div><h3 className="text-sm font-bold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>
          </Card>
        ))}
      </section>
    </div>
  );
}

function ServiceExplorer({ user, onSignIn, onOpenService }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/catalog/services', { limit: '100', ...(query ? { q: query } : {}) });
      setItems(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <SectionHeading eyebrow="Discover" title="Explore home services" description="Find the right help for your space and schedule." />
      <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        <Search className="ml-2 mt-2.5 shrink-0 text-slate-400" size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load()} className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none" placeholder="Search cleaning, plumbing, appliance repair…" />
        <Button size="sm" onClick={load}>Search</Button>
      </div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onClick={() => user ? onOpenService(service.id) : onSignIn()} />)}
        </div>
      ) : <EmptyState icon={Search} title="No services match that search" description="Try a broader keyword or clear your search." />}
    </div>
  );
}

function AddressBook() {
  const cities = useCities();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setAddresses(await api.get('/addresses'));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <SectionHeading
        eyebrow="Your places"
        title="Saved addresses"
        description="Keep the places you book for close at hand."
        action={<Button onClick={() => setEditing(true)}><Plus size={16} /> Add address</Button>}
      />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><MapPin size={20} /></span>
                {address.isDefault && <Badge tone="green">Default</Badge>}
              </div>
              <h3 className="mt-4 font-extrabold text-slate-900">{address.label}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city}{address.region ? `, ${address.region}` : ''} {address.postalCode}</p>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={MapPin} title="No saved addresses yet" description="Add your home or workplace to make booking faster." action={<Button onClick={() => setEditing(true)}><Plus size={16} /> Add an address</Button>} />}
      <Modal open={editing} onClose={() => setEditing(false)} title="Add a place">
        <AddressEditor cities={cities} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
      </Modal>
    </div>
  );
}

function BookingHistory({ onSignIn }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState('');

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

  async function cancel(bookingId) {
    setCancelling(bookingId);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { reason: 'Cancelled by customer' });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setCancelling('');
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="Your plans" title="My bookings" description="All your upcoming visits and service history." />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : bookings.length ? (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarDays size={21} /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-slate-900">{booking.serviceNameSnapshot || booking.service?.name}</h3><Badge tone={booking.status === 'completed' ? 'green' : booking.status === 'cancelled' ? 'rose' : booking.status === 'assigned' ? 'amber' : 'blue'}>{booking.status?.replaceAll('_', ' ')}</Badge></div>
                  <p className="mt-1 text-xs text-slate-500">{booking.bookingNumber} · {new Date(booking.scheduledStart).toLocaleString()}</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{currency(booking.total, booking.currency)} <span className="font-normal text-slate-400">· {booking.provider?.displayName || 'Finding your local expert'}</span></p>
                </div>
              </div>
              {['pending', 'assigned', 'confirmed'].includes(booking.status) && new Date(booking.scheduledStart) > new Date() && (
                <Button variant="quiet" size="sm" disabled={cancelling === booking.id} onClick={() => cancel(booking.id)}>{cancelling === booking.id ? 'Cancelling…' : 'Cancel booking'}</Button>
              )}
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={CalendarDays} title="Nothing booked just yet" description="Your next little home win is one good booking away." action={<Button onClick={onSignIn}>Explore services</Button>} />}
    </div>
  );
}

function CustomerProfile({ user }) {
  const [emailOtp, setEmailOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const verified = Boolean(user.emailVerifiedAt || user.emailVerified);

  async function requestCode() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/otp/email/request', {});
      setMessage('A verification code has been sent to your email.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }
  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/otp/email/verify', { code: emailOtp });
      setMessage('Your email is verified. Refresh the page to update your profile.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="Account" title="Your profile" description="Manage your account details and security." />
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-100 text-xl font-black text-emerald-800">{user.fullName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">{user.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Email verification</span><Badge tone={verified ? 'green' : 'amber'}>{verified ? 'Verified' : 'Action needed'}</Badge></div>
            {!verified && <Button className="mt-4 w-full" variant="secondary" onClick={requestCode} disabled={busy}>{busy ? 'Sending…' : 'Send verification code'}</Button>}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-extrabold text-slate-900">Keep your account protected</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Urbanmate uses secure sign-in and verifies your email before you book services.</p>
          {!verified && (
            <form onSubmit={verifyCode} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Input value={emailOtp} onChange={(event) => setEmailOtp(event.target.value)} required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6-digit code" />
              <Button type="submit" variant="secondary" disabled={busy}>Verify</Button>
            </form>
          )}
          {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{message}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
        </Card>
      </div>
    </div>
  );
}

function BookingFlow({ serviceId, onClose, onNeedLogin }) {
  const cities = useCities();
  const [service, setService] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packageId, setPackageId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [date, setDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [addAddress, setAddAddress] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [serviceData, addressData] = await Promise.all([
        api.get(`/catalog/services/${serviceId}`),
        api.get('/addresses')
      ]);
      setService(serviceData);
      setAddresses(addressData);
      setPackageId(serviceData.packages?.[0]?.id || '');
      setAddressId(addressData[0]?.id || '');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [serviceId]);

  const selectedPackage = service?.packages?.find((item) => item.id === packageId);
  const selectedAddons = service?.addons?.filter((item) => addonIds.includes(item.id)) || [];
  const price = selectedPackage
    ? Number(selectedPackage.price) + selectedAddons.reduce((sum, item) => sum + Number(item.price), 0)
    : Number(service?.effectivePrice || service?.basePrice || 0) + selectedAddons.reduce((sum, item) => sum + Number(item.price), 0);

  function toggleAddon(addonId) {
    setAddonIds((current) => current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]);
  }

  async function checkSlot() {
    setChecking(true);
    setError('');
    setAvailability(null);
    try {
      const scheduledStart = new Date(`${date}T${time}:00`).toISOString();
      const result = await api.get('/bookings/availability', {
        serviceId,
        addressId,
        scheduledStart,
        ...(packageId ? { packageId } : {}),
        ...(addonIds.length ? { addonIds: addonIds.join(',') } : {})
      });
      setAvailability(result);
      if (!result.providers?.length) setError('No verified provider is available for that time. Try another slot.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setChecking(false);
    }
  }

  async function createBooking() {
    if (!availability?.providers?.length) return;
    setBusy(true);
    setError('');
    try {
      const scheduledStart = new Date(`${date}T${time}:00`).toISOString();
      const booking = await api.post('/bookings', {
        serviceId,
        addressId,
        scheduledStart,
        ...(packageId ? { packageId } : {}),
        addonIds
      });
      setCreatedBooking(booking);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      if (requestError.status === 401) onNeedLogin();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader label="Loading service details…" />;
  if (error && !service) return <ErrorState message={error} onRetry={load} />;
  if (createdBooking) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-emerald-50 p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-700 text-white"><Check size={26} /></span>
          <h3 className="mt-4 text-xl font-extrabold text-slate-900">Your booking is in good hands.</h3>
          <p className="mt-2 text-sm text-slate-600">Booking {createdBooking.bookingNumber} is assigned and waiting for your provider to confirm.</p>
        </div>
        <Card className="p-4">
          <div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">{service?.name}</span><strong>{currency(createdBooking.total, createdBooking.currency)}</strong></div>
          <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500"><span>{new Date(createdBooking.scheduledStart).toLocaleString()}</span><Badge tone="amber">Provider confirmation pending</Badge></div>
        </Card>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Checkout has been prepared. Payment options will appear here when the payment API is enabled for this environment.
        </div>
        <Button className="w-full" onClick={onClose}>Done</Button>
      </div>
    );
  }

  if (addAddress) {
    return (
      <div>
        <button type="button" onClick={() => setAddAddress(false)} className="mb-4 text-sm font-bold text-emerald-700">← Back to booking</button>
        <AddressEditor cities={cities} onCancel={() => setAddAddress(false)} onSaved={(address) => {
          setAddresses((current) => [address, ...current]);
          setAddressId(address.id);
          setAddAddress(false);
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#f0f5ef] p-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-700">Your service</p><h3 className="mt-1 font-extrabold text-slate-900">{service?.name}</h3><p className="mt-1 text-sm text-slate-500">{service?.shortDescription || service?.description}</p></div>
        <span className="whitespace-nowrap rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800">{currency(price, service?.currency)}</span>
      </div>

      {service?.packages?.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">Choose a package</h3><span className="text-xs text-slate-400">Select one</span></div>
          <div className="space-y-2">
            {service.packages.map((item) => (
              <button type="button" key={item.id} onClick={() => setPackageId(item.id)} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition ${packageId === item.id ? 'border-emerald-600 bg-emerald-50/60' : 'border-slate-200 hover:border-emerald-300'}`}>
                <span className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-full border ${packageId === item.id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300'}`}>{packageId === item.id && <Check size={12} />}</span><span><span className="block text-sm font-bold text-slate-800">{item.name}</span><span className="text-xs text-slate-500">{item.durationMinutes} min</span></span></span>
                <span className="text-sm font-extrabold text-slate-900">{currency(item.price, service.currency)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {service?.addons?.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-extrabold text-slate-900">Nice to add</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {service.addons.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-emerald-300">
                <input type="checkbox" checked={addonIds.includes(item.id)} onChange={() => toggleAddon(item.id)} className="mt-1 accent-emerald-700" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{item.name}</span><span className="text-xs text-slate-500">{item.durationMinutes} min · {currency(item.price, service.currency)}</span></span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">Where and when?</h3><button type="button" onClick={() => setAddAddress(true)} className="text-xs font-bold text-emerald-700"><Plus size={13} className="mr-1 inline" /> Add address</button></div>
        {addresses.length ? (
          <Field label="Service address">
            <Select value={addressId} onChange={(event) => { setAddressId(event.target.value); setAvailability(null); }}>
              {addresses.map((address) => <option key={address.id} value={address.id}>{address.label} · {address.city}, {address.line1}</option>)}
            </Select>
          </Field>
        ) : (
          <EmptyState icon={MapPin} title="Add a service address" description="We’ll check professionals who cover your neighbourhood." action={<Button size="sm" onClick={() => setAddAddress(true)}>Add address</Button>} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Choose a day"><Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => { setDate(event.target.value); setAvailability(null); }} required /></Field>
          <Field label="Preferred time"><Select value={time} onChange={(event) => { setTime(event.target.value); setAvailability(null); }}>{Array.from({ length: 22 }, (_, index) => { const hour = Math.floor(index / 2) + 7; const minute = index % 2 ? '30' : '00'; const value = `${String(hour).padStart(2, '0')}:${minute}`; return <option key={value} value={value}>{value}</option>; })}</Select></Field>
        </div>
        <Button variant="secondary" className="w-full" onClick={checkSlot} disabled={!addressId || checking}>{checking ? 'Checking local availability…' : 'Check available providers'}</Button>
        {availability?.providers?.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <p className="text-sm font-bold text-emerald-900">{availability.providers.length} verified {availability.providers.length === 1 ? 'professional is' : 'professionals are'} available</p>
            <p className="mt-1 text-xs text-emerald-800/75">The first available professional will be assigned automatically and asked to confirm.</p>
          </div>
        )}
      </section>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div><span className="block text-xs text-slate-400">Estimated total</span><strong className="text-lg text-slate-900">{currency(price, service?.currency)}</strong></div>
        <Button onClick={createBooking} disabled={busy || !availability?.providers?.length}>{busy ? 'Confirming…' : 'Confirm booking'} <ArrowRight size={15} /></Button>
      </div>
    </div>
  );
}

export default function CustomerPortal({ user, active, onTabChange, onSignIn }) {
  const [serviceId, setServiceId] = useState('');
  const [loginPrompt, setLoginPrompt] = useState(false);

  function openService(id) {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    setServiceId(id);
  }

  let content;
  if (active === 'bookings') content = <BookingHistory onSignIn={() => onTabChange('services')} />;
  else if (active === 'addresses') content = <AddressBook />;
  else if (active === 'profile' && user) content = <CustomerProfile user={user} />;
  else if (active === 'services') content = <ServiceExplorer user={user} onSignIn={() => setLoginPrompt(true)} onOpenService={openService} />;
  else content = <CustomerHome user={user} onSignIn={() => setLoginPrompt(true)} onOpenService={openService} onTabChange={onTabChange} />;

  return (
    <>
      {content}
      <Modal open={Boolean(serviceId)} onClose={() => setServiceId('')} title="Build your booking" wide>
        {serviceId && <BookingFlow serviceId={serviceId} onClose={() => { setServiceId(''); onTabChange('bookings'); }} onNeedLogin={() => { setServiceId(''); setLoginPrompt(true); }} />}
      </Modal>
      <Modal open={loginPrompt} onClose={() => setLoginPrompt(false)} title="Sign in to book">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-500">Create an account or sign in to save your details and confirm your service booking.</p>
          <Button className="w-full" onClick={() => { setLoginPrompt(false); onSignIn(); }}>Continue to sign in</Button>
        </div>
      </Modal>
    </>
  );
}
