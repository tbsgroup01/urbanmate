import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
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
  Wrench
} from 'lucide-react';
import AddressEditor from '../components/AddressEditor';
import EmailVerification from '../components/EmailVerification';
import { CartPage, ServiceDetails } from './MarketplacePages';
import { demoCategories, demoServices, filterDemoServices } from '../lib/demoCatalog';
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
  'from-violet-100 to-fuchsia-50 text-violet-800',
  'from-fuchsia-100 to-pink-50 text-fuchsia-800',
  'from-indigo-100 to-sky-50 text-indigo-800'
];

function getDemoFilters(filters, categories) {
  const selectedCategory = categories.find((category) => category.id === filters.categoryId);
  const demoCategory = demoCategories.find((category) => category.name.toLowerCase() === selectedCategory?.name?.toLowerCase());
  return {
    ...filters,
    categoryId: demoCategory?.id || filters.categoryId
  };
}

function useCities() {
  const [cities, setCities] = useState([]);
  useEffect(() => {
    api.get('/catalog/cities', { limit: '100' }).then(setCities).catch(() => setCities([]));
  }, []);
  return cities;
}

function ServiceCard({ service, index, onClick, compact = false }) {
  const Icon = serviceIcon(service.name);
  const image = service.images?.[0]?.imageUrl;
  return (
    <button type="button" onClick={onClick} className="group overflow-hidden rounded-2xl border border-violet-100 bg-white text-left shadow-[0_8px_24px_-20px_rgba(76,29,149,0.5)] transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-900/10">
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${categoryColors[index % categoryColors.length]} ${compact ? 'h-28' : 'h-36'}`}>
        {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : (
          <span className="grid h-[66px] w-[66px] place-items-center rounded-[23px] bg-white/85 shadow-sm transition group-hover:rotate-[-5deg] group-hover:scale-105">
            <Icon size={31} strokeWidth={1.6} />
          </span>
        )}
        {image && <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 to-transparent" />}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-violet-800">Local pros</div>
        {!compact && <div className="absolute -bottom-5 left-5 grid h-10 w-10 place-items-center rounded-xl border border-slate-100 bg-white text-amber-500 shadow-sm"><Star size={16} fill="currentColor" /></div>}
      </div>
      <div className={`p-4 ${compact ? '' : 'pt-7'}`}>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{service.category?.name || 'HOME SERVICE'}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900">{service.name}</h3>
        {!compact && <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{service.shortDescription || service.description || 'Carefully matched professionals, ready when you need them.'}</p>}
        <div className={`flex items-center justify-between gap-2 ${compact ? 'mt-2' : 'mt-4 border-t border-slate-100 pt-4'}`}>
          <span className="text-xs font-extrabold text-slate-900">From {currency(service.effectivePrice ?? service.basePrice, service.currency)}</span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white"><ArrowRight size={14} /></span>
        </div>
      </div>
    </button>
  );
}

function CustomerHome({ user, onOpenService, onTabChange, onBecomePartner }) {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingCount, setBookingCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    api.get('/catalog/categories', { limit: '100' })
      .then((result) => setCategories(result.length ? result : demoCategories))
      .catch((requestError) => {
        setCategories(demoCategories);
        console.warn('Using sample service categories because the catalog could not be loaded:', getErrorMessage(requestError));
      });
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
        if (!active) return;
        if (items.length) {
          setServices(items);
          setDemoMode(false);
        } else {
          setServices(filterDemoServices(demoServices, getDemoFilters({ q: query, categoryId }, categories)));
          setDemoMode(true);
        }
      }).catch((requestError) => {
        if (!active) return;
        setServices(filterDemoServices(demoServices, getDemoFilters({ q: query, categoryId }, categories)));
        setDemoMode(true);
        setError('');
        console.warn('Using sample services because the catalog could not be loaded:', getErrorMessage(requestError));
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, categoryId, categories]);

  useEffect(() => {
    if (!user) return;
    api.get('/bookings', { page: '1', limit: '100' })
      .then((items) => setBookingCount(items.length))
      .catch(() => setBookingCount(0));
  }, [user]);

  const trendTerms = ['AC service', 'Home cleaning', 'Salon at home', 'Plumbing'];
  const heroImage = services.find((service) => service.images?.[0]?.imageUrl)?.images?.[0]?.imageUrl;

  return (
    <div id="customer-home" className="space-y-9 pb-8">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#f2ebff] sm:rounded-[34px]">
        <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-fuchsia-100/80 blur-3xl" />
        <div className="relative grid min-h-[410px] items-center gap-8 px-5 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1fr_0.95fr] lg:px-12 lg:py-12">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-violet-800"><Sparkles size={13} /> Home services, on demand</span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl xl:text-[58px]">
              Book trusted pros for <span className="text-violet-700">all your home needs.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">Cleaning, repairs, maintenance and more — thoughtful local help, right at your doorstep.</p>
            <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl border border-violet-100 bg-white p-2 shadow-[0_14px_40px_-24px_rgba(76,29,149,0.45)]">
              <Search size={19} className="ml-2 shrink-0 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' })} placeholder="Search AC repair, home cleaning…" className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" aria-label="Search services" />
              <Button size="sm" className="bg-violet-700 hover:bg-violet-800" onClick={() => document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' })}>Search</Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-slate-500">Trending:</span>
              {trendTerms.map((term) => <button key={term} type="button" onClick={() => { setQuery(term); document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full border border-violet-100 bg-white/80 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-800">{term}</button>)}
            </div>
            {user && (
              <button type="button" onClick={() => onTabChange('bookings')} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-violet-800 hover:text-violet-950">
                <CalendarDays size={15} /> You have {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'} <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="relative mx-auto flex min-h-[260px] w-full max-w-[500px] items-center justify-center sm:min-h-[310px]">
            {heroImage ? (
              <img src={heroImage} alt="Home service from Urbanmate" className="absolute inset-0 h-full w-full rounded-[30px] object-cover shadow-xl" />
            ) : (
              <>
                <div className="absolute inset-5 rounded-[38%] bg-gradient-to-br from-violet-300 via-fuchsia-200 to-indigo-200 shadow-[0_35px_80px_-40px_rgba(91,33,182,0.5)]" />
                <div className="relative grid h-52 w-52 place-items-center rounded-[36%] border border-white/80 bg-white/70 shadow-xl backdrop-blur sm:h-60 sm:w-60">
                  <div className="flex h-36 w-36 flex-col items-center justify-center rounded-[30%] bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-900/20 sm:h-40 sm:w-40">
                    <House size={68} strokeWidth={1.35} />
                    <span className="mt-2 rounded-full bg-white px-3 py-1 text-[9px] font-extrabold text-violet-800 shadow">HOME, MADE EASIER</span>
                  </div>
                </div>
              </>
            )}
            <div className="absolute left-0 top-5 flex items-center gap-2 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-lg sm:left-1">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><ShieldCheck size={19} /></span>
              <span><strong className="block text-[11px] text-slate-900">Verified experts</strong><small className="text-[10px] text-slate-500">Thoughtful, trusted care</small></span>
            </div>
            <div className="absolute bottom-4 right-0 flex items-center gap-2 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-lg sm:right-1">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-700"><CalendarDays size={19} /></span>
              <span><strong className="block text-[11px] text-slate-900">Flexible scheduling</strong><small className="text-[10px] text-slate-500">Choose a time that works</small></span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-700">Find your fix</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Browse by category</h2></div>
          <button type="button" onClick={() => onTabChange('services')} className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900">All services <ChevronRight size={15} /></button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3">
          {(categories.length ? categories.slice(0, 8) : ['Cleaning', 'Plumbing', 'Electrical', 'Appliance care'].map((name) => ({ id: name, name }))).map((category, index) => {
            const Icon = serviceIcon(category.name);
            return (
              <button key={category.id} type="button" onClick={() => { setCategoryId(category.id.length > 30 ? category.id : ''); if (category.id.length <= 30) setQuery(category.name); document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' }); }} className="group min-w-[118px] overflow-hidden rounded-2xl border border-violet-100 bg-white text-left shadow-[0_8px_25px_-22px_rgba(76,29,149,0.7)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md sm:min-w-[136px]">
                <span className={`flex h-[74px] items-center justify-center bg-gradient-to-br ${categoryColors[index % categoryColors.length]}`}><Icon size={29} strokeWidth={1.7} /></span>
                <span className="block px-3 py-2.5 text-center text-[11px] font-extrabold leading-tight text-slate-800">{category.name}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => onTabChange('services')} className="grid min-w-[92px] place-items-center rounded-2xl border border-violet-100 bg-violet-50 px-3 text-center text-xs font-extrabold text-violet-800 transition hover:bg-violet-100"><span className="text-2xl">»</span><span>More<br />services</span></button>
        </div>
      </section>

      <section id="customer-services" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-700">Handpicked for your home</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{query ? `Services for “${query}”` : 'Popular services'}</h2></div>
          <button type="button" onClick={() => onTabChange('services')} className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900">View all services <ArrowRight size={14} /></button>
        </div>
        {demoMode && <p role="status" className="mb-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-[11px] leading-5 text-violet-800">Sample services are shown while the live catalog is unavailable. These listings are for preview only.</p>}
        {loading ? <PageLoader label="Finding the right local services…" /> : error ? <ErrorState message={error} onRetry={() => setQuery((value) => `${value} `)} /> : services.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {services.slice(0, 5).map((service, index) => <ServiceCard key={service.id} service={service} index={index} compact onClick={() => onOpenService(service.id)} />)}
          </div>
        ) : <EmptyState icon={CircleHelp} title="No services found" description="Try a different search or check back as more local services are added." />}
      </section>

      <section className="grid gap-3 rounded-[26px] bg-gradient-to-r from-[#f6f0ff] via-[#f2ebff] to-[#f8f2ff] p-5 sm:grid-cols-[1.1fr_repeat(4,1fr)] sm:items-center sm:p-6">
        <div className="mb-1 sm:mb-0"><h2 className="text-lg font-black tracking-tight text-violet-900">How Urbanmate works</h2><p className="mt-1 text-xs leading-5 text-slate-600">Home help, in a few simple steps.</p></div>
        {[
          { icon: Search, title: 'Choose a service', text: 'Browse trusted home services.' },
          { icon: CalendarDays, title: 'Pick a time', text: 'Choose a convenient slot.' },
          { icon: BadgeCheck, title: 'Meet your pro', text: 'A local expert confirms.' },
          { icon: Star, title: 'Enjoy the result', text: 'Share your experience.' }
        ].map(({ icon: Icon, title, text }, index) => (
          <div key={title} className="flex items-center gap-3 border-t border-violet-200/70 pt-3 sm:block sm:border-0 sm:border-l sm:pl-4 sm:pt-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-violet-700 shadow-sm"><Icon size={18} /></span>
            <div className="sm:mt-2"><h3 className="text-xs font-extrabold text-slate-900">{index + 1}. {title}</h3><p className="mt-0.5 text-[10px] leading-4 text-slate-500">{text}</p></div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-700">The Urbanmate difference</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Good help. Thoughtfully delivered.</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: 'Verified professionals', text: 'Providers are reviewed before joining our network.' },
            { icon: Clock3, title: 'Flexible scheduling', text: 'Pick a service time that works for your day.' },
            { icon: ArrowUpRight, title: 'Clear pricing', text: 'See service prices before confirming a booking.' },
            { icon: Sparkles, title: 'Care in the details', text: 'A smoother way to take care of your home.' }
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex gap-3 border-violet-100 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon size={19} /></span>
              <div><h3 className="text-xs font-extrabold text-slate-900">{title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p></div>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-violet-800 via-violet-700 to-fuchsia-700 px-6 py-7 text-white sm:px-9 sm:py-8">
        <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border border-white/15" />
        <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-200">For skilled professionals</p><h2 className="mt-2 text-xl font-black sm:text-2xl">Build your business with Urbanmate.</h2><p className="mt-2 max-w-xl text-xs leading-5 text-violet-100">Connect with customers, manage your schedule, and grow your local service business.</p></div>
          <Button className="shrink-0 bg-white text-violet-800 hover:bg-violet-50" onClick={onBecomePartner}>Become a partner <ArrowRight size={15} /></Button>
        </div>
      </section>
    </div>
  );
}

function ServiceExplorer({ onOpenService }) {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    api.get('/catalog/categories', { limit: '100' })
      .then((result) => setCategories(result.length ? result : demoCategories))
      .catch((requestError) => {
        setCategories(demoCategories);
        console.warn('Using sample service categories because the catalog could not be loaded:', getErrorMessage(requestError));
      });
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      const filters = {
        limit: '100',
        ...(query.trim() ? { q: query.trim() } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(minPrice ? { minPrice } : {}),
        ...(maxPrice ? { maxPrice } : {}),
        ...(minDuration ? { minDuration } : {}),
        sortBy,
        order: 'asc'
      };
      api.get('/catalog/services', filters).then((result) => {
        if (!active) return;
        if (result.length) {
          setItems(result);
          setDemoMode(false);
        } else {
          setItems(filterDemoServices(demoServices, getDemoFilters(filters, categories)));
          setDemoMode(true);
        }
      }).catch((requestError) => {
        if (!active) return;
        if (requestError.status === 400) {
          setError(getErrorMessage(requestError));
          setDemoMode(false);
          return;
        }
        setItems(filterDemoServices(demoServices, getDemoFilters(filters, categories)));
        setDemoMode(true);
        console.warn('Using sample services because the catalog could not be loaded:', getErrorMessage(requestError));
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, categoryId, minPrice, maxPrice, minDuration, sortBy, reloadKey, categories]);

  function load() {
    setReloadKey((value) => value + 1);
  }

  return (
    <div id="customer-services">
      <SectionHeading eyebrow="Discover" title="Explore home services" description="Find the right help for your space and schedule." />
      {demoMode && <p role="status" className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-[11px] leading-5 text-violet-800">Sample services are shown while the live catalog is unavailable. These listings are for preview only.</p>}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-3 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10">
          <Search className="shrink-0 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search cleaning, plumbing, appliance repair…" aria-label="Search services" />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-bold text-slate-500">Category
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Minimum price
            <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600" placeholder="₹0" />
          </label>
          <label className="text-xs font-bold text-slate-500">Maximum price
            <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600" placeholder="Any price" />
          </label>
          <label className="text-xs font-bold text-slate-500">Minimum duration
            <select value={minDuration} onChange={(event) => setMinDuration(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600">
              <option value="">Any duration</option><option value="30">30+ minutes</option><option value="60">1+ hour</option><option value="120">2+ hours</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Sort by
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600">
              <option value="name">Name</option><option value="price">Price</option><option value="duration">Duration</option>
            </select>
          </label>
        </div>
      </div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onClick={() => onOpenService(service.id)} />)}
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

function CustomerProfile({ user, onUserUpdate }) {
  return (
    <div>
      <SectionHeading eyebrow="Account" title="Your profile" description="Manage your account details and security." />
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-100 text-xl font-black text-emerald-800">{user.fullName?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">{user.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm leading-6 text-slate-500">Your account is protected with secure sign-in. Keep your email current so you can receive important account updates.</p>
          </div>
        </Card>
        <EmailVerification user={user} onVerified={onUserUpdate} />
      </div>
    </div>
  );
}

function BookingFlow({ serviceId, initialItem, onClose, onNeedLogin, onBookingCreated }) {
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
    if (initialItem?.isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [serviceData, addressData] = await Promise.all([
        api.get(`/catalog/services/${serviceId}`),
        api.get('/addresses')
      ]);
      setService(serviceData);
      setAddresses(addressData);
      const savedPackage = serviceData.packages?.find((item) => item.id === initialItem?.packageId);
      setPackageId(savedPackage?.id || serviceData.packages?.[0]?.id || '');
      setAddonIds((initialItem?.addonIds || []).filter((id) => serviceData.addons?.some((addon) => addon.id === id)));
      setAddressId(addressData[0]?.id || '');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [serviceId, initialItem]);

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
      onBookingCreated(booking);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      if (requestError.status === 401) onNeedLogin();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader label="Loading service details…" />;
  if (initialItem?.isDemo && !service) {
    return (
      <div className="space-y-4 rounded-2xl bg-violet-50 p-5">
        <Badge tone="blue">Sample listing</Badge>
        <h3 className="text-lg font-extrabold text-slate-900">Preview only</h3>
        <p className="text-sm leading-6 text-slate-600">This sample service can be explored and added to your cart, but booking needs the live catalog and availability API.</p>
        <Button variant="secondary" className="w-full" onClick={onClose}>Back to cart</Button>
      </div>
    );
  }
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
          Your booking request has been submitted. Online payment is not available here yet; your booking is awaiting provider confirmation.
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

export default function CustomerPortal({
  user,
  active,
  onTabChange,
  onSignIn,
  onUserUpdate,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onBecomePartner
}) {
  const [serviceId, setServiceId] = useState('');
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [detailServiceId, setDetailServiceId] = useState('');
  const [loginPrompt, setLoginPrompt] = useState(false);

  function openService(id) {
    setDetailServiceId(id);
  }

  function changeTab(next) {
    onTabChange(next);
    if (!user && next === 'services') {
      window.setTimeout(() => document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  let content;
  if (detailServiceId) {
    content = <ServiceDetails
      serviceId={detailServiceId}
      cartItem={cartItems.find((item) => item.serviceId === detailServiceId)}
      onBack={() => setDetailServiceId('')}
      onAddToCart={(item) => { onAddToCart(item); onTabChange('cart'); setDetailServiceId(''); }}
    />;
  } else if (active === 'cart') {
    content = <CartPage
      items={cartItems}
      onRemove={onRemoveFromCart}
      onContinue={() => changeTab('services')}
      onCheckout={(item) => {
        if (!user) {
          setLoginPrompt(true);
          return;
        }
        setSelectedCartItem(item);
        setServiceId(item.serviceId);
      }}
    />;
  } else if (active === 'bookings') content = <BookingHistory onSignIn={() => changeTab('services')} />;
  else if (active === 'addresses') content = <AddressBook />;
  else if (active === 'profile' && user) content = <CustomerProfile user={user} onUserUpdate={onUserUpdate} />;
  else if (active === 'services') content = <ServiceExplorer onOpenService={openService} />;
  else content = <CustomerHome user={user} onOpenService={openService} onTabChange={changeTab} onBecomePartner={onBecomePartner} />;

  return (
    <>
      {content}
      <Modal open={Boolean(serviceId)} onClose={() => { setServiceId(''); setSelectedCartItem(null); }} title="Schedule your service" wide>
        {serviceId && <BookingFlow
          serviceId={serviceId}
          initialItem={selectedCartItem}
          onClose={() => { setServiceId(''); setSelectedCartItem(null); onTabChange('bookings'); }}
          onNeedLogin={() => { setServiceId(''); setSelectedCartItem(null); setLoginPrompt(true); }}
          onBookingCreated={() => onRemoveFromCart(serviceId)}
        />}
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
