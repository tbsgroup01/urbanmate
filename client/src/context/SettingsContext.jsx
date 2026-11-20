import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const defaultSettings = {
  siteName: 'UrbanMate',
  siteTitle: 'UrbanMate - On-Demand Doorstep Home & Salon Services',
  metaDescription: 'UrbanMate connects you with verified local professionals for cleaning, repair, salon, and handyman services across your city.',
  metaKeywords: 'urbanmate, home services, salon at home, cleaning, plumbing, electrician, appliance repair',
  headerScripts: '',
  bodyScripts: '',
  logoUrl: '',
  faviconUrl: '',
  payment: {
    mode: 'test',
    razorpayEnabled: true,
    razorpayKeyId: '',
    upiEnabled: true,
    upiId: '',
    upiPayeeName: '',
    upiQrUrl: '',
    upiInstructions: '',
    codEnabled: true
  }
};

const SettingsContext = createContext({
  settings: defaultSettings,
  refreshSettings: async () => {},
  loading: false
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('urbanmate_public_settings');
      if (cached) return { ...defaultSettings, ...JSON.parse(cached) };
    } catch {}
    return defaultSettings;
  });
  const [loading, setLoading] = useState(false);

  const applyDomSettings = useCallback((data) => {
    if (!data) return;

    // 1. Title
    const newTitle = data.siteTitle || data.siteName;
    if (newTitle && document.title !== newTitle) {
      document.title = newTitle;
    }

    // 2. Favicon
    if (data.faviconUrl) {
      let favicon = document.querySelector("link[rel~='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      if (favicon.href !== data.faviconUrl) {
        favicon.href = data.faviconUrl;
      }
    }

    // 3. Meta Description
    if (data.metaDescription) {
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = data.metaDescription;
    }

    // 4. Meta Keywords
    if (data.metaKeywords) {
      let metaKw = document.querySelector("meta[name='keywords']");
      if (!metaKw) {
        metaKw = document.createElement('meta');
        metaKw.name = 'keywords';
        document.head.appendChild(metaKw);
      }
      metaKw.content = data.metaKeywords;
    }

    // 5. Header Scripts injection
    let headContainer = document.getElementById('urbanmate-header-scripts');
    if (data.headerScripts && data.headerScripts.trim()) {
      if (!headContainer) {
        headContainer = document.createElement('div');
        headContainer.id = 'urbanmate-header-scripts';
        headContainer.style.display = 'none';
        document.head.appendChild(headContainer);
      }
      if (headContainer.innerHTML !== data.headerScripts) {
        headContainer.innerHTML = data.headerScripts;
      }
    } else if (headContainer) {
      headContainer.remove();
    }

    // 6. Body Scripts injection
    let bodyContainer = document.getElementById('urbanmate-body-scripts');
    if (data.bodyScripts && data.bodyScripts.trim()) {
      if (!bodyContainer) {
        bodyContainer = document.createElement('div');
        bodyContainer.id = 'urbanmate-body-scripts';
        bodyContainer.style.display = 'none';
        document.body.appendChild(bodyContainer);
      }
      if (bodyContainer.innerHTML !== data.bodyScripts) {
        bodyContainer.innerHTML = data.bodyScripts;
      }
    } else if (bodyContainer) {
      bodyContainer.remove();
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/settings/public');
      if (data && typeof data === 'object') {
        const merged = {
          ...defaultSettings,
          ...data,
          payment: { ...defaultSettings.payment, ...(data.payment || {}) }
        };
        setSettings(merged);
        applyDomSettings(merged);
        try {
          localStorage.setItem('urbanmate_public_settings', JSON.stringify(merged));
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to refresh public settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, [applyDomSettings]);

  useEffect(() => {
    refreshSettings();

    // Listen for custom event dispatched when admin saves settings
    function handleSettingsUpdated(e) {
      if (e?.detail) {
        setSettings((prev) => {
          const next = { ...prev, ...e.detail };
          applyDomSettings(next);
          return next;
        });
      }
      refreshSettings();
    }

    window.addEventListener('urbanmate:settings-updated', handleSettingsUpdated);
    window.addEventListener('storage', (event) => {
      if (event.key === 'urbanmate_public_settings') {
        try {
          const parsed = JSON.parse(event.newValue);
          setSettings(parsed);
          applyDomSettings(parsed);
        } catch {}
      }
    });

    return () => {
      window.removeEventListener('urbanmate:settings-updated', handleSettingsUpdated);
    };
  }, [refreshSettings, applyDomSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

