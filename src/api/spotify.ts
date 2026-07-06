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
  init?: RequestInit,
  // Some write endpoints (e.g. POST /me/player/queue) return 2xx with a bare,
  // opaque command id rather than JSON. Callers that don't need the body pass
  // false so a non-JSON success is treated as success instead of a parse error.
  expectJson = true
): Promise<T | null> {
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  // Read the body once, as text, so we can handle empty/non-JSON responses
  // without JSON.parse throwing a cryptic "Unexpected character" error.
  const raw = res.status === 204 ? '' : await res.text();

  if (!res.ok) {
    let message = `Spotify request failed (${res.status})`;
    try {
      message = JSON.parse(raw)?.error?.message ?? message;
    } catch {
      // response had no JSON body; keep the default message
    }
    throw new SpotifyApiError(message, res.status);
  }

  // Empty success body (e.g. 204), or a caller that doesn't expect JSON: the
  // request succeeded and there's nothing to parse.
  if (!raw.trim() || !expectJson) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new SpotifyApiError(
      `Spotify returned an unexpected (non-JSON) response (${res.status}).`,
      res.status
    );
  }
}

export async function searchTracks(
  accessToken: string,
  query: string,
  limit = 10 // Spotify's /search endpoint caps limit at 10 (range 0-10)
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
  const data = await spotifyFetch<{ items: (SpotifyPlaylist | null)[] }>(
    accessToken,
    '/me/playlists?limit=50'
  );
  // The array can contain null entries (e.g. an unavailable playlist).
  return (data?.items ?? []).filter((p): p is SpotifyPlaylist => !!p && !!p.id);
}

// Spotify deprecated the playlist `tracks` field in favour of `items`; read
// whichever is present so the count survives the API change.
export function playlistTrackCount(playlist: SpotifyPlaylist): number {
  return playlist.items?.total ?? playlist.tracks?.total ?? 0;
}

export interface SpotifyQueue {
  currentlyPlaying: SpotifyTrack | null;
  queue: SpotifyTrack[];
}

export async function getQueue(accessToken: string): Promise<SpotifyQueue> {
  // Returns null (204) when there's no active device / nothing playing.
  const data = await spotifyFetch<{
    currently_playing: (SpotifyTrack & { type?: string }) | null;
    queue: (SpotifyTrack & { type?: string })[];
  }>(accessToken, '/me/player/queue');
  if (!data) return { currentlyPlaying: null, queue: [] };
  // The queue can also contain podcast episodes, which don't match SpotifyTrack;
  // keep only tracks so the UI can render them uniformly.
  const isTrack = (t: (SpotifyTrack & { type?: string }) | null): t is SpotifyTrack =>
    !!t && (t.type === undefined || t.type === 'track');
  return {
    currentlyPlaying: isTrack(data.currently_playing) ? data.currently_playing : null,
    queue: (data.queue ?? []).filter(isTrack),
  };
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  // First 100 tracks (the endpoint's max page size); pagination isn't wired up.
  // Spotify deprecated each entry's `track` field in favour of `item`; read
  // whichever is present. Entries can also be podcast episodes, so keep tracks only.
  const data = await spotifyFetch<{
    items: {
      item?: (SpotifyTrack & { type?: string }) | null;
      track?: (SpotifyTrack & { type?: string }) | null;
    }[];
  }>(accessToken, `/playlists/${playlistId}/items?limit=100`);
  return (data?.items ?? [])
    .map((entry) => entry.item ?? entry.track)
    .filter((t): t is SpotifyTrack & { type?: string } => !!t)
    .filter((t) => t.type === undefined || t.type === 'track');
}

export async function removeTrackFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string
): Promise<void> {
  await spotifyFetch(accessToken, `/playlists/${playlistId}/items`, {
    method: 'DELETE',
    body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
  });
}

export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string
): Promise<void> {
  await spotifyFetch(accessToken, `/playlists/${playlistId}/items`, {
    method: 'POST',
    body: JSON.stringify({ uris: [trackUri] }),
  });
}

export async function addTrackToQueue(accessToken: string, trackUri: string): Promise<void> {
  const params = new URLSearchParams({ uri: trackUri });
  await spotifyFetch(
    accessToken,
    `/me/player/queue?${params.toString()}`,
    { method: 'POST' },
    false // success returns an opaque command id, not JSON — don't parse it
  );
}
