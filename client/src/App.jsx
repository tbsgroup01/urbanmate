import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
  Shield,
  Sparkles,
  UserRound,
  Users,
  Wallet
} from 'lucide-react';
import AuthDialog from './components/AuthDialog';
import EmailVerification from './components/EmailVerification';
import {
  Brand,
  Button,
  Modal,
  PageLoader,
  initials
} from './components/ui';
import { api, getAccessToken, getErrorMessage, setAccessToken } from './lib/api';
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
      { id: 'addresses', label: 'My addresses', icon: MapPin },
      { id: 'profile', label: 'Profile', icon: UserRound }
    ]
  },
  provider: {
    title: 'Provider workspace',
    subtitle: 'Your jobs, schedule, and business — all in one place.',
    nav: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
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
      { id: 'services', label: 'Services', icon: PackageSearch },
      { id: 'bookings', label: 'Bookings', icon: CalendarDays },
      { id: 'finance', label: 'Payments & reports', icon: ChartNoAxesCombined }
    ]
  }
};

function getUserRoles(user) {
  return user?.roles?.map((role) => role.name) || [];
}

function getPasswordResetToken() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

function PortalNav({ portal, active, onChange, mobile = false }) {
  return (
    <nav className={mobile ? 'grid grid-cols-4 gap-1' : 'space-y-1'}>
      {portalConfig[portal].nav.map(({ id, label, icon: Icon }) => (
        <button
          type="button"
          key={id}
          onClick={() => onChange(id)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            active === id
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          } ${mobile ? 'flex-col gap-1 px-1 py-2 text-[10px]' : ''}`}
        >
          <Icon size={18} strokeWidth={active === id ? 2.4 : 1.8} />
          <span className={mobile ? 'max-w-full truncate' : ''}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function AppHeader({ user, portal, openAuth, onLogout, onToggleMenu, onVerifyEmail }) {
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
          <a href="#" onClick={(event) => event.preventDefault()} className="flex items-center gap-3">
            <Brand />
            {user && <span className="hidden border-l border-slate-200 pl-3 text-xs font-semibold text-slate-500 sm:inline">{portal === 'customer' ? 'HOME SERVICES' : portal === 'provider' ? 'PRO PARTNER' : 'ADMIN CONSOLE'}</span>}
          </a>
        </div>

        {!user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => openAuth('provider', 'register')} className="hidden text-sm font-semibold text-slate-600 transition hover:text-emerald-700 sm:block">Become a pro</button>
            <Button size="sm" onClick={() => openAuth('customer')}>Sign in <ArrowUpRight size={15} /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">Hi, {firstName}</p>
              <p className="text-[11px] capitalize text-slate-400">{portal} account</p>
            </div>
            <div className="relative group">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800 ring-2 ring-white" aria-label="Account menu">
                {initials(user.fullName)}
              </button>
              <div className="invisible absolute right-0 top-full z-40 mt-2 w-52 translate-y-1 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-bold text-slate-800">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
                {!user.emailVerified && (
                  <button type="button" onClick={onVerifyEmail} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                    <Shield size={15} /> Verify email
                  </button>
                )}
                <button type="button" onClick={onLogout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
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

function PublicLanding({ openAuth }) {
  const categories = [
    { title: 'Home cleaning', caption: 'A fresh start, every time', icon: '✳', tint: 'bg-lime-100 text-lime-800' },
    { title: 'Plumbing', caption: 'Repairs without the rush', icon: '⌁', tint: 'bg-sky-100 text-sky-800' },
    { title: 'Electrical', caption: 'Safe, skilled, sorted', icon: 'ϟ', tint: 'bg-amber-100 text-amber-800' },
    { title: 'Appliance repair', caption: 'Keep life moving', icon: '⌂', tint: 'bg-violet-100 text-violet-800' }
  ];
  return (
    <main>
      <section className="relative overflow-hidden bg-[#eff5ed]">
        <div className="absolute -right-36 -top-32 h-[540px] w-[540px] rounded-full border border-emerald-900/5" />
        <div className="absolute -right-16 -top-10 h-[400px] w-[400px] rounded-full border border-emerald-900/5" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-14 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3.5 py-2 text-xs font-bold text-emerald-900">
              <Sparkles size={14} /> GOOD HANDS. RIGHT AT HOME.
            </div>
            <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.055em] text-slate-900 sm:text-6xl xl:text-7xl">
              More ease in
              <span className="block font-serif font-medium italic text-emerald-700">everyday living.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Find a trusted local expert for the little fixes and big resets that make your place feel like home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => openAuth('customer')}>Explore services <ArrowUpRight size={17} /></Button>
              <Button variant="secondary" size="lg" onClick={() => openAuth('provider', 'register')}>Join as a professional</Button>
            </div>
            <div className="mt-9 flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex -space-x-2">
                {['A', 'M', 'R', 'S'].map((letter, index) => (
                  <span key={letter} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#eff5ed] text-[10px] font-black text-white ${['bg-emerald-700', 'bg-amber-600', 'bg-slate-700', 'bg-rose-500'][index]}`}>{letter}</span>
                ))}
              </div>
              <span>Local expertise, thoughtfully matched</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute inset-6 rounded-[38%] bg-emerald-200/50 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] bg-[#dce9d5] p-5 sm:p-7">
              <div className="absolute right-8 top-8 h-20 w-20 rounded-full bg-amber-200/80" />
              <div className="relative flex min-h-[330px] items-center justify-center sm:min-h-[390px]">
                <div className="absolute bottom-3 left-[9%] right-[8%] h-5 rounded-full bg-emerald-900/10 blur-md" />
                <div className="relative z-10 grid h-64 w-64 place-items-center rounded-[42%] border border-white/70 bg-gradient-to-br from-white/80 to-emerald-100/70 shadow-[0_35px_80px_-40px_rgba(16,75,48,0.42)] sm:h-72 sm:w-72">
                  <div className="grid h-44 w-44 place-items-center rounded-[36%] bg-white shadow-xl shadow-emerald-900/10 sm:h-52 sm:w-52">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-[30px] bg-emerald-700 text-white sm:h-32 sm:w-32">
                      <Sparkles size={44} strokeWidth={1.5} />
                      <span className="absolute -right-3 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-xl text-amber-900 shadow-md">⌂</span>
                    </div>
                  </div>
                </div>
                <div className="absolute left-1 top-10 rounded-2xl bg-white p-3.5 shadow-lg shadow-emerald-900/10 sm:left-0">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Your home, handled</span>
                  <span className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><span className="text-emerald-600">●</span> Trusted local pros</span>
                </div>
                <div className="absolute bottom-7 right-0 rounded-2xl bg-white p-3.5 shadow-lg shadow-emerald-900/10">
                  <span className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">✦</span> Care in the details</span>
                  <span className="mt-1 block pl-9 text-[11px] text-slate-400">Easy booking. Thoughtful service.</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 left-8 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">The Urbanmate promise</p>
              <p className="mt-1 text-sm font-extrabold text-slate-800">A little less to worry about.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">A good place to start</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Care for every corner.</h2>
          </div>
          <button type="button" onClick={() => openAuth('customer')} className="text-sm font-bold text-emerald-700 hover:text-emerald-900">See all services <span aria-hidden="true">→</span></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              type="button"
              key={category.title}
              onClick={() => openAuth('customer')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5"
            >
              <span className={`mb-7 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${category.tint}`}>{category.icon}</span>
              <span className="block font-extrabold text-slate-900">{category.title}</span>
              <span className="mt-1 block text-sm text-slate-500">{category.caption}</span>
              <span className="mt-5 block text-sm font-bold text-emerald-700 opacity-0 transition group-hover:opacity-100">Explore →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-16 max-w-[1440px] px-5 sm:px-8 lg:px-14">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#163d30] p-7 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">For skilled professionals</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Good work deserves a better platform.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/75">Grow your business, build trusted relationships, and stay in control of your schedule.</p>
          </div>
          <Button variant="secondary" onClick={() => openAuth('provider', 'register')}>Join Urbanmate <ArrowUpRight size={16} /></Button>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [portal, setPortal] = useState('customer');
  const [active, setActive] = useState('home');
  const [booting, setBooting] = useState(Boolean(getAccessToken()));
  const [resetToken, setResetToken] = useState(getPasswordResetToken);
  const [authOpen, setAuthOpen] = useState(() => Boolean(getPasswordResetToken()));
  const [authMode, setAuthMode] = useState(() => getPasswordResetToken() ? 'reset' : 'login');
  const [authRole, setAuthRole] = useState('customer');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) return;
    let activeRequest = true;
    api.get('/auth/me')
      .then((currentUser) => {
        if (!activeRequest) return;
        const roles = getUserRoles(currentUser);
        const currentPortal = roles.includes('admin') ? 'admin' : roles.includes('provider') ? 'provider' : 'customer';
        setUser(currentUser);
        setPortal(currentPortal);
        setActive(portalConfig[currentPortal].nav[0].id);
      })
      .catch(() => {
        setAccessToken(null);
      })
      .finally(() => {
        if (activeRequest) setBooting(false);
      });
    return () => { activeRequest = false; };
  }, []);

  const availablePortals = useMemo(() => getUserRoles(user), [user]);
  function openAuth(role = 'customer', mode = 'login') {
    setAuthRole(role);
    setAuthMode(mode);
    setAuthError('');
    setAuthOpen(true);
  }

  function completePasswordReset() {
    setResetToken('');
    setAuthMode('login');
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
  }

  function onAuthSuccess(nextUser) {
    const roles = getUserRoles(nextUser);
    const nextPortal = roles.includes('admin') ? 'admin' : roles.includes('provider') ? 'provider' : 'customer';
    setUser(nextUser);
    setPortal(nextPortal);
    setActive(portalConfig[nextPortal].nav[0].id);
    setAuthOpen(false);
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
      setPortal('customer');
      setActive('home');
      setEmailVerifyOpen(false);
    }
  }

  const portalContent = portal === 'provider'
    ? <ProviderPortal user={user} active={active} onTabChange={setActive} onUserUpdate={setUser} />
    : portal === 'admin'
      ? <AdminPortal user={user} active={active} onTabChange={setActive} />
      : <CustomerPortal user={user} active={active} onTabChange={setActive} onSignIn={() => openAuth('customer')} onUserUpdate={setUser} />;

  if (booting) return <PageLoader label="Securing your Urbanmate session…" />;

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-900">
      <AppHeader
        user={user}
        portal={portal}
        openAuth={openAuth}
        onLogout={logout}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onVerifyEmail={() => setEmailVerifyOpen(true)}
      />
      {user ? (
        <div className="mx-auto flex max-w-[1440px] gap-7 px-4 sm:px-7 xl:px-10">
          <aside className={`fixed inset-y-[72px] left-0 z-20 w-[260px] border-r border-slate-200 bg-white px-5 py-7 transition-transform lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:translate-x-0 lg:border-0 lg:bg-transparent lg:px-0 ${menuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}>
            <div className="mb-5 px-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">{portal === 'customer' ? 'YOUR SPACE' : portal === 'provider' ? 'PRO WORKSPACE' : 'MANAGE'}</p>
            </div>
            <PortalNav portal={portal} active={active} onChange={(next) => { setActive(next); setMenuOpen(false); }} />
            <div className="mt-8 rounded-2xl bg-emerald-900 p-4 text-white">
              <p className="text-xs font-bold text-emerald-200">{portal === 'provider' ? 'Your next good job' : portal === 'admin' ? 'Marketplace health' : 'Make room for life'}</p>
              <p className="mt-1 text-sm font-bold leading-5">{portal === 'provider' ? 'Your schedule is in your hands.' : portal === 'admin' ? 'A thoughtful service starts with thoughtful operations.' : 'Let a local expert take one thing off your list.'}</p>
              <Sparkles className="mt-4 text-emerald-300" size={18} />
            </div>
            {availablePortals.length > 1 && <div className="mt-6 px-3 text-[11px] text-slate-400">Your account has access to multiple workspaces.</div>}
          </aside>
          <main className="min-w-0 flex-1 pb-24 pt-7 lg:pb-10 lg:pt-9">
            {authError && <p role="alert" className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</p>}
            <div className="mb-7 hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{portalConfig[portal].title}</p>
              <p className="mt-1 text-sm text-slate-500">{portalConfig[portal].subtitle}</p>
            </div>
            {portalContent}
          </main>
        </div>
      ) : <PublicLanding openAuth={openAuth} />}
      {user && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-2 py-1.5 lg:hidden">
          <PortalNav portal={portal} active={active} onChange={setActive} mobile />
        </div>
      )}
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>© {new Date().getFullYear()} Urbanmate. Home, made easier.</span>
          <span className="flex items-center gap-2"><Shield size={13} /> Your account and bookings stay protected.</span>
        </div>
      </footer>
      <Modal open={authOpen} onClose={() => setAuthOpen(false)} title="Your Urbanmate account">
        <AuthDialog
          initialRole={authRole}
          initialMode={authMode}
          resetToken={resetToken}
          onResetComplete={completePasswordReset}
          onSuccess={onAuthSuccess}
        />
      </Modal>
      <Modal open={emailVerifyOpen} onClose={() => setEmailVerifyOpen(false)} title="Verify your email">
        {user && <EmailVerification user={user} onVerified={setUser} />}
      </Modal>
    </div>
  );
}

export default App;
