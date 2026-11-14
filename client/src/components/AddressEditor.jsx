import { useMemo, useState } from 'react';
import { api, getErrorMessage } from '../lib/api';
import { Button, Field, Input, Select } from './ui';

export default function AddressEditor({ cities, onSaved, onCancel }) {
  const [values, setValues] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    cityId: '',
    areaId: '',
    city: '',
    region: '',
    postalCode: '',
    countryCode: 'IN',
    isDefault: false
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedCity = cities.find((city) => city.id === values.cityId);
  const areas = useMemo(() => selectedCity?.areas || [], [selectedCity]);

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { line1, line2, areaId, cityId, region, ...rest } = values;
      const address = await api.post('/addresses', {
        ...rest,
        line1,
        ...(line2 ? { line2 } : {}),
        ...(cityId ? { cityId } : {}),
        ...(areaId ? { areaId } : {}),
        ...(region ? { region } : {})
      });
      onSaved(address);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address label">
          <Select value={values.label} onChange={(event) => update('label', event.target.value)}>
            <option>Home</option><option>Work</option><option>Other</option>
          </Select>
        </Field>
        <Field label="Postal code">
          <Input value={values.postalCode} onChange={(event) => update('postalCode', event.target.value)} required placeholder="560001" />
        </Field>
      </div>
      <Field label="Address line">
        <Input value={values.line1} onChange={(event) => update('line1', event.target.value)} required placeholder="Building, street and landmark" />
      </Field>
      <Field label="Additional details">
        <Input value={values.line2} onChange={(event) => update('line2', event.target.value)} placeholder="Apartment, floor or nearby landmark (optional)" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City">
          {cities.length ? (
            <Select
              value={values.cityId}
              onChange={(event) => {
                const city = cities.find((item) => item.id === event.target.value);
                setValues((current) => ({
                  ...current,
                  cityId: event.target.value,
                  areaId: '',
                  city: city?.name || '',
                  countryCode: city?.countryCode || current.countryCode
                }));
              }}
              required
            >
              <option value="">Choose city</option>
              {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
            </Select>
          ) : (
            <Input value={values.city} onChange={(event) => update('city', event.target.value)} required placeholder="Your city" />
          )}
        </Field>
        <Field label="Area / neighbourhood">
          {areas.length ? (
            <Select value={values.areaId} onChange={(event) => update('areaId', event.target.value)}>
              <option value="">Choose area (optional)</option>
              {areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
            </Select>
          ) : (
            <Input value={values.region} onChange={(event) => update('region', event.target.value)} placeholder="Neighbourhood (optional)" />
          )}
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={values.isDefault} onChange={(event) => update('isDefault', event.target.checked)} className="accent-emerald-700" />
          Make this my default address
        </label>
        <span className="text-xs font-semibold text-slate-400">{values.countryCode}</span>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="quiet" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</Button>
      </div>
    </form>
  );
}
