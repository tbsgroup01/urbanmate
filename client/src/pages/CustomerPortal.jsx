import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Eye,
  House,
  LayoutGrid,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Table as TableIcon,
  Trash2,
  Wrench,
  X,
  Zap
} from 'lucide-react';

import { useSettings } from '../context/SettingsContext';
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
  currency,
  initials
} from '../components/ui';


import { api, assetUrl, getErrorMessage, resolveMediaUrl } from '../lib/api';
import ThoughtfulCurations from '../components/ThoughtfulCurations';

import heroImage from '../assets/hero.png'

const serviceIcon = (name = '') => {
  const normalized = name.toLowerCase();
  if (normalized.includes('clean')) return Sparkles;
  if (normalized.includes('plumb') || normalized.includes('water')) return Wrench;
  if (normalized.includes('electric')) return Sparkles;
  if (normalized.includes('home')) return House;
  return Wrench;
};

const categoryColors = [
  'from-violet-100 to-purple-50 text-violet-800',
  'from-violet-100 to-fuchsia-50 text-violet-800',
  'from-fuchsia-100 to-pink-50 text-fuchsia-800',
  'from-indigo-100 to-sky-50 text-indigo-800'
];

const defaultCategoryPhotos = {
  'full home/ by room cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'statement design wall': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  'living & bedroom cleaning': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  'native water purifier': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
  'native smart locks': 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  'cleaning': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80',
  'plumbing': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',
  'electrical': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
  'saloon': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'salon at home': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'ac service & repair': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'appliance repair': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  'pest control': 'https://images.unsplash.com/photo-1563207153-f403bf289096?auto=format&fit=crop&w=600&q=80',
  'painting': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80'
};



const getCategoryPhoto = (category) => {
  if (category?.imageUrl) return category.imageUrl;
  const name = (category?.name || '').toLowerCase();
  for (const [key, url] of Object.entries(defaultCategoryPhotos)) {
    if (name.includes(key) || key.includes(name)) return url;
  }
  if (name.includes('clean')) return defaultCategoryPhotos['cleaning'];
  if (name.includes('wall') || name.includes('paint')) return defaultCategoryPhotos['statement design wall'];
  if (name.includes('purif') || name.includes('water')) return defaultCategoryPhotos['native water purifier'];
  if (name.includes('lock') || name.includes('smart')) return defaultCategoryPhotos['native smart locks'];
  if (name.includes('plumb')) return defaultCategoryPhotos['plumbing'];
  if (name.includes('electr')) return defaultCategoryPhotos['electrical'];
  if (name.includes('salon') || name.includes('beauty')) return defaultCategoryPhotos['saloon'];
  return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
};

const isCategoryNew = (category) => {
  if (category?.isNew) return true;
  const name = (category?.name || '').toLowerCase();
  return name.includes('water purifier') || name.includes('purifier');
};

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

const defaultServiceImages = {
  'threading': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'intense cleaning (2 bathroom)': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  'foam-jet ac service': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  'fabric sofa cleaning': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'furnished apartment - home deep cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'electrical inspection': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80',
  'plumbing repair': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80',
  'standard home cleaning': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80',
  'hair cutting': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'acoustic fluted wood panel accent wall': 'https://www.urbancompany.com/img/images/growth/home-screen/1794421454113-a0f0a9.jpeg?bucket=urbanclap-prod&quality=85&format=auto',
  'full home deep cleaning (2 bhk / 3 bhk)': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'sofa shampooing & living room revitalizer': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'native m2 smart ro+uv water purifier': 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80',
  'native 3d face id smart door lock': 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80'
};

const serviceMetadata = {
  'threading': { rating: '4.86', reviews: '3.2M', duration: '10 MINS', options: 8 },
  'intense cleaning (2 bathroom)': { rating: '4.81', reviews: '8.2M', duration: '60 MINS', originalPrice: 998 },
  'foam-jet ac service': { rating: '4.75', reviews: '3.1M', duration: '60 MINS', options: 9 },
  'fabric sofa cleaning': { rating: '4.87', reviews: '377.9K', duration: '45 MINS' },
  'furnished apartment - home deep cleaning': { rating: '4.78', reviews: '1.1M', duration: '3 HRS 45 MINS' }
};

function formatServiceDuration(minutes) {
  if (!minutes || minutes <= 0) return '30 MINS';
  if (minutes < 60) return `${minutes} MINS`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  const hrText = hrs === 1 ? '1 HR' : `${hrs} HRS`;
  return rem > 0 ? `${hrText} ${rem} MINS` : hrText;
}

function getServiceImage(service) {
  if (service?.images?.[0]?.imageUrl) return service.images[0].imageUrl;
  const name = (service?.name || '').toLowerCase();
  for (const [key, url] of Object.entries(defaultServiceImages)) {
    if (name.includes(key) || key.includes(name)) return url;
  }
  if (name.includes('clean')) return defaultServiceImages['standard home cleaning'];
  if (name.includes('plumb')) return defaultServiceImages['plumbing repair'];
  if (name.includes('electr')) return defaultServiceImages['electrical inspection'];
  if (name.includes('ac')) return defaultServiceImages['foam-jet ac service'];
  if (name.includes('sofa')) return defaultServiceImages['fabric sofa cleaning'];
  return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
}

const featuredCategoryOrder = [
  'full home/ by room cleaning',
  'statement design wall',
  'living & bedroom cleaning',
  'native water purifier',
  'native smart locks',
  'saloon',
  'cleaning',
  'electrical',
  'plumbing'
];

function sortBrowseCategories(items = []) {
  if (!items.length) return items;
  return [...items].sort((a, b) => {
    const aName = (a.name || '').toLowerCase().trim();
    const bName = (b.name || '').toLowerCase().trim();
    const aIndex = featuredCategoryOrder.indexOf(aName);
    const bIndex = featuredCategoryOrder.indexOf(bName);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
}

function getServiceDetails(service, index = 0) {
  const normalizedName = (service?.name || '').toLowerCase().trim();
  const matched = serviceMetadata[normalizedName];

  const rating = service?.averageRating || service?.rating || matched?.rating || (4.75 + (index % 4) * 0.04).toFixed(2);
  const reviews = service?.reviewCount
    ? (service.reviewCount >= 1_000_000 ? `${(service.reviewCount / 1_000_000).toFixed(1)}M` : service.reviewCount >= 1000 ? `${(service.reviewCount / 1000).toFixed(1)}K` : service.reviewCount)
    : (matched?.reviews || ['3.2M', '8.2M', '3.1M', '377.9K', '1.1M', '520K', '890K'][index % 7]);

  const durationText = matched?.duration || formatServiceDuration(service?.durationMinutes);
  const optionsCount = matched?.options || service?.packages?.length || 0;
  const originalPrice = matched?.originalPrice || (service?.basePrice && service?.effectivePrice && Number(service.basePrice) > Number(service.effectivePrice) ? service.basePrice : null);
  const showStartsAt = optionsCount > 1 || Boolean(matched?.options) || (service?.packages && service.packages.length > 1);

  return {
    rating,
    reviews,
    durationText,
    optionsCount,
    originalPrice,
    showStartsAt
  };
}

const featuredPopularOrder = [
  'threading',
  'intense cleaning (2 bathroom)',
  'foam-jet ac service',
  'fabric sofa cleaning',
  'furnished apartment - home deep cleaning'
];

function sortPopularServices(items = [], isFiltering = false) {
  if (isFiltering || !items.length) return items;
  return [...items].sort((a, b) => {
    const aName = (a.name || '').toLowerCase().trim();
    const bName = (b.name || '').toLowerCase().trim();
    const aIndex = featuredPopularOrder.indexOf(aName);
    const bIndex = featuredPopularOrder.indexOf(bName);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
}

function ServiceCard({ service, index = 0, onClick }) {
  const photo = getServiceImage(service);
  const details = getServiceDetails(service, index);
  const price = service?.effectivePrice ?? service?.basePrice;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-start text-left cursor-pointer w-full select-none"
    >
      {/* Photo Container */}
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl sm:rounded-[20px] bg-slate-100 shadow-xs transition duration-300 group-hover:shadow-md">
        <img
          src={photo}
          alt={service?.name || 'Service photo'}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Add button on bottom right */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex flex-col items-center justify-center rounded-lg bg-white/95 px-3.5 py-1 text-center shadow-[0_2px_8px_rgba(0,0,0,0.14)] border border-slate-100 backdrop-blur-xs transition duration-200 hover:bg-slate-50 hover:shadow-md active:scale-95 min-w-[56px]"
          >
            <span className="block text-xs sm:text-[13px] font-bold text-violet-700 leading-tight">
              Add
            </span>
            {details.optionsCount > 0 && (
              <span className="block text-[9px] font-medium text-slate-500 leading-none mt-0.5">
                {details.optionsCount} options
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Details below photo */}
      <h3 className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-1 transition group-hover:text-violet-700">
        {service?.name}
      </h3>

      {/* Rating & Duration */}
      <div className="mt-1 flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-700">
        <Star size={11} className="fill-slate-800 text-slate-800 shrink-0" />
        <span>{details.rating}</span>
        <span className="text-slate-500 font-normal">({details.reviews})</span>
        <span className="text-slate-300 mx-0.5">·</span>
        <span className="text-slate-600 font-semibold">{details.durationText}</span>
      </div>

      {/* Price section */}
      <div className="mt-1">
        {details.showStartsAt && (
          <span className="block text-[11px] font-medium text-slate-500 leading-tight">
            Starts at
          </span>
        )}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm sm:text-base font-bold text-slate-950">
            {currency(price, 'INR')}
          </span>
          {details.originalPrice && (
            <span className="text-xs text-slate-400 line-through font-normal">
              {currency(details.originalPrice, 'INR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerHome({ user, onOpenService, onTabChange, onSelectCategory, onBecomePartner }) {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingCount, setBookingCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const handleCategoryClick = (category) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      onTabChange('category', category.slug || category.id);
    }
  };

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
        limit: '100',
        ...(query.trim() ? { q: query.trim() } : {})
      }).then((items) => {
        if (!active) return;
        if (items.length) {
          setServices(items);
          setDemoMode(false);
        } else {
          setServices(filterDemoServices(demoServices, getDemoFilters({ q: query }, categories)));
          setDemoMode(true);
        }
      }).catch((requestError) => {
        if (!active) return;
        setServices(filterDemoServices(demoServices, getDemoFilters({ q: query }, categories)));
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
  }, [query, categories]);

  useEffect(() => {
    if (!user) return;
    api.get('/bookings', { page: '1', limit: '100' })
      .then((items) => setBookingCount(items.length))
      .catch(() => setBookingCount(0));
  }, [user]);

  const sortedCategories = useMemo(() => {
    return sortBrowseCategories(categories.length ? categories : demoCategories);
  }, [categories]);

  // Group services by category
  const categoriesWithServices = useMemo(() => {
    const map = new Map();
    for (const cat of sortedCategories) {
      map.set(cat.id, {
        category: cat,
        services: []
      });
    }

    for (const service of services) {
      const catId = service.categoryId || service.category_id;
      if (catId && map.has(catId)) {
        map.get(catId).services.push(service);
      } else {
        const matchingCat = sortedCategories.find((c) =>
          (c.name && service.categoryName && c.name.toLowerCase() === service.categoryName.toLowerCase()) ||
          (c.slug && service.categorySlug && c.slug === service.categorySlug)
        );
        if (matchingCat && map.has(matchingCat.id)) {
          map.get(matchingCat.id).services.push(service);
        }
      }
    }

    return Array.from(map.values()).filter((item) => item.services.length > 0);
  }, [sortedCategories, services]);

  const trendTerms = ['AC service', 'Home cleaning', 'Salon at home', 'Plumbing'];


  return (
    <div id="customer-home" className="space-y-10 pb-8">
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

          <div className="relative mx-auto flex w-full items-center justify-center py-2 lg:justify-end">
            {heroImage ? (
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 m-auto h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-violet-300/40 blur-3xl pointer-events-none" />
                <div className="relative flex items-center justify-center p-2 sm:p-4">
                  <img
                    src={heroImage}
                    alt="Home service professional from Urbanmate"
                    className="h-auto max-h-[300px] sm:max-h-[350px] lg:max-h-[385px] w-auto max-w-full object-contain drop-shadow-xl transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
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

          </div>
        </div>
      </section>

      {/* All Categories Grid */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-700">Find your fix</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Browse by category</h2>
          </div>
          <button
            type="button"
            onClick={() => onTabChange('services')}
            className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900"
          >
            All services <ChevronRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5 sm:gap-4 lg:gap-5">
          {sortedCategories.map((category) => {
            const photo = getCategoryPhoto(category);
            const isSelected = selectedCategoryFilter === category.id;
            const hasNewBadge = isCategoryNew(category);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className="group flex flex-col items-start text-left cursor-pointer w-full"
              >
                <div
                  className={`relative w-full aspect-square overflow-hidden rounded-2xl sm:rounded-[22px] bg-slate-100 shadow-xs transition duration-300 group-hover:shadow-md ${isSelected ? 'ring-2 ring-violet-600 ring-offset-2 ring-offset-white' : ''
                    }`}
                >
                  <img
                    src={photo}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {hasNewBadge && (
                    <span className="absolute top-2 left-2 rounded-md bg-[#a0153e] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      New
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span
                  className={`mt-2.5 text-xs sm:text-[13px] md:text-sm font-semibold leading-snug line-clamp-2 transition ${isSelected ? 'text-violet-700 font-bold' : 'text-slate-800 group-hover:text-violet-700'
                    }`}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* All Categories and Their Services Section */}
      <section id="customer-services" className="scroll-mt-24 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-700">Handpicked for your home</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              {query ? `Services for “${query}”` : 'Categories & services'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onTabChange('services')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-950 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            View all services ({services.length}) <ArrowRight size={14} />
          </button>
        </div>

        {/* Category Filter Pills */}
        {!query && categoriesWithServices.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('')}
              className={`rounded-full px-4 py-2 text-xs font-bold shrink-0 transition ${!selectedCategoryFilter
                ? 'bg-violet-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              All Categories ({services.length})
            </button>
            {categoriesWithServices.map(({ category, services: catServices }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryFilter((cur) => (cur === category.id ? '' : category.id))}
                className={`rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${selectedCategoryFilter === category.id
                  ? 'bg-violet-700 text-white shadow-sm font-bold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <span>{category.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategoryFilter === category.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {catServices.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {demoMode && (
          <p role="status" className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-[11px] leading-5 text-violet-800">
            Sample services are shown while the live catalog is unavailable. These listings are for preview only.
          </p>
        )}

        {loading ? (
          <PageLoader label="Finding the right local services…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setQuery((value) => `${value} `)} />
        ) : query ? (
          /* Search Results */
          services.length ? (
            <div className="grid grid-cols-2 min-[480px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
              {services.map((service, index) => (
                <div key={service.id} className="w-full">
                  <ServiceCard
                    service={service}
                    index={index}
                    onClick={() => onOpenService(service.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CircleHelp} title="No services found" description="Try a different search or check back as more local services are added." />
          )
        ) : selectedCategoryFilter ? (
          /* Single Selected Category View */
          (() => {
            const entry = categoriesWithServices.find((item) => item.category.id === selectedCategoryFilter);
            if (!entry) return null;
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-violet-50/70 border border-violet-100">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                      <img src={getCategoryPhoto(entry.category)} alt={entry.category.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        {entry.category.name}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                          {entry.services.length} {entry.services.length === 1 ? 'service' : 'services'}
                        </span>
                      </h3>
                      {entry.category.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{entry.category.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(entry.category)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 px-4 py-2 rounded-xl transition shadow-xs"
                  >
                    View all {entry.category.name} providers & book <ArrowRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 min-[480px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
                  {entry.services.map((service, index) => (
                    <div key={service.id} className="w-full">
                      <ServiceCard
                        service={service}
                        index={index}
                        onClick={() => onOpenService(service.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : categoriesWithServices.length ? (
          <div className="space-y-8">
            {categoriesWithServices.map(({ category, services: catServices }) => (
              <div key={category.id} className="space-y-3.5 pt-6 border-t border-slate-200/70 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 shadow-xs">
                      <img src={getCategoryPhoto(category)} alt={category.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        {category.name}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                          {catServices.length} {catServices.length === 1 ? 'service' : 'services'}
                        </span>
                      </h3>
                      {category.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-950 bg-violet-50 hover:bg-violet-100 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    View all {category.name} <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 min-[480px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
                  {catServices.map((service, index) => (
                    <div key={service.id} className="w-full">
                      <ServiceCard
                        service={service}
                        index={index}
                        onClick={() => onOpenService(service.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-3xl bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 border border-violet-100 p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Looking for another home service?</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Browse our full directory of {services.length} services across every category with custom price filters and duration options.
                </p>
              </div>
              <Button
                onClick={() => onTabChange('services')}
                className="shrink-0 bg-violet-700 hover:bg-violet-800 text-white font-bold px-5 py-3 rounded-xl shadow-xs"
              >
                View all services <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState icon={CircleHelp} title="No services found" description="Try a different search or check back as more local services are added." />
        )}
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

      <ThoughtfulCurations />

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
          <Button className="shrink-0 bg-white text-red-800 hover:bg-violet-50" onClick={onBecomePartner}>Become a partner <ArrowRight size={15} /></Button>
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
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-3 focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-600/10">
          <Search className="shrink-0 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search cleaning, plumbing, appliance repair…" aria-label="Search services" />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-bold text-slate-500">Category
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-600">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Minimum price
            <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-600" placeholder="₹0" />
          </label>
          <label className="text-xs font-bold text-slate-500">Maximum price
            <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-600" placeholder="Any price" />
          </label>
          <label className="text-xs font-bold text-slate-500">Minimum duration
            <select value={minDuration} onChange={(event) => setMinDuration(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-600">
              <option value="">Any duration</option><option value="30">30+ minutes</option><option value="60">1+ hour</option><option value="120">2+ hours</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Sort by
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-600">
              <option value="name">Name</option><option value="price">Price</option><option value="duration">Duration</option>
            </select>
          </label>
        </div>
      </div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={load} /> : items.length ? (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {items.map((service, index) => <ServiceCard key={service.id} service={service} index={index} onClick={() => onOpenService(service.id)} />)}
        </div>
      ) : <EmptyState icon={Search} title="No services match that search" description="Try a broader keyword or clear your search." />}
    </div>
  );
}

function CozyLivingRoomScene({ className = '' }) {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="roomGlow" cx="65%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#f3e8ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#faf5ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="chairPurple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="cushionPurple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      {/* Warm background circular arch */}
      <circle cx="210" cy="115" r="95" fill="url(#roomGlow)" />

      {/* Warm Lamp Light Glow */}
      <polygon points="255,48 208,202 298,202" fill="url(#lampCone)" />

      {/* Floor Lamp */}
      <ellipse cx="255" cy="198" rx="16" ry="4" fill="#64748b" />
      <path d="M 255,198 L 255,42" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 255,42 Q 255,28 245,28 L 240,28" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="230,50 250,50 245,30 235,30" fill="#d97706" />
      <ellipse cx="240" cy="50" rx="10" ry="3.5" fill="#f59e0b" />
      <ellipse cx="240" cy="30" rx="5" ry="2" fill="#b45309" />

      {/* Potted Indoor Houseplant */}
      <ellipse cx="85" cy="198" rx="18" ry="4" fill="#94a3b8" opacity="0.3" />
      <path d="M 72,168 L 76,196 C 76,198 94,198 94,196 L 98,168 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
      <ellipse cx="85" cy="168" rx="13" ry="3" fill="#cbd5e1" />
      <path d="M 85,168 Q 65,145 60,118 Q 72,130 85,168" fill="#7c3aed" />
      <path d="M 85,168 Q 72,120 78,92 Q 88,118 85,168" fill="#8b5cf6" />
      <path d="M 85,168 Q 95,115 108,102 Q 102,132 85,168" fill="#6d28d9" />
      <path d="M 85,168 Q 102,140 115,130 Q 102,152 85,168" fill="#a78bfa" />
      <path d="M 85,168 Q 60,155 52,145 Q 65,160 85,168" fill="#5b21b6" />

      {/* Violet Modern Armchair */}
      <line x1="135" y1="168" x2="128" y2="198" stroke="#a16207" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="190" y1="168" x2="196" y2="198" stroke="#a16207" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="145" y1="164" x2="140" y2="192" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
      <line x1="180" y1="164" x2="186" y2="192" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />

      {/* Chair Body Shadow */}
      <ellipse cx="162" cy="195" rx="36" ry="6" fill="#4c1d95" opacity="0.15" />

      {/* Chair Backrest */}
      <rect x="126" y="82" width="74" height="70" rx="20" fill="url(#chairPurple)" />
      <path d="M 148,92 C 148,110 148,135 148,142" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      <path d="M 178,92 C 178,110 178,135 178,142" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

      {/* Comfy Seat Cushion */}
      <rect x="122" y="142" width="82" height="26" rx="12" fill="url(#cushionPurple)" />

      {/* Armrests */}
      <rect x="114" y="118" width="18" height="42" rx="9" fill="#6d28d9" />
      <rect x="194" y="118" width="18" height="42" rx="9" fill="#7c3aed" />

      {/* Accent Pillow (Cream / Light Yellow) */}
      <rect x="135" y="132" width="28" height="24" rx="7" transform="rotate(-10 135 132)" fill="#fefce8" stroke="#fef08a" strokeWidth="1" />
      <path d="M 144,136 Q 148,144 146,148" stroke="#fde047" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function ShieldPodium3D({ className = '' }) {
  return (
    <svg viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="shieldShadow" x="10" y="125" width="150" height="40" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="podiumTop" x1="25" y1="120" x2="145" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="50%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="50%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="podiumSide" x1="25" y1="130" x2="145" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#046a48" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="shieldFace" x1="45" y1="30" x2="125" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="45%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#044e34" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="shieldBevel" x1="85" y1="30" x2="135" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#022c1d" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
        <linearGradient id="gloss" x1="55" y1="35" x2="85" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Floating platform drop shadow */}
      <ellipse cx="85" cy="144" rx="60" ry="12" fill="#6d28d9" opacity="0.3" filter="url(#shieldShadow)" />

      {/* 3D Tiered Cylinder Podium */}
      <path d="M 22,136 A 63,16 0 0,0 148,136 L 148,145 A 63,16 0 0,1 22,145 Z" fill="#02472f" />
      <path d="M 22,136 A 63,16 0 0,0 148,136 L 148,145 A 63,16 0 0,1 22,145 Z" fill="#3b0764" />
      <path d="M 22,126 A 63,16 0 0,0 148,126 L 148,136 A 63,16 0 0,1 22,136 Z" fill="url(#podiumSide)" />
      <ellipse cx="85" cy="126" rx="63" ry="16" fill="url(#podiumTop)" stroke="#6ee7b7" strokeWidth="1.5" />
      <ellipse cx="85" cy="126" rx="63" ry="16" fill="url(#podiumTop)" stroke="#c4b5fd" strokeWidth="1.5" />
      <ellipse cx="85" cy="124" rx="54" ry="13" fill="#ede9fe" opacity="0.6" />

      {/* 3D Shield Base Shadow */}
      <ellipse cx="85" cy="120" rx="30" ry="6" fill="#4c1d95" opacity="0.45" />

      {/* 3D Shield */}
      <path
        d="M 52,38 C 66,35 79,42 85,44 C 91,42 104,35 118,38 L 123,41 C 109,38 96,45 90,47 C 84,45 71,38 57,41 Z M 118,38 C 120,68 111,98 85,118 L 89,122 C 117,101 126,71 124,41 Z"
        fill="url(#shieldBevel)"
      />
      <path
        d="M 52,38 C 66,35 79,42 85,44 C 91,42 104,35 118,38 C 120,68 111,98 85,118 C 59,98 50,68 52,38 Z"
        fill="url(#shieldFace)"
      />
      <path
        d="M 55,42 C 67,39 78,44 85,46 C 85,65 80,95 62,106 C 54,88 53,60 55,42 Z"
        fill="url(#gloss)"
      />
      <path
        d="M 70,75 L 81,86 L 103,62"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function SuburbanHouseGraphic({ className = '' }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="60" cy="80" rx="55" ry="9" fill="#ede9fe" />
      <ellipse cx="30" cy="78" rx="20" ry="6" fill="#ddd6fe" />

      {/* Left Tree */}
      <rect x="23" y="66" width="4" height="12" rx="1.5" fill="#a16207" />
      <circle cx="25" cy="60" r="13" fill="#8b5cf6" />
      <circle cx="28" cy="58" r="9" fill="#4ade80" />
      <circle cx="28" cy="58" r="9" fill="#a78bfa" />

      {/* Right Trees */}
      <rect x="98" y="68" width="4" height="10" rx="1.5" fill="#a16207" />
      <circle cx="100" cy="62" r="11" fill="#7c3aed" />
      <circle cx="93" cy="66" r="8" fill="#8b5cf6" />

      {/* Chimney */}
      <rect x="74" y="32" width="7" height="15" rx="1" fill="#6d28d9" />

      {/* House Main Walls */}
      <rect x="42" y="48" width="48" height="30" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />

      {/* Pitched Roof */}
      <polygon points="36,49 66,28 96,49" fill="#6d28d9" />
      <polygon points="40,49 66,31 92,49" fill="#7c3aed" />

      {/* Front Door */}
      <rect x="60" y="61" width="12" height="17" rx="2" fill="#6d28d9" />
      <circle cx="69" cy="70" r="1" fill="#fef08a" />

      {/* Left Window */}
      <rect x="46" y="55" width="9" height="11" rx="1.5" fill="#e0f2fe" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="46" y1="60.5" x2="55" y2="60.5" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="50.5" y1="55" x2="50.5" y2="66" stroke="#94a3b8" strokeWidth="0.8" />

      {/* Right Window */}
      <rect x="77" y="55" width="9" height="11" rx="1.5" fill="#e0f2fe" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="77" y1="60.5" x2="86" y2="60.5" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="81.5" y1="55" x2="81.5" y2="66" stroke="#94a3b8" strokeWidth="0.8" />

      <circle cx="43" cy="77" r="5" fill="#8b5cf6" />
      <circle cx="89" cy="77" r="5" fill="#8b5cf6" />
    </svg>
  );
}

function OfficeTowersGraphic({ className = '' }) {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="60" cy="80" rx="55" ry="9" fill="#ede9fe" />

      <rect x="22" y="70" width="3.5" height="8" rx="1" fill="#a16207" />
      <circle cx="24" cy="65" r="9" fill="#7c3aed" />

      <rect x="101" y="71" width="3.5" height="7" rx="1" fill="#a16207" />
      <circle cx="103" cy="66" r="8" fill="#8b5cf6" />

      {/* Left Tower */}
      <rect x="38" y="44" width="24" height="34" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      <rect x="42" y="48" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="48" y="48" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="54" y="48" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="42" y="55" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="48" y="55" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="54" y="55" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="42" y="62" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="48" y="62" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="54" y="62" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="42" y="69" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="48" y="69" width="4" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="54" y="69" width="4" height="4" rx="0.5" fill="#38bdf8" />

      {/* Right Tower */}
      <rect x="66" y="28" width="28" height="50" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <line x1="80" y1="28" x2="80" y2="18" stroke="#64748b" strokeWidth="1.5" />
      <circle cx="80" cy="17" r="1.5" fill="#ef4444" />
      <rect x="71" y="34" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="79" y="34" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="85" y="34" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="71" y="42" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="79" y="42" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="85" y="42" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="71" y="50" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="79" y="50" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="85" y="50" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="71" y="58" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="79" y="58" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="85" y="58" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="71" y="66" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="79" y="66" width="5" height="5" rx="0.5" fill="#0284c7" />
      <rect x="85" y="66" width="5" height="5" rx="0.5" fill="#0284c7" />
    </svg>
  );
}

function EditProfileModal({ open, onClose, user, onSaved }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFullName(user?.fullName || '');
      setPhone(user?.phone || '');
      setAvatarUrl(user?.avatarUrl || '');
      setError('');
    }
  }, [open, user]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5MB or less');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { fullName, phone };
      if (avatarUrl !== user?.avatarUrl) {
        payload.avatarUrl = avatarUrl;
      }
      const updated = await api.patch('/auth/me', payload);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 text-violet-800 font-extrabold text-lg grid place-items-center ring-2 ring-violet-200">
            {avatarUrl ? (
              <img
                src={resolveMediaUrl(avatarUrl)}
                alt="Avatar preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }
                }}
              />
            ) : null}
            <span style={{ display: avatarUrl ? 'none' : 'block' }}>
              {initials(fullName || 'User')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">Profile Photo</p>
            <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG or WebP up to 5MB</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer transition"
              >
                Change photo
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                >
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <Field label="Full Name">
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g. Rajeev Aggarwal"
          />
        </Field>
        <Field label="Phone Number" hint="Used for booking confirmations and technician arrival updates.">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy || !fullName.trim()}>{busy ? 'Saving…' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddressBook() {
  const cities = useCities();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

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

  function handleAdd() {
    setEditingAddress(null);
    setModalOpen(true);
  }

  function handleEdit(addr) {
    setEditingAddress(addr);
    setModalOpen(true);
  }

  async function handleDelete(addr) {
    if (!window.confirm(`Are you sure you want to delete "${addr.label}"?`)) return;
    try {
      await api.delete(`/addresses/${addr.id}`);
      await load();
    } catch (requestError) {
      alert(getErrorMessage(requestError));
    }
  }

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6d28d9]">YOUR PLACES</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">Saved Addresses</h2>
          <p className="mt-1 text-sm text-slate-500 font-normal">Keep the places you book for close at hand.</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-700 hover:bg-violet-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Address
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        error.toLowerCase().includes('auth') || error.toLowerCase().includes('session') ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-6 text-center space-y-3">
            <p className="text-sm font-bold text-violet-900">Your session has expired. Please sign in to view your saved addresses.</p>
            <Button size="sm" onClick={() => window.location.assign('/urbanmate/login')} className="bg-violet-700 hover:bg-violet-800">
              Sign In to Account
            </Button>
          </div>
        ) : (
          <ErrorState message={error} onRetry={load} />
        )
      ) : addresses.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {addresses.map((address, idx) => {
            const isHome = (address.label || '').toLowerCase().includes('home');
            return (
              <div
                key={address.id}
                className="group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:border-violet-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5f3ff] border border-[#ede9fe] text-[#7c3aed]">
                        <MapPin size={20} />
                      </span>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-slate-900">{address.label}</h3>
                        {(address.isDefault && idx === 0) && (
                          <span className="rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-[11px] font-extrabold text-[#6d28d9]">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => handleEdit(address)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-violet-700 cursor-pointer"
                        title="Edit address"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(address)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3.5 max-w-[62%] space-y-0.5">
                    <p className="text-sm font-semibold leading-relaxed text-slate-700">
                      {address.line1}{address.line2 ? `, ${address.line2}` : ''}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {address.city} {address.postalCode}
                    </p>
                  </div>
                </div>

                {/* Bottom Right Graphic */}
                <div className="pointer-events-none absolute bottom-1 right-2 w-28 sm:w-32 opacity-95 group-hover:scale-105 transition-transform">
                  <img
                    src={assetUrl(isHome ? '/profile_house.png' : '/profile_office.png')}
                    alt={address.label}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No saved addresses yet"
          description="Add your home or workplace to make booking faster."
          action={
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#044c2c] hover:bg-[#033c23] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-700 hover:bg-violet-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition"
            >
              <Plus size={16} /> Add Address
            </button>
          }
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAddress ? 'Edit address' : 'Add address'}>
        <AddressEditor
          cities={cities}
          initialAddress={editingAddress}
          onCancel={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      </Modal>
    </div>
  );
}

function BookingHistory({ onSignIn }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState('');
  const [confirming, setConfirming] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [viewMode, setViewMode] = useState('table');
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      api.get('/bookings', { page: '1', limit: '100' })
        .then((data) => {
          setBookings(data);
          setSelectedBooking((prev) => {
            if (!prev) return null;
            const updated = data.find((b) => b.id === prev.id);
            return updated || prev;
          });
        })
        .catch(() => { });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  async function cancel(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { reason: 'Cancelled by customer' });
      await load();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setCancelling('');
    }
  }

  async function confirmCompletion(bookingId) {
    setConfirming(bookingId);
    setError('');
    try {
      await api.post(`/bookings/${bookingId}/confirm-completion`);
      await load();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: 'completed' } : null));
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setConfirming('');
    }
  }

  const pendingConfirmations = bookings.filter((b) => b.status === 'provider_completed');
  const activeCount = bookings.filter((b) => ['pending', 'assigned', 'confirmed', 'in_progress'].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length;

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (statusFilter === 'needs_action') {
      list = list.filter((b) => b.status === 'provider_completed');
    } else if (statusFilter === 'active') {
      list = list.filter((b) => ['pending', 'assigned', 'confirmed', 'in_progress'].includes(b.status));
    } else if (statusFilter === 'completed') {
      list = list.filter((b) => b.status === 'completed');
    } else if (statusFilter === 'cancelled') {
      list = list.filter((b) => b.status === 'cancelled' || b.status === 'rejected');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((b) => {
        const num = b.bookingNumber?.toLowerCase() || '';
        const sName = (b.serviceNameSnapshot || b.service?.name || '').toLowerCase();
        const pName = (b.provider?.displayName || '').toLowerCase();
        const city = (b.address?.city || '').toLowerCase();
        const line1 = (b.address?.line1 || '').toLowerCase();
        return num.includes(q) || sName.includes(q) || pName.includes(q) || city.includes(q) || line1.includes(q);
      });
    }
    return list;
  }, [bookings, statusFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, pageSize]);

  const totalItems = filteredBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  const renderStatusBadge = (status) => {
    if (status === 'provider_completed') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          Needs Confirmation
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/90 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-800">
          <Check size={12} strokeWidth={2.5} /> Completed
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800">
          <Clock3 size={12} /> In progress
        </span>
      );
    }
    if (status === 'assigned' || status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
          <BadgeCheck size={12} /> Confirmed
        </span>
      );
    }
    if (status === 'cancelled' || status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700">
        Pending
      </span>
    );
  };

  const renderPagination = () => {
    if (totalItems === 0) return null;

    const pageNumbers = [];
    const maxVisible = 5;
    let startPage = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let p = startPage; p <= endPage; p++) {
      pageNumbers.push(p);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Showing <strong className="font-extrabold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
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

          <div className="flex items-center gap-1 px-1">
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-extrabold transition cursor-pointer ${p === safePage
                  ? 'bg-violet-700 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

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
    );
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Your service orders"
        title="My bookings"
        description="All your upcoming visits, active appointments, and past service history."
      />

      {/* Alert banner when technician completed work and awaits confirmation */}
      {pendingConfirmations.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 p-4 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="text-sm font-black text-amber-900">
                {pendingConfirmations.length === 1
                  ? '1 Service Completed — Ready for Your Confirmation'
                  : `${pendingConfirmations.length} Services Completed — Ready for Your Confirmation`}
              </p>
              <p className="text-xs font-medium text-amber-700 mt-0.5">
                Your technician has marked their work complete. Please review the service and click "Confirm completion" to finalize.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('needs_action')}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 transition shrink-0 cursor-pointer shadow-xs"
          >
            View pending confirmation
          </button>
        </div>
      )}

      {/* Controls & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${statusFilter === 'all'
              ? 'bg-white text-violet-900 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All ({bookings.length})
          </button>
          {pendingConfirmations.length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('needs_action')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${statusFilter === 'needs_action'
                ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                : 'text-amber-800 bg-amber-100/70 hover:bg-amber-100'
                }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-600 animate-ping shrink-0" />
              Action needed ({pendingConfirmations.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${statusFilter === 'active'
              ? 'bg-white text-violet-900 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${statusFilter === 'completed'
              ? 'bg-white text-violet-900 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${statusFilter === 'cancelled'
              ? 'bg-white text-violet-900 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking #, service, provider…"
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`grid h-7 w-7 place-items-center rounded-lg transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-violet-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <TableIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Cards view"
              className={`grid h-7 w-7 place-items-center rounded-lg transition cursor-pointer ${viewMode === 'cards' ? 'bg-white text-violet-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <PageLoader label="Loading your bookings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filteredBookings.length === 0 ? (
        bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing booked just yet"
            description="Your next little home win is one good booking away."
            action={<Button onClick={onSignIn}>Explore services</Button>}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-bold text-slate-700">No bookings match your current filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another status tab.</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="mt-3 text-xs font-bold text-violet-700 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Booking & Service</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBookings.map((booking) => {
                  const isProviderCompleted = booking.status === 'provider_completed';
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`transition-colors hover:bg-violet-50/40 cursor-pointer ${isProviderCompleted ? 'bg-amber-50/30' : ''
                        }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                            {booking.bookingNumber}
                          </span>
                        </div>
                        <p className="font-extrabold text-slate-900 line-clamp-1">
                          {booking.serviceNameSnapshot || booking.service?.name}
                        </p>
                        {booking.serviceItems && booking.serviceItems.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {booking.serviceItems.length} {booking.serviceItems.length === 1 ? 'service item' : 'service items'}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <CalendarDays size={14} className="text-violet-600 shrink-0" />
                          {new Date(booking.scheduledStart).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-slate-400 pl-5">
                          {new Date(booking.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-[190px]">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {booking.address ? `${booking.address.line1}, ${booking.address.city}` : 'Customer Address'}
                          </span>
                        </div>
                        {booking.address?.postalCode && (
                          <span className="text-[10px] text-slate-400 pl-4 block">
                            PIN: {booking.address.postalCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {booking.provider ? (
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-800 ring-1 ring-violet-200">
                              {initials(booking.provider.displayName)}
                            </span>
                            <div>
                              <span className="block font-bold text-xs text-slate-800 leading-tight">
                                {booking.provider.displayName}
                              </span>
                              <span className="text-[10px] font-semibold text-violet-700">Verified Pro</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Matching expert…</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-sm font-black text-slate-900">
                          {currency(booking.total, booking.currency)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                          {booking.currency && booking.currency !== 'USD' ? booking.currency : 'INR'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(booking.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isProviderCompleted && (
                            <button
                              type="button"
                              disabled={confirming === booking.id}
                              onClick={() => confirmCompletion(booking.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-violet-700 hover:bg-violet-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Check size={14} strokeWidth={2.5} />
                              {confirming === booking.id ? 'Confirming…' : 'Confirm'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            title="View details"
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 cursor-pointer shadow-2xs"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          {['pending', 'assigned', 'confirmed'].includes(booking.status) && new Date(booking.scheduledStart) > new Date() && (
                            <button
                              type="button"
                              disabled={cancelling === booking.id}
                              onClick={() => cancel(booking.id)}
                              className="rounded-xl px-2 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                            >
                              {cancelling === booking.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-2">
            {paginatedBookings.map((booking) => {
              const isProviderCompleted = booking.status === 'provider_completed';
              return (
                <Card
                  key={booking.id}
                  className={`p-5 space-y-3.5 transition-all cursor-pointer hover:border-violet-300 hover:shadow-md ${isProviderCompleted ? 'border-2 border-amber-300 bg-amber-50/20' : ''
                    }`}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                        {booking.bookingNumber}
                      </span>
                      <h3 className="mt-1 font-extrabold text-slate-900 text-base">
                        {booking.serviceNameSnapshot || booking.service?.name}
                      </h3>
                    </div>
                    {renderStatusBadge(booking.status)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={13} className="text-violet-600 shrink-0" />
                      <span className="font-bold text-slate-800">
                        {new Date(booking.scheduledStart).toLocaleDateString()} at{' '}
                        {new Date(booking.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {booking.address && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{booking.address.line1}, {booking.address.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Provider</span>
                      <span className="font-extrabold text-slate-900">
                        {booking.provider?.displayName || 'Assigning soon…'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                      <span className="font-black text-slate-900 text-sm">
                        {currency(booking.total, booking.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    {isProviderCompleted && (
                      <button
                        type="button"
                        disabled={confirming === booking.id}
                        onClick={() => confirmCompletion(booking.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-violet-700 hover:bg-violet-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        {confirming === booking.id ? 'Confirming…' : 'Confirm completion'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-800 cursor-pointer"
                    >
                      <Eye size={13} /> View details
                    </button>
                    {['pending', 'assigned', 'confirmed'].includes(booking.status) && new Date(booking.scheduledStart) > new Date() && (
                      <Button variant="quiet" size="sm" disabled={cancelling === booking.id} onClick={() => cancel(booking.id)}>
                        {cancelling === booking.id ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          {renderPagination()}
        </div>
      )}

      {/* DETAILED BOOKING MODAL */}
      {selectedBooking && (
        <Modal
          open={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details · ${selectedBooking.bookingNumber}`}
          wide
        >
          <div className="space-y-5">
            {/* Top Status & Price Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Current Status</span>
                <div className="mt-1 flex items-center gap-2">
                  {renderStatusBadge(selectedBooking.status)}
                  <span className="text-xs text-slate-500">
                    Booked on {new Date(selectedBooking.createdAt || selectedBooking.scheduledStart).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Price</span>
                <p className="text-xl font-black text-slate-900">{currency(selectedBooking.total, selectedBooking.currency)}</p>
              </div>
            </div>

            {selectedBooking.status === 'provider_completed' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <p className="text-xs font-bold">
                    Technician has completed this service! Please confirm to close the booking.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={confirming === selectedBooking.id}
                  onClick={() => confirmCompletion(selectedBooking.id)}
                  className="rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs px-4 py-2 transition shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check size={14} className="inline mr-1" /> Confirm Completion
                </button>
              </div>
            )}

            {/* Grid of details: Service, Schedule, Address, Provider */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              {/* Service Details */}
              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2 bg-white">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-violet-700 block">Service Information</span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {selectedBooking.serviceNameSnapshot || selectedBooking.service?.name}
                </h4>
                {selectedBooking.service?.slug && (
                  <p className="text-slate-500 capitalize">Category: {selectedBooking.service.slug.replace('-', ' ')}</p>
                )}
                {selectedBooking.serviceItems && selectedBooking.serviceItems.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Items Included:</span>
                    {selectedBooking.serviceItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{item.name || item.type} (x{item.quantity || 1})</span>
                        <span className="font-bold">{currency(item.totalPrice || item.unitPrice, selectedBooking.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule & Timing */}
              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2 bg-white">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-violet-700 block">Schedule & Timing</span>
                <div className="flex items-start gap-2">
                  <CalendarDays size={16} className="text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">
                      {new Date(selectedBooking.scheduledStart).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {new Date(selectedBooking.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {selectedBooking.scheduledEnd && ` — ${new Date(selectedBooking.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2 bg-white">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-violet-700 block">Service Location</span>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    {selectedBooking.address ? (
                      <>
                        <p className="font-bold text-slate-900">{selectedBooking.address.line1}</p>
                        {selectedBooking.address.line2 && <p className="text-slate-600">{selectedBooking.address.line2}</p>}
                        <p className="text-slate-500 mt-0.5">
                          {selectedBooking.address.city} {selectedBooking.address.postalCode ? `- ${selectedBooking.address.postalCode}` : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-500">Address recorded on booking file.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Provider */}
              <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2 bg-white">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-violet-700 block">Assigned Provider</span>
                {selectedBooking.provider ? (
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 text-sm font-black text-violet-800">
                      {initials(selectedBooking.provider.displayName)}
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-900 flex items-center gap-1">
                        {selectedBooking.provider.displayName}
                        <BadgeCheck size={14} className="text-violet-600" />
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Verified Professional Partner</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-800 font-medium italic">Our operations team is assigning the best qualified professional in your area.</p>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2 text-xs">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 block">Payment Summary</span>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Base / Package Amount</span>
                  <span>{currency(selectedBooking.subtotal || selectedBooking.total, selectedBooking.currency)}</span>
                </div>
                {Number(selectedBooking.taxTotal) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes & Platform Fees</span>
                    <span>{currency(selectedBooking.taxTotal, selectedBooking.currency)}</span>
                  </div>
                )}
                {Number(selectedBooking.discountTotal) > 0 && (
                  <div className="flex justify-between text-violet-700 font-medium">
                    <span>Discounts Applied</span>
                    <span>- {currency(selectedBooking.discountTotal, selectedBooking.currency)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-violet-700">{currency(selectedBooking.total, selectedBooking.currency)}</span>
                </div>
              </div>
            </div>

            {selectedBooking.cancellationReason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <strong className="font-bold">Cancellation Reason:</strong> {selectedBooking.cancellationReason}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div>
                {['pending', 'assigned', 'confirmed'].includes(selectedBooking.status) && new Date(selectedBooking.scheduledStart) > new Date() && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={cancelling === selectedBooking.id}
                    onClick={() => cancel(selectedBooking.id)}
                  >
                    {cancelling === selectedBooking.id ? 'Cancelling…' : 'Cancel booking'}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'provider_completed' && (
                  <Button
                    size="sm"
                    disabled={confirming === selectedBooking.id}
                    onClick={() => confirmCompletion(selectedBooking.id)}
                    className="bg-violet-700 hover:bg-violet-800 text-white"
                  >
                    <Check size={14} /> Confirm Completion
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CustomerProfile({ user, onUserUpdate }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const avatarInputRef = useRef(null);

  const isEmailVerified = Boolean(user?.emailVerified || user?.emailVerifiedAt);

  async function handleAvatarDirectUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Profile photo must be 5MB or less.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setUploadingPhoto(true);
      try {
        const updated = await api.patch('/auth/me', { avatarUrl: reader.result });
        onUserUpdate?.(updated);
      } catch (err) {
        alert(getErrorMessage(err));
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-100/60 via-purple-50 to-indigo-50 p-6 sm:p-8 md:p-10 shadow-[0_2px_16px_rgba(109,40,217,0.06)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl z-10">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] text-[#6d28d9]">
              YOUR HOME, TAKEN CARE OF
            </p>
            <h1 className="mt-1.5 text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-slate-900 leading-tight">
              Your Profile
            </h1>
            <p className="mt-2 text-sm sm:text-base font-normal text-slate-600 leading-relaxed">
              Manage your account details, preferences and security.
            </p>
          </div>
          <div className="w-full md:w-auto md:max-w-[300px] lg:max-w-[340px] flex justify-center md:justify-end shrink-0">
            <img src={assetUrl('/profile_banner_room.png')} alt="Living Room" className="w-60 sm:w-68 md:w-76 h-auto object-contain pointer-events-none drop-shadow-xs" />
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Two Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: User Identity Card */}
        <div className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-16 w-16 sm:h-[74px] sm:w-[74px] items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 text-xl font-black text-violet-800 shadow-inner ring-2 ring-white">
                    {user?.avatarUrl ? (
                      <img
                        src={resolveMediaUrl(user.avatarUrl)}
                        alt={user?.fullName || 'User'}
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
                      {initials(user?.fullName || 'User')}
                    </span>
                  </div>
                  <label
                    className={`absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#7c3aed] text-white shadow-xs transition hover:bg-[#6d28d9] cursor-pointer ${uploadingPhoto ? 'animate-pulse' : ''}`}
                    title="Upload profile photo"
                  >
                    <Camera size={13} strokeWidth={2.5} />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarDirectUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-black text-slate-900">{user?.fullName || 'Customer'}</h2>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] text-[#7c3aed] shrink-0" title="Verified Account">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium truncate max-w-[200px] sm:max-w-[260px]">{user?.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/80 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-violet-50 cursor-pointer"
              >
                <Pencil size={13} className="text-violet-700" />
                Edit Profile
              </button>
            </div>

            <p className="mt-5 text-xs sm:text-sm font-normal leading-relaxed text-slate-500">
              Your account is protected with secure sign-in. Keep your email current so you can receive important updates.
            </p>
          </div>

          {/* Contact Details Boxes */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email Box */}
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-[#f8faf9] p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <Mail size={18} className="shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                </div>
              </div>
              {isEmailVerified ? (
                <span className="shrink-0 rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-[11px] font-bold text-[#6d28d9]">
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setVerifyingEmail(true)}
                  className="shrink-0 rounded-full bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 transition cursor-pointer"
                >
                  Verify
                </button>
              )}
            </div>

            {/* Phone Box */}
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-[#f8faf9] p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <Phone size={18} className="shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {user?.phone || '+91 98765 43210'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="shrink-0 rounded-full border border-violet-300 bg-white px-3 py-0.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50 cursor-pointer"
              >
                {user?.phone ? 'Verify' : 'Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Account Status Card */}
        <div className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-violet-500/40 bg-violet-50/60 text-violet-600">
                <ShieldCheck size={19} />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Account Status</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe] px-3 py-1 text-xs font-bold text-[#6d28d9]">
              Verified <Check size={12} strokeWidth={3} />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            {/* Checklist */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#7c3aed] text-white shadow-xs shrink-0">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700">Email verified</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#7c3aed] text-white shadow-xs shrink-0">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700">Account created</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#7c3aed] text-white shadow-xs shrink-0">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700">Profile completed</span>
              </div>
            </div>

            {/* 3D Shield Graphic */}
            <div className="flex justify-center sm:justify-end">
              <img src={assetUrl('/profile_shield_3d.png')} alt="Account Status" className="w-28 h-28 sm:w-32 sm:h-32 object-contain pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Saved Addresses */}
      <AddressBook />

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editingProfile}
        onClose={() => setEditingProfile(false)}
        user={user}
        onSaved={(updated) => {
          onUserUpdate?.(updated);
        }}
      />

      {/* Email Verification Modal */}
      <Modal open={verifyingEmail} onClose={() => setVerifyingEmail(false)} title="Verify Your Email">
        <EmailVerification
          user={user}
          onVerified={(updated) => {
            onUserUpdate?.(updated);
            setVerifyingEmail(false);
          }}
        />
      </Modal>
    </div>
  );
}

function BookingFlow({ serviceId, initialItem, onClose, onNeedLogin, onBookingCreated }) {
  const cities = useCities();
  const { settings } = useSettings();
  const paymentConfig = settings?.payment || { codEnabled: true, upiEnabled: true, razorpayEnabled: true, mode: 'test' };
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (paymentConfig.upiEnabled) return 'upi';
    if (paymentConfig.codEnabled) return 'cod';
    if (paymentConfig.razorpayEnabled) return 'razorpay';
    return 'cod';
  });
  const [upiRefId, setUpiRefId] = useState('');
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

  useEffect(() => {
    if (service && addressId && date && time) {
      checkSlot();
    }
  }, [service, addressId, date, time, packageId, addonIds]);

  const selectedPackage = service?.packages?.find((item) => item.id === packageId);
  const selectedAddons = service?.addons?.filter((item) => addonIds.includes(item.id)) || [];
  const price = selectedPackage
    ? Number(selectedPackage.price) + selectedAddons.reduce((sum, item) => sum + Number(item.price), 0)
    : Number(service?.effectivePrice || service?.basePrice || 0) + selectedAddons.reduce((sum, item) => sum + Number(item.price), 0);

  function toggleAddon(addonId) {
    setAddonIds((current) => current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]);
  }

  async function checkSlot() {
    if (!addressId || !date || !time) return;
    setChecking(true);
    setError('');
    setAvailability(null);
    try {
      const scheduledStart = new Date(`${date}T${time}:00`).toISOString();
      const validProviderUuid = initialItem?.providerId && initialItem.providerId.includes('-') && !initialItem.providerId.includes('tier')
        ? initialItem.providerId
        : undefined;
      const result = await api.get('/bookings/availability', {
        serviceId,
        addressId,
        scheduledStart,
        ...(validProviderUuid ? { providerId: validProviderUuid } : {}),
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
      const validProviderUuid = (initialItem?.providerId && initialItem.providerId.includes('-') && !initialItem.providerId.includes('tier'))
        ? initialItem.providerId
        : (availability?.providers?.[0]?.id || undefined);
      const booking = await api.post('/bookings', {
        serviceId,
        addressId,
        scheduledStart,
        paymentMethod,
        ...(upiRefId ? { paymentTransactionId: upiRefId.trim() } : {}),
        ...(validProviderUuid ? { providerId: validProviderUuid } : {}),
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
        <div className="rounded-2xl bg-violet-50 p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-700 text-white"><Check size={26} /></span>
          <h3 className="mt-4 text-xl font-extrabold text-slate-900">Your booking request is sent!</h3>
          <p className="mt-2 text-sm text-slate-600">
            Booking {createdBooking.bookingNumber} is assigned to <strong className="text-violet-950 font-black">{createdBooking.provider?.displayName || initialItem?.providerName || 'your verified provider'}</strong> and waiting for confirmation.
          </p>
        </div>
        <Card className="p-4">
          <div className="flex justify-between gap-3 text-sm"><span className="text-slate-500">{service?.name}</span><strong>{currency(createdBooking.total, createdBooking.currency || 'INR')}</strong></div>
          <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
            <span>{new Date(createdBooking.scheduledStart).toLocaleString()}</span>
            <Badge tone="amber">Awaiting provider confirmation</Badge>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Payment:</span>
            <span className="font-bold text-slate-800 capitalize">
              {paymentMethod === 'upi' ? 'UPI QR Pay' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Gateway'}
            </span>
          </div>
        </Card>
        <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-4 text-sm leading-6 text-violet-900">
          The assigned professional has received your request and will review &amp; confirm the appointment.
        </div>
        <Button className="w-full" onClick={onClose}>Done</Button>
      </div>
    );
  }

  if (addAddress) {
    return (
      <div>
        <button type="button" onClick={() => setAddAddress(false)} className="mb-4 text-sm font-bold text-violet-700">← Back to booking</button>
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
      {initialItem?.providerName && (
        <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-950">
          <BadgeCheck size={18} className="text-violet-700 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase font-bold text-violet-700 tracking-wider">Assigned Provider</span>
            <span className="text-xs font-bold text-slate-900">{initialItem.providerName}</span>
            <span className="ml-1 text-violet-700 font-semibold">({initialItem.providerTier || 'Verified'})</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#f0f5ef] p-4">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-700">Your service</p><h3 className="mt-1 font-extrabold text-slate-900">{service?.name}</h3><p className="mt-1 text-sm text-slate-500">{service?.shortDescription || service?.description}</p></div>
        <span className="whitespace-nowrap rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800">{currency(price, 'INR')}</span>
      </div>

      {service?.packages?.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">Choose a package</h3><span className="text-xs text-slate-400">Select one</span></div>
          <div className="space-y-2">
            {service.packages.map((item) => (
              <button type="button" key={item.id} onClick={() => setPackageId(item.id)} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition ${packageId === item.id ? 'border-violet-600 bg-violet-50/60' : 'border-slate-200 hover:border-violet-300'}`}>
                <span className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-full border ${packageId === item.id ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300'}`}>{packageId === item.id && <Check size={12} />}</span><span><span className="block text-sm font-bold text-slate-800">{item.name}</span><span className="text-xs text-slate-500">{item.durationMinutes} min</span></span></span>
                <span className="text-sm font-extrabold text-slate-900">{currency(item.price, 'INR')}</span>
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
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-violet-300">
                <input type="checkbox" checked={addonIds.includes(item.id)} onChange={() => toggleAddon(item.id)} className="mt-1 accent-violet-700" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{item.name}</span><span className="text-xs text-slate-500">{item.durationMinutes} min · {currency(item.price, 'INR')}</span></span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">Where and when?</h3><button type="button" onClick={() => setAddAddress(true)} className="text-xs font-bold text-violet-700"><Plus size={13} className="mr-1 inline" /> Add address</button></div>
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
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5">
            <p className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
              <BadgeCheck size={16} className="text-violet-700" />
              {initialItem?.providerName
                ? `${initialItem.providerName} is verified & available for this slot!`
                : `${availability.providers.length} verified ${availability.providers.length === 1 ? 'professional is' : 'professionals are'} available`}
            </p>
            <p className="mt-1 text-xs text-violet-800/75">
              {initialItem?.providerName
                ? 'Your booking will be confirmed directly with your chosen provider.'
                : 'The first available verified professional will be assigned automatically and asked to confirm.'}
            </p>
          </div>
        )}
      </section>

      {/* Realtime Payment Method Configuration */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">Payment Option</h3>
          {paymentConfig.mode === 'test' && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              Test Mode Active
            </span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {paymentConfig.upiEnabled && (
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${paymentMethod === 'upi'
                ? 'border-violet-600 bg-violet-50/70 ring-2 ring-violet-600/20'
                : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-slate-900">UPI / QR Pay</span>
                <span className={`h-4 w-4 rounded-full border grid place-items-center ${paymentMethod === 'upi' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300'}`}>
                  {paymentMethod === 'upi' && <Check size={10} />}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">GPay, PhonePe, Paytm</span>
            </button>
          )}

          {paymentConfig.razorpayEnabled && (
            <button
              type="button"
              onClick={() => setPaymentMethod('razorpay')}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${paymentMethod === 'razorpay'
                ? 'border-violet-600 bg-violet-50/70 ring-2 ring-violet-600/20'
                : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Online Gateway</span>
                <span className={`h-4 w-4 rounded-full border grid place-items-center ${paymentMethod === 'razorpay' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300'}`}>
                  {paymentMethod === 'razorpay' && <Check size={10} />}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Cards &amp; NetBanking</span>
            </button>
          )}

          {paymentConfig.codEnabled && (
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${paymentMethod === 'cod'
                ? 'border-violet-600 bg-violet-50/70 ring-2 ring-violet-600/20'
                : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Pay on Visit</span>
                <span className={`h-4 w-4 rounded-full border grid place-items-center ${paymentMethod === 'cod' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300'}`}>
                  {paymentMethod === 'cod' && <Check size={10} />}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Cash or UPI after service</span>
            </button>
          )}
        </div>

        {paymentMethod === 'upi' && paymentConfig.upiEnabled && (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {paymentConfig.upiQrUrl ? (
                <div className="bg-white p-2 rounded-xl border border-violet-200 shadow-sm shrink-0 text-center">
                  <img src={paymentConfig.upiQrUrl} alt="UPI QR Code" className="h-28 w-28 object-contain mx-auto" />
                  <span className="block text-[9px] font-bold text-slate-400 mt-1">Scan &amp; Pay</span>
                </div>
              ) : (
                <div className="h-24 w-24 bg-white rounded-xl border border-violet-200 grid place-items-center text-violet-700 shrink-0">
                  <QrCode size={36} />
                </div>
              )}
              <div className="space-y-1 text-xs text-slate-700 min-w-0 flex-1">
                {paymentConfig.upiId && (
                  <p className="truncate"><span className="font-semibold text-slate-500">UPI ID:</span> <code className="bg-white px-2 py-0.5 rounded border border-violet-200 font-mono text-violet-900 font-bold">{paymentConfig.upiId}</code></p>
                )}
                {paymentConfig.upiPayeeName && (
                  <p><span className="font-semibold text-slate-500">Payee:</span> <strong className="text-slate-800">{paymentConfig.upiPayeeName}</strong></p>
                )}
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  {paymentConfig.upiInstructions || 'Scan the QR code or use the UPI ID above to complete payment.'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Transaction UTR / Reference ID (optional)
              </label>
              <input
                type="text"
                value={upiRefId}
                onChange={(e) => setUpiRefId(e.target.value)}
                placeholder="e.g. 331289456712"
                className="w-full rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-violet-600"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'razorpay' && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-900 leading-relaxed">
            <strong>Instant Secure Gateway:</strong> All transactions are processed through 128-bit SSL encrypted merchant gateway.
          </div>
        )}

        {paymentMethod === 'cod' && (
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3.5 text-xs text-violet-900 leading-relaxed">
            <strong>Pay on Completion:</strong> No advance payment required. Hand cash or scan provider’s QR code once the service is verified.
          </div>
        )}
      </section>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div><span className="block text-xs text-slate-400">Estimated total</span><strong className="text-lg text-slate-900">{currency(price, 'INR')}</strong></div>
        <Button onClick={createBooking} disabled={busy || !availability?.providers?.length}>{busy ? 'Confirming…' : 'Confirm booking'} <ArrowRight size={15} /></Button>
      </div>
    </div>
  );
}

function getCategoryTiers(category, services = [], providers = []) {
  const name = (category?.name || '').toLowerCase();

  const lowestPrice = services.reduce((min, s) => {
    const p = Number(s.effectivePrice || s.basePrice || 0);
    return p > 0 && p < min ? p : min;
  }, 999999);
  const baseStarts = lowestPrice !== 999999 ? lowestPrice : 249;

  let royaleTitle = 'Royale';
  let royaleBrands = 'INOA | REPÈCHAGE | O3+';
  let royalePrice = Math.max(449, baseStarts);
  let royaleDesc = 'Only top professionals for advanced cuts, beard styling & facials.';
  let royaleImage = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

  let primeTitle = 'Prime';
  let primeBrands = "L'ORÉAL | BOMBAY SHAVING";
  let primePrice = Math.max(249, Math.round(baseStarts * 0.65));
  let primeDesc = 'Everyday cuts, color & cleanup.';
  let primeImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
  let primeArrival = 'Arriving in 44 mins';

  if (name.includes('clean')) {
    royaleTitle = 'Royale Deep Clean';
    royaleBrands = 'TASKI | DIVERSEY | KÄRCHER';
    royalePrice = Math.max(799, baseStarts);
    royaleDesc = 'Top-rated 5-star cleaners with heavy-duty mechanized scrubbing and hospital-grade sanitization.';
    royaleImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Clean';
    primeBrands = 'ECO-SHINE | ADVANCED VACUUM';
    primePrice = Math.max(399, Math.round(baseStarts * 0.6));
    primeDesc = 'Everyday thorough vacuuming, stain removal, and spotless surface care.';
    primeImage = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Arriving in 35 mins';
  } else if (name.includes('electric') || name.includes('ac')) {
    royaleTitle = 'Royale Master Tech';
    royaleBrands = 'COPPER-SAFE | 2X FOAM-JET | FLUKE';
    royalePrice = Math.max(599, baseStarts);
    royaleDesc = 'Senior certified technicians, deep high-pressure foam jet cleaning, and full circuit diagnosis.';
    royaleImage = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Quick Fix';
    primeBrands = 'HAVELLS | ANCHOR | SCHNEIDER';
    primePrice = Math.max(299, Math.round(baseStarts * 0.6));
    primeDesc = 'Prompt wiring repairs, switch replacements, and standard appliance servicing.';
    primeImage = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Arriving in 25 mins';
  } else if (name.includes('plumb')) {
    royaleTitle = 'Royale Plumber';
    royaleBrands = 'JAQUAR | KOHLER | GROHE';
    royalePrice = Math.max(499, baseStarts);
    royaleDesc = 'Precision leak detection, luxury bath fitting installation, and heavy drain clearing.';
    royaleImage = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Plumber';
    primeBrands = 'ASTRAL | SUPREME | SPEED-FIX';
    primePrice = Math.max(199, Math.round(baseStarts * 0.6));
    primeDesc = 'Quick tap repair, blockages, pipe joints, and everyday water fixture service.';
    primeImage = 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Arriving in 30 mins';
  } else if (name.includes('purifier') || name.includes('lock') || name.includes('wall')) {
    royaleTitle = 'Royale Certified Installation';
    royaleBrands = 'NATIVE LABS | 2-YEAR WARRANTY';
    royalePrice = baseStarts;
    royaleDesc = 'Company-certified master technicians with digital calibration, testing, and lifetime app sync.';
    royaleImage = 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Standard Setup';
    primeBrands = 'GENUINE PARTS | 30-DAY GUARANTEE';
    primePrice = Math.round(baseStarts * 0.85);
    primeDesc = 'Official doorstep demo, filter replacement, and priority express setup.';
    primeImage = 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Same-day slot available';
  }

  const defaultRoyalePro = providers[0] || null;
  const defaultPrimePro = providers[1] || providers[0] || null;

  return {
    royale: {
      id: defaultRoyalePro ? defaultRoyalePro.id : 'royale',
      providerId: defaultRoyalePro ? defaultRoyalePro.id : null,
      badge: '✪ Top rated pros',
      title: royaleTitle,
      brands: royaleBrands,
      startsAt: royalePrice,
      description: royaleDesc,
      image: royaleImage
    },
    prime: {
      id: defaultPrimePro ? defaultPrimePro.id : 'prime',
      providerId: defaultPrimePro ? defaultPrimePro.id : null,
      badge: null,
      arrival: primeArrival,
      title: primeTitle,
      brands: primeBrands,
      startsAt: primePrice,
      description: primeDesc,
      image: primeImage
    }
  };
}

function CategoryPreferencesPage({
  categoryIdentifier,
  cartItems = [],
  onBack,
  onOpenService,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  onViewCart
}) {
  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedPreference, setSelectedPreference] = useState(null);
  const [selectedServiceForPackage, setSelectedServiceForPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    async function loadData() {
      try {
        let cat = null;
        if (categoryIdentifier) {
          try {
            cat = await api.get(`/catalog/categories/${categoryIdentifier}`);
          } catch {
            cat = demoCategories.find(
              (c) => c.slug === categoryIdentifier || c.id === categoryIdentifier || c.name.toLowerCase() === categoryIdentifier.toLowerCase()
            );
          }
        }

        if (!cat) {
          const list = await api.get('/catalog/categories', { limit: '20' }).catch(() => []);
          cat = (list && list[0]) || demoCategories[0];
        }

        if (!active) return;
        setCategory(cat);

        let categoryServices = [];
        try {
          categoryServices = await api.get('/catalog/services', { categoryId: cat.id, limit: '50' });
        } catch {
          categoryServices = [];
        }

        if (!categoryServices.length) {
          categoryServices = demoServices.filter(
            (s) => s.category?.name?.toLowerCase() === cat.name?.toLowerCase() || s.categoryId === cat.id
          );
        }

        let provs = [];
        try {
          const provData = await api.get('/providers', { limit: '20', ...(cat.id ? { categoryId: cat.id } : {}) });
          provs = Array.isArray(provData) ? provData : (provData?.items || []);
        } catch {
          provs = [];
        }

        if (!provs.length) {
          try {
            const allProvs = await api.get('/providers', { limit: '10' });
            provs = Array.isArray(allProvs) ? allProvs : (allProvs?.items || []);
          } catch {
            provs = [];
          }
        }

        if (!active) return;
        setServices(categoryServices);
        setProviders(provs);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err));
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [categoryIdentifier]);

  const tiers = useMemo(() => {
    return getCategoryTiers(category, services, providers);
  }, [category, services, providers]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.total || item.packagePrice || 0), 0);
  }, [cartItems]);

  const handleAddService = (service, chosenPackage = null) => {
    if (!selectedPreference) {
      if (onOpenService) {
        onOpenService(service.id);
      }
      return;
    }
    const pkg = chosenPackage || service.packages?.[0];
    const price = pkg ? Number(pkg.price) : Number(service.effectivePrice ?? service.basePrice ?? 0);
    onAddToCart({
      serviceId: service.id,
      name: service.name,
      categoryName: category?.name || 'Home service',
      description: service.shortDescription || service.description || '',
      currency: service.currency || 'INR',
      providerId: selectedPreference.id,
      providerName: selectedPreference.name,
      providerTier: selectedPreference.tier,
      providerAvatar: selectedPreference.image,
      packageId: pkg?.id || '',
      packageName: pkg?.name || 'Standard service',
      packagePrice: price,
      total: price,
      isDemo: Boolean(service.isDemo)
    });
  };

  if (loading) {
    return <PageLoader label="Loading service preferences…" />;
  }

  if (error && !category) {
    return <ErrorState message={error} onRetry={onBack} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-2 sm:px-4 pb-28 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 transition hover:text-violet-700"
      >
        <ArrowLeft size={16} /> Back to categories
      </button>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            <Sparkles size={13} /> {category?.name || 'Category'}
          </span>
          <span className="text-xs text-slate-400 font-medium">· Doorstep professional services</span>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Select your preference
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Choose a service tier or verified professional for {category?.name}
        </p>

        <div className="my-6 border-b border-slate-200" />

        <div className="space-y-6">
          {/* 1. Royale Preference Card */}
          {(() => {
            const isSelected = selectedPreference?.tier === 'Royale';
            return (
              <div
                onClick={() => setSelectedPreference(isSelected ? null : { id: tiers.royale.providerId || 'royale-tier', name: tiers.royale.title, tier: 'Royale', image: tiers.royale.image })}
                className={`group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-3 rounded-2xl cursor-pointer transition select-none ${isSelected ? 'bg-violet-50/70 ring-2 ring-violet-600' : 'hover:bg-slate-50 border border-transparent'
                  }`}
              >
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs">
                  <img
                    src={tiers.royale.image}
                    alt={tiers.royale.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {tiers.royale.badge && (
                    <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-[#b87333] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
                      {tiers.royale.badge}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 transition group-hover:text-violet-700">
                        {tiers.royale.title}
                      </h2>
                      {isSelected && (
                        <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${isSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 group-hover:border-violet-500'
                      }`}>
                      {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="text-slate-400" />}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {tiers.royale.brands.split('|').map((brand, i, arr) => (
                      <span key={brand.trim()} className="flex items-center gap-2">
                        <span>{brand.trim()}</span>
                        {i < arr.length - 1 && <span className="text-slate-300">|</span>}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-700">
                    Starts at {currency(tiers.royale.startsAt, 'INR')}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    {tiers.royale.description}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="border-b border-slate-150" />

          {/* 2. Prime Preference Card */}
          {(() => {
            const isSelected = selectedPreference?.tier === 'Prime';
            return (
              <div
                onClick={() => setSelectedPreference(isSelected ? null : { id: tiers.prime.providerId || 'prime-tier', name: tiers.prime.title, tier: 'Prime', image: tiers.prime.image })}
                className={`group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-3 rounded-2xl cursor-pointer transition select-none ${isSelected ? 'bg-violet-50/70 ring-2 ring-violet-600' : 'hover:bg-slate-50 border border-transparent'
                  }`}
              >
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs">
                  <img
                    src={tiers.prime.image}
                    alt={tiers.prime.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 transition group-hover:text-violet-700">
                        {tiers.prime.title}
                      </h2>
                      {isSelected && (
                        <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${isSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 group-hover:border-violet-500'
                      }`}>
                      {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="text-slate-400" />}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                    <Zap size={13} className="fill-violet-600 text-violet-600" />
                    <span>{tiers.prime.arrival}</span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {tiers.prime.brands.split('|').map((brand, i, arr) => (
                      <span key={brand.trim()} className="flex items-center gap-2">
                        <span>{brand.trim()}</span>
                        {i < arr.length - 1 && <span className="text-slate-300">|</span>}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-700">
                    Starts at {currency(tiers.prime.startsAt, 'INR')}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    {tiers.prime.description}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* 3. Verified Database Providers */}
          {providers.length > 0 && (
            <>
              <div className="border-b border-slate-150" />
              <div className="pt-2">
                <div className="mb-3 flex items-center gap-2">
                  <BadgeCheck size={16} className="text-violet-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Verified Independent Providers ({providers.length})
                  </span>
                </div>
                <div className="space-y-4">
                  {providers.map((provider) => {
                    const isSelected = selectedPreference?.id === provider.id;
                    return (
                      <div
                        key={provider.id}
                        onClick={() => setSelectedPreference(isSelected ? null : { id: provider.id, name: provider.displayName, tier: 'Verified Pro', image: provider.avatarUrl })}
                        className={`group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-3 rounded-2xl cursor-pointer transition select-none ${isSelected ? 'bg-violet-50/70 ring-2 ring-violet-600' : 'hover:bg-slate-50 border border-transparent'
                          }`}
                      >
                        <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs border border-slate-200">
                          {provider.avatarUrl ? (
                            <img
                              src={resolveMediaUrl(provider.avatarUrl)}
                              alt={provider.displayName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'grid';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{ display: provider.avatarUrl ? 'none' : 'grid' }}
                            className="h-full w-full place-items-center bg-violet-100 text-lg font-black text-violet-800"
                          >
                            {provider.displayName?.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                          </div>
                          <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-violet-700 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-violet-800 transition">
                                {provider.displayName}
                              </h3>
                              {isSelected && (
                                <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                  ✓ Selected
                                </span>
                              )}
                            </div>
                            <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${isSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 group-hover:border-violet-500'
                              }`}>
                              {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="text-slate-400" />}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                            <span>{provider.professionalTitle || 'Service Professional'}</span>
                            {provider.experienceYears > 0 && <span>· {provider.experienceYears} yrs experience</span>}
                            <span className="text-violet-700 font-bold">· 100% On-time guarantee</span>
                          </div>
                          <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-700">
                            Starts at {currency(provider.services?.[0]?.customPrice || provider.services?.[0]?.basePrice || tiers.prime.startsAt, 'INR')}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                            {provider.bio || 'Verified platform professional ready for doorstep home service.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )
          }
        </div >

        {/* Services & Packages List */}
        < div className="mt-8 border-t border-slate-200 pt-6" >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Services in {category?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Choose options and add to your cart
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {services.length} {services.length === 1 ? 'service available' : 'services available'}
            </span>
          </div>

          {
            !selectedPreference ? (
              <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900">
                <span className="text-base">⚠️</span>
                <span>Please select your provider preference above (Royale, Prime, or a verified pro), or click any service below to view all providers.</span>
              </div>
            ) : (
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-950">
                <span className="flex items-center gap-2">
                  <BadgeCheck size={16} className="text-violet-700" />
                  Selected preference: <strong>{selectedPreference.name}</strong> ({selectedPreference.tier})
                </span>
                <span className="text-violet-700 text-[11px] font-bold">✓ Ready to add services</span>
              </div>
            )
          }

          {
            services.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {services.map((service, index) => {
                  const photo = getServiceImage(service);
                  const details = getServiceDetails(service, index);
                  const inCart = cartItems.find((item) => item.serviceId === service.id);
                  const servicePrice = service.effectivePrice ?? service.basePrice;

                  return (
                    <div key={service.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div
                        onClick={() => onOpenService?.(service.id)}
                        className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer group"
                      >
                        <div className="h-20 w-20 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs border border-slate-100">
                          <img src={photo} alt={service.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-violet-700 transition">
                            {service.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                            <Star size={11} className="fill-slate-800 text-slate-800 shrink-0" />
                            <span>{details.rating}</span>
                            <span className="text-slate-500 font-normal">({details.reviews})</span>
                            <span className="text-slate-300 mx-0.5">·</span>
                            <span className="text-slate-600">{details.durationText}</span>
                          </div>
                          <div className="mt-1.5 flex items-baseline gap-2">
                            <span className="text-sm sm:text-base font-black text-slate-950">
                              {currency(servicePrice, 'INR')}
                            </span>
                            {details.originalPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                {currency(details.originalPrice, 'INR')}
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {service.shortDescription || service.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800 border border-violet-200 flex items-center gap-1.5">
                              <Check size={14} /> Added
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(service.id)}
                              className="rounded-xl px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedPreference) {
                                if (onOpenService) onOpenService(service.id);
                                return;
                              }
                              if (service.packages?.length > 1) {
                                setSelectedServiceForPackage(service);
                              } else {
                                handleAddService(service);
                              }
                            }}
                            className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 text-center text-white shadow-sm transition active:scale-95 min-w-[90px] ${selectedPreference ? 'bg-violet-700 hover:bg-violet-800' : 'bg-slate-800 hover:bg-violet-700'
                              }`}
                          >
                            <span className="text-xs sm:text-sm font-bold leading-tight">
                              {selectedPreference ? `+ Add (${selectedPreference.tier})` : 'Select pro'}
                            </span>
                            {details.optionsCount > 1 && (
                              <span className="text-[10px] text-violet-200 leading-none mt-0.5">
                                {details.optionsCount} options
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center italic">
                No specific services configured under this category yet.
              </p>
            )}
        </div>
      </div >

      {selectedServiceForPackage && (
        <Modal
          open={Boolean(selectedServiceForPackage)}
          onClose={() => setSelectedServiceForPackage(null)}
          title={selectedServiceForPackage?.name || 'Choose options'}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Pick the package that fits your home:</p>
            {selectedServiceForPackage?.packages?.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => {
                  handleAddService(selectedServiceForPackage, pkg);
                  setSelectedServiceForPackage(null);
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-violet-600 hover:bg-violet-50/50 cursor-pointer transition"
              >
                <div>
                  <h5 className="font-bold text-slate-900 group-hover:text-violet-800">{pkg.name}</h5>
                  <p className="text-xs text-slate-500">{pkg.durationMinutes} mins · {pkg.description || 'Standard inclusion'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-900">{currency(pkg.price, 'INR')}</span>
                  <span className="rounded-lg bg-violet-700 px-3 py-1 text-xs font-bold text-white group-hover:bg-violet-800">
                    Select
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )
      }

      {
        cartItems.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl rounded-2xl bg-slate-950 text-white p-3.5 sm:p-4 shadow-2xl border border-slate-800 flex items-center justify-between backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white font-bold text-sm">
                <ShoppingBag size={18} />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 leading-none">
                  {cartItems.length} {cartItems.length === 1 ? 'service added' : 'services added'}
                </p>
                <p className="mt-1 text-base sm:text-lg font-black text-white leading-tight">
                  {currency(cartTotal, 'INR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onViewCart}
                className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => onCheckout(cartItems[cartItems.length - 1])}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:bg-violet-500 active:scale-95"
              >
                <span>Checkout</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default function CustomerPortal({
  user,
  active,
  categoryParam,
  serviceParam,
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

  const currentServiceId = detailServiceId || (active === 'service' ? (serviceParam || categoryParam) : '');

  function openService(id) {
    setDetailServiceId(id);
    changeTab('service', id);
  }

  function closeService() {
    setDetailServiceId('');
    changeTab('services');
  }

  function changeTab(next, param = '') {
    onTabChange(next, param);
    if (!user && next === 'services') {
      window.setTimeout(() => document.getElementById('customer-services')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  let content;
  if (currentServiceId) {
    content = <ServiceDetails
      serviceId={currentServiceId}
      cartItem={cartItems.find((item) => item.serviceId === currentServiceId)}
      onBack={closeService}
      onAddToCart={(item) => { onAddToCart(item); changeTab('cart'); setDetailServiceId(''); }}
    />;
  } else if (active === 'cart') {
    content = <CartPage
      items={cartItems}
      onRemove={onRemoveFromCart}
      onContinue={() => changeTab('services')}
      onCheckout={(item) => {
        if (!user) {
          setLoginPrompt(true);
          onSignIn();
          return;
        }
        setSelectedCartItem(item);
        setServiceId(item.serviceId);
      }}
    />;
  } else if (active === 'category') {
    content = <CategoryPreferencesPage
      categoryIdentifier={categoryParam}
      cartItems={cartItems}
      onBack={() => changeTab('home')}
      onOpenService={openService}
      onAddToCart={onAddToCart}
      onRemoveFromCart={onRemoveFromCart}
      onCheckout={(item) => {
        if (!user) {
          setLoginPrompt(true);
          onSignIn();
          return;
        }
        setSelectedCartItem(item);
        setServiceId(item.serviceId);
      }}
      onViewCart={() => changeTab('cart')}
    />;
  } else if (active === 'bookings') content = <BookingHistory onSignIn={() => changeTab('services')} />;
  else if ((active === 'profile' || active === 'addresses') && user) content = <CustomerProfile user={user} onUserUpdate={onUserUpdate} />;
  else if (active === 'services') content = <ServiceExplorer onOpenService={openService} onSelectCategory={(cat) => changeTab('category', cat.slug || cat.id)} />;
  else content = <CustomerHome
    user={user}
    onOpenService={openService}
    onTabChange={changeTab}
    onSelectCategory={(cat) => changeTab('category', cat.slug || cat.id)}
    onBecomePartner={onBecomePartner}
  />;

  return (
    <>
      {content}
      <Modal open={Boolean(serviceId)} onClose={() => { setServiceId(''); setSelectedCartItem(null); }} title="Schedule your service" wide>
        {serviceId && <BookingFlow
          serviceId={serviceId}
          initialItem={selectedCartItem}
          onClose={() => { setServiceId(''); setSelectedCartItem(null); onTabChange('bookings'); }}
          onNeedLogin={() => { setServiceId(''); setSelectedCartItem(null); setLoginPrompt(true); }}
          // onNeedLogin={() => { setServiceId(''); setSelectedCartItem(null); onSignIn(); }}
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
