import { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  SPOTIFY_AUTH_ENDPOINT,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_ENDPOINT,
} from '../config/spotify';
import { StoredTokens } from '../types/spotify';
import { clearTokens, loadTokens, saveTokens } from './tokenStore';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: SPOTIFY_AUTH_ENDPOINT,
  tokenEndpoint: SPOTIFY_TOKEN_ENDPOINT,
};

// Refresh a little before actual expiry so an in-flight request never lands on a dead token.
const REFRESH_SKEW_MS = 60_000;

export function useSpotifyAuth() {
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SPOTIFY_SCOPES,
      usePKCE: true,
      redirectUri: SPOTIFY_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      // Force Spotify to re-show the consent screen so a previously-granted (and
      // possibly narrower) authorization can't be silently reused.
      extraParams: { show_dialog: 'true' },
    },
    discovery
  );

  useEffect(() => {
    (async () => {
      setTokens(await loadTokens());
      setIsReady(true);
    })();
  }, []);

  const login = useCallback(async () => {
    if (!request) return;
    setIsLoggingIn(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success' || !result.params.code) return;

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: SPOTIFY_CLIENT_ID,
          code: result.params.code,
          redirectUri: SPOTIFY_REDIRECT_URI,
          extraParams: { code_verifier: request.codeVerifier ?? '' },
        },
        discovery
      );

      const next: StoredTokens = {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken ?? '',
        expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
      };
      await saveTokens(next);
      setTokens(next);
    } finally {
      setIsLoggingIn(false);
    }
  }, [request, promptAsync]);

  const logout = useCallback(async () => {
    await clearTokens();
    setTokens(null);
  }, []);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;
    if (Date.now() < tokens.expiresAt - REFRESH_SKEW_MS) {
      return tokens.accessToken;
    }
    if (!tokens.refreshToken) return null;

    try {
      const refreshed = await AuthSession.refreshAsync(
        { clientId: SPOTIFY_CLIENT_ID, refreshToken: tokens.refreshToken },
        discovery
      );
      const next: StoredTokens = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
        expiresAt: Date.now() + (refreshed.expiresIn ?? 3600) * 1000,
      };
      await saveTokens(next);
      setTokens(next);
      return next.accessToken;
    } catch {
      await clearTokens();
      setTokens(null);
      return null;
    }
  }, [tokens]);

  return {
    isReady,
    isAuthenticated: !!tokens,
    isLoggingIn,
    canLogin: !!request,
    login,
    logout,
    getValidAccessToken,
  };
}
