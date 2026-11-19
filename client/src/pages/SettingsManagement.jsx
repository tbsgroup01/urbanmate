import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  Code2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  ImageIcon,
  Info,
  Mail,
  QrCode,
  RefreshCw,
  Save,
  Send,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  UploadCloud,
  Wallet
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageLoader,
  SectionHeading,
  Textarea
} from '../components/ui';
import { api, getErrorMessage } from '../lib/api';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Tab 1: General Settings state
  const [general, setGeneral] = useState({
    siteName: 'UrbanMate',
    siteTitle: 'UrbanMate - On-Demand Doorstep Home & Salon Services',
    metaDescription: '',
    metaKeywords: '',
    headerScripts: '',
    bodyScripts: '',
    logoUrl: '',
    faviconUrl: ''
  });
  const [scriptPlacement, setScriptPlacement] = useState('head');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Tab 2: Payment Configuration state
  const [payment, setPayment] = useState({
    mode: 'test',
    razorpayEnabled: true,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
    upiEnabled: true,
    upiId: '',
    upiPayeeName: '',
    upiQrUrl: '',
    upiInstructions: '',
    codEnabled: true
  });
  const [uploadingQr, setUploadingQr] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Tab 3: Mail Configuration state
  const [mail, setMail] = useState({
    enabled: true,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    encryption: 'tls',
    user: '',
    password: '',
    fromEmail: 'noreply@urbanmate.in',
    fromName: 'UrbanMate'
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/settings/admin');
      if (data.general) setGeneral((prev) => ({ ...prev, ...data.general }));
      if (data.payment) setPayment((prev) => ({ ...prev, ...data.payment }));
      if (data.mail) setMail((prev) => ({ ...prev, ...data.mail }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveSection(section, data) {
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      await api.put('/settings/admin', { section, data });
      setFeedback({
        type: 'success',
        message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`
      });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(err)
      });
    } finally {
      setSaving(false);
    }
  }

  // Handle Logo Upload
  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.post('/settings/admin/upload-asset', {
        dataUrl,
        assetType: 'logo'
      });
      setGeneral((prev) => ({ ...prev, logoUrl: res.url }));
    } catch (err) {
      alert(`Logo upload failed: ${getErrorMessage(err)}`);
    } finally {
      setUploadingLogo(false);
    }
  }

  // Handle Favicon Upload
  async function handleFaviconUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.post('/settings/admin/upload-asset', {
        dataUrl,
        assetType: 'favicon'
      });
      setGeneral((prev) => ({ ...prev, faviconUrl: res.url }));
    } catch (err) {
      alert(`Favicon upload failed: ${getErrorMessage(err)}`);
    } finally {
      setUploadingFavicon(false);
    }
  }

  // Handle QR Code Upload
  async function handleQrUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.post('/settings/admin/upload-asset', {
        dataUrl,
        assetType: 'upi_qr'
      });
      setPayment((prev) => ({ ...prev, upiQrUrl: res.url }));
    } catch (err) {
      alert(`QR Code upload failed: ${getErrorMessage(err)}`);
    } finally {
      setUploadingQr(false);
    }
  }

  // Handle Send Test Email
  async function handleSendTestEmail(e) {
    e.preventDefault();
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      alert('Please enter a valid recipient email address');
      return;
    }
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await api.post('/settings/admin/test-email', {
        toEmail: testEmailRecipient,
        mailSettings: mail
      });
      setTestEmailResult({
        success: true,
        message: `Test email sent successfully to ${testEmailRecipient}! Message ID: ${res.messageId || 'OK'}`
      });
    } catch (err) {
      setTestEmailResult({
        success: false,
        message: getErrorMessage(err)
      });
    } finally {
      setTestingEmail(false);
    }
  }

  const webhookUrl = `${window.location.origin}/api/v1/payments/razorpay/webhook`;

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  }

  if (loading) {
    return <PageLoader label="Loading platform settings…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSettings} />;
  }

  return (
    <div className="space-y-7 pb-20">
      <SectionHeading
        eyebrow="System & Platform"
        title="Settings & Configuration"
        description="Configure marketplace branding, SEO metadata, Razorpay credentials, UPI QR payments, and SMTP email delivery."
      />

      {/* Feedback banner */}
      {feedback.message && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold transition ${
            feedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? <Check size={18} className="text-emerald-700 shrink-0" /> : <AlertCircle size={18} className="text-rose-700 shrink-0" />}
          <span className="flex-1">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2 sm:gap-4 overflow-x-auto pb-px scrollbar-none">
          {[
            {
              id: 'general',
              label: 'General Setting',
              subtitle: 'Branding, SEO & Scripts',
              icon: Globe,
              badge: 'Branding'
            },
            {
              id: 'payment',
              label: 'Payment Configuration',
              subtitle: 'Razorpay & UPI QR',
              icon: CreditCard,
              badge: payment.mode === 'live' ? 'Live Mode' : 'Test Mode'
            },
            {
              id: 'mail',
              label: 'Mail Configuration',
              subtitle: 'SMTP Server',
              icon: Mail,
              badge: mail.enabled ? 'Active' : 'Disabled'
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setFeedback({ type: '', message: '' });
                }}
                className={`group flex items-center gap-3 border-b-2 px-3 sm:px-5 py-3 text-left transition ${
                  isActive
                    ? 'border-emerald-700 text-emerald-950 font-bold'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 font-medium'
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm font-extrabold leading-tight">
                    {tab.label}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-slate-400 font-normal">
                    {tab.subtitle}
                  </span>
                </span>
                <span
                  className={`ml-1 hidden md:inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Card 1: Branding Assets (Logo & Favicon) */}
          <Card className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <ImageIcon size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Brand Identity Assets</h3>
                <p className="text-xs text-slate-400">Upload your platform logo and browser favicon icon.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Logo Upload Box */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Site Logo</span>
                  <span className="text-[11px] text-slate-400 font-normal">Recommended: 240×60px (.png, .svg)</span>
                </label>

                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50">
                  {general.logoUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center rounded-xl bg-white p-4 border border-slate-100 shadow-2xs min-h-[90px]">
                        <img
                          src={general.logoUrl}
                          alt="Site Logo Preview"
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 truncate">
                          <Check size={12} /> Active Logo
                        </span>
                        <div className="flex gap-2">
                          <label className="cursor-pointer rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition">
                            Change
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/svg+xml,image/webp"
                              className="hidden"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setGeneral((prev) => ({ ...prev, logoUrl: '' }))}
                            className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-6 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-2xs border border-slate-200 mb-2">
                        {uploadingLogo ? <RefreshCw size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {uploadingLogo ? 'Uploading logo…' : 'Click to upload Site Logo'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">PNG, SVG, or WebP with transparent background</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Favicon Upload Box with Live Browser Tab Mock */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Favicon Icon</span>
                  <span className="text-[11px] text-slate-400 font-normal">Recommended: 32×32px (.ico, .png)</span>
                </label>

                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50">
                  {/* Browser Tab Mockup */}
                  <div className="mb-3 rounded-xl border border-slate-200 bg-slate-200/60 p-2 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider px-1">Browser Tab Preview</p>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-2xs max-w-full">
                      {general.faviconUrl ? (
                        <img src={general.faviconUrl} alt="Favicon" className="h-4 w-4 object-contain shrink-0" />
                      ) : (
                        <span className="grid h-4 w-4 place-items-center rounded-xs bg-emerald-700 text-[9px] font-black text-white shrink-0">
                          U
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                        {general.siteTitle || general.siteName || 'UrbanMate'}
                      </span>
                      <span className="text-[10px] text-slate-300 ml-1">✕</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">
                      {general.faviconUrl ? 'Custom favicon configured' : 'Using default platform icon'}
                    </span>
                    <div className="flex gap-2">
                      <label className="cursor-pointer rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition">
                        {uploadingFavicon ? 'Uploading…' : general.faviconUrl ? 'Replace' : 'Upload icon'}
                        <input
                          type="file"
                          accept="image/x-icon,image/png,image/svg+xml,image/vnd.microsoft.icon"
                          className="hidden"
                          onChange={handleFaviconUpload}
                          disabled={uploadingFavicon}
                        />
                      </label>
                      {general.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => setGeneral((prev) => ({ ...prev, faviconUrl: '' }))}
                          className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Website Identity & SEO Information */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-700">
                <Globe size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Website Identity & SEO Meta</h3>
                <p className="text-xs text-slate-400">Configure site name, default titles, and search engine metadata.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Site Name">
                <Input
                  value={general.siteName}
                  onChange={(e) => setGeneral((prev) => ({ ...prev, siteName: e.target.value }))}
                  placeholder="e.g. UrbanMate"
                />
              </Field>

              <Field label="Default Page Title (Browser Title)">
                <Input
                  value={general.siteTitle}
                  onChange={(e) => setGeneral((prev) => ({ ...prev, siteTitle: e.target.value }))}
                  placeholder="e.g. UrbanMate - On-Demand Doorstep Home & Salon Services"
                />
              </Field>
            </div>

            <Field label="Meta Description">
              <Textarea
                rows={3}
                value={general.metaDescription}
                onChange={(e) => setGeneral((prev) => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="Brief summary of your platform shown in search engine results…"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Recommended: 150 - 160 characters</span>
                <span className={general.metaDescription.length > 160 ? 'text-amber-600 font-bold' : ''}>
                  {general.metaDescription.length} characters
                </span>
              </div>
            </Field>

            <Field label="Meta Keywords (Comma separated)">
              <Input
                value={general.metaKeywords}
                onChange={(e) => setGeneral((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                placeholder="e.g. home services, salon at home, cleaning, plumbing, electrician, repairs"
              />
            </Field>
          </Card>

          {/* Card 3: Custom Meta Tags & Scripts (Placement: Head or Body) */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-700">
                  <Code2 size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Custom Tags & Scripts Placement</h3>
                  <p className="text-xs text-slate-400">Inject custom HTML meta tags, Google Analytics, or chat scripts.</p>
                </div>
              </div>

              {/* Placement selector pills */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setScriptPlacement('head')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    scriptPlacement === 'head' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Head (&lt;head&gt;)
                </button>
                <button
                  type="button"
                  onClick={() => setScriptPlacement('body')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    scriptPlacement === 'body' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Body (&lt;body&gt;)
                </button>
              </div>
            </div>

            {scriptPlacement === 'head' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Custom &lt;head&gt; Meta Tags &amp; Header Scripts</span>
                  <Badge tone="blue">Placed inside &lt;head&gt;</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Use for site verification meta tags, Google Analytics (<code className="text-slate-800">gtag.js</code>), custom stylesheets, or open-graph tags.
                </p>
                <textarea
                  rows={6}
                  value={general.headerScripts}
                  onChange={(e) => setGeneral((prev) => ({ ...prev, headerScripts: e.target.value }))}
                  placeholder={`<meta name="google-site-verification" content="..." />\n<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=..."></script>`}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500 shadow-inner"
                  spellCheck="false"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Custom &lt;body&gt; Footer Scripts</span>
                  <Badge tone="amber">Placed before &lt;/body&gt;</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Use for live chat widgets (Tawk.to, Crisp, Intercom), customer feedback beacons, or conversion tracking scripts.
                </p>
                <textarea
                  rows={6}
                  value={general.bodyScripts}
                  onChange={(e) => setGeneral((prev) => ({ ...prev, bodyScripts: e.target.value }))}
                  placeholder={`<!-- Live Chat Widget or Tracking Script -->\n<script>\n  window.$crisp = [];\n  // ...\n</script>`}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500 shadow-inner"
                  spellCheck="false"
                />
              </div>
            )}
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={() => saveSection('general', general)}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[160px]"
            >
              <Save size={16} />
              {saving ? 'Saving changes…' : 'Save General Settings'}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Environment & Gateway Status Card */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CreditCard size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Payment Environment &amp; Gateways</h3>
                  <p className="text-xs text-slate-400">Choose between sandbox/test mode or live production processing.</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPayment((prev) => ({ ...prev, mode: 'test' }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    payment.mode === 'test' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Sandbox / Test</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayment((prev) => ({ ...prev, mode: 'live' }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    payment.mode === 'live' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Live Production</span>
                </button>
              </div>
            </div>

            {/* Warning or Live Indicator banner */}
            {payment.mode === 'test' ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 font-medium">
                <Info size={16} className="text-amber-700 shrink-0" />
                <span>
                  <strong>Test Mode Active:</strong> All transactions are simulated with dummy cards and test UPI IDs. No real bank charges will occur.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-950 font-medium">
                <BadgeCheck size={16} className="text-emerald-700 shrink-0" />
                <span>
                  <strong>Live Mode Active:</strong> Real transactions will be processed via your live Razorpay merchant account and registered UPI QR.
                </span>
              </div>
            )}

            {/* Methods Active Toggles */}
            <div className="grid gap-4 sm:grid-cols-3 pt-1">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Razorpay Gateway</span>
                  <span className="block text-[11px] text-slate-400">Cards, UPI &amp; NetBanking</span>
                </div>
                <input
                  type="checkbox"
                  checked={payment.razorpayEnabled}
                  onChange={(e) => setPayment((prev) => ({ ...prev, razorpayEnabled: e.target.checked }))}
                  className="h-5 w-5 accent-emerald-700 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition">
                <div>
                  <span className="block text-xs font-bold text-slate-900">UPI QR Code</span>
                  <span className="block text-[11px] text-slate-400">Scan &amp; Pay directly</span>
                </div>
                <input
                  type="checkbox"
                  checked={payment.upiEnabled}
                  onChange={(e) => setPayment((prev) => ({ ...prev, upiEnabled: e.target.checked }))}
                  className="h-5 w-5 accent-emerald-700 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Pay on Service</span>
                  <span className="block text-[11px] text-slate-400">Cash / Pro direct pay</span>
                </div>
                <input
                  type="checkbox"
                  checked={payment.codEnabled}
                  onChange={(e) => setPayment((prev) => ({ ...prev, codEnabled: e.target.checked }))}
                  className="h-5 w-5 accent-emerald-700 rounded cursor-pointer"
                />
              </label>
            </div>
          </Card>

          {/* Razorpay Credentials Card */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <CreditCard size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Razorpay API Credentials</h3>
                  <p className="text-xs text-slate-400">Obtain Key ID and Secret from Razorpay Dashboard &gt; Settings &gt; API Keys.</p>
                </div>
              </div>
              <Badge tone={payment.mode === 'live' ? 'green' : 'amber'}>
                {payment.mode === 'live' ? 'Live Keys Required' : 'Test Keys'}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Razorpay Key ID">
                <Input
                  value={payment.razorpayKeyId}
                  onChange={(e) => setPayment((prev) => ({ ...prev, razorpayKeyId: e.target.value }))}
                  placeholder={payment.mode === 'live' ? 'rzp_live_...' : 'rzp_test_...'}
                />
              </Field>

              <Field label="Razorpay Key Secret">
                <div className="relative">
                  <Input
                    type={showRazorpaySecret ? 'text' : 'password'}
                    value={payment.razorpayKeySecret}
                    onChange={(e) => setPayment((prev) => ({ ...prev, razorpayKeySecret: e.target.value }))}
                    placeholder="Enter Razorpay Secret Key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showRazorpaySecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <Field label="Webhook Secret (Optional)">
              <div className="relative">
                <Input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={payment.razorpayWebhookSecret}
                  onChange={(e) => setPayment((prev) => ({ ...prev, razorpayWebhookSecret: e.target.value }))}
                  placeholder="Enter webhook secret from Razorpay Dashboard"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Webhook endpoint URL helper */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Your Razorpay Webhook URL
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-slate-800 break-all select-all">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0"
                >
                  {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedWebhook ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* UPI & Payment QR Code Upload Card */}
          <Card className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <QrCode size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">UPI &amp; Payment QR Code Configuration</h3>
                <p className="text-xs text-slate-400">Upload your merchant UPI QR code for direct scan-and-pay during customer checkout.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              {/* QR Upload & Preview */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700">Payment QR Code</label>
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                  {payment.upiQrUrl ? (
                    <div className="space-y-3">
                      <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-xl bg-white p-2 border border-slate-200 shadow-2xs">
                        <img
                          src={payment.upiQrUrl}
                          alt="Merchant UPI QR"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex justify-center gap-2">
                        <label className="cursor-pointer rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition">
                          Change QR
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleQrUpload}
                            disabled={uploadingQr}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setPayment((prev) => ({ ...prev, upiQrUrl: '' }))}
                          className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-6">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-teal-700 shadow-2xs border border-slate-200 mb-2">
                        {uploadingQr ? <RefreshCw size={20} className="animate-spin" /> : <QrCode size={22} />}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {uploadingQr ? 'Uploading QR…' : 'Upload QR Image'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Google Pay / PhonePe QR image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleQrUpload}
                        disabled={uploadingQr}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* UPI ID & Merchant details */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="UPI ID / VPA">
                    <Input
                      value={payment.upiId}
                      onChange={(e) => setPayment((prev) => ({ ...prev, upiId: e.target.value }))}
                      placeholder="e.g. urbanmate@okhdfcbank"
                    />
                  </Field>

                  <Field label="UPI Payee / Merchant Name">
                    <Input
                      value={payment.upiPayeeName}
                      onChange={(e) => setPayment((prev) => ({ ...prev, upiPayeeName: e.target.value }))}
                      placeholder="e.g. UrbanMate Services Pvt Ltd"
                    />
                  </Field>
                </div>

                <Field label="Customer Checkout Payment Instructions">
                  <Textarea
                    rows={3}
                    value={payment.upiInstructions}
                    onChange={(e) => setPayment((prev) => ({ ...prev, upiInstructions: e.target.value }))}
                    placeholder="Instructions displayed to customers when choosing UPI payment (e.g. Scan with Google Pay/PhonePe and keep transaction ID ready)..."
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={() => saveSection('payment', payment)}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[160px]"
            >
              <Save size={16} />
              {saving ? 'Saving changes…' : 'Save Payment Configuration'}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MAIL CONFIGURATION (SMTP) */}
      {/* ========================================================================= */}
      {activeTab === 'mail' && (
        <div className="space-y-6">
          {/* SMTP Service Status Card */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Mail size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">SMTP Mail Server Settings</h3>
                  <p className="text-xs text-slate-400">Configure email delivery for customer booking alerts, OTPs, and receipts.</p>
                </div>
              </div>

              {/* Status toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <span className="text-xs font-bold text-slate-700">Email Notifications:</span>
                <input
                  type="checkbox"
                  checked={mail.enabled}
                  onChange={(e) => setMail((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="h-5 w-5 accent-emerald-700 rounded cursor-pointer"
                />
                <Badge tone={mail.enabled ? 'green' : 'gray'}>
                  {mail.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="SMTP Host">
                <Input
                  value={mail.host}
                  onChange={(e) => setMail((prev) => ({ ...prev, host: e.target.value }))}
                  placeholder="e.g. smtp.gmail.com"
                />
              </Field>

              <Field label="SMTP Port">
                <Input
                  type="number"
                  value={mail.port}
                  onChange={(e) => setMail((prev) => ({ ...prev, port: Number(e.target.value) || 587 }))}
                  placeholder="587 or 465"
                />
              </Field>

              <Field label="Encryption Protocol">
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {['tls', 'ssl', 'none'].map((enc) => (
                    <button
                      key={enc}
                      type="button"
                      onClick={() => setMail((prev) => ({ ...prev, encryption: enc, secure: enc === 'ssl' }))}
                      className={`rounded-xl py-2 text-xs font-bold uppercase transition ${
                        mail.encryption === enc
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {enc}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SMTP Username / Email">
                <Input
                  value={mail.user}
                  onChange={(e) => setMail((prev) => ({ ...prev, user: e.target.value }))}
                  placeholder="e.g. notifications@urbanmate.in"
                />
              </Field>

              <Field label="SMTP Password / App Password">
                <div className="relative">
                  <Input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={mail.password}
                    onChange={(e) => setMail((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter SMTP password or app-specific password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>
          </Card>

          {/* Sender Identity Card */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-700">
                <Send size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Sender Identity</h3>
                <p className="text-xs text-slate-400">Details displayed to recipients in the &quot;From&quot; field.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From Email Address">
                <Input
                  type="email"
                  value={mail.fromEmail}
                  onChange={(e) => setMail((prev) => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="e.g. noreply@urbanmate.in"
                />
              </Field>

              <Field label="From Sender Display Name">
                <Input
                  value={mail.fromName}
                  onChange={(e) => setMail((prev) => ({ ...prev, fromName: e.target.value }))}
                  placeholder="e.g. UrbanMate Team"
                />
              </Field>
            </div>
          </Card>

          {/* Live SMTP Connection & Test Email Card */}
          <Card className="p-5 sm:p-6 space-y-4 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Send Live Test Email</h3>
                  <p className="text-xs text-slate-500">Send an instant test email to verify your SMTP server connection and credentials.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="min-w-0 flex-1 w-full">
                <Input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Enter your personal email to receive test message…"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={testingEmail || !testEmailRecipient}
                className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto shrink-0 shadow-sm"
              >
                {testingEmail ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Connecting to SMTP…
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Test Email
                  </>
                )}
              </Button>
            </form>

            {testEmailResult && (
              <div
                className={`rounded-2xl p-4 text-xs font-semibold leading-relaxed ${
                  testEmailResult.success
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-950'
                    : 'border border-rose-300 bg-rose-50 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testEmailResult.success ? (
                    <BadgeCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-sm font-black">
                      {testEmailResult.success ? 'SMTP Verification Succeeded' : 'SMTP Connection Failed'}
                    </strong>
                    <span className="mt-1 block font-normal">{testEmailResult.message}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={() => saveSection('mail', mail)}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[160px]"
            >
              <Save size={16} />
              {saving ? 'Saving changes…' : 'Save Mail Configuration'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

