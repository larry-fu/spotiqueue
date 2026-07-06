# spotiQueue

A minimal Expo / React Native app for searching Spotify and managing what plays
next. Log in with your Spotify account, search for a track, and add it to your
playback queue or one of your playlists — plus review your current queue and edit
playlist contents.

## Features

- **Log in with Spotify** — OAuth via a custom-scheme dev build (`spotiqueue://redirect`).
- **Search tracks** — debounced live search against the Spotify catalog.
- **Add to queue** — drop a track into your active playback queue (requires Premium
  and an active device).
- **Add to playlist** — pick one of your playlists and add the track to it.
- **View queue** — see what's playing now and what's up next (read-only, see below).
- **View playlist** — browse the tracks in any of your playlists.
- **Remove from playlist** — delete a track from a playlist you own.

Every add/remove action is gated behind a short confirmation prompt (a "speed bump")
so a stray tap can't silently change your queue or a playlist.

### What's intentionally not here

- **Removing tracks from the queue.** Spotify's Web API exposes no endpoint for
  removing an arbitrary queued item — only *add to queue* and *skip to next*. The
  queue view is therefore read-only, and shows a note to that effect. This is an API
  limitation, not an app one.
- Playback controls, creating playlists, and non-track search. See
  [`NEXT_STEPS.md`](./NEXT_STEPS.md).

## Tech stack

- Expo SDK 57 / React Native 0.86 (dev client — not Expo Go, because the custom
  OAuth redirect needs it)
- `expo-auth-session` + `expo-crypto` for the PKCE auth flow
- `expo-secure-store` for token storage
- TypeScript

## Quick start

```bash
npm install
npx expo run:android   # or: npx expo run:ios
```

You'll need a Spotify app (for the Client ID) and, on Android, a running emulator or
device. Full setup — creating the Spotify app, configuring the Client ID, and the
Linux/Android-emulator troubleshooting notes — is in [`RUN.md`](./RUN.md).

## Project layout

```
App.tsx                      auth gate: LoginScreen vs SearchScreen
src/
  api/spotify.ts             Spotify Web API calls (search, queue, playlists)
  auth/useSpotifyAuth.ts     OAuth + token lifecycle
  config/spotify.ts          Client ID, redirect URI, scopes
  types/spotify.ts           shared API types
  components/
    TrackRow.tsx             search-result row (Queue / Playlist actions)
    TrackListItem.tsx        shared artwork+title row (queue & playlist views)
  screens/
    LoginScreen.tsx
    SearchScreen.tsx         search + header entry points to the modals
    PlaylistPickerModal.tsx  choose a playlist (add-to or browse)
    PlaylistDetailModal.tsx  playlist tracks + remove
    QueueModal.tsx           read-only current queue
```

## Documentation

- [`RUN.md`](./RUN.md) — full setup, running, and troubleshooting.
- [`ANDROID_SDK_SETUP.md`](./ANDROID_SDK_SETUP.md) — Android SDK/emulator setup.
- [`NEXT_STEPS.md`](./NEXT_STEPS.md) — roadmap and known limitations.
