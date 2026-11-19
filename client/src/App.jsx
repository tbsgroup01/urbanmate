import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
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
import { api, getAccessToken, getErrorMessage, refreshAccessToken, setAccessToken } from './lib/api';
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
    title: 'Provider workspace',
    subtitle: 'Your jobs, schedule, and business — all in one place.',
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
    title: 'Operations console',
    subtitle: 'A clear view of your marketplace operations.',
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

function getPasswordResetToken() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

function getSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('urbanmate_cart') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function resolveRouteFromPath(pathname, userRoles = []) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const parts = clean.split('/').filter(Boolean);

  if (parts[0] === 'login') {
    return { portal: 'auth', active: 'login' };
  }
  if (parts[0] === 'register' || parts[0] === 'signup') {
    return { portal: 'auth', active: 'register', param: parts[1] || '' };
  }
  if (parts[0] === 'forgot-password' || parts[0] === 'forgot') {
    return { portal: 'auth', active: 'forgot' };
  }
  if (parts[0] === 'reset-password' || parts[0] === 'reset') {
    return { portal: 'auth', active: 'reset' };
  }

  if (parts[0] === 'admin') {
    const validAdminTabs = ['overview', 'providers', 'customers', 'categories', 'services', 'bookings', 'finance', 'settings'];
    const tab = validAdminTabs.includes(parts[1]) ? parts[1] : 'overview';
    return { portal: 'admin', active: tab };
  }
  if (parts[0] === 'provider') {
    const validProviderTabs = ['overview', 'services', 'requests', 'active', 'history', 'availability', 'earnings', 'profile'];
    const tab = validProviderTabs.includes(parts[1]) ? parts[1] : 'overview';
    return { portal: 'provider', active: tab };
  }
  if (parts[0] === 'service') {
    return { portal: 'customer', active: 'service', param: parts[1] || '' };
  }
  if (parts[0] === 'category') {
    return { portal: 'customer', active: 'category', param: parts[1] || '' };
  }
  if (parts[0] === 'services') return { portal: 'customer', active: 'services' };
  if (parts[0] === 'bookings') return { portal: 'customer', active: 'bookings' };
  if (parts[0] === 'cart') return { portal: 'customer', active: 'cart' };
  if (parts[0] === 'profile') return { portal: 'customer', active: 'profile' };

  if (userRoles.includes('admin')) return { portal: 'admin', active: 'overview' };
  if (userRoles.includes('provider')) return { portal: 'provider', active: 'overview' };
  return { portal: 'customer', active: 'home' };
}

function getPathForRoute(portalName, activeTab, param = '') {
  if (portalName === 'auth') {
    if (activeTab === 'login') return '/login';
    if (activeTab === 'register') return param ? `/register/${param}` : '/register';
    if (activeTab === 'forgot') return '/forgot-password';
    if (activeTab === 'reset') return '/reset-password';
    return '/login';
  }
  if (portalName === 'admin') {
    return activeTab === 'overview' ? '/admin' : `/admin/${activeTab}`;
  }
  if (portalName === 'provider') {
    return activeTab === 'overview' ? '/provider' : `/provider/${activeTab}`;
  }
  if (activeTab === 'service') {
    return param ? `/service/${param}` : '/services';
  }
  if (activeTab === 'category') {
    return param ? `/category/${param}` : '/services';
  }
  return activeTab === 'home' ? '/' : `/${activeTab}`;
}

function PortalNav({ portal, active, onChange, mobile = false, providerRequestsCount = 0, customerPendingConfirmCount = 0 }) {
  return (
    <nav className={mobile ? 'grid grid-cols-4 gap-1' : 'space-y-1'}>
      {portalConfig[portal].nav.map(({ id, label, icon: Icon }) => {
        const hasProviderBadge = portal === 'provider' && id === 'requests' && providerRequestsCount > 0;
        const hasCustomerBadge = portal === 'customer' && id === 'bookings' && customerPendingConfirmCount > 0;
        const badgeCount = hasProviderBadge ? providerRequestsCount : hasCustomerBadge ? customerPendingConfirmCount : 0;
        const badgeColor = hasCustomerBadge ? 'bg-amber-600' : 'bg-rose-600';

        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active === id
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${mobile ? 'flex-col gap-1 px-1 py-2 text-[10px]' : ''}`}
          >
            <div className="relative">
              <Icon size={18} strokeWidth={active === id ? 2.4 : 1.8} />
              {mobile && badgeCount > 0 && (
                <span className={`absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full ${badgeColor} text-[9px] font-black text-white animate-pulse`}>
                  {badgeCount}
                </span>
              )}
            </div>
            <span className={mobile ? 'max-w-full truncate' : ''}>{label}</span>
            {!mobile && badgeCount > 0 && (
              <span className={`ml-auto inline-flex items-center rounded-full ${badgeColor} px-2 py-0.5 text-[11px] font-black text-white shadow-xs animate-pulse`}>
                {badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function AppHeader({ user, portal, active, openAuth, onLogout, onToggleMenu, onVerifyEmail, onNavigate, cartCount }) {
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/75 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-5 px-4 sm:px-7 xl:px-10">
        <div className="flex items-center gap-3">
          {user && (
            <button type="button" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onToggleMenu} aria-label="Toggle navigation">
              <Menu size={19} />
            </button>
          )}
          <button type="button" onClick={() => onNavigate('home')} className="flex items-center gap-3 text-left">
            <Brand />
            {user && <span className="hidden border-l border-slate-200 pl-3 text-xs font-semibold text-slate-500 sm:inline">{portal === 'customer' ? 'HOME SERVICES' : portal === 'provider' ? 'PRO PARTNER' : 'ADMIN CONSOLE'}</span>}
          </button>
        </div>

        {!user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="mr-3 hidden items-center gap-1 md:flex" aria-label="Main navigation">
              <button type="button" onClick={() => onNavigate('home')} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${active === 'home' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}>Home</button>
              <button type="button" onClick={() => onNavigate('services')} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === 'services' ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-800'}`}>Services</button>
              <button type="button" onClick={() => openAuth('provider', 'register')} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-800">Become a partner</button>
            </nav>
            <button type="button" onClick={() => onNavigate('cart')} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800" aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
            </button>
            <Button size="sm" className="bg-violet-700 hover:bg-violet-800" onClick={() => openAuth('customer')}>Login / Sign up <ArrowUpRight size={15} /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4">
            {portal === 'customer' && <button type="button" onClick={() => onNavigate('cart')} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800" aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}>
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
            </button>}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">Hi, {firstName}</p>
              <p className="text-[11px] capitalize text-slate-400">{portal} account</p>
            </div>
            <div className="relative group">
              <button type="button" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800 ring-2 ring-white" aria-label="Account menu">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  initials(user.fullName)
                )}
              </button>
              <div className="invisible absolute right-0 top-full z-40 mt-2 w-52 translate-y-1 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-bold text-slate-800">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
                <button type="button" onClick={() => onNavigate('profile')} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <UserRound size={15} className="text-emerald-700" /> Your Profile
                </button>
                <button type="button" onClick={() => onNavigate('bookings')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <CalendarDays size={15} className="text-emerald-700" /> My Bookings
                </button>
                {!user.emailVerified && (
                  <button type="button" onClick={onVerifyEmail} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                    <Shield size={15} /> Verify email
                  </button>
                )}
                <button type="button" onClick={onLogout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header >
  );
}

function App() {
  const initialRoute = resolveRouteFromPath(window.location.pathname);
  const [user, setUser] = useState(null);
  const [portal, setPortal] = useState(initialRoute.portal);
  const [active, setActive] = useState(initialRoute.active);
  const [categoryParam, setCategoryParam] = useState(initialRoute.param || '');
  const [booting, setBooting] = useState(true);
  const [resetToken, setResetToken] = useState(getPasswordResetToken);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [cartItems, setCartItems] = useState(getSavedCart);
  const [providerRequestsCount, setProviderRequestsCount] = useState(0);
  const [customerPendingConfirmCount, setCustomerPendingConfirmCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('urbanmate_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!user) {
      setProviderRequestsCount(0);
      setCustomerPendingConfirmCount(0);
      return;
    }
    async function checkBadgeCounts() {
      try {
        const bookings = await api.get('/bookings', { page: '1', limit: '100' });
        if (portal === 'provider') {
          setProviderRequestsCount(bookings.filter((b) => b.status === 'assigned').length);
        } else if (portal === 'customer') {
          setCustomerPendingConfirmCount(bookings.filter((b) => b.status === 'provider_completed').length);
        }
      } catch (_) {}
    }
    checkBadgeCounts();
    const interval = setInterval(checkBadgeCounts, 3500);
    return () => clearInterval(interval);
  }, [user, portal]);

  function navigateTo(nextPortal, nextTab, replace = false, nextParam = '') {
    const targetPath = getPathForRoute(nextPortal, nextTab, nextParam);
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ portal: nextPortal, active: nextTab, param: nextParam }, '', targetPath);
      } else {
        window.history.pushState({ portal: nextPortal, active: nextTab, param: nextParam }, '', targetPath);
      }
    }
    setPortal(nextPortal);
    setActive(nextTab);
    setCategoryParam(nextParam);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    function handlePopState() {
      const roles = getUserRoles(user);
      const route = resolveRouteFromPath(window.location.pathname, roles);
      if (user && route.portal === 'auth') {
        const defaultPortal = roles.includes('admin') ? 'admin' : roles.includes('provider') ? 'provider' : 'customer';
        const defaultTab = portalConfig[defaultPortal].nav[0].id;
        navigateTo(defaultPortal, defaultTab, true);
        return;
      }
      setPortal(route.portal);
      setActive(route.active);
      setCategoryParam(route.param || '');
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  useEffect(() => {
    api.get('/settings/public')
      .then((settings) => {
        if (!settings) return;
        if (settings.siteTitle) {
          document.title = settings.siteTitle;
        } else if (settings.siteName) {
          document.title = settings.siteName;
        }

        if (settings.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.faviconUrl;
        }

        if (settings.metaDescription) {
          let meta = document.querySelector("meta[name='description']");
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
          }
          meta.content = settings.metaDescription;
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    api.get('/settings/public')
      .then((settings) => {
        if (!settings) return;
        if (settings.siteTitle) {
          document.title = settings.siteTitle;
        } else if (settings.siteName) {
          document.title = settings.siteName;
        }

        if (settings.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.faviconUrl;
        }

        if (settings.metaDescription) {
          let meta = document.querySelector("meta[name='description']");
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
          }
          meta.content = settings.metaDescription;
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let activeRequest = true;

    async function checkAuth() {
      try {
        let token = getAccessToken();
        if (!token) {
          try {
            token = await refreshAccessToken();
          } catch {

          }
        }
        if (!token) {
          if (activeRequest) setBooting(false);
          return;
        }

        const currentUser = await api.get('/auth/me');
        if (!activeRequest) return;
        const roles = getUserRoles(currentUser);
        const route = resolveRouteFromPath(window.location.pathname, roles);
        setUser(currentUser);

        let targetPortal = route.portal;
        let targetActive = route.active;
        let targetParam = route.param || '';

        if (targetPortal === 'auth') {
          targetPortal = roles.includes('admin') ? 'admin' : roles.includes('provider') ? 'provider' : 'customer';
          targetActive = portalConfig[targetPortal].nav[0].id;
          targetParam = '';
        }

        setPortal(targetPortal);
        setActive(targetActive);
        setCategoryParam(targetParam);

        const targetPath = getPathForRoute(targetPortal, targetActive, targetParam);
        if (window.location.pathname !== targetPath) {
          window.history.replaceState({ portal: targetPortal, active: targetActive, param: targetParam }, '', targetPath);
        }
      } catch {
        if (activeRequest) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (activeRequest) setBooting(false);
      }
    }

    checkAuth();
    return () => { activeRequest = false; };
  }, []);

  const availablePortals = useMemo(() => getUserRoles(user), [user]);
  function navigateCustomer(section) {
    navigateTo('customer', section);
    if (!user) {
      const target = section === 'services' ? 'customer-services' : section === 'home' ? 'customer-home' : 'customer-page';
      window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  function openAuth(role = 'customer', mode = 'login') {
    navigateTo('auth', mode === 'register' ? 'register' : 'login', false, role === 'provider' ? 'provider' : '');
  }

  function completePasswordReset() {
    setResetToken('');
    navigateTo('auth', 'login', true);
  }

  function onAuthSuccess(nextUser) {
    const roles = getUserRoles(nextUser);
    const nextPortal = roles.includes('admin') ? 'admin' : roles.includes('provider') ? 'provider' : 'customer';
    const defaultTab = portalConfig[nextPortal].nav[0].id;
    setUser(nextUser);
    navigateTo(nextPortal, defaultTab, true);
    setAuthError('');
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setAccessToken(null);
      setUser(null);
      navigateTo('customer', 'home', true);
      setEmailVerifyOpen(false);
    }
  }

  const portalContent = portal === 'provider'
    ? <ProviderPortal user={user} active={active} onTabChange={(tab) => navigateTo('provider', tab)} onUserUpdate={setUser} />
    : portal === 'admin'
      ? <AdminPortal user={user} active={active} onTabChange={(tab) => navigateTo('admin', tab)} />
      : <CustomerPortal
        user={user}
        active={active}
        categoryParam={categoryParam}
        serviceParam={active === 'service' ? categoryParam : ''}
        onTabChange={(tab, param = '') => navigateTo('customer', tab, false, param)}
        onSignIn={() => openAuth('customer')}
        onUserUpdate={setUser}
        cartItems={cartItems}
        onAddToCart={(item) => setCartItems((current) => [...current.filter((entry) => entry.serviceId !== item.serviceId), item])}
        onRemoveFromCart={(serviceId) => setCartItems((current) => current.filter((entry) => entry.serviceId !== serviceId))}
        onBecomePartner={() => openAuth('provider', 'register')}
      />;

  if (booting) return <PageLoader label="Securing your Urbanmate session…" />;

  if (portal === 'auth' && !user) {
    return (
      <AuthPage
        initialMode={active === 'register' ? 'register' : active === 'forgot' ? 'forgot' : active === 'reset' ? 'reset' : 'login'}
        initialRole={categoryParam === 'provider' ? 'provider' : 'customer'}
        resetToken={resetToken}
        onResetComplete={completePasswordReset}
        onSuccess={onAuthSuccess}
        onNavigateHome={() => navigateTo('customer', 'home')}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8f6] text-slate-900">
      <AppHeader
        user={user}
        portal={portal}
        active={active}
        openAuth={openAuth}
        onLogout={logout}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onVerifyEmail={() => setEmailVerifyOpen(true)}
        onNavigate={navigateCustomer}
        cartCount={cartItems.length}
      />
      {user ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-7 px-4 sm:px-7 xl:px-10">
          <aside className={`fixed inset-y-[72px] left-0 z-20 w-[260px] border-r border-slate-200 bg-white px-5 py-7 transition-transform lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:translate-x-0 lg:border-0 lg:bg-transparent lg:px-0 ${menuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}>
            <div className="mb-5 px-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">{portal === 'customer' ? 'YOUR SPACE' : portal === 'provider' ? 'PRO WORKSPACE' : 'MANAGE'}</p>
            </div>
            <PortalNav
              portal={portal}
              active={active}
              onChange={(next) => { navigateTo(portal, next); setMenuOpen(false); }}
              providerRequestsCount={providerRequestsCount}
              customerPendingConfirmCount={customerPendingConfirmCount}
            />
            <div className="mt-8 rounded-2xl bg-emerald-900 p-4 text-white">
              <p className="text-xs font-bold text-emerald-200">{portal === 'provider' ? 'Your next good job' : portal === 'admin' ? 'Marketplace health' : 'Make room for life'}</p>
              <p className="mt-1 text-sm font-bold leading-5">{portal === 'provider' ? 'Your schedule is in your hands.' : portal === 'admin' ? 'A thoughtful service starts with thoughtful operations.' : 'Let a local expert take one thing off your list.'}</p>
              <Sparkles className="mt-4 text-emerald-300" size={18} />
            </div>
            {availablePortals.length > 1 && <div className="mt-6 px-3 text-[11px] text-slate-400">Your account has access to multiple workspaces.</div>}
          </aside>
          <main className="min-w-0 flex-1 pb-24 pt-7 lg:pb-10 lg:pt-9">
            {authError && <p role="alert" className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</p>}
            {portal !== 'customer' && (
              <div className="mb-7 hidden sm:block">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{portalConfig[portal].title}</p>
                <p className="mt-1 text-sm text-slate-500">{portalConfig[portal].subtitle}</p>
              </div>
            )}
            {portalContent}
          </main>
        </div>
      ) : (
        <main id="customer-page" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-14 pt-5 sm:px-7 lg:px-10">
          <CustomerPortal
            user={null}
            active={active}
            categoryParam={categoryParam}
            serviceParam={active === 'service' ? categoryParam : ''}
            onTabChange={(tab, param = '') => navigateTo('customer', tab, false, param)}
            onSignIn={() => openAuth('customer')}
            onUserUpdate={setUser}
            cartItems={cartItems}
            onAddToCart={(item) => setCartItems((current) => [...current.filter((entry) => entry.serviceId !== item.serviceId), item])}
            onRemoveFromCart={(serviceId) => setCartItems((current) => current.filter((entry) => entry.serviceId !== serviceId))}
            onBecomePartner={() => openAuth('provider', 'register')}
          />
        </main>
      )}
      {user && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-2 py-1.5 lg:hidden">
          <PortalNav
            portal={portal}
            active={active}
            onChange={(next) => navigateTo(portal, next)}
            mobile
            providerRequestsCount={providerRequestsCount}
            customerPendingConfirmCount={customerPendingConfirmCount}
          />
        </div>
      )}
      {portal !== 'admin' && (
        <footer className="bg-[#1d123d] px-5 py-9 text-violet-100 sm:px-8">
          <div className="mx-auto grid max-w-[1360px] gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
            <div>
              <div className="flex items-center gap-3"><Brand dark /><span className="text-[10px] font-semibold text-violet-200">Home services, simplified.</span></div>
              <p className="mt-4 max-w-xs text-xs leading-5 text-violet-200/75">A thoughtful way to find local help for cleaning, repairs, and the little things that make a place feel like home.</p>
              <div className="mt-4 flex items-center gap-2 text-violet-200/80"><Shield size={14} /><span className="text-[10px]">Your account and bookings stay protected.</span></div>
            </div>
            {(!user || portal === 'customer') ? (
              <div>
                <h2 className="text-xs font-extrabold text-white">Explore</h2>
                <div className="mt-3 space-y-2">
                  <button type="button" onClick={() => navigateCustomer('home')} className="block text-left text-xs text-violet-200/75 transition hover:text-white">Home</button>
                  <button type="button" onClick={() => navigateCustomer('services')} className="block text-left text-xs text-violet-200/75 transition hover:text-white">Services</button>
                  {user && <button type="button" onClick={() => navigateCustomer('bookings')} className="block text-left text-xs text-violet-200/75 transition hover:text-white">My bookings</button>}
                </div>
              </div>
            ) : <div><h2 className="text-xs font-extrabold text-white">Your workspace</h2><p className="mt-3 text-xs leading-5 text-violet-200/75">Manage your services and bookings from your account workspace.</p></div>}
            <div>
              <h2 className="text-xs font-extrabold text-white">For professionals</h2>
              <p className="mt-3 text-xs leading-5 text-violet-200/75">Grow your local service business with Urbanmate.</p>
              {!user && <button type="button" onClick={() => openAuth('provider', 'register')} className="mt-3 text-xs font-bold text-black transition hover:text-fuchsia-200">Become a partner <ArrowUpRight size={13} className="ml-1 inline" /></button>}
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white">Need help?</h2>
              <p className="mt-3 text-xs leading-5 text-violet-200/75">For help with an upcoming visit, check your booking details or contact your service professional.</p>
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-[1360px] flex-col justify-between gap-2 border-t border-white/10 pt-4 text-[10px] text-violet-200/65 sm:flex-row">
            <span>© {new Date().getFullYear()} Urbanmate. Home, made easier.</span>
            <span>Thoughtful local service, right at home.</span>
          </div>
        </footer>
      )}

      <Modal open={emailVerifyOpen} onClose={() => setEmailVerifyOpen(false)} title="Verify your email">
        {user && <EmailVerification user={user} onVerified={setUser} />}
      </Modal>
    </div>
  );
}

export default App;
