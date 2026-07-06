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

  // TEMP DEBUG — never logs the token, only method/path/status.
  console.log('[spotifyFetch]', init?.method ?? 'GET', path, '->', res.status);

  if (res.status === 204) return null;

  if (!res.ok) {
    let message = `Spotify request failed (${res.status})`;
    try {
      const body = await res.json();
      console.log('[spotifyFetch] error body:', JSON.stringify(body)); // TEMP DEBUG
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
  // TEMP DEBUG — log who you are vs. who owns each playlist.
  const me = await spotifyFetch<{ id: string; display_name?: string }>(accessToken, '/me');
  console.log('[whoami] my user id:', me?.id, me?.display_name);
  for (const p of data?.items ?? []) {
    if (p) {
      const meta = p as SpotifyPlaylist & { collaborative?: boolean; public?: boolean };
      console.log(
        '[playlist]',
        p.name,
        '| id:',
        p.id,
        '| owner:',
        p.owner?.id,
        '| collaborative:',
        meta.collaborative,
        '| public:',
        meta.public
      );
    }
  }

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
  // TEMP DEBUG — shows how many entries came back and the keys of the first one.
  console.log(
    '[getPlaylistTracks] item count:',
    data?.items?.length,
    'first entry keys:',
    data?.items?.[0] ? Object.keys(data.items[0]) : null
  );
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
  await spotifyFetch(accessToken, `/me/player/queue?${params.toString()}`, {
    method: 'POST',
  });
}
