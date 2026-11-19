import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Minus,
  ShieldCheck,
  ShoppingBag,
  Star
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
import { api, getErrorMessage } from '../lib/api';
import { getDemoService } from '../lib/demoCatalog';

const gradients = [
  'from-emerald-100 via-lime-50 to-white text-emerald-800',
  'from-amber-100 via-orange-50 to-white text-amber-800',
  'from-sky-100 via-cyan-50 to-white text-sky-800',
  'from-violet-100 via-fuchsia-50 to-white text-violet-800'
];

export function ServiceDetails({ serviceId, cartItem, onBack, onAddToCart }) {
  const [service, setService] = useState(null);
  const [packageId, setPackageId] = useState('');
  const [addonIds, setAddonIds] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/catalog/services/${serviceId}`)
      .then((result) => {
        if (!active) return;
        const serviceData = result || getDemoService(serviceId);
        setService(serviceData);
        setDemoMode(Boolean(serviceData?.isDemo));
        const savedPackage = serviceData?.packages?.find((item) => item.id === cartItem?.packageId);
        setPackageId(savedPackage?.id || serviceData?.packages?.[0]?.id || '');
        setAddonIds((cartItem?.addonIds || []).filter((id) => serviceData?.addons?.some((addon) => addon.id === id)));
      })
      .catch((requestError) => {
        if (!active) return;
        const demoService = getDemoService(serviceId);
        if (demoService) {
          setService(demoService);
          setDemoMode(true);
          setPackageId(demoService.packages?.find((item) => item.id === cartItem?.packageId)?.id || demoService.packages?.[0]?.id || '');
          setAddonIds((cartItem?.addonIds || []).filter((id) => demoService.addons?.some((addon) => addon.id === id)));
          console.warn('Showing a sample service because the catalog detail could not be loaded:', getErrorMessage(requestError));
        } else {
          setError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [serviceId, cartItem, reloadKey]);

  if (loading) return <PageLoader label="Loading service details…" />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />;
  if (!service) return <EmptyState title="Service not found" description="This service may no longer be available." action={<Button onClick={onBack}>Back to services</Button>} />;

  const selectedPackage = service.packages?.find((item) => item.id === packageId);
  const selectedAddons = service.addons?.filter((item) => addonIds.includes(item.id)) || [];
  const basePrice = selectedPackage ? Number(selectedPackage.price) : Number(service.effectivePrice ?? service.basePrice ?? 0);
  const addonTotal = selectedAddons.reduce((sum, item) => sum + Number(item.price), 0);
  const total = basePrice + addonTotal;
  const heroImage = service.images?.[0]?.imageUrl;

  function addToCart() {
    onAddToCart({
      serviceId: service.id,
      name: service.name,
      categoryName: service.category?.name || 'Home service',
      description: service.shortDescription || service.description || '',
      currency: service.currency || 'INR',
      packageId: selectedPackage?.id || '',
      packageName: selectedPackage?.name || '',
      packagePrice: basePrice,
      addonIds,
      addonNames: selectedAddons.map((item) => item.name),
      addonPrice: addonTotal,
      total,
      isDemo: Boolean(service.isDemo)
    });
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-emerald-800">
        <ArrowLeft size={16} /> Back to services
      </button>
      {demoMode && <p role="status" className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">Sample service preview. Live availability and booking require the catalog service to be online.</p>}
      <div className="grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="min-w-0">
          <div className={`relative flex min-h-64 overflow-hidden rounded-[28px] bg-gradient-to-br ${gradients[service.name.length % gradients.length]} sm:min-h-80`}>
            {heroImage ? (
              <img src={heroImage} alt={service.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 75% 15%, white 0 7%, transparent 7.5%), radial-gradient(circle at 20% 85%, white 0 12%, transparent 12.5%)' }} />
            )}
            <div className="relative z-10 m-5 flex items-start justify-between gap-3 self-start">
              <Badge tone="green">{service.category?.name || 'Home service'}</Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700"><ShieldCheck size={14} className="text-emerald-700" /> Trusted local pros</span>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">A little help goes a long way</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{service.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{service.description || service.shortDescription || 'Carefully matched professionals, ready when you need them.'}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200"><Clock3 size={14} className="text-emerald-700" /> About {service.durationMinutes || 60} minutes</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200"><Star size={14} className="fill-amber-400 text-amber-400" /> Vetted professionals</span>
            </div>
          </div>

          {service.packages?.length > 0 && (
            <section className="mt-8">
              <div className="mb-3">
                <h2 className="text-lg font-extrabold text-slate-900">Choose the right package</h2>
                <p className="mt-1 text-sm text-slate-500">Pick the level of care that suits your home.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {service.packages.map((item) => (
                  <button type="button" key={item.id} onClick={() => setPackageId(item.id)} className={`rounded-2xl border p-4 text-left transition ${packageId === item.id ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/10' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-extrabold text-slate-900">{item.name}</h3><p className="mt-1 text-xs text-slate-500">{item.durationMinutes} minutes</p></div>
                      <span className="text-sm font-extrabold text-slate-900">{currency(item.price, service.currency)}</span>
                    </div>
                    {item.description && <p className="mt-3 text-xs leading-5 text-slate-500">{item.description}</p>}
                    {item.features?.length > 0 && <ul className="mt-3 space-y-1.5">{item.features.slice(0, 4).map((feature) => <li key={feature} className="flex gap-2 text-xs text-slate-600"><Check size={14} className="shrink-0 text-emerald-700" />{feature}</li>)}</ul>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {service.addons?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-slate-900">Make it extra special</h2>
              <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
                {service.addons.map((addon) => {
                  const selected = addonIds.includes(addon.id);
                  return (
                    <button type="button" key={addon.id} onClick={() => setAddonIds((current) => selected ? current.filter((id) => id !== addon.id) : [...current, addon.id])} className="flex w-full items-center gap-3 py-4 text-left">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${selected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 text-transparent'}`}><Check size={13} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{addon.name}</span><span className="mt-0.5 block text-xs text-slate-500">{addon.description || `${addon.durationMinutes || 0} extra minutes`}</span></span>
                      <span className="text-sm font-extrabold text-slate-800">+{currency(addon.price, service.currency)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Your selection</p>
            <h2 className="mt-2 text-xl font-extrabold text-slate-900">{service.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedPackage?.name || 'Standard service'}</p>
            <div className="my-5 space-y-3 border-y border-slate-100 py-4 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-500">{selectedPackage?.name || 'Service'}</span><span className="font-bold text-slate-800">{currency(basePrice, service.currency)}</span></div>
              {selectedAddons.map((addon) => <div key={addon.id} className="flex justify-between gap-3"><span className="text-slate-500">{addon.name}</span><span className="font-bold text-slate-800">{currency(addon.price, service.currency)}</span></div>)}
              <div className="flex justify-between gap-3 pt-1"><span className="font-bold text-slate-700">Estimated total</span><strong className="text-lg text-slate-900">{currency(total, service.currency)}</strong></div>
            </div>
            <Button className="w-full" onClick={addToCart}><ShoppingBag size={17} /> {cartItem ? 'Update cart' : 'Add to cart'}</Button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-400">You’ll choose an address and time at checkout.</p>
          </Card>
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900"><ShieldCheck size={16} className="mt-0.5 shrink-0" /> Verified local professionals and clear pricing, before you book.</div>
        </aside>
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
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">Your picks</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Your cart</h1><p className="mt-1 text-sm text-slate-500">{items.length} {items.length === 1 ? 'service' : 'services'} ready when you are.</p></div>
        <button type="button" onClick={onContinue} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"><ArrowLeft size={15} /> Keep exploring</button>
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
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-base text-slate-900">{currency(item.total, item.currency)}</strong>
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
