import { useEffect, useState } from 'react';

const CONSENT_KEY = 'cookie_consent_v1';
const UMAMI_SCRIPT_ID = 'umami-script';
const DEFAULT_UMAMI_WEBSITE_ID = '4b955fb2-5417-4adb-a9fe-a8133b4ee463';

type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: false;
  policyVersion: string;
  timestamp: string;
};

function getWebsiteId() {
  return import.meta.env.VITE_UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID;
}

function loadUmamiScript() {
  if (document.getElementById(UMAMI_SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = UMAMI_SCRIPT_ID;
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.setAttribute('data-website-id', getWebsiteId());
  document.head.appendChild(script);
}

function unloadUmamiScript() {
  const existing = document.getElementById(UMAMI_SCRIPT_ID);
  if (existing) existing.remove();
}

function readConsent(): CookieConsent | null {
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean) {
  const consent: CookieConsent = {
    necessary: true,
    analytics,
    marketing: false,
    policyVersion: '1.0',
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event('open-cookie-preferences'));
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current = readConsent();
    if (!current) {
      setVisible(true);
      return;
    }
    if (current.analytics) loadUmamiScript();
    else unloadUmamiScript();
  }, []);

  useEffect(() => {
    const onOpen = () => setVisible(true);
    window.addEventListener('open-cookie-preferences', onOpen);
    return () => window.removeEventListener('open-cookie-preferences', onOpen);
  }, []);

  const acceptAnalytics = () => {
    saveConsent(true);
    loadUmamiScript();
    setVisible(false);
  };

  const rejectOptional = () => {
    saveConsent(false);
    unloadUmamiScript();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <p>
        We use necessary cookies for core functionality and optional analytics cookies to improve the
        site. You can change this later from the footer.
      </p>
      <div className="cookie-actions">
        <button className="btn btn-primary" onClick={acceptAnalytics}>
          Accept Analytics
        </button>
        <button className="btn btn-outline" onClick={rejectOptional}>
          Reject Optional
        </button>
      </div>
    </div>
  );
}
