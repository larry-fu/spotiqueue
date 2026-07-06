# Next Steps

The app currently covers: search, add to queue, add to playlist, view queue
(read-only), view a playlist's tracks, and remove from playlist. Nothing else is
implemented by design. If the scope ever expands, here's what's worth doing first,
roughly in priority order.

## Before shipping to real users

- **Register a production redirect URI.** `spotiqueue://redirect` only works for a
  dev/standalone build installed from source. A production build (TestFlight/Play
  Store) needs its own signed bundle ID / package name registered in both `app.json`
  and the Spotify Dashboard's redirect URI list.
- **Handle Spotify rate limits (429).** `src/api/spotify.ts` currently surfaces the
  error message but doesn't read the `Retry-After` header or back off. Under heavy
  use (e.g. fast typing triggering many searches) this will surface as a raw failure
  alert.
- **Handle the "no active device" case better.** Right now a failed add-to-queue just
  shows an alert. A nicer flow would call `GET /me/player/devices` first and let the
  user pick a target device, or prompt them to open Spotify before retrying.

## Quality-of-life improvements

- **Cache playlists.** The playlist picker re-fetches `/me/playlists` every time it
  opens (both for add-to and browse). Fine for typical libraries, but a light
  in-memory cache with pull-to-refresh would cut redundant calls if this gets used a
  lot in one session.
- **Show pagination for search results.** Search is capped at 10 results — Spotify's
  `/search` endpoint now maxes `limit` at 10 (`searchTracks` in
  `src/api/spotify.ts`); there's no "load more."
- **Paginate playlist tracks.** `PlaylistDetailModal` loads only the first 100 tracks
  (`getPlaylistTracks` in `src/api/spotify.ts`); longer playlists are truncated with
  no "load more."
- **Loading/error states polish.** Current states are functional (text + Alert) but
  minimal — no retry buttons, no skeleton loaders.

## Explicitly out of scope (per the original spec)

These would be natural extensions but were deliberately left out — call this out if
priorities change:

- Playback controls (play/pause/skip/seek), volume, shuffle/repeat.
- Browsing albums or artists. (Viewing a playlist's tracks *is* now supported.)
- Creating new playlists.
- Search beyond tracks (artists, albums, episodes, podcasts).
- Any offline/local caching of track data beyond the current session.

## Known limitations to flag to users

- Add-to-queue requires Spotify **Premium** and an active device — this is a Spotify
  API restriction, not something the app can work around.
- **Removing a track from the queue is impossible** via the Web API — Spotify exposes
  no such endpoint (only add-to-queue and skip-to-next). The queue view is read-only
  by necessity. Removing from a *playlist* is supported.
- Removing from a playlist only works on playlists you own or can edit; others' shared
  playlists will return a 403.
- No account/profile screen — the only account-related action is logging out.
