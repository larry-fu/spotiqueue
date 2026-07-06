import { SPOTIFY_API_BASE } from '../config/spotify';
import { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';

export class SpotifyApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function spotifyFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) return null;

  if (!res.ok) {
    let message = `Spotify request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      // response had no JSON body; keep the default message
    }
    throw new SpotifyApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export async function searchTracks(
  accessToken: string,
  query: string,
  limit = 25
): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  const data = await spotifyFetch<{ tracks: { items: SpotifyTrack[] } }>(
    accessToken,
    `/search?${params.toString()}`
  );
  return data?.tracks.items ?? [];
}

export async function getUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{ items: SpotifyPlaylist[] }>(
    accessToken,
    '/me/playlists?limit=50'
  );
  return data?.items ?? [];
}

export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string
): Promise<void> {
  await spotifyFetch(accessToken, `/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function addTrackToQueue(accessToken: string, trackUri: string): Promise<void> {
  const params = new URLSearchParams({ uri: trackUri });
  await spotifyFetch(accessToken, `/me/player/queue?${params.toString()}`, {
    method: 'POST',
  });
}
