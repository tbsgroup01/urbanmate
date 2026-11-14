import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  PackagePlus,
  Plus,
  ShieldCheck,
  Users,
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
  Modal,
  PageLoader,
  SectionHeading,
  Select,
  Textarea,
  currency
} from '../components/ui';
import { api, getErrorMessage } from '../lib/api';

function StatusBadge({ status }) {
  const tone = status === 'approved' || status === 'completed' ? 'green'
    : ['rejected', 'cancelled', 'suspended'].includes(status) ? 'rose'
      : status === 'pending' || status === 'assigned' ? 'amber' : 'blue';
  return <Badge tone={tone}>{status?.replaceAll('_', ' ')}</Badge>;
}

function AdminOverview({ onNavigate }) {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bookingData, serviceData, providerData] = await Promise.all([
        api.get('/bookings', { page: '1', limit: '100' }),
        api.get('/catalog/admin/services', { page: '1', limit: '100' }),
        api.get('/providers/admin/applications', { page: '1', limit: '100' })
      ]);
      setBookings(bookingData);
      setServices(serviceData);
      setProviders(providerData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader label="Loading marketplace overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const stats = [
    { title: 'Bookings', value: bookings.length, note: `${bookings.filter((item) => item.status === 'assigned').length} awaiting provider`, icon: CalendarDays, color: 'bg-sky-50 text-sky-700', tab: 'bookings' },
    { title: 'Service catalogue', value: services.length, note: `${services.filter((item) => item.isActive).length} active services`, icon: Wrench, color: 'bg-emerald-50 text-emerald-700', tab: 'services' },
    { title: 'Provider applications', value: providers.length, note: `${providers.filter((item) => item.approvalStatus === 'pending').length} need review`, icon: BadgeCheck, color: 'bg-amber-50 text-amber-700', tab: 'providers' },
    { title: 'Customers', value: '—', note: 'Customer directory API unavailable', icon: Users, color: 'bg-violet-50 text-violet-700', tab: 'customers' }
  ];

  return (
    <div className="space-y-7">
      <SectionHeading eyebrow="Marketplace pulse" title="Operations overview" description="A clear snapshot of activity across Urbanmate." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, note, icon: Icon, color, tab }) => (
          <Card key={title} className="p-5">
            <div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon size={19} /></span><button type="button" onClick={() => onNavigate(tab)} className="text-slate-400 hover:text-emerald-700"><ArrowUpRight size={17} /></button></div>
            <p className="mt-4 text-2xl font-black text-slate-900">{value}</p><p className="mt-1 text-sm font-bold text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-400">{note}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Latest activity</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">Recent bookings</h2></div><button type="button" onClick={() => onNavigate('bookings')} className="text-xs font-bold text-emerald-700">All bookings →</button></div>
          {bookings.length ? <div className="divide-y divide-slate-100">{bookings.slice(0, 5).map((booking) => <div key={booking.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-slate-800">{booking.serviceNameSnapshot || booking.service?.name}</p><p className="mt-1 text-xs text-slate-400">{booking.bookingNumber} · {new Date(booking.scheduledStart).toLocaleDateString()}</p></div><StatusBadge status={booking.status} /></div>)}</div> : <p className="py-7 text-center text-sm text-slate-400">No bookings have been created yet.</p>}
        </Card>
        <Card className="bg-[#173f32] p-6 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-emerald-200"><ShieldCheck size={21} /></span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-emerald-200">Operations note</p>
          <h2 className="mt-1 text-xl font-extrabold">People first. Process always.</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50/70">Review provider identity documents before approval, and keep service availability aligned to the cities you operate in.</p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => onNavigate('providers')}>Review providers <ArrowUpRight size={14} /></Button>
        </Card>
      </div>
    </div>
  );
}

function ProviderManagement() {
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setProviders(await api.get('/providers/admin/applications', { page: '1', limit: '100', ...(status ? { status } : {}) }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [status]);

  async function decide(providerId, decision, reason) {
    setBusy(providerId);
    setError('');
    try {
      await api.patch(`/providers/admin/applications/${providerId}/decision`, {
        status: decision,
        ...(decision === 'rejected' ? { rejectionReason: reason } : {})
      });
      setRejecting(null);
      setRejectionReason('');
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="People & trust" title="Provider management" description="Review applications and help great local professionals get started." action={<Select className="w-auto min-w-36" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></Select>} />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : providers.length ? (
        <div className="space-y-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-800">{provider.displayName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-slate-900">{provider.displayName}</h3><StatusBadge status={provider.approvalStatus} /></div><p className="mt-1 text-xs text-slate-500">{provider.professionalTitle || 'Professional'} · {provider.experienceYears || 0} years experience</p><p className="mt-1 text-xs text-slate-400">{provider.user?.email || 'Email details available in application view'}</p><p className="mt-2 text-xs leading-5 text-slate-500">{provider.bio || 'No profile bio added yet.'}</p></div>
                </div>
                {provider.approvalStatus === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy === provider.id} onClick={() => decide(provider.id, 'approved')}><BadgeCheck size={14} /> Approve</Button>
                    <Button size="sm" variant="danger" disabled={busy === provider.id} onClick={() => { setRejecting(provider); setError(''); }}>Reject</Button>
                  </div>
                )}
              </div>
              {provider.documents?.length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{provider.documents.map((document) => <span key={document.id} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600"><ShieldCheck size={13} className="text-emerald-700" />{document.documentType.replaceAll('_', ' ')}: {document.status}</span>)}</div>}
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={BadgeCheck} title="No applications here" description="Provider applications will appear here as people join the network." />}
      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Reject provider application">
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (rejecting) decide(rejecting.id, 'rejected', rejectionReason.trim());
        }}>
          <p className="text-sm leading-6 text-slate-500">Share a clear reason with {rejecting?.displayName || 'this applicant'} so they understand what needs to change.</p>
          <Field label="Reason for rejection"><Textarea rows={4} minLength={3} maxLength={500} required value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what is missing or needs correction" /></Field>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="quiet" onClick={() => setRejecting(null)}>Keep application</Button><Button type="submit" variant="danger" disabled={Boolean(busy)}>Reject application</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ categoryId: '', name: '', slug: '', shortDescription: '', description: '', basePrice: '', durationMinutes: '60' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [serviceData, categoryData] = await Promise.all([
        api.get('/catalog/admin/services', { page: '1', limit: '100' }),
        api.get('/catalog/admin/categories', { page: '1', limit: '100' })
      ]);
      setServices(serviceData);
      setCategories(categoryData);
      setValues((current) => ({ ...current, categoryId: current.categoryId || categoryData[0]?.id || '' }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createService(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/catalog/admin/services', {
        ...values,
        basePrice: Number(values.basePrice),
        durationMinutes: Number(values.durationMinutes)
      });
      setModal(false);
      setValues({ categoryId: categories[0]?.id || '', name: '', slug: '', shortDescription: '', description: '', basePrice: '', durationMinutes: '60' });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value, ...(key === 'name' ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) }));
  }

  return (
    <div>
      <SectionHeading eyebrow="Marketplace catalogue" title="Service management" description="Keep the service catalogue clear, current and available." action={<Button onClick={() => setModal(true)}><Plus size={16} /> Add service</Button>} />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : services.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.5fr_1fr_0.7fr_0.7fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 sm:grid"><span>Service</span><span>Category</span><span>Starting price</span><span>Status</span></div>
          {services.map((service) => <div key={service.id} className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:grid-cols-[1.5fr_1fr_0.7fr_0.7fr] sm:items-center sm:gap-4"><div><p className="text-sm font-bold text-slate-800">{service.name}</p><p className="mt-1 text-xs text-slate-400">{service.durationMinutes} minutes · {service.slug}</p></div><span className="text-xs text-slate-500">{service.category?.name || 'Service category'}</span><span className="text-sm font-bold text-slate-700">{currency(service.effectivePrice ?? service.basePrice, service.currency)}</span><StatusBadge status={service.isActive ? 'approved' : 'suspended'} /></div>)}
        </div>
      ) : <EmptyState icon={Wrench} title="Your catalogue starts here" description="Add services to help customers discover the work your marketplace offers." action={<Button onClick={() => setModal(true)}><Plus size={15} /> Add a service</Button>} />}
      <Modal open={modal} onClose={() => setModal(false)} title="Add a service">
        <form className="space-y-4" onSubmit={createService}>
          <Field label="Category"><Select required value={values.categoryId} onChange={(event) => update('categoryId', event.target.value)}><option value="">Choose category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</Select></Field>
          <Field label="Service name"><Input required minLength={2} value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Deep home cleaning" /></Field>
          <Field label="URL slug"><Input required value={values.slug} onChange={(event) => update('slug', event.target.value)} placeholder="deep-home-cleaning" /></Field>
          <Field label="Short description"><Input value={values.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} maxLength={500} placeholder="A clear one-line summary" /></Field>
          <Field label="Details"><Textarea rows={3} value={values.description} onChange={(event) => update('description', event.target.value)} placeholder="What customers can expect" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Base price"><Input type="number" min="0" step="0.01" value={values.basePrice} onChange={(event) => update('basePrice', event.target.value)} required /></Field><Field label="Duration (minutes)"><Input type="number" min="1" value={values.durationMinutes} onChange={(event) => update('durationMinutes', event.target.value)} required /></Field></div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !categories.length}>{busy ? 'Creating…' : 'Create service'} <PackagePlus size={15} /></Button>
        </form>
      </Modal>
    </div>
  );
}

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [providerIds, setProviderIds] = useState({});
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

  async function assign(bookingId) {
    const providerId = providerIds[bookingId]?.trim();
    if (!providerId) {
      setError('Enter an eligible provider ID to assign this booking.');
      return;
    }
    setBusy(bookingId);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/assign`, { providerId });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="Service operations" title="Booking management" description="Monitor customer bookings and assign a provider when needed." />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : bookings.length ? (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold text-slate-900">{booking.serviceNameSnapshot || booking.service?.name}</h3><StatusBadge status={booking.status} /></div><p className="mt-1 text-xs text-slate-500">{booking.bookingNumber} · {new Date(booking.scheduledStart).toLocaleString()}</p><p className="mt-1 text-xs text-slate-400">Provider: {booking.provider?.displayName || 'Unassigned'} · {currency(booking.total, booking.currency)}</p></div>
                {['pending', 'assigned'].includes(booking.status) && (
                  <div className="flex gap-2">
                    <Input className="max-w-[260px]" value={providerIds[booking.id] || ''} onChange={(event) => setProviderIds((current) => ({ ...current, [booking.id]: event.target.value }))} placeholder="Eligible provider UUID" aria-label="Provider ID" />
                    <Button size="sm" disabled={busy === booking.id} onClick={() => assign(booking.id)}>{busy === booking.id ? 'Assigning…' : 'Assign'}</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={CalendarDays} title="No bookings yet" description="Customer bookings will appear here as soon as the marketplace is active." />}
    </div>
  );
}

function CustomerManagement() {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('suspended');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/auth/admin/users/${userId.trim()}/status`, { status });
      setMessage(`Account ${status === 'active' ? 'activated' : 'suspended'} successfully.`);
      setUserId('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeading eyebrow="Customer care" title="Customer management" description="Manage account status when support or trust operations require it." />
      <Card className="max-w-2xl p-6">
        <div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Users size={19} /></span><div><h2 className="font-extrabold text-slate-900">Update customer account status</h2><p className="mt-1 text-xs leading-5 text-slate-500">The API currently supports status updates by user ID; customer search and directory endpoints are not available yet.</p></div></div>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Customer user ID"><Input value={userId} onChange={(event) => setUserId(event.target.value)} required placeholder="Paste the account UUID" /></Field>
          <Field label="New status"><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option></Select></Field>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update account'} <ArrowUpRight size={15} /></Button>
        </form>
      </Card>
    </div>
  );
}

function FinanceManagement() {
  return (
    <div>
      <SectionHeading eyebrow="Finance & reporting" title="Payments and commissions" description="Payment and payout controls belong in a verified, auditable financial workflow." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Banknote size={21} /></span>
          <h2 className="mt-4 text-lg font-extrabold text-slate-900">Payment operations</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">The current API does not expose payment, refund or settlement management endpoints. This panel is ready for those APIs and will not display simulated financial data.</p>
          <Badge tone="amber">API not available</Badge>
        </Card>
        <Card className="p-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ClipboardList size={21} /></span>
          <h2 className="mt-4 text-lg font-extrabold text-slate-900">Commission reports</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Commission summaries, provider wallets and withdrawal review require server-side ledger data. No placeholder totals are shown.</p>
          <Badge tone="amber">API not available</Badge>
        </Card>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><CircleHelp size={18} className="mt-0.5 shrink-0" /><p className="leading-6">Financial data should only be reported from verified gateway events and persisted ledger transactions, never from browser-submitted payment status.</p></div>
    </div>
  );
}

export default function AdminPortal({ active, onTabChange }) {
  if (active === 'providers') return <ProviderManagement />;
  if (active === 'customers') return <CustomerManagement />;
  if (active === 'services') return <ServiceManagement />;
  if (active === 'bookings') return <BookingManagement />;
  if (active === 'finance') return <FinanceManagement />;
  return <AdminOverview onNavigate={onTabChange} />;
}
