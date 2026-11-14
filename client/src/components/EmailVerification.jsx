import { useState } from 'react';
import { BadgeCheck, MailCheck } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { Badge, Button, Card, Field, Input } from './ui';

export default function EmailVerification({ user, onVerified }) {
  const [justVerified, setJustVerified] = useState(false);
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const verified = justVerified || Boolean(user.emailVerifiedAt || user.emailVerified);

  async function requestCode() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/otp/email/request', {});
      setRequested(true);
      setMessage('A 6-digit code has been sent to your email. It expires in 10 minutes.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/otp/email/verify', { code });
      setJustVerified(true);
      setCode('');
      setMessage('Your email is verified.');
      onVerified?.({ ...user, emailVerified: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MailCheck size={18} className="text-emerald-700" />
            <h3 className="font-extrabold text-slate-900">Email verification</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {verified
              ? 'Your email is verified and your account is up to date.'
              : 'Verify your email to help protect your account and complete your provider application.'}
          </p>
        </div>
        <Badge tone={verified ? 'green' : 'amber'}>{verified ? 'Verified' : 'Not verified'}</Badge>
      </div>

      {!verified && (
        <div className="mt-5 space-y-3">
          {!requested ? (
            <Button variant="secondary" className="w-full" onClick={requestCode} disabled={busy}>
              {busy ? 'Sending…' : 'Send verification code'}
            </Button>
          ) : (
            <>
              <form onSubmit={verifyCode} className="flex flex-col gap-3 sm:flex-row">
                <Field label="6-digit code" hint="The code expires after 10 minutes.">
                  <Input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                  />
                </Field>
                <Button type="submit" variant="secondary" className="sm:mt-5" disabled={busy || code.length !== 6}>
                  {busy ? 'Checking…' : 'Verify'}
                </Button>
              </form>
              <button
                type="button"
                onClick={requestCode}
                disabled={busy}
                className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 disabled:opacity-50"
              >
                Send a new code
              </button>
            </>
          )}
        </div>
      )}

      {message && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"><BadgeCheck size={16} />{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
    </Card>
  );
}
