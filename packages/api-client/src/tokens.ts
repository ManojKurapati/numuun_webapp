export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Pluggable token storage so the client works in the browser, SSR or tests. */
export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: AuthTokens): void;
  clear(): void;
}

/** Persists tokens in `localStorage`. Safe to call during SSR (acts as empty). */
export function createBrowserTokenStore(namespace = 'namo'): TokenStore {
  const accessKey = `${namespace}.accessToken`;
  const refreshKey = `${namespace}.refreshToken`;
  const available = (): boolean => typeof window !== 'undefined';

  return {
    getAccessToken: () => (available() ? window.localStorage.getItem(accessKey) : null),
    getRefreshToken: () => (available() ? window.localStorage.getItem(refreshKey) : null),
    setTokens: ({ accessToken, refreshToken }) => {
      if (!available()) return;
      window.localStorage.setItem(accessKey, accessToken);
      window.localStorage.setItem(refreshKey, refreshToken);
    },
    clear: () => {
      if (!available()) return;
      window.localStorage.removeItem(accessKey);
      window.localStorage.removeItem(refreshKey);
    },
  };
}

/** In-memory token storage. */
export function createMemoryTokenStore(): TokenStore {
  let tokens: AuthTokens | null = null;
  return {
    getAccessToken: () => tokens?.accessToken ?? null,
    getRefreshToken: () => tokens?.refreshToken ?? null,
    setTokens: (next) => {
      tokens = next;
    },
    clear: () => {
      tokens = null;
    },
  };
}
