const DEFAULT_REMOTE_SERVER = 'https://ais-pre-4e7cvmhzcdceswfr227vvq-38813031509.asia-southeast1.run.app';

export function isPackagedMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'appassets.androidplatform.net' ||
    window.location.protocol === 'file:' ||
    window.location.protocol === 'capacitor:'
  );
}

export function getSavedServerUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('puja_server_url') || '';
}

export function setSavedServerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed) {
    localStorage.setItem('puja_server_url', trimmed);
  } else {
    localStorage.removeItem('puja_server_url');
  }
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const customServer = getSavedServerUrl();
  if (customServer) {
    return `${customServer}${normalizedPath}`;
  }
  if (isPackagedMobileApp()) {
    return `${DEFAULT_REMOTE_SERVER}${normalizedPath}`;
  }
  return normalizedPath;
}

export function getLiveWsUrl(): string {
  const customServer = getSavedServerUrl();
  const base = customServer || (isPackagedMobileApp() ? DEFAULT_REMOTE_SERVER : '');

  if (base) {
    const wsBase = base.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
    return `${wsBase}/live-ws`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/live-ws`;
}
