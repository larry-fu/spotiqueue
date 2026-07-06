# Next Steps

The app currently covers exactly three operations: search, add to queue, add to
playlist. Nothing else is implemented by design. If the scope ever expands, here's
what's worth doing first, roughly in priority order.

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
  opens. Fine for typical libraries, but a light in-memory cache with pull-to-refresh
  would cut redundant calls if this gets used a lot in one session.
- **Show pagination for search results.** Search is capped at 25 results
  (`searchTracks` in `src/api/spotify.ts`); there's no "load more."
- **Loading/error states polish.** Current states are functional (text + Alert) but
  minimal — no retry buttons, no skeleton loaders.

## Explicitly out of scope (per the original spec)

These would be natural extensions but were deliberately left out — call this out if
priorities change:

- Playback controls (play/pause/skip/seek), volume, shuffle/repeat.
- Browsing albums, artists, or existing playlist contents.
- Removing tracks from a queue or playlist.
- Creating new playlists.
- Search beyond tracks (artists, albums, episodes, podcasts).
- Any offline/local caching of track data beyond the current session.

## Known limitations to flag to users

- Add-to-queue requires Spotify **Premium** and an active device — this is a Spotify
  API restriction, not something the app can work around.
- No account/profile screen — the only account-related action is logging out.
