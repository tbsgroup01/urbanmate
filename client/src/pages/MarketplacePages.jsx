import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  Minus,
  ShieldCheck,
  ShoppingBag,
  Star,
  UserCheck,
  Zap
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageLoader,
  currency
} from '../components/ui';
import { api, getErrorMessage, resolveMediaUrl } from '../lib/api';
import { getDemoService } from '../lib/demoCatalog';

const gradients = [
  'from-violet-100 via-purple-50 to-white text-violet-800',
  'from-amber-100 via-orange-50 to-white text-amber-800',
  'from-sky-100 via-cyan-50 to-white text-sky-800',
  'from-violet-100 via-fuchsia-50 to-white text-violet-800'
];

function getServiceTiers(service, providers = []) {
  const name = (service?.name || '').toLowerCase();
  const catName = (service?.category?.name || '').toLowerCase();
  const basePrice = Number(service?.effectivePrice ?? service?.basePrice ?? 249);

  let royaleTitle = 'Royale';
  let royaleBrands = 'INOA | REPÈCHAGE | O3+';
  let royalePrice = Math.max(449, basePrice);
  let royaleDesc = 'Only top professionals for advanced cuts, beard styling & facials.';
  let royaleImage = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

  let primeTitle = 'Prime';
  let primeBrands = "L'ORÉAL | BOMBAY SHAVING";
  let primePrice = Math.max(249, Math.round(basePrice * 0.75));
  let primeDesc = 'Everyday cuts, color & cleanup.';
  let primeImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
  let primeArrival = 'Arriving in 45 mins';

  if (name.includes('clean') || catName.includes('clean')) {
    royaleTitle = 'Royale Deep Clean';
    royaleBrands = 'TASKI | DIVERSEY | KÄRCHER';
    royalePrice = Math.max(799, basePrice);
    royaleDesc = 'Top-rated 5-star cleaners with heavy-duty mechanized scrubbing and hospital-grade sanitization.';
    royaleImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Standard Clean';
    primeBrands = 'ECO-SHINE | ADVANCED VACUUM';
    primePrice = Math.max(399, Math.round(basePrice * 0.7));
    primeDesc = 'Everyday thorough vacuuming, stain removal, and spotless surface care.';
    primeImage = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Arriving in 35 mins';
  } else if (name.includes('electric') || name.includes('ac') || catName.includes('electric')) {
    royaleTitle = 'Royale Master Tech';
    royaleBrands = 'COPPER-SAFE | 2X FOAM-JET | FLUKE';
    royalePrice = Math.max(599, basePrice);
    royaleDesc = 'Senior certified technicians, deep high-pressure foam jet cleaning, and full circuit diagnosis.';
    royaleImage = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Quick Fix';
    primeBrands = 'HAVELLS | ANCHOR | SCHNEIDER';
    primePrice = Math.max(299, Math.round(basePrice * 0.7));
    primeDesc = 'Prompt wiring repairs, switch replacements, and standard appliance servicing.';
    primeImage = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Arriving in 25 mins';
  } else if (name.includes('plumb') || catName.includes('plumb')) {
    royaleTitle = 'Royale Plumber';
    royaleBrands = 'JAQUAR | KOHLER | GROHE';
    royalePrice = Math.max(499, basePrice);
    royaleDesc = 'Precision leak detection, luxury bath fitting installation, and heavy drain clearing.';
    royaleImage = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80';

    primeTitle = 'Prime Plumber';
    primeBrands = 'ASTRAL | SUPREME | SPEED-FIX';
    primePrice = Math.max(199, Math.round(basePrice * 0.65));
    primeDesc = 'Quick tap repair, blockages, pipe joints, and everyday water fixture service.';
    primeImage = 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=400&q=80';
    primeArrival = 'Arriving in 30 mins';
  }

  const defaultRoyalePro = providers[0] || null;
  const defaultPrimePro = providers[1] || providers[0] || null;

  return [
    {
      id: defaultRoyalePro ? defaultRoyalePro.id : 'royale-tier',
      tier: 'Royale',
      badge: '✪ Top rated pros',
      title: royaleTitle,
      brands: royaleBrands,
      startsAt: royalePrice,
      description: royaleDesc,
      image: royaleImage,
      providerId: defaultRoyalePro?.id || null
    },
    {
      id: defaultPrimePro ? defaultPrimePro.id : 'prime-tier',
      tier: 'Prime',
      badge: null,
      arrival: primeArrival,
      title: primeTitle,
      brands: primeBrands,
      startsAt: primePrice,
      description: primeDesc,
      image: primeImage,
      providerId: defaultPrimePro?.id || null
    }
  ];
}

export function ServiceDetails({ serviceId, cartItem, onBack, onAddToCart }) {
  const [service, setService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [packageId, setPackageId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(
    cartItem?.providerId ? { id: cartItem.providerId, name: cartItem.providerName, tier: cartItem.providerTier || 'Verified' } : null
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    async function load() {
      try {
        let serviceData;
        try {
          serviceData = await api.get(`/catalog/services/${serviceId}`);
        } catch {
          serviceData = getDemoService(serviceId);
        }

        if (!active) return;
        setService(serviceData);
        setDemoMode(Boolean(serviceData?.isDemo));

        const savedPackage = serviceData?.packages?.find((item) => item.id === cartItem?.packageId);
        setPackageId(savedPackage?.id || serviceData?.packages?.[0]?.id || '');
        setAddonIds((cartItem?.addonIds || []).filter((id) => serviceData?.addons?.some((addon) => addon.id === id)));

        // Fetch verified providers for this service
        let provs = [];
        try {
          const res = await api.get('/providers', { limit: '20', ...(serviceData?.id ? { serviceId: serviceData.id } : {}) });
          provs = Array.isArray(res) ? res : (res?.items || []);
        } catch {
          provs = [];
        }

        if (!provs.length) {
          try {
            const allRes = await api.get('/providers', { limit: '10' });
            provs = Array.isArray(allRes) ? allRes : (allRes?.items || []);
          } catch {
            provs = [];
          }
        }

        if (!active) return;
        setProviders(provs);
      } catch (requestError) {
        if (!active) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [serviceId, cartItem, reloadKey]);

  const tiers = useMemo(() => {
    return getServiceTiers(service, providers);
  }, [service, providers]);

  if (loading) return <PageLoader label="Loading service and provider options…" />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />;
  if (!service) return <EmptyState title="Service not found" description="This service may no longer be available." action={<Button onClick={onBack}>Back to services</Button>} />;

  const selectedPackage = service.packages?.find((item) => item.id === packageId);
  const selectedAddons = service.addons?.filter((item) => addonIds.includes(item.id)) || [];
  const basePrice = selectedPackage ? Number(selectedPackage.price) : Number(service.effectivePrice ?? service.basePrice ?? 0);
  const addonTotal = selectedAddons.reduce((sum, item) => sum + Number(item.price), 0);
  const total = basePrice + addonTotal;
  const heroImage = service.images?.[0]?.imageUrl;

  function addToCart() {
    if (!selectedProvider) return;

    onAddToCart({
      serviceId: service.id,
      name: service.name,
      categoryName: service.category?.name || 'Home service',
      description: service.shortDescription || service.description || '',
      currency: service.currency || 'INR',
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      providerTier: selectedProvider.tier,
      providerAvatar: selectedProvider.image || selectedProvider.avatarUrl,
      packageId: selectedPackage?.id || '',
      packageName: selectedPackage?.name || 'Standard service',
      packagePrice: basePrice,
      addonIds,
      addonNames: selectedAddons.map((item) => item.name),
      addonPrice: addonTotal,
      total,
      isDemo: Boolean(service.isDemo)
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-2 sm:px-4 pb-20">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 transition hover:text-violet-700"
      >
        <ArrowLeft size={16} /> Back to services
      </button>

      {demoMode && (
        <p role="status" className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
          Sample service preview. Live availability and booking require the catalog service to be online.
        </p>
      )}

      {/* Service Banner Top Card */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs border border-slate-100">
            {heroImage ? (
              <img src={heroImage} alt={service.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-violet-100 text-violet-700 font-bold">
                {service.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <Badge tone="violet" className="absolute top-2 left-2 z-10 text-[9px]">
              {service.category?.name || 'Service'}
            </Badge>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {service.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 line-clamp-2">
              {service.description || service.shortDescription || 'Professional home service delivered right at your doorstep.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                <Clock3 size={13} className="text-violet-700" /> About {service.durationMinutes || 45} mins
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                <Star size={13} className="fill-amber-400 text-amber-400" /> 4.85 (Vetted)
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                Starting at {currency(basePrice, service.currency || 'INR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Select your preference */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-xs">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Select your preference
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Choose a verified provider or preference tier. <span className="font-bold text-rose-600">You must select a provider before adding to cart.</span>
        </p>

        <div className="my-6 border-b border-slate-200" />

        {/* Preferences / Providers List */}
        <div className="space-y-6">
          {tiers.map((tier) => {
            const isSelected = selectedProvider?.tier === tier.tier;
            return (
              <div key={tier.tier}>
                <div
                  onClick={() => setSelectedProvider({ id: tier.id, name: tier.title, tier: tier.tier, image: tier.image })}
                  className={`group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-3 rounded-2xl cursor-pointer transition select-none ${
                    isSelected ? 'bg-violet-50/70 ring-2 ring-violet-600' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs">
                    <img
                      src={tier.image}
                      alt={tier.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {tier.badge && (
                      <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-[#b87333] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-violet-700 transition">
                          {tier.title}
                        </h3>
                        {isSelected && (
                          <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${
                        isSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 group-hover:border-violet-500'
                      }`}>
                        {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="text-slate-400" />}
                      </span>
                    </div>

                    {tier.arrival && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                        <Zap size={13} className="fill-violet-600 text-violet-600" />
                        <span>{tier.arrival}</span>
                      </div>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {tier.brands.split('|').map((brand, i, arr) => (
                        <span key={brand.trim()} className="flex items-center gap-2">
                          <span>{brand.trim()}</span>
                          {i < arr.length - 1 && <span className="text-slate-300">|</span>}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-700">
                      Starts at {currency(tier.startsAt, 'INR')}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>
                </div>
                <div className="my-5 border-b border-slate-150" />
              </div>
            );
          })}

          {/* Real Platform Providers */}
          {providers.length > 0 && (
            <div className="pt-2">
              <div className="mb-3 flex items-center gap-2">
                <BadgeCheck size={16} className="text-violet-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verified Independent Professionals ({providers.length})
                </span>
              </div>
              <div className="space-y-4">
                {providers.map((pro) => {
                  const isSelected = selectedProvider?.id === pro.id;
                  return (
                    <div
                      key={pro.id}
                      onClick={() => setSelectedProvider({ id: pro.id, name: pro.displayName, tier: 'Verified Pro', image: pro.avatarUrl })}
                      className={`group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-3 rounded-2xl cursor-pointer transition select-none ${
                        isSelected ? 'bg-violet-50/70 ring-2 ring-violet-600' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-xs border border-slate-200">
                        {pro.avatarUrl ? (
                          <img
                            src={resolveMediaUrl(pro.avatarUrl)}
                            alt={pro.displayName}
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
                          style={{ display: pro.avatarUrl ? 'none' : 'grid' }}
                          className="h-full w-full place-items-center bg-violet-100 text-lg font-black text-violet-800"
                        >
                          {pro.displayName?.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                        </div>
                        <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-violet-700 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          ✓ Verified
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-violet-800 transition">
                              {pro.displayName}
                            </h3>
                            {isSelected && (
                              <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                          <span className={`grid h-6 w-6 place-items-center rounded-full border transition ${
                            isSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 group-hover:border-violet-500'
                          }`}>
                            {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="text-slate-400" />}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>{pro.professionalTitle || 'Service Professional'}</span>
                          {pro.experienceYears > 0 && <span>· {pro.experienceYears} yrs experience</span>}
                          <span className="text-violet-700 font-bold">· 100% On-time</span>
                        </div>

                        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-700">
                          Starts at {currency(basePrice, 'INR')}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                          {pro.bio || 'Verified platform professional ready for doorstep home service.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Packages (if any) */}
        {service.packages?.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-base font-extrabold text-slate-900">Choose package</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {service.packages.map((pkg) => (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => setPackageId(pkg.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    packageId === pkg.id ? 'border-violet-600 bg-violet-50/70 ring-2 ring-violet-600/10' : 'border-slate-200 bg-white hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900">{pkg.name}</h4>
                      <p className="mt-1 text-xs text-slate-500">{pkg.durationMinutes} mins</p>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">{currency(pkg.price, 'INR')}</span>
                  </div>
                  {pkg.description && <p className="mt-2 text-xs text-slate-500">{pkg.description}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Addons (if any) */}
        {service.addons?.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-base font-extrabold text-slate-900">Optional add-ons</h3>
            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
              {service.addons.map((addon) => {
                const selected = addonIds.includes(addon.id);
                return (
                  <button
                    type="button"
                    key={addon.id}
                    onClick={() => setAddonIds((current) => selected ? current.filter((id) => id !== addon.id) : [...current, addon.id])}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                      selected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 text-transparent'
                    }`}>
                      <Check size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800">{addon.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">+{currency(addon.price, service.currency)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mandatory Provider Check & Add to Cart Action */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          {!selectedProvider ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
                <span className="text-lg">⚠️</span>
                <span>Please select a provider above before adding this service to your cart. Without selecting a provider, services cannot be added.</span>
              </div>
              <Button disabled className="w-full py-3.5 text-sm font-bold opacity-50 cursor-not-allowed">
                Select a provider above to add to cart
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-900">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={15} className="text-violet-700" />
                  Selected pro: <strong>{selectedProvider.name}</strong> ({selectedProvider.tier})
                </span>
                <span className="text-violet-700 font-extrabold">{currency(total, service.currency || 'INR')}</span>
              </div>
              <Button
                className="w-full bg-violet-700 hover:bg-violet-800 py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
                onClick={addToCart}
              >
                <ShoppingBag size={18} />
                Add to cart with {selectedProvider.name} · {currency(total, service.currency || 'INR')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CartPage({ items, onRemove, onCheckout, onContinue }) {
  const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  if (!items.length) {
    return <EmptyState icon={ShoppingBag} title="Your cart is taking a breather" description="Explore home services and add the help you need. Your selections will be waiting here." action={<Button onClick={onContinue}>Explore services <ArrowRight size={15} /></Button>} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">Your picks</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Your cart</h1><p className="mt-1 text-sm text-slate-500">{items.length} {items.length === 1 ? 'service' : 'services'} ready when you are.</p></div>
        <button type="button" onClick={onContinue} className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900"><ArrowLeft size={15} /> Keep exploring</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_350px]">
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.serviceId} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradients[item.name.length % gradients.length]}`}><ShoppingBag size={24} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{item.categoryName}</p>{item.isDemo && <Badge tone="blue">Sample</Badge>}</div>
                  <h2 className="mt-1 text-base font-extrabold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.packageName || 'Standard service'}{item.addonNames?.length ? ` · ${item.addonNames.join(', ')}` : ''}</p>
                  {item.providerName && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800 border border-violet-200">
                      <UserCheck size={13} className="text-violet-700" />
                      <span>Provider: <strong>{item.providerName}</strong> ({item.providerTier || 'Verified'})</span>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-base text-slate-900">{currency(item.total, 'INR')}</strong>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onCheckout(item)}>Continue to details <ArrowRight size={14} /></Button>
                      <button type="button" aria-label={`Remove ${item.name} from cart`} onClick={() => onRemove(item.serviceId)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Minus size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="h-fit p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-slate-900">Order summary</h2>
          <div className="my-4 space-y-3 border-y border-slate-100 py-4 text-sm">
            <div className="flex justify-between gap-3 text-slate-500"><span>Services ({items.length})</span><span>{currency(total, items[0]?.currency)}</span></div>
            <div className="flex justify-between gap-3 text-slate-500"><span>Taxes and fees</span><span>Calculated at booking</span></div>
            <div className="flex justify-between gap-3 pt-1"><strong className="text-slate-800">Estimated total</strong><strong className="text-lg text-slate-900">{currency(total, items[0]?.currency)}</strong></div>
          </div>
          <Button className="w-full" onClick={() => onCheckout(items[0])}>Continue to checkout <ArrowRight size={15} /></Button>
          <p className="mt-3 text-center text-xs leading-5 text-slate-400">Each service is scheduled and confirmed separately.</p>
        </Card>
      </div>
    </div>
  );
}
