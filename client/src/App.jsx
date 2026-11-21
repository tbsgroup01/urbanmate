import { useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Rocket,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  Wrench
} from 'lucide-react';
import AuthPage from './pages/AuthPage';
import EmailVerification from './components/EmailVerification';
import {
  Brand,
  Button,
  Modal,
  PageLoader,
  initials
} from './components/ui';
import { api, getAccessToken, getErrorMessage, refreshAccessToken, resolveMediaUrl, setAccessToken } from './lib/api';
import CustomerPortal from './pages/CustomerPortal';
import ProviderPortal from './pages/ProviderPortal';
import AdminPortal from './pages/AdminPortal';

const portalConfig = {
  customer: {
    title: 'Your home, taken care of',
    subtitle: 'Find trusted experts for the things that matter.',
    nav: [
      { id: 'home', label: 'Home', icon: LayoutDashboard },
      { id: 'services', label: 'Explore services', icon: PackageSearch },
      { id: 'bookings', label: 'My bookings', icon: CalendarDays },
      { id: 'profile', label: 'Profile', icon: UserRound }
    ]
  },
  provider: {
    nav: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'services', label: 'My services', icon: Wrench },
      { id: 'requests', label: 'Booking requests', icon: Bell },
      { id: 'active', label: 'Active jobs', icon: BriefcaseBusiness },
      { id: 'history', label: 'Job history', icon: ClipboardList },
      { id: 'availability', label: 'Availability', icon: CalendarDays },
      { id: 'earnings', label: 'Earnings', icon: Wallet },
      { id: 'profile', label: 'Profile & documents', icon: UserRound }
    ]
  },

  admin: {
    nav: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'providers', label: 'Providers', icon: BriefcaseBusiness },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'categories', label: 'Categories', icon: FolderTree },
      { id: 'services', label: 'Services', icon: PackageSearch },
      { id: 'bookings', label: 'Bookings', icon: CalendarDays },
      { id: 'finance', label: 'Payments & reports', icon: ChartNoAxesCombined },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
};

function getUserRoles(user) {
  return user?.roles?.map((role) => (typeof role === 'string' ? role : role?.name)).filter(Boolean) || [];
}

function getSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('urbanmate_cart') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function PortalNav({ portal, active, onChange, mobile = false, providerRequestsCount = 0, customerPendingConfirmCount = 0 }) {
  const isProvider = portal === 'provider';
  const navItems = portalConfig[portal]?.nav || [];

  if (mobile) {
    const colCount = navItems.length <= 4 ? 'grid-cols-4' : navItems.length <= 6 ? 'grid-cols-6' : 'grid-cols-4 sm:grid-cols-8';

    return (
      <nav className={`grid ${colCount} gap-2 items-center justify-items-center w-full`} aria-label="Mobile Navigation">
        {navItems.map(({ id, label, icon: Icon }) => {
          const hasProviderBadge = portal === 'provider' && id === 'requests' && providerRequestsCount > 0;
          const hasCustomerBadge = portal === 'customer' && id === 'bookings' && customerPendingConfirmCount > 0;
          const badgeCount = hasProviderBadge ? providerRequestsCount : hasCustomerBadge ? customerPendingConfirmCount : 0;
          const badgeColor = hasCustomerBadge ? 'bg-amber-600' : 'bg-rose-500';
          const isCurrentActive = active === id;

          return (
            <button
              type="button"
              key={id}
              onClick={() => onChange(id)}
              aria-label={label}
              title={label}
              className={`group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                isCurrentActive
                  ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/35 ring-2 ring-violet-200/80 scale-105'
                  : 'text-slate-400 hover:bg-violet-50 hover:text-violet-700 active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  size={isCurrentActive ? 22 : 20}
                  strokeWidth={isCurrentActive ? 2.5 : 1.9}
                  className="transition-transform duration-200"
                />
                {badgeCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full ${badgeColor} px-1 text-[9px] font-black text-white shadow-xs animate-pulse ring-2 ring-white`}
                  >
                    {badgeCount}
                  </span>
                )}
              </div>
              {isCurrentActive && (
                <span className="absolute -bottom-1 h-1 w-3.5 rounded-full bg-violet-600 shadow-xs shadow-violet-400" />
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {navItems.map(({ id, label, icon: Icon }) => {
        const hasProviderBadge = portal === 'provider' && id === 'requests' && providerRequestsCount > 0;
        const hasCustomerBadge = portal === 'customer' && id === 'bookings' && customerPendingConfirmCount > 0;
        const badgeCount = hasProviderBadge ? providerRequestsCount : hasCustomerBadge ? customerPendingConfirmCount : 0;
        const badgeColor = hasCustomerBadge ? 'bg-amber-600' : 'bg-rose-500';
        const isCurrentActive = active === id;

        let buttonStyle = '';
        if (isProvider) {
          buttonStyle = isCurrentActive
            ? 'bg-[#ede9fe] text-[#4c1d95] font-black shadow-md shadow-violet-950/40'
            : 'text-violet-200/80 hover:bg-white/10 hover:text-white font-semibold';
        } else {
          buttonStyle = isCurrentActive
            ? 'bg-gradient-to-r from-violet-700 to-purple-600 text-white font-bold shadow-md shadow-violet-600/20'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold';
        }

        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm transition ${buttonStyle}`}
          >
            <div className="relative">
              <Icon size={18} strokeWidth={isCurrentActive ? 2.4 : 1.8} />
            </div>
            <span>{label}</span>
            {badgeCount > 0 && (
              <span
                className={`ml-auto inline-flex items-center rounded-full ${
                  isCurrentActive ? 'bg-white text-violet-700' : badgeColor + ' text-white'
                } px-2 py-0.5 text-[11px] font-black shadow-xs animate-pulse`}
              >
                {badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function AppHeader({ user, portal, active, onLogout, onToggleMenu, onVerifyEmail, cartCount }) {
  const navigate = useNavigate();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const roles = useMemo(() => getUserRoles(user), [user]);
  const isAdmin = roles.includes('admin');
  const isProvider = roles.includes('provider');

  const targetUiPath = isAdmin
    ? '/admin/overview'
    : isProvider
    ? '/provider/overview'
    : '/profile';

  const roleBadgeLabel = isAdmin
    ? 'Admin Console'
    : isProvider
    ? 'Pro Workspace'
    : 'Customer Space';

  function handleBrandClick() {
    if (!user) {
      navigate('/');
      return;
    }
    if (isAdmin) navigate('/admin/overview');
    else if (isProvider) navigate('/provider/overview');
    else navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/75 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-5 px-4 sm:px-7 xl:px-10">
        <div className="flex items-center gap-3">
          {user && portal !== 'customer' && (
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
              onClick={onToggleMenu}
              aria-label="Toggle navigation"
            >
              <Menu size={19} />
            </button>
          )}
          <button type="button" onClick={handleBrandClick} className="flex items-center gap-3 text-left">
            <Brand size="lg" />
            {user && (
              <span className="hidden border-l border-slate-200 pl-3 text-xs font-semibold text-slate-500 sm:inline">
                {portal === 'customer' ? 'HOME SERVICES' : portal === 'provider' ? 'PRO PARTNER' : 'ADMIN CONSOLE'}
              </span>
            )}
          </button>
        </div>

        {!user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="mr-3 hidden items-center gap-1 md:flex" aria-label="Main navigation">
              <button
                type="button"
                onClick={() => navigate('/')}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${active === 'home' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => navigate('/services')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === 'services' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}
              >
                Services
              </button>

              <button
                type="button"
                onClick={() => navigate('/register/provider')}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-800"
              >
                Become a partner
              </button>
            </nav>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-violet-50 hover:text-violet-800"
              aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-700 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <Button size="sm" className="bg-violet-700 hover:bg-violet-800" onClick={() => navigate('/login')}>
              Login / Sign up <ArrowUpRight size={15} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4">
            {portal === 'customer' && (
              <nav className="mr-2 hidden items-center gap-1 md:flex" aria-label="Customer navigation">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${active === 'home' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === 'services' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}
                >
                  Services
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === 'bookings' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}
                >
                  My bookings
                </button>
              </nav>
            )}

            {portal === 'customer' && (
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-violet-50 hover:text-violet-800"
                aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-700 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative group">
              <button
                type="button"
                onClick={() => navigate(targetUiPath)}
                className="flex items-center gap-2.5 rounded-full border border-violet-100/90 bg-white/95 py-1 pl-1 pr-3.5 shadow-xs transition-all duration-200 hover:border-violet-300 hover:bg-violet-50/70 hover:shadow-md cursor-pointer"
                title={`Go to ${roleBadgeLabel} (${targetUiPath})`}
                aria-label={`Go to ${roleBadgeLabel}`}
              >
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-violet-600 to-purple-600 text-xs font-black text-white shadow-xs ring-2 ring-white">
                  {user.avatarUrl || user.providerProfile?.avatarUrl ? (
                    <img
                      src={resolveMediaUrl(user.avatarUrl || user.providerProfile?.avatarUrl)}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      display: user.avatarUrl || user.providerProfile?.avatarUrl ? 'none' : 'flex'
                    }}
                  >
                    {initials(user.fullName)}
                  </span>
                </div>

                <div className="hidden text-left sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 leading-none">Hi, {firstName}</span>
                    <ArrowUpRight size={13} className="text-violet-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-violet-700 capitalize leading-none">
                    {roleBadgeLabel}
                  </span>
                </div>
              </button>

              <div className="invisible absolute right-0 top-full z-40 mt-2 w-56 translate-y-1 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-slate-800">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(targetUiPath)}
                  className="mt-1.5 flex w-full items-center justify-between rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 transition cursor-pointer"
                >
                  <span>Go to {roleBadgeLabel}</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(isProvider ? '/provider/profile' : '/profile')}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <UserRound size={15} className="text-violet-700" /> Your Profile
                </button>

                <button
                  type="button"
                  onClick={() => navigate(isProvider ? '/provider/active' : isAdmin ? '/admin/bookings' : '/bookings')}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <CalendarDays size={15} className="text-violet-700" /> {isProvider ? 'Active Jobs' : 'My Bookings'}
                </button>

                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={onVerifyEmail}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 cursor-pointer"
                  >
                    <Shield size={15} /> Verify email
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function PortalLayout({
  user,
  portal,
  active,
  cartCount,
  onLogout,
  onVerifyEmail,
  providerRequestsCount,
  customerPendingConfirmCount,
  children
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f6] text-slate-900">
      <AppHeader
        user={user}
        portal={portal}
        active={active}
        onLogout={onLogout}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onVerifyEmail={onVerifyEmail}
        cartCount={cartCount}
      />

      {user ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-7 px-4 sm:px-7 xl:px-10">
          {portal !== 'customer' && menuOpen && (
            <div
              className="fixed inset-0 z-10 bg-slate-900/40 backdrop-blur-xs lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}
          <aside
            className={`${portal === 'customer'
              ? 'hidden lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:w-[260px] lg:border-0 lg:bg-transparent lg:px-0'
              : `fixed inset-y-[72px] left-0 z-20 w-[260px] transition-transform lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:translate-x-0 ${portal === 'provider'
                ? 'border border-violet-900/40 bg-gradient-to-b from-[#1b0f38] via-[#241249] to-[#120726] text-white rounded-[28px] p-4 my-3 shadow-xl'
                : 'border-r border-slate-200 bg-white px-5 py-7 lg:border-0 lg:bg-transparent lg:px-0'
              } ${menuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`
              }`}
          >
            <div className="mb-5 px-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${portal === 'provider' ? 'text-violet-300/60' : 'text-slate-400'}`}>
                {portal === 'customer' ? 'YOUR SPACE' : portal === 'provider' ? 'PRO WORKSPACE' : 'MANAGE'}
              </p>
            </div>
            <PortalNav
              portal={portal}
              active={active}
              onChange={(nextTab) => {
                setMenuOpen(false);
                if (portal === 'customer') {
                  if (nextTab === 'home') navigate('/');
                  else navigate(`/${nextTab}`);
                } else if (portal === 'provider') {
                  navigate(`/provider/${nextTab}`);
                } else if (portal === 'admin') {
                  navigate(`/admin/${nextTab}`);
                }
              }}
              providerRequestsCount={providerRequestsCount}
              customerPendingConfirmCount={customerPendingConfirmCount}
            />
            {portal === 'provider' ? (
              <div className="relative mt-8 overflow-hidden rounded-3xl border border-violet-800/40 bg-gradient-to-br from-[#1e0f3e] via-[#2c1356] to-[#0f0520] p-5 text-white shadow-xl">
                <svg className="pointer-events-none absolute -bottom-1 inset-x-0 h-10 w-full text-violet-500/20" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
                  <path d="M0,40 C30,40 50,15 100,25 L100,40 Z" />
                </svg>
                <div className="relative z-10">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white mb-3">
                    <Rocket size={17} className="text-amber-400" />
                  </div>
                  <p className="text-xs font-semibold text-violet-200">Your next good job</p>
                  <p className="mt-1 text-sm font-extrabold leading-snug text-white">Your schedule is in your hands.</p>
                </div>
              </div>
            ) : (
              <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0f3e] via-[#2c1356] to-[#0f0520] p-5 text-white shadow-lg shadow-violet-900/10">
                <p className="text-xs font-semibold text-violet-200">
                  {portal === 'admin' ? 'Marketplace health' : 'Make room for life'}
                </p>
                <p className="mt-1 text-sm font-extrabold leading-snug">
                  {portal === 'admin'
                    ? 'A thoughtful service starts with thoughtful operations.'
                    : 'Let a local expert take one thing off your list.'}
                </p>
                <Sparkles className="mt-4 text-violet-300" size={18} />
              </div>
            )}
          </aside>

          <main className="min-w-0 flex-1 pb-24 pt-7 lg:pb-10 lg:pt-9">
            {portal !== 'customer' && (
              <div className="mb-6 hidden sm:block">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-700">{portalConfig[portal]?.title}</p>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{portalConfig[portal]?.subtitle}</p>
              </div>
            )}
            {children}
          </main>
        </div>
      ) : (
        <main id="customer-page" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-14 pt-5 sm:px-7 lg:px-10">
          {children}
        </main>
      )}

      {user && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-100/90 bg-white/95 px-4 py-2.5 shadow-[0_-4px_25px_rgba(109,40,217,0.08)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-md">
            <PortalNav
              portal={portal}
              active={active}
              onChange={(nextTab) => {
                if (portal === 'customer') {
                  if (nextTab === 'home') navigate('/');
                  else navigate(`/${nextTab}`);
                } else if (portal === 'provider') {
                  navigate(`/provider/${nextTab}`);
                } else if (portal === 'admin') {
                  navigate(`/admin/${nextTab}`);
                }
              }}
              mobile
              providerRequestsCount={providerRequestsCount}
              customerPendingConfirmCount={customerPendingConfirmCount}
            />
          </div>
        </div>
      )}

      {portal !== 'admin' && (
        <footer className="bg-[#1d123d] px-5 py-9 text-violet-100 sm:px-8">
          <div className="mx-auto grid max-w-[1360px] gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Brand dark />
                <span className="text-[10px] font-semibold text-violet-200">Home services, simplified.</span>
              </div>
              <p className="mt-4 max-w-xs text-xs leading-5 text-violet-200/75">
                A thoughtful way to find local help for cleaning, repairs, and the little things that make a place feel like home.
              </p>
              <div className="mt-4 flex items-center gap-2 text-violet-200/80">
                <Shield size={14} />
                <span className="text-[10px]">Your account and bookings stay protected.</span>
              </div>
            </div>
            {!user || portal === 'customer' ? (
              <div>
                <h2 className="text-xs font-extrabold text-white">Explore</h2>
                <div className="mt-3 space-y-2">
                  <button type="button" onClick={() => navigate('/')} className="block text-left text-xs text-violet-200/75 transition hover:text-white">
                    Home
                  </button>
                  <button type="button" onClick={() => navigate('/services')} className="block text-left text-xs text-violet-200/75 transition hover:text-white">
                    Services
                  </button>
                  {user && (
                    <button type="button" onClick={() => navigate('/bookings')} className="block text-left text-xs text-violet-200/75 transition hover:text-white">
                      My bookings
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-extrabold text-white">Your workspace</h2>
                <p className="mt-3 text-xs leading-5 text-violet-200/75">Manage your services and bookings from your account workspace.</p>
              </div>
            )}
            <div>
              <h2 className="text-xs font-extrabold text-white">For professionals</h2>
              <p className="mt-3 text-xs leading-5 text-violet-200/75">Grow your local service business with Urbanmate.</p>
              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/register/provider')}
                  className="mt-3 text-xs font-bold text-black transition hover:text-fuchsia-200"
                >
                  Become a partner <ArrowUpRight size={13} className="ml-1 inline" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white">Need help?</h2>
              <p className="mt-3 text-xs leading-5 text-violet-200/75">
                For help with an upcoming visit, check your booking details or contact your service professional.
              </p>
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-[1360px] flex-col justify-between gap-2 border-t border-white/10 pt-4 text-[10px] text-violet-200/65 sm:flex-row">
            <span>© {new Date().getFullYear()} Urbanmate. Home, made easier.</span>
            <span>Thoughtful local service, right at home.</span>
          </div>
        </footer>
      )}
    </div>
  );
}

function PublicOnlyRoute({ user, children }) {
  if (user) {
    const roles = getUserRoles(user);
    if (roles.includes('admin')) return <Navigate to="/admin/overview" replace />;
    if (roles.includes('provider')) return <Navigate to="/provider/overview" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function RequireCustomer({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function RequireProvider({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  const roles = getUserRoles(user);
  if (!roles.includes('provider')) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RequireAdmin({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  const roles = getUserRoles(user);
  if (!roles.includes('admin')) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function CustomerPage({
  user,
  active,
  cartItems,
  setCartItems,
  onUserUpdate,
  providerRequestsCount,
  customerPendingConfirmCount,
  onLogout,
  onVerifyEmail
}) {
  const params = useParams();
  const navigate = useNavigate();

  return (
    <PortalLayout
      user={user}
      portal="customer"
      active={active}
      cartCount={cartItems.length}
      onLogout={onLogout}
      onVerifyEmail={onVerifyEmail}
      providerRequestsCount={providerRequestsCount}
      customerPendingConfirmCount={customerPendingConfirmCount}
    >
      <CustomerPortal
        user={user}
        active={active}
        categoryParam={params.id || ''}
        serviceParam={active === 'service' ? params.id || '' : ''}
        onTabChange={(tab, param = '') => {
          if (tab === 'home') navigate('/');
          else if (tab === 'services') navigate('/services');
          else if (tab === 'service') navigate(param ? `/service/${param}` : '/services');
          else if (tab === 'category') navigate(param ? `/category/${param}` : '/services');
          else if (tab === 'cart') navigate('/cart');
          else if (tab === 'bookings') navigate('/bookings');
          else if (tab === 'profile') navigate('/profile');
          else navigate('/');
        }}
        onSignIn={() => navigate('/login')}
        onUserUpdate={onUserUpdate}
        cartItems={cartItems}
        onAddToCart={(item) => setCartItems((current) => [...current.filter((entry) => entry.serviceId !== item.serviceId), item])}
        onRemoveFromCart={(serviceId) => setCartItems((current) => current.filter((entry) => entry.serviceId !== serviceId))}
        onBecomePartner={() => navigate('/register/provider')}
      />
    </PortalLayout>
  );
}

function ProviderPage({
  user,
  cartItems,
  onUserUpdate,
  providerRequestsCount,
  customerPendingConfirmCount,
  onLogout,
  onVerifyEmail
}) {
  const params = useParams();
  const navigate = useNavigate();
  const activeTab = params.tab || 'overview';

  return (
    <PortalLayout
      user={user}
      portal="provider"
      active={activeTab}
      cartCount={cartItems.length}
      onLogout={onLogout}
      onVerifyEmail={onVerifyEmail}
      providerRequestsCount={providerRequestsCount}
      customerPendingConfirmCount={customerPendingConfirmCount}
    >
      <ProviderPortal
        user={user}
        active={activeTab}
        onTabChange={(tab) => navigate(`/provider/${tab}`)}
        onUserUpdate={onUserUpdate}
      />
    </PortalLayout>
  );
}

function AdminPage({
  user,
  cartItems,
  providerRequestsCount,
  customerPendingConfirmCount,
  onLogout,
  onVerifyEmail
}) {
  const params = useParams();
  const navigate = useNavigate();
  const activeTab = params.tab || 'overview';

  return (
    <PortalLayout
      user={user}
      portal="admin"
      active={activeTab}
      cartCount={cartItems.length}
      onLogout={onLogout}
      onVerifyEmail={onVerifyEmail}
      providerRequestsCount={providerRequestsCount}
      customerPendingConfirmCount={customerPendingConfirmCount}
    >
      <AdminPortal
        user={user}
        active={activeTab}
        onTabChange={(tab) => navigate(`/admin/${tab}`)}
      />
    </PortalLayout>
  );
}

function AuthRoute({ mode, onAuthSuccess }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = params.role === 'provider' ? 'provider' : 'customer';
  const token = searchParams.get('token') || '';

  return (
    <AuthPage
      initialMode={mode}
      initialRole={role}
      resetToken={token}
      onResetComplete={() => navigate('/login', { replace: true })}
      onSuccess={onAuthSuccess}
      onNavigateHome={() => navigate('/')}
    />
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('urbanmate_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(() => {
    const token = getAccessToken();
    const saved = localStorage.getItem('urbanmate_user');
    return Boolean(token && !saved);
  });
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [cartItems, setCartItems] = useState(getSavedCart);
  const [providerRequestsCount, setProviderRequestsCount] = useState(0);
  const [customerPendingConfirmCount, setCustomerPendingConfirmCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  function handleUserUpdate(updatedUser) {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('urbanmate_user', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('urbanmate_user');
    }
  }

  useEffect(() => {
    localStorage.setItem('urbanmate_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    function handleStorage(e) {
      if (e.key === 'urbanmate_access_token' || e.key === 'urbanmate_user') {
        const token = localStorage.getItem('urbanmate_access_token');
        const savedUser = localStorage.getItem('urbanmate_user');
        if (!token) {
          setUser(null);
        } else if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch { }
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!user) {
      setProviderRequestsCount(0);
      setCustomerPendingConfirmCount(0);
      return;
    }
    const roles = getUserRoles(user);
    async function checkBadgeCounts() {
      try {
        const bookings = await api.get('/bookings', { page: '1', limit: '100' });
        if (roles.includes('provider')) {
          setProviderRequestsCount(bookings.filter((b) => b.status === 'assigned').length);
        } else if (roles.includes('customer')) {
          setCustomerPendingConfirmCount(bookings.filter((b) => b.status === 'provider_completed').length);
        }
      } catch (_) { }
    }
    checkBadgeCounts();
    const interval = setInterval(checkBadgeCounts, 3500);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    let activeRequest = true;

    async function checkAuth() {
      try {
        let token = getAccessToken();
        if (!token) {
          try {
            token = await refreshAccessToken();
          } catch { }
        }
        if (!token) {
          if (activeRequest) {
            setUser(null);
            localStorage.removeItem('urbanmate_user');
            setBooting(false);
          }
          return;
        }

        const currentUser = await api.get('/auth/me');
        if (!activeRequest) return;
        setUser(currentUser);
        localStorage.setItem('urbanmate_user', JSON.stringify(currentUser));
      } catch {
        if (activeRequest) {
          setAccessToken(null);
          localStorage.removeItem('urbanmate_user');
          setUser(null);
        }
      } finally {
        if (activeRequest) setBooting(false);
      }
    }

    checkAuth();
    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setAccessToken(null);
      localStorage.removeItem('urbanmate_user');
      setUser(null);
    }
    window.addEventListener('urbanmate:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('urbanmate:unauthorized', handleUnauthorized);
  }, []);

  function handleAuthSuccess(nextUser) {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('urbanmate_user', JSON.stringify(nextUser));
    }
    const roles = getUserRoles(nextUser);
    const redirectPath = location.state?.from?.pathname;
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else if (roles.includes('admin')) {
      navigate('/admin/overview', { replace: true });
    } else if (roles.includes('provider')) {
      navigate('/provider/overview', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch (_) { }
    setAccessToken(null);
    localStorage.removeItem('urbanmate_user');
    setUser(null);
    setEmailVerifyOpen(false);
    navigate('/', { replace: true });
  }

  if (booting) {
    return <PageLoader label="Securing your Urbanmate session…" />;
  }

  const commonProps = {
    user,
    cartItems,
    setCartItems,
    onUserUpdate: handleUserUpdate,
    providerRequestsCount,
    customerPendingConfirmCount,
    onLogout: handleLogout,
    onVerifyEmail: () => setEmailVerifyOpen(true)
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<CustomerPage active="home" {...commonProps} />} />
        <Route path="/services" element={<CustomerPage active="services" {...commonProps} />} />
        <Route path="/service/:id" element={<CustomerPage active="service" {...commonProps} />} />
        <Route path="/category/:id" element={<CustomerPage active="category" {...commonProps} />} />
        <Route path="/cart" element={<CustomerPage active="cart" {...commonProps} />} />
        <Route
          path="/bookings"
          element={
            <RequireCustomer user={user}>
              <CustomerPage active="bookings" {...commonProps} />
            </RequireCustomer>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireCustomer user={user}>
              <CustomerPage active="profile" {...commonProps} />
            </RequireCustomer>
          }
        />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute user={user}>
              <AuthRoute mode="login" onAuthSuccess={handleAuthSuccess} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute user={user}>
              <AuthRoute mode="register" onAuthSuccess={handleAuthSuccess} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register/:role"
          element={
            <PublicOnlyRoute user={user}>
              <AuthRoute mode="register" onAuthSuccess={handleAuthSuccess} />
            </PublicOnlyRoute>
          }
        />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute user={user}>
              <AuthRoute mode="forgot" onAuthSuccess={handleAuthSuccess} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute user={user}>
              <AuthRoute mode="reset" onAuthSuccess={handleAuthSuccess} />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/provider"
          element={
            <RequireProvider user={user}>
              <Navigate to="/provider/overview" replace />
            </RequireProvider>
          }
        />
        <Route
          path="/provider/:tab"
          element={
            <RequireProvider user={user}>
              <ProviderPage {...commonProps} />
            </RequireProvider>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin user={user}>
              <Navigate to="/admin/overview" replace />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/:tab"
          element={
            <RequireAdmin user={user}>
              <AdminPage {...commonProps} />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Modal open={emailVerifyOpen} onClose={() => setEmailVerifyOpen(false)} title="Verify your email">
        {user && <EmailVerification user={user} onVerified={setUser} />}
      </Modal>
    </>
  );
}

export default App;
