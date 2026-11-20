import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  ClipboardList,
  Clock,
  DollarSign,
  FolderPlus,
  FolderTree,
  ImageIcon,
  Mail,
  MapPin,
  PackagePlus,
  PackageSearch,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  UploadCloud,
  UserCheck,
  Users,
  UserX,
  Wallet,
  Wrench,
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
  Modal,
  PageLoader,
  SectionHeading,
  Select,
  Textarea,
  currency
} from '../components/ui';
import { api, getErrorMessage, resolveMediaUrl } from '../lib/api';
import SettingsManagement from './SettingsManagement';

function StatusBadge({ status }) {
  const tone = status === 'approved' || status === 'completed' || status === 'settled' || status === 'active' ? 'violet'
    : ['rejected', 'cancelled', 'suspended', 'refunded'].includes(status) ? 'rose'
      : status === 'pending' || status === 'assigned' ? 'amber' : 'blue';
  return <Badge tone={tone}>{status?.replaceAll('_', ' ')}</Badge>;
}

function AdminStatCard({
  title,
  value,
  note,
  icon: Icon,
  iconBg,
  arrowColor,
  border = 'border-slate-200/90',
  bg = 'bg-white',
  wave,
  badge,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[26px] border ${border} ${bg} p-5 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Decorative smooth bottom SVG wave */}
      {wave && (
        <svg
          className={`pointer-events-none absolute -bottom-0.5 -right-0.5 h-20 w-36 ${wave} transition-transform duration-300 group-hover:scale-105`}
          viewBox="0 0 144 80"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,80 C35,80 55,50 85,42 C115,34 128,15 144,0 L144,80 Z" />
        </svg>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${iconBg} shadow-xs`}>
            <Icon size={20} />
          </span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 shadow-2xs">
                {badge}
              </span>
            )}
            {onClick && (
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl bg-white/80 ${arrowColor || 'text-violet-700'} shadow-2xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}
              >
                <ArrowUpRight size={16} />
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-sm font-bold text-slate-700">{title}</p>
          {note && <p className="mt-0.5 text-xs font-medium text-slate-400">{note}</p>}
        </div>
      </div>
    </div>
  );
}

function AdminOverview({ onNavigate, user }) {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bookingData, serviceData, categoryData, providerData, userData, financeData] = await Promise.all([
        api.get('/bookings', { page: '1', limit: '100' }),
        api.get('/catalog/admin/services', { page: '1', limit: '100' }),
        api.get('/catalog/admin/categories', { page: '1', limit: '100' }),
        api.get('/providers/admin/applications', { page: '1', limit: '100' }),
        api.get('/auth/admin/users', { limit: '100' }),
        api.get('/bookings/admin/finance')
      ]);
      setBookings(bookingData || []);
      setServices(serviceData || []);
      setCategories(categoryData || []);
      setProviders(providerData || []);
      setUsers(userData || []);
      setFinance(financeData || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader label="Loading marketplace operations overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const pendingProviders = providers.filter((p) => p.approvalStatus === 'pending').length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const activeCustomers = users.filter((u) => u.status === 'active').length;
  const gmv = finance?.metrics?.totalGrossVolume || 0;

  const stats = [
    {
      title: 'Categories',
      value: categories.length,
      note: `${categories.filter((c) => c.isActive).length} active catalog groups`,
      icon: FolderTree,
      iconBg: 'bg-[#ede9fe] text-[#7c3aed]',
      arrowColor: 'text-[#7c3aed]',
      border: 'border-violet-100/90 hover:border-violet-300',
      bg: 'bg-gradient-to-br from-white via-white to-violet-50/50',
      wave: 'text-[#ddd6fe]/50',
      tab: 'categories'
    },
    {
      title: 'Services catalogue',
      value: services.length,
      note: `${services.filter((s) => s.isActive).length} active services ready`,
      icon: Wrench,
      iconBg: 'bg-[#fae8ff] text-[#c026d3]',
      arrowColor: 'text-[#c026d3]',
      border: 'border-fuchsia-100/90 hover:border-fuchsia-300',
      bg: 'bg-gradient-to-br from-white via-white to-fuchsia-50/50',
      wave: 'text-[#f5d0fe]/50',
      tab: 'services'
    },
    {
      title: 'Providers',
      value: providers.length,
      note: pendingProviders ? `${pendingProviders} application${pendingProviders > 1 ? 's' : ''} need review` : 'All verified & active',
      icon: BadgeCheck,
      iconBg: 'bg-[#ffedd5] text-[#ea580c]',
      arrowColor: 'text-[#ea580c]',
      border: 'border-amber-100/90 hover:border-amber-300',
      bg: 'bg-gradient-to-br from-white via-white to-amber-50/50',
      wave: 'text-[#fed7aa]/50',
      tab: 'providers',
      badge: pendingProviders ? `${pendingProviders} pending` : null
    },
    {
      title: 'Customers',
      value: users.length,
      note: `${activeCustomers} active customer accounts`,
      icon: Users,
      iconBg: 'bg-[#e0e7ff] text-[#4f46e5]',
      arrowColor: 'text-[#4f46e5]',
      border: 'border-indigo-100/90 hover:border-indigo-300',
      bg: 'bg-gradient-to-br from-white via-white to-indigo-50/50',
      wave: 'text-[#c7d2fe]/50',
      tab: 'customers'
    },
    {
      title: 'Bookings',
      value: bookings.length,
      note: pendingBookings ? `${pendingBookings} unassigned bookings` : 'All assigned to pros',
      icon: CalendarDays,
      iconBg: 'bg-[#e0f2fe] text-[#0284c7]',
      arrowColor: 'text-[#0284c7]',
      border: 'border-sky-100/90 hover:border-sky-300',
      bg: 'bg-gradient-to-br from-white via-white to-sky-50/50',
      wave: 'text-[#bae6fd]/50',
      tab: 'bookings',
      badge: pendingBookings ? `${pendingBookings} unassigned` : null
    },
    {
      title: 'Marketplace GMV',
      value: currency(gmv, 'INR'),
      note: `${currency(finance?.metrics?.platformRevenue || 0, 'INR')} platform commission`,
      icon: Banknote,
      iconBg: 'bg-[#f3e8ff] text-[#9333ea]',
      arrowColor: 'text-[#9333ea]',
      border: 'border-purple-100/90 hover:border-purple-300',
      bg: 'bg-gradient-to-br from-white via-white to-purple-50/50',
      wave: 'text-[#e9d5ff]/50',
      tab: 'finance'
    }
  ];

  return (
    <div className="space-y-7">
      {/* Operations Command Hero Banner */}
      <div className="relative overflow-hidden rounded-[30px] border border-violet-800/40 bg-gradient-to-br from-[#1e0f3e] via-[#2c1356] to-[#0f0520] p-6 sm:p-8 text-white shadow-xl shadow-violet-950/20">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />
        <svg className="pointer-events-none absolute -bottom-1 inset-x-0 h-16 w-full text-violet-500/10" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
          <path d="M0,40 C30,40 50,15 100,25 L100,40 Z" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-200 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
              Operations Command &bull; Marketplace Live
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Operations Overview
            </h1>
            <p className="max-w-xl text-xs sm:text-sm text-violet-200/80 font-medium">
              Live monitoring across your service catalog, verified professionals, active customer requests, and marketplace financial health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-violet-950 shadow-md shadow-black/20 hover:bg-violet-50 transition cursor-pointer"
            >
              <PackagePlus size={15} className="text-violet-700" /> + Add Service
            </button>
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 transition cursor-pointer"
            >
              <FolderPlus size={15} /> Categories
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-xs backdrop-blur-md hover:bg-white/20 transition cursor-pointer"
            >
              <Sliders size={15} /> Settings
            </button>
          </div>
        </div>
      </div>
      
      {/* 6 Colorful Modern Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.title}
            {...stat}
            onClick={() => onNavigate(stat.tab)}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ede9fe] text-[#7c3aed]">
                <CalendarDays size={18} />
              </span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-700">Live service orders</p>
                <h2 className="text-lg font-black text-slate-900">Recent Bookings</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bookings')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 hover:underline"
            >
              All bookings ({bookings.length}) <ArrowUpRight size={14} />
            </button>
          </div>

          {bookings.length ? (
            <div className="space-y-2">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => onNavigate('bookings')}
                  className="flex items-center justify-between gap-3 rounded-2xl p-3 border border-slate-100 bg-slate-50/50 hover:bg-violet-50/40 hover:border-violet-100 transition cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-violet-800 bg-violet-100/70 px-2 py-0.5 rounded-md">
                        {booking.bookingNumber}
                      </span>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {booking.serviceNameSnapshot || booking.service?.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(booking.scheduledStart).toLocaleDateString()} &bull; Customer: <span className="font-semibold text-slate-600">{booking.customer?.fullName || 'Customer'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-xs text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                      {currency(booking.total, 'INR')}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm font-medium text-slate-400">No bookings have been created yet.</p>
          )}
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-violet-800/40 bg-gradient-to-br from-[#1e0f3e] via-[#2c1356] to-[#0f0520] p-6 text-white shadow-xl shadow-violet-950/15 flex flex-col justify-between">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-36 w-36 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="relative z-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-violet-200 ring-1 ring-white/15">
              <ShieldCheck size={22} />
            </span>
            <p className="mt-4 text-[11px] font-extrabold uppercase tracking-widest text-violet-300">Operations priority</p>
            <h2 className="mt-1 text-xl font-black">Professional Vetting & Trust</h2>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-violet-100/75">
              {pendingProviders > 0
                ? `You have ${pendingProviders} provider application${pendingProviders > 1 ? 's' : ''} awaiting review and approval.`
                : 'All provider applications are up to date. Keep monitoring service availability and customer bookings.'}
            </p>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('providers')}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-violet-950 shadow-md hover:bg-violet-50 transition cursor-pointer"
            >
              Review Providers <ArrowUpRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-400/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer"
            >
              Categories <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderManagement() {
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [status, setStatus] = useState(''); // Default to all so all providers appear immediately
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/providers/admin/applications', {
        page: '1',
        limit: '100',
        ...(status ? { status } : {}),
        ...(search.trim() ? { q: search.trim() } : {})
      });
      setProviders(data);
      if (!status && !search.trim()) {
        setAllProviders(data);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  // Pre-load all providers on mount to populate counts accurately
  useEffect(() => {
    api.get('/providers/admin/applications', { page: '1', limit: '100' })
      .then((data) => setAllProviders(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 180);
    return () => clearTimeout(timer);
  }, [status, search]);

  const counts = useMemo(() => {
    const list = allProviders.length ? allProviders : providers;
    return {
      all: list.length,
      approved: list.filter((p) => p.approvalStatus === 'approved').length,
      pending: list.filter((p) => p.approvalStatus === 'pending').length,
      rejected: list.filter((p) => p.approvalStatus === 'rejected').length,
      suspended: list.filter((p) => p.approvalStatus === 'suspended').length
    };
  }, [allProviders, providers]);

  async function decide(providerId, decision, reason) {
    setBusy(providerId);
    setActionError('');
    setSuccessMessage('');
    try {
      await api.patch(`/providers/admin/applications/${providerId}/decision`, {
        status: decision,
        ...(decision === 'rejected' ? { rejectionReason: reason } : {})
      });
      setRejecting(null);
      setRejectionReason('');
      setSuccessMessage(`Provider status updated to ${decision} successfully.`);
      await load();
      // Also refresh allProviders for accurate counts
      api.get('/providers/admin/applications', { page: '1', limit: '100' })
        .then((data) => setAllProviders(data))
        .catch(() => {});
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="People & trust"
        title="Provider management"
        description="Review applications, oversee verified local professionals, and filter by status."
      />

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard
          title="Total Providers"
          value={counts.all}
          note="Registered pros"
          icon={Users}
          iconBg="bg-[#e0e7ff] text-[#4f46e5]"
          arrowColor="text-[#4f46e5]"
          border="border-indigo-100/90"
          bg="bg-gradient-to-br from-white via-white to-indigo-50/50"
          wave="text-[#c7d2fe]/50"
          onClick={() => setStatus('')}
        />
        <AdminStatCard
          title="Active & Approved"
          value={counts.approved}
          note="Ready to take jobs"
          icon={BadgeCheck}
          iconBg="bg-[#ede9fe] text-[#7c3aed]"
          arrowColor="text-[#7c3aed]"
          border="border-violet-100/90"
          bg="bg-gradient-to-br from-white via-white to-violet-50/50"
          wave="text-[#ddd6fe]/50"
          onClick={() => setStatus('approved')}
        />
        <AdminStatCard
          title="Pending Review"
          value={counts.pending}
          note="Awaiting approval"
          icon={Clock}
          iconBg="bg-[#ffedd5] text-[#ea580c]"
          arrowColor="text-[#ea580c]"
          border="border-amber-100/90"
          bg="bg-gradient-to-br from-white via-white to-amber-50/50"
          wave="text-[#fed7aa]/50"
          badge={counts.pending > 0 ? `${counts.pending} pending` : null}
          onClick={() => setStatus('pending')}
        />
        <AdminStatCard
          title="Restricted Pros"
          value={counts.suspended + counts.rejected}
          note="Suspended or rejected"
          icon={ShieldAlert}
          iconBg="bg-[#ffe4e6] text-[#e11d48]"
          arrowColor="text-[#e11d48]"
          border="border-rose-100/90"
          bg="bg-gradient-to-br from-white via-white to-rose-50/50"
          wave="text-[#fecdd3]/50"
          onClick={() => setStatus('suspended')}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, business, or email..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-9 text-xs font-semibold text-slate-900 outline-none transition focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/15"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: '', label: 'All', count: counts.all, activeCls: 'bg-violet-700 text-white shadow-sm shadow-violet-700/20' },
            { id: 'approved', label: 'Approved', count: counts.approved, activeCls: 'bg-violet-700 text-white shadow-sm shadow-violet-700/20' },
            { id: 'pending', label: 'Pending', count: counts.pending, activeCls: 'bg-amber-600 text-white shadow-sm shadow-amber-600/20' },
            { id: 'rejected', label: 'Rejected', count: counts.rejected, activeCls: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' },
            { id: 'suspended', label: 'Suspended', count: counts.suspended, activeCls: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' }
          ].map((item) => {
            const isActive = status === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? item.activeCls
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{item.label}</span>
                <span className={`rounded-md px-1.5 py-0.2 text-[10px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200/90 text-slate-700'
                }`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {actionError && <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">{actionError}</p>}
      {successMessage && <p role="status" className="rounded-2xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-800">{successMessage}</p>}

      {loading ? (
        <PageLoader label="Loading marketplace providers…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : providers.length ? (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="rounded-[28px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  {provider.avatarUrl ? (
                    <img
                      src={resolveMediaUrl(provider.avatarUrl)}
                      alt={provider.displayName}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-violet-200 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'grid';
                        }
                      }}
                    />
                  ) : null}
                  <span
                    style={{ display: provider.avatarUrl ? 'none' : 'grid' }}
                    className="h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-sm font-black text-violet-800 ring-2 ring-violet-200 shadow-xs"
                  >
                    {provider.displayName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{provider.displayName}</h3>
                      <StatusBadge status={provider.approvalStatus} />
                      {provider.isOnline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-pulse" /> Online
                        </span>
                      )}
                      {provider.identityVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                          <ShieldCheck size={11} /> Verified ID
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-semibold">
                      {provider.professionalTitle || 'Service Professional'} &bull; {provider.experienceYears || 0} yrs experience
                      {provider.businessName && ` &bull; ${provider.businessName}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                      {provider.user?.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-violet-500" /> {provider.user.email}</span>}
                      {provider.user?.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-violet-500" /> {provider.user.phone}</span>}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600 font-medium">{provider.bio || 'No profile bio added yet.'}</p>
                  </div>
                </div>

                {/* Admin Quick Decision Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {provider.approvalStatus === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        disabled={busy === provider.id}
                        onClick={() => decide(provider.id, 'approved')}
                        className="bg-gradient-to-r from-violet-700 to-purple-600 text-white shadow-sm hover:shadow-violet-600/20"
                      >
                        <BadgeCheck size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy === provider.id} onClick={() => { setRejecting(provider); setActionError(''); }}>
                        Reject
                      </Button>
                    </>
                  )}
                  {provider.approvalStatus === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-200 text-slate-600 hover:bg-slate-100"
                      disabled={busy === provider.id}
                      onClick={() => decide(provider.id, 'suspended')}
                    >
                      Suspend
                    </Button>
                  )}
                  {provider.approvalStatus === 'suspended' && (
                    <Button
                      size="sm"
                      disabled={busy === provider.id}
                      onClick={() => decide(provider.id, 'approved')}
                      className="bg-gradient-to-r from-violet-700 to-purple-600 text-white shadow-sm hover:shadow-violet-600/20"
                    >
                      <BadgeCheck size={14} /> Reactivate
                    </Button>
                  )}
                  {provider.approvalStatus === 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === provider.id}
                      onClick={() => decide(provider.id, 'approved')}
                    >
                      <BadgeCheck size={14} /> Re-approve
                    </Button>
                  )}
                </div>
              </div>

              {/* Provider Offered Services */}
              <div className="mt-4 border-t border-slate-100 pt-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Wrench size={14} className="text-violet-700" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Offered services {provider.services?.length ? `(${provider.services.length})` : ''}
                  </span>
                </div>
                {provider.services?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((srv) => (
                      <span
                        key={srv.id}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                          srv.isActive !== false
                            ? 'border-violet-200/80 bg-violet-50/70 text-violet-900'
                            : 'border-slate-200 bg-slate-100 text-slate-500 line-through'
                        }`}
                      >
                        <span>{srv.name}</span>
                        <span className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-black text-violet-700 shadow-2xs">
                          {currency(srv.customPrice != null ? srv.customPrice : srv.basePrice, 'INR')}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No services added by this provider yet.</p>
                )}
              </div>

              {provider.documents?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {provider.documents.map((document) => (
                    <span key={document.id} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      <ShieldCheck size={13} className="text-violet-700" />
                      {document.documentType.replaceAll('_', ' ')}: {document.status}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BadgeCheck}
          title={search ? 'No matching providers found' : `No ${status ? status : ''} providers`}
          description={
            search
              ? `No providers matched “${search}”. Try clearing your search keyword or selecting a different status.`
              : status
                ? `No providers with “${status}” status. Switch to “All” to view all providers.`
                : 'No providers have registered on the platform yet.'
          }
        />
      )}

      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Reject provider application">
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (rejecting) decide(rejecting.id, 'rejected', rejectionReason.trim());
        }}>
          <p className="text-sm leading-6 text-slate-500">Share a clear reason with {rejecting?.displayName || 'this applicant'} so they understand what needs to change.</p>
          <Field label="Reason for rejection"><Textarea rows={4} minLength={3} maxLength={500} required value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain what is missing or needs correction" /></Field>
          {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="quiet" onClick={() => setRejecting(null)}>Keep application</Button><Button type="submit" variant="danger" disabled={Boolean(busy)}>Reject application</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function CategoryManagement({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const [values, setValues] = useState({
    name: '',
    slug: '',
    imageUrl: ''
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/catalog/admin/categories', { page: '1', limit: '100' });
      setCategories(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(key, value) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'name' ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') } : {})
    }));
  }

  async function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB');
      return;
    }

    setImageError('');
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post('/catalog/admin/upload-image', {
        dataUrl,
        filename: file.name
      });

      setValues((current) => ({ ...current, imageUrl: res.imageUrl }));
    } catch (uploadErr) {
      setImageError(getErrorMessage(uploadErr));
    } finally {
      setUploadingImage(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    setBusy(true);
    setCategoryError('');
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        imageUrl: values.imageUrl?.trim() || null
      };
      const created = await api.post('/catalog/admin/categories', payload);
      setModal(false);
      setValues({ name: '', slug: '', imageUrl: '' });
      setActionSuccess(`Category "${created.name}" created successfully.`);
      setTimeout(() => setActionSuccess(''), 4000);
      await load();
    } catch (requestError) {
      setCategoryError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const totalLinkedServices = useMemo(() => {
    return categories.reduce((acc, c) => acc + (c.services?.length || 0), 0);
  }, [categories]);

  const activeCategoriesCount = useMemo(() => {
    return categories.filter((c) => c.isActive !== false).length;
  }, [categories]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketplace catalogue"
        title="Category management"
        description="Organize marketplace services into clear, discoverable categories with photos."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => { setCategoryError(''); setImageError(''); setModal(true); }}
              className="bg-gradient-to-r from-violet-700 to-purple-600 text-white shadow-md shadow-violet-700/20 hover:shadow-violet-700/30"
            >
              <Plus size={16} /> Add category
            </Button>
            {onNavigate && (
              <Button variant="secondary" onClick={() => onNavigate('services')}>
                Services catalogue →
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminStatCard
          title="Total Categories"
          value={categories.length}
          note="Active taxonomy groups"
          icon={FolderTree}
          iconBg="bg-[#ede9fe] text-[#7c3aed]"
          arrowColor="text-[#7c3aed]"
          border="border-violet-100/90"
          bg="bg-gradient-to-br from-white via-white to-violet-50/50"
          wave="text-[#ddd6fe]/50"
        />
        <AdminStatCard
          title="Linked Services"
          value={totalLinkedServices}
          note="Live catalog offerings"
          icon={Wrench}
          iconBg="bg-[#fae8ff] text-[#c026d3]"
          arrowColor="text-[#c026d3]"
          border="border-fuchsia-100/90"
          bg="bg-gradient-to-br from-white via-white to-fuchsia-50/50"
          wave="text-[#f5d0fe]/50"
        />
        <AdminStatCard
          title="Active Categories"
          value={activeCategoriesCount}
          note="Visible in store"
          icon={BadgeCheck}
          iconBg="bg-[#e0f2fe] text-[#0284c7]"
          arrowColor="text-[#0284c7]"
          border="border-sky-100/90"
          bg="bg-gradient-to-br from-white via-white to-sky-50/50"
          wave="text-[#bae6fd]/50"
        />
      </div>

      {actionSuccess && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          <Check size={17} className="text-violet-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or slug…"
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span>{categories.length} categories</span>
          <span>&bull;</span>
          <span className="text-violet-700 font-extrabold">{totalLinkedServices} linked services</span>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading marketplace categories…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : categories.length ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)]">
          <div className="hidden grid-cols-[1.8fr_1.2fr_0.6fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:grid">
            <span>Category</span>
            <span>URL Slug</span>
            <span>Status</span>
            <span className="text-right">Services</span>
          </div>
          {categories
            .filter((c) => !search.trim() || c.name?.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase()))
            .map((category) => (
            <div
              key={category.id}
              className="grid gap-2 border-b border-slate-100 px-6 py-4.5 last:border-b-0 hover:bg-violet-50/20 transition sm:grid-cols-[1.8fr_1.2fr_0.6fr_0.8fr] sm:items-center sm:gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {category.imageUrl ? (
                  <img
                    src={resolveMediaUrl(category.imageUrl)}
                    alt={category.name}
                    className="h-13 w-13 shrink-0 rounded-2xl object-cover ring-2 ring-violet-200/80 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'grid';
                      }
                    }}
                  />
                ) : null}
                <div
                  style={{ display: category.imageUrl ? 'none' : 'grid' }}
                  className="h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 ring-2 ring-violet-200/80 shadow-xs"
                >
                  <FolderTree size={22} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{category.name}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {category.services?.length || 0} {(category.services?.length === 1) ? 'service' : 'services'}
                  </p>
                </div>
              </div>
              <div>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl truncate inline-block max-w-full">
                  {category.slug}
                </span>
              </div>
              <div>
                <StatusBadge status={category.isActive ? 'approved' : 'suspended'} />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onNavigate?.('services', category.id)}
                  className="text-xs font-bold text-violet-800 hover:bg-violet-100/60"
                >
                  View services ({category.services?.length || 0}) →
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to start organizing your home services catalog."
          action={
            <Button onClick={() => { setCategoryError(''); setImageError(''); setModal(true); }}>
              <Plus size={15} /> Add category
            </Button>
          }
        />
      )}

      {/* Add Category Modal with Image Upload */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add a category">
        <form className="space-y-4" onSubmit={createCategory}>
          <Field label="Category photo">
            {values.imageUrl ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img
                  src={resolveMediaUrl(values.imageUrl)}
                  alt="Category preview"
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-slate-200 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">Photo attached</p>
                  <p className="truncate text-[11px] text-slate-400">{values.imageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValues((c) => ({ ...c, imageUrl: '' }))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Remove photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center transition hover:border-violet-500 hover:bg-violet-50/20">
                  <UploadCloud className="mb-1.5 h-7 w-7 text-violet-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingImage ? 'Uploading image…' : 'Click to upload category photo'}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-400">PNG, JPG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageFile}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                <Input
                  placeholder="Or enter an external image URL"
                  value={values.imageUrl}
                  onChange={(event) => update('imageUrl', event.target.value)}
                  className="text-xs"
                />
              </div>
            )}
            {imageError && <p className="mt-1.5 text-xs text-rose-600 font-medium">{imageError}</p>}
          </Field>

          <Field label="Category name" hint="e.g. Electrical, Plumbing, Cleaning, Appliance Care">
            <Input
              required
              minLength={2}
              maxLength={100}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Enter category name"
              autoFocus
            />
          </Field>

          <Field label="URL slug" hint="Auto-generated URL identifier (lowercase, numbers, and hyphens)">
            <Input
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              value={values.slug}
              onChange={(event) => update('slug', event.target.value)}
              placeholder="e.g. appliance-care"
            />
          </Field>

          {categoryError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{categoryError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || uploadingImage || values.name.trim().length < 2}>
              {busy ? 'Adding category…' : 'Add category'} <FolderPlus size={15} />
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ServiceManagement({ onNavigate, initialCategoryId = 'all', onCategoryChange }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [editingService, setEditingService] = useState(null);

  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryValues, setCategoryValues] = useState({ name: '', slug: '' });

  const [values, setValues] = useState({
    categoryId: '',
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    basePrice: '',
    durationMinutes: '60',
    imageUrl: ''
  });

  useEffect(() => {
    if (initialCategoryId) setSelectedCategory(initialCategoryId);
  }, [initialCategoryId]);

  function handleCategoryFilter(catId) {
    setSelectedCategory(catId);
    onCategoryChange?.(catId);
  }

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
      setValues((current) => ({
        ...current,
        categoryId: current.categoryId || (selectedCategory !== 'all' ? selectedCategory : categoryData[0]?.id || '')
      }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function update(key, value) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'name' ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') } : {})
    }));
  }

  function updateCategoryField(key, value) {
    setCategoryValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'name' ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') } : {})
    }));
  }

  async function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB');
      return;
    }

    setImageError('');
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post('/catalog/admin/upload-image', {
        dataUrl,
        filename: file.name
      });

      setValues((current) => ({ ...current, imageUrl: res.imageUrl }));
    } catch (uploadErr) {
      setImageError(getErrorMessage(uploadErr));
    } finally {
      setUploadingImage(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    setCategoryBusy(true);
    setCategoryError('');
    try {
      const created = await api.post('/catalog/admin/categories', {
        name: categoryValues.name.trim(),
        slug: categoryValues.slug.trim()
      });

      const updatedCategories = await api.get('/catalog/admin/categories', { page: '1', limit: '100' });
      setCategories(updatedCategories);
      setValues((current) => ({ ...current, categoryId: created.id || current.categoryId }));
      setCategoryModal(false);
      setCategoryValues({ name: '', slug: '' });
      setActionSuccess(`Category "${created.name}" created successfully.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (requestError) {
      setCategoryError(getErrorMessage(requestError));
    } finally {
      setCategoryBusy(false);
    }
  }

  function openAddService() {
    setEditingService(null);
    setServiceError('');
    setImageError('');
    setValues({
      categoryId: (selectedCategory !== 'all' ? selectedCategory : categories[0]?.id) || '',
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      basePrice: '',
      durationMinutes: '60',
      imageUrl: ''
    });
    setModal(true);
  }

  function openEditService(service) {
    setEditingService(service);
    setServiceError('');
    setImageError('');
    setValues({
      categoryId: service.categoryId || service.category?.id || categories[0]?.id || '',
      name: service.name || '',
      slug: service.slug || '',
      shortDescription: service.shortDescription || '',
      description: service.description || '',
      basePrice: String(service.basePrice ?? ''),
      durationMinutes: String(service.durationMinutes ?? '60'),
      imageUrl: service.images?.[0]?.imageUrl || ''
    });
    setModal(true);
  }

  async function saveService(event) {
    event.preventDefault();
    setBusy(true);
    setServiceError('');
    try {
      const payload = {
        categoryId: values.categoryId,
        name: values.name.trim(),
        slug: values.slug.trim(),
        shortDescription: values.shortDescription?.trim() || null,
        description: values.description?.trim() || null,
        basePrice: Number(values.basePrice),
        durationMinutes: Number(values.durationMinutes),
        images: values.imageUrl?.trim()
          ? [{ imageUrl: values.imageUrl.trim(), altText: values.name.trim(), sortOrder: 0 }]
          : []
      };

      if (editingService) {
        await api.patch(`/catalog/admin/services/${editingService.id}`, payload);
        setActionSuccess(`Service "${payload.name}" updated successfully.`);
      } else {
        await api.post('/catalog/admin/services', payload);
        setActionSuccess(`Service "${payload.name}" created successfully.`);
      }

      setModal(false);
      setEditingService(null);
      setValues({
        categoryId: (selectedCategory !== 'all' ? selectedCategory : categories[0]?.id) || '',
        name: '',
        slug: '',
        shortDescription: '',
        description: '',
        basePrice: '',
        durationMinutes: '60',
        imageUrl: ''
      });
      setTimeout(() => setActionSuccess(''), 4000);
      await load();
    } catch (requestError) {
      setServiceError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.categoryId === selectedCategory || s.category?.id === selectedCategory);

  return (
    <div>
      <SectionHeading
        eyebrow="Marketplace catalogue"
        title="Service management"
        description="Organize services, select categories, and manage pricing and images."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" onClick={() => onNavigate ? onNavigate('categories') : setCategoryModal(true)}>
              <FolderTree size={16} /> Categories
            </Button>
            <Button
              onClick={openAddService}
              className="bg-gradient-to-r from-violet-700 to-purple-600 text-white shadow-md shadow-violet-700/20 hover:shadow-violet-700/30"
            >
              <Plus size={16} /> Add service
            </Button>
          </div>
        }
      />

      {actionSuccess && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          <Check size={17} className="text-violet-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleCategoryFilter('all')}
            className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-violet-700 text-white shadow-sm shadow-violet-700/20'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            All categories ({services.length})
          </button>
          {categories.map((cat) => {
            const count = services.filter((s) => s.categoryId === cat.id || s.category?.id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryFilter(cat.id)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-violet-700 text-white shadow-sm shadow-violet-700/20'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {cat.imageUrl ? (
                  <img src={resolveMediaUrl(cat.imageUrl)} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <FolderTree size={14} className={isSelected ? 'text-white' : 'text-violet-600'} />
                )}
                <span>{cat.name}</span>
                <span className={`text-[10px] font-black rounded-md px-1.5 py-0.2 ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filteredServices.length ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)]">
          <div className="hidden grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.5fr] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:grid">
            <span>Service</span>
            <span>Category</span>
            <span>Starting price</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          {
            filteredServices.map((service) => {
              const thumb = service.images?.[0]?.imageUrl;
              return (
                <div
                  key={service.id}
                  className="grid gap-2 border-b border-slate-100 px-6 py-4.5 last:border-b-0 hover:bg-violet-50/20 transition sm:grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.5fr] sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={service.name}
                        className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-violet-200/80 shadow-sm"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 ring-2 ring-violet-200/80 shadow-xs">
                        <ImageIcon size={20} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{service.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400 font-medium">
                        {service.durationMinutes} minutes &bull; <span className="font-mono text-[11px] text-slate-500">{service.slug}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="inline-block rounded-xl bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-900 border border-violet-100 truncate max-w-full">
                      {service.category?.name || 'Service category'}
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {currency(service.effectivePrice ?? service.basePrice, service.currency)}
                  </span>
                  <div>
                    <StatusBadge status={service.isActive ? 'approved' : 'suspended'} />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditService(service)}
                      className="text-xs font-bold text-violet-800 hover:bg-violet-100/60"
                    >
                      <Pencil size={13} /> Edit
                    </Button>
                  </div>
                </div>
              );
            })
          }
        </div>
      ) : services.length && selectedCategory !== 'all' ? (
        <EmptyState
          icon={FolderTree}
          title="No services in this category"
          description={`No services have been added under "${categories.find((c) => c.id === selectedCategory)?.name || 'this category'}" yet.`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={openAddService}>
                <Plus size={15} /> Add service in this category
              </Button>
              <Button variant="secondary" onClick={() => handleCategoryFilter('all')}>
                Show all services
              </Button>
            </div>
          }
        />
      ) : (
        <EmptyState
          icon={Wrench}
          title="Your catalogue starts here"
          description="Add categories and services to help customers discover the work your marketplace offers."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => { setCategoryError(''); setCategoryModal(true); }}>
                <FolderPlus size={15} /> Add category
              </Button>
              <Button onClick={openAddService}>
                <Plus size={15} /> Add a service
              </Button>
            </div>
          }
        />
      )}

      {/* Add Category Modal */}
      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title="Add a category">
        <form className="space-y-4" onSubmit={createCategory}>
          <Field label="Category name" hint="e.g. Electrical, Plumbing, Cleaning, Appliance Care">
            <Input
              required
              minLength={2}
              maxLength={100}
              value={categoryValues.name}
              onChange={(event) => updateCategoryField('name', event.target.value)}
              placeholder="Enter category name"
              autoFocus
            />
          </Field>
          <Field label="URL slug" hint="Auto-generated URL identifier (lowercase, numbers, and hyphens)">
            <Input
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              value={categoryValues.slug}
              onChange={(event) => updateCategoryField('slug', event.target.value)}
              placeholder="e.g. appliance-care"
            />
          </Field>
          {categoryError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{categoryError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCategoryModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={categoryBusy || categoryValues.name.trim().length < 2}>
              {categoryBusy ? 'Adding category…' : 'Add category'} <FolderPlus size={15} />
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal} onClose={() => setModal(false)} title={editingService ? 'Edit service & category' : 'Add a service'}>
        <form className="space-y-4" onSubmit={saveService}>
          <Field label="Service category" hint="Click a category below to select, or choose from dropdown">
            <div className="space-y-2.5">
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-2xl border border-slate-200 bg-slate-50/60">
                  {categories.map((cat) => {
                    const isSelected = values.categoryId === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => update('categoryId', cat.id)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition border ${isSelected
                          ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/40'
                          }`}
                      >
                        {cat.imageUrl ? (
                          <img src={resolveMediaUrl(cat.imageUrl)} alt="" className="h-5 w-5 rounded-md object-cover" />
                        ) : (
                          <FolderTree size={14} className={isSelected ? 'text-white' : 'text-violet-700'} />
                        )}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <Select
                  required
                  value={values.categoryId}
                  onChange={(event) => update('categoryId', event.target.value)}
                  className="flex-1"
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate ? onNavigate('categories') : setCategoryModal(true)}
                  title="Create a new category"
                >
                  <FolderPlus size={15} />
                </Button>
              </div>
            </div>
          </Field>

          <Field label="Service name">
            <Input
              required
              minLength={2}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. Deep home cleaning"
            />
          </Field>
          <Field label="URL slug">
            <Input
              required
              value={values.slug}
              onChange={(event) => update('slug', event.target.value)}
              placeholder="deep-home-cleaning"
            />
          </Field>

          <Field label="Service photo">
            {values.imageUrl ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img
                  src={resolveMediaUrl(values.imageUrl)}
                  alt="Service preview"
                  className="h-16 w-16 shrink-0 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">Photo attached</p>
                  <p className="truncate text-[11px] text-slate-400">{values.imageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValues((c) => ({ ...c, imageUrl: '' }))}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Remove photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center transition hover:border-violet-500 hover:bg-violet-50/20">
                  <UploadCloud className="mb-1.5 h-7 w-7 text-violet-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingImage ? 'Uploading image…' : 'Click to upload service photo'}
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-400">PNG, JPG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageFile}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                <Input
                  placeholder="Or enter an external image URL"
                  value={values.imageUrl}
                  onChange={(event) => update('imageUrl', event.target.value)}
                  className="text-xs"
                />
              </div>
            )}
            {imageError && <p className="mt-1.5 text-xs text-rose-600 font-medium">{imageError}</p>}
          </Field>

          <Field label="Short description">
            <Input
              value={values.shortDescription}
              onChange={(event) => update('shortDescription', event.target.value)}
              maxLength={500}
              placeholder="A clear one-line summary"
            />
          </Field>
          <Field label="Details">
            <Textarea
              rows={3}
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="What customers can expect"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={values.basePrice}
                onChange={(event) => update('basePrice', event.target.value)}
                required
              />
            </Field>
            <Field label="Duration (minutes)">
              <Input
                type="number"
                min="1"
                value={values.durationMinutes}
                onChange={(event) => update('durationMinutes', event.target.value)}
                required
              />
            </Field>
          </div>
          {serviceError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{serviceError}</p>}
          <Button type="submit" className="w-full" disabled={busy || uploadingImage || !categories.length}>
            {editingService ? (busy ? 'Saving changes…' : 'Save changes') : (busy ? 'Creating…' : 'Create service')} <PackagePlus size={15} />
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [approvedProviders, setApprovedProviders] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bookingData, providerData] = await Promise.all([
        api.get('/bookings', { page: '1', limit: '100' }),
        api.get('/providers/admin/applications', { status: 'approved', page: '1', limit: '100' })
      ]);
      setBookings(bookingData || []);
      setApprovedProviders(providerData || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function assign(bookingId) {
    const providerId = selectedProviders[bookingId];
    if (!providerId) {
      setError('Please select an approved provider from the list.');
      return;
    }
    setBusy(bookingId);
    setError('');
    setMessage('');
    try {
      await api.patch(`/bookings/${bookingId}/assign`, { providerId });
      setMessage('Provider assigned to booking successfully.');
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  async function cancelBooking(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setBusy(bookingId);
    setError('');
    setMessage('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { cancellationReason: 'Admin cancellation' });
      setMessage('Booking cancelled.');
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = !search.trim() ||
        b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceNameSnapshot?.toLowerCase().includes(search.toLowerCase()) ||
        b.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        b.provider?.displayName?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const activeCount = bookings.filter((b) => ['assigned', 'confirmed', 'in_progress'].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const totalItems = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Service operations"
        title="Booking management"
        description="Monitor real-time customer bookings, review scheduled service visits, and assign approved professionals."
      />

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Total Bookings"
          value={bookings.length}
          note="All customer requests"
          icon={CalendarDays}
          iconBg="bg-[#e0f2fe] text-[#0284c7]"
          arrowColor="text-[#0284c7]"
          border="border-sky-100/90"
          bg="bg-gradient-to-br from-white via-white to-sky-50/50"
          wave="text-[#bae6fd]/50"
          onClick={() => setStatusFilter('all')}
        />
        <AdminStatCard
          title="Awaiting Assignment"
          value={pendingCount}
          note="Need provider allocation"
          icon={Clock}
          iconBg="bg-[#ffedd5] text-[#ea580c]"
          arrowColor="text-[#ea580c]"
          border="border-amber-100/90"
          bg="bg-gradient-to-br from-white via-white to-amber-50/50"
          wave="text-[#fed7aa]/50"
          badge={pendingCount > 0 ? `${pendingCount} pending` : null}
          onClick={() => setStatusFilter('pending')}
        />
        <AdminStatCard
          title="In Progress / Active"
          value={activeCount}
          note="Assigned or underway"
          icon={Wrench}
          iconBg="bg-[#ede9fe] text-[#7c3aed]"
          arrowColor="text-[#7c3aed]"
          border="border-violet-100/90"
          bg="bg-gradient-to-br from-white via-white to-violet-50/50"
          wave="text-[#ddd6fe]/50"
          onClick={() => setStatusFilter('in_progress')}
        />
        <AdminStatCard
          title="Completed Jobs"
          value={completedCount}
          note="Delivered successfully"
          icon={BadgeCheck}
          iconBg="bg-[#f3e8ff] text-[#9333ea]"
          arrowColor="text-[#9333ea]"
          border="border-purple-100/90"
          bg="bg-gradient-to-br from-white via-white to-purple-50/50"
          wave="text-[#e9d5ff]/50"
          onClick={() => setStatusFilter('completed')}
        />
      </div>

      {message && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          <Check size={17} className="text-violet-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-700">{error}</p>}

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking #, service, customer, or provider…"
            className="pl-10 rounded-2xl border-slate-200 bg-slate-50/60"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-52 rounded-2xl border-slate-200">
          <option value="all">All statuses ({bookings.length})</option>
          <option value="pending">Pending ({pendingCount})</option>
          <option value="assigned">Assigned</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed ({completedCount})</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {/* Bookings List */}
      {loading ? (
        <PageLoader label="Loading marketplace bookings…" />
      ) : filteredBookings.length ? (
        <div className="space-y-4">
          <div className="space-y-3.5">
            {paginatedBookings.map((booking) => {
              const isAssignable = ['pending', 'assigned'].includes(booking.status);
              return (
                <div
                  key={booking.id}
                  className="rounded-[28px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] space-y-4 hover:border-violet-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-800 bg-violet-100/70 px-2.5 py-1 rounded-xl">
                          {booking.bookingNumber}
                        </span>
                        <h3 className="font-black text-slate-900 text-base">
                          {booking.serviceNameSnapshot || booking.service?.name}
                        </h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-violet-500" />
                          {new Date(booking.scheduledStart).toLocaleString()}
                        </span>
                        {booking.address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-violet-500" />
                            {booking.address.line1}, {booking.address.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:shrink-0">
                      <p className="text-xl sm:text-2xl font-black text-slate-900">{currency(booking.total, 'INR')}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{booking.currency && booking.currency !== 'USD' ? booking.currency : 'INR'}</p>
                    </div>
                  </div>

                  {/* Customer and Provider Details Bar */}
                  <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Customer</span>
                      <p className="font-extrabold text-slate-900">{booking.customer?.fullName || 'Registered customer'}</p>
                      <p className="text-slate-500 mt-0.5">{booking.customer?.email} {booking.customer?.phone ? `&bull; ${booking.customer.phone}` : ''}</p>
                    </div>
                    <div>
                      <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Assigned provider</span>
                      {booking.provider ? (
                        <div>
                          <p className="font-extrabold text-violet-900 flex items-center gap-1.5">
                            <BadgeCheck size={14} className="text-violet-600" />
                            {booking.provider.displayName}
                          </p>
                          <p className="text-slate-500 mt-0.5">{booking.provider.phone || 'Provider assigned'}</p>
                        </div>
                      ) : (
                        <p className="text-amber-700 font-bold italic flex items-center gap-1.5">
                          <Clock size={13} /> Unassigned (Awaiting assignment)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assign Provider / Actions */}
                  {isAssignable && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                        <Select
                          className="text-xs flex-1 max-w-xs rounded-xl"
                          value={selectedProviders[booking.id] || ''}
                          onChange={(e) => setSelectedProviders((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                        >
                          <option value="">Select an approved provider…</option>
                          {approvedProviders.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.displayName} ({p.user?.email || 'Approved'})
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          disabled={busy === booking.id || !selectedProviders[booking.id]}
                          onClick={() => assign(booking.id)}
                          className="bg-gradient-to-r from-violet-700 to-purple-600 text-white shadow-sm hover:shadow-violet-600/20"
                        >
                          {busy === booking.id ? 'Assigning…' : 'Assign provider'}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy === booking.id}
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancel booking
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-600 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Showing <strong className="font-extrabold text-slate-900">{startIndex + 1}</strong> to{' '}
                  <strong className="font-extrabold text-slate-900">{endIndex}</strong> of{' '}
                  <strong className="font-extrabold text-slate-900">{totalItems}</strong> bookings
                </span>
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="text-slate-400">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-violet-600 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage(1)}
                  title="First page"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                <span className="px-2 text-xs font-bold text-violet-800">
                  Page {safePage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(totalPages)}
                  title="Last page"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No bookings found"
          description="Bookings created by customers will appear here."
        />
      )}
    </div>
  );
}

function CustomerManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/auth/admin/users', { page: '1', limit: '100' });
      setUsers(data || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(user) {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setBusyId(user.id);
    setMessage('');
    try {
      await api.patch(`/auth/admin/users/${user.id}/status`, { status: nextStatus });
      setMessage(`Account for ${user.fullName} has been ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId('');
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search.trim() ||
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesRole = roleFilter === 'all' || u.roles?.includes(roleFilter);
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const totalBookings = users.reduce((sum, u) => sum + (u.bookingCount || 0), 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="People & accounts"
        title="Customer management"
        description="View registered customers, their contact details, booking activity, and manage account statuses."
      />

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Total Accounts"
          value={users.length}
          note="Registered marketplace users"
          icon={Users}
          iconBg="bg-[#e0e7ff] text-[#4f46e5]"
          arrowColor="text-[#4f46e5]"
          border="border-indigo-100/90"
          bg="bg-gradient-to-br from-white via-white to-indigo-50/50"
          wave="text-[#c7d2fe]/50"
          onClick={() => setStatusFilter('all')}
        />
        <AdminStatCard
          title="Active Accounts"
          value={activeCount}
          note="Can book and use services"
          icon={BadgeCheck}
          iconBg="bg-[#ede9fe] text-[#7c3aed]"
          arrowColor="text-[#7c3aed]"
          border="border-violet-100/90"
          bg="bg-gradient-to-br from-white via-white to-violet-50/50"
          wave="text-[#ddd6fe]/50"
          onClick={() => setStatusFilter('active')}
        />
        <AdminStatCard
          title="Suspended Accounts"
          value={suspendedCount}
          note="Restricted from platform"
          icon={UserX}
          iconBg="bg-[#ffe4e6] text-[#e11d48]"
          arrowColor="text-[#e11d48]"
          border="border-rose-100/90"
          bg="bg-gradient-to-br from-white via-white to-rose-50/50"
          wave="text-[#fecdd3]/50"
          onClick={() => setStatusFilter('suspended')}
        />
        <AdminStatCard
          title="Customer Bookings"
          value={totalBookings}
          note="Lifetime booking requests"
          icon={CalendarDays}
          iconBg="bg-[#e0f2fe] text-[#0284c7]"
          arrowColor="text-[#0284c7]"
          border="border-sky-100/90"
          bg="bg-gradient-to-br from-white via-white to-sky-50/50"
          wave="text-[#bae6fd]/50"
        />
      </div>

      {message && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          <Check size={17} className="text-violet-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-700">{error}</p>}

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-10 rounded-2xl border-slate-200 bg-slate-50/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44 rounded-2xl border-slate-200">
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="suspended">Suspended only</option>
          </Select>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-44 rounded-2xl border-slate-200">
            <option value="all">All roles</option>
            <option value="customer">Customers</option>
            <option value="provider">Providers</option>
            <option value="admin">Admins</option>
          </Select>
        </div>
      </div>

      {/* Customer Directory Table */}
      {loading ? (
        <PageLoader label="Loading customer directory…" />
      ) : filteredUsers.length ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)]">
          <div className="hidden grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:grid">
            <span>Customer</span>
            <span>Contact info</span>
            <span>Bookings</span>
            <span>Joined date</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="grid gap-3 px-6 py-4.5 hover:bg-violet-50/20 transition sm:grid-cols-[1.5fr_1.5fr_0.8fr_0.8fr_0.8fr_0.8fr] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-xs font-black text-violet-800 ring-2 ring-violet-200/80 shadow-xs">
                    {u.fullName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{u.fullName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {u.roles?.map((r) => (
                        <span key={r} className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-1 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-violet-500 shrink-0" />
                    <span className="truncate">{u.email}</span>
                    {u.emailVerified && <span title="Email verified" className="text-violet-600 font-bold">✓</span>}
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-1.5 truncate text-slate-400">
                      <Phone size={13} className="text-violet-500 shrink-0" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs">
                  <span className="font-black text-slate-900">{u.bookingCount || 0}</span>
                  <span className="text-slate-400 font-medium"> bookings</span>
                  {u.totalSpent > 0 && (
                    <p className="text-[11px] font-bold text-violet-700 mt-0.5">{currency(u.totalSpent, 'INR')}</p>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {new Date(u.createdAt).toLocaleDateString()}
                </div>

                <div>
                  <StatusBadge status={u.status} />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={u.status === 'active' ? 'danger' : 'secondary'}
                    disabled={busyId === u.id}
                    onClick={() => toggleStatus(u)}
                    className="text-xs font-bold"
                  >
                    {busyId === u.id ? 'Updating…' : u.status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No accounts match your search"
          description="Try adjusting your search keywords or filter settings."
        />
      )}
    </div>
  );
}

function FinanceManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bookings/admin/finance');
      setData(res);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const metrics = data?.metrics || {
    totalGrossVolume: 0,
    completedVolume: 0,
    platformRevenue: 0,
    providerPayouts: 0,
    totalBookings: 0,
    completedCount: 0,
    pendingCount: 0
  };

  const transactions = useMemo(() => {
    return (data?.transactions || []).filter((tx) => {
      const matchesSearch = !search.trim() ||
        tx.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        tx.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
        tx.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        tx.providerName?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Finance & reporting"
        title="Payments and financial operations"
        description="Real-time revenue, platform commissions, provider settlement ledgers, and transaction history from the database."
      />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Gross Marketplace Volume"
          value={currency(metrics.totalGrossVolume, 'INR')}
          note={`Total value across ${metrics.totalBookings} bookings`}
          icon={Banknote}
          iconBg="bg-[#f3e8ff] text-[#9333ea]"
          arrowColor="text-[#9333ea]"
          border="border-purple-100/90"
          bg="bg-gradient-to-br from-white via-white to-purple-50/50"
          wave="text-[#e9d5ff]/50"
          onClick={() => setStatusFilter('all')}
        />
        <AdminStatCard
          title="Settled Volume"
          value={currency(metrics.completedVolume, 'INR')}
          note={`${metrics.completedCount} completed jobs settled`}
          icon={BadgeCheck}
          iconBg="bg-[#e0e7ff] text-[#4f46e5]"
          arrowColor="text-[#4f46e5]"
          border="border-indigo-100/90"
          bg="bg-gradient-to-br from-white via-white to-indigo-50/50"
          wave="text-[#c7d2fe]/50"
          onClick={() => setStatusFilter('settled')}
        />
        <AdminStatCard
          title="Platform Commission"
          value={currency(metrics.platformRevenue, 'INR')}
          note="15% marketplace platform fee"
          icon={TrendingUp}
          iconBg="bg-[#ede9fe] text-[#7c3aed]"
          arrowColor="text-[#7c3aed]"
          border="border-violet-100/90"
          bg="bg-gradient-to-br from-white via-white to-violet-50/50"
          wave="text-[#ddd6fe]/50"
        />
        <AdminStatCard
          title="Net Provider Payouts"
          value={currency(metrics.providerPayouts, 'INR')}
          note="Earnings for service professionals"
          icon={Wallet}
          iconBg="bg-[#ffedd5] text-[#ea580c]"
          arrowColor="text-[#ea580c]"
          border="border-amber-100/90"
          bg="bg-gradient-to-br from-white via-white to-amber-50/50"
          wave="text-[#fed7aa]/50"
        />
      </div>

      {error && <p role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-700">{error}</p>}

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by booking #, service, customer or provider…"
            className="pl-10 rounded-2xl border-slate-200 bg-slate-50/60"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-48 rounded-2xl border-slate-200">
          <option value="all">All statuses</option>
          <option value="settled">Settled only</option>
          <option value="pending">Pending only</option>
          <option value="refunded">Refunded only</option>
        </Select>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <PageLoader label="Calculating financial transactions from database…" />
      ) : transactions.length ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)]">
          <div className="hidden grid-cols-[1.4fr_1.4fr_1.2fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:grid">
            <span>Booking & service</span>
            <span>Customer</span>
            <span>Provider</span>
            <span>Date</span>
            <span className="text-right">Gross total</span>
            <span className="text-right">Platform fee</span>
            <span className="text-right">Status</span>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="grid gap-2 px-6 py-4 hover:bg-violet-50/20 transition sm:grid-cols-[1.4fr_1.4fr_1.2fr_0.8fr_0.7fr_0.7fr_0.8fr] sm:items-center sm:gap-4 text-xs font-medium"
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-violet-800 bg-violet-100/70 px-2 py-0.5 rounded-md border border-violet-200 block w-fit mb-1">
                    {tx.bookingNumber}
                  </span>
                  <p className="font-extrabold text-slate-900">{tx.serviceName}</p>
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{tx.customerName}</p>
                  <p className="text-slate-400 truncate text-[11px]">{tx.customerEmail}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-800 truncate">{tx.providerName}</p>
                </div>

                <div className="text-slate-500 font-medium">
                  {new Date(tx.createdAt || tx.date).toLocaleDateString()}
                </div>

                <div className="text-right font-black text-slate-900 text-sm">
                  {currency(tx.amount, 'INR')}
                </div>

                <div className="text-right font-bold text-violet-700">
                  +{currency(tx.commission, 'INR')}
                </div>

                <div className="flex justify-end">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                    tx.status === 'settled'
                      ? 'bg-violet-100 text-violet-800'
                      : tx.status === 'refunded'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Banknote}
          title="No transaction records"
          description="Transactions generated from completed and active bookings will be listed here."
        />
      )}
    </div>
  );
}

export default function AdminPortal({ active, onTabChange, user }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  function handleNavigate(tab, categoryId = '') {
    if (categoryId) setSelectedCategoryId(categoryId);
    onTabChange(tab);
  }

  if (active === 'providers') return <ProviderManagement onNavigate={handleNavigate} />;
  if (active === 'customers') return <CustomerManagement onNavigate={handleNavigate} />;
  if (active === 'categories') return <CategoryManagement onNavigate={handleNavigate} />;
  if (active === 'services') return <ServiceManagement onNavigate={handleNavigate} initialCategoryId={selectedCategoryId} onCategoryChange={setSelectedCategoryId} />;
  if (active === 'bookings') return <BookingManagement onNavigate={handleNavigate} />;
  if (active === 'finance') return <FinanceManagement onNavigate={handleNavigate} />;
  if (active === 'settings') return <SettingsManagement />;
  return <AdminOverview onNavigate={handleNavigate} user={user} />;
}
