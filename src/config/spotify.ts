/**
 * Fill these in from your Spotify Developer Dashboard app (developer.spotify.com/dashboard).
 * Redirect URI must be registered EXACTLY as below (including scheme) in the dashboard's
 * "Redirect URIs" settings for the app.
 */
export const SPOTIFY_CLIENT_ID = '0118318360be41bb80476e5c1d4d56df';

// Matches the "scheme" in app.json. Works for the standalone/dev-client app.
export const SPOTIFY_REDIRECT_URI = 'spotiqueue://redirect';

// Only what's needed for: reading the catalog, seeing/controlling playback queue,
// and reading/modifying playlists. Nothing else.
export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
];

export const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
export const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
