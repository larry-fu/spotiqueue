import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addTrackToPlaylist, addTrackToQueue, searchTracks, SpotifyApiError } from '../api/spotify';
import { TrackRow } from '../components/TrackRow';
import { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';
import { PlaylistPickerModal } from './PlaylistPickerModal';

interface Props {
  getValidAccessToken: () => Promise<string | null>;
  onLogout: () => void;
}

const DEBOUNCE_MS = 400;

// Speed bump: make add actions require an explicit confirm so a stray tap can't
// silently queue a song or mutate a playlist. Resolves true if the user confirms.
function confirmAdd(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Add', onPress: () => resolve(true) },
    ]);
  });
}

export function SearchScreen({ getValidAccessToken, onLogout }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyTrackId, setBusyTrackId] = useState<string | null>(null);
  const [pickerTrack, setPickerTrack] = useState<SpotifyTrack | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getValidAccessToken();
        if (!token) {
          setError('Session expired. Please log in again.');
          onLogout();
          return;
        }
        setResults(await searchTracks(token, query));
      } catch (e) {
        setError(e instanceof SpotifyApiError ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, getValidAccessToken, onLogout]);

  const handleAddToQueue = useCallback(
    async (track: SpotifyTrack) => {
      const ok = await confirmAdd('Add to queue?', `Add "${track.name}" to your playback queue?`);
      if (!ok) return;
      setBusyTrackId(track.id);
      try {
        const token = await getValidAccessToken();
        if (!token) throw new Error('Session expired. Please log in again.');
        await addTrackToQueue(token, track.uri);
        Alert.alert('Added to queue', `"${track.name}" was added to your playback queue.`);
      } catch (e) {
        const message =
          e instanceof SpotifyApiError && e.status === 404
            ? 'No active device found. Open Spotify and start playing something first.'
            : e instanceof Error
            ? e.message
            : 'Could not add to queue.';
        Alert.alert('Add to queue failed', message);
      } finally {
        setBusyTrackId(null);
      }
    },
    [getValidAccessToken]
  );

  const handleSelectPlaylist = useCallback(
    async (playlist: SpotifyPlaylist) => {
      if (!pickerTrack) return;
      const track = pickerTrack;
      setPickerTrack(null);
      const ok = await confirmAdd(
        'Add to playlist?',
        `Add "${track.name}" to "${playlist.name}"?`
      );
      if (!ok) return;
      setBusyTrackId(track.id);
      try {
        const token = await getValidAccessToken();
        if (!token) throw new Error('Session expired. Please log in again.');
        await addTrackToPlaylist(token, playlist.id, track.uri);
        Alert.alert('Added to playlist', `"${track.name}" was added to "${playlist.name}".`);
      } catch (e) {
        Alert.alert('Add to playlist failed', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setBusyTrackId(null);
      }
    },
    [pickerTrack, getValidAccessToken]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>spotiQueue</Text>
        <Pressable onPress={onLogout}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Search for a song"
        placeholderTextColor="#777"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {loading && <Text style={styles.status}>Searching…</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TrackRow
            track={item}
            busy={busyTrackId === item.id}
            onAddToQueue={() => handleAddToQueue(item)}
            onAddToPlaylist={() => setPickerTrack(item)}
          />
        )}
        ListEmptyComponent={
          !loading && query.trim() ? <Text style={styles.status}>No results.</Text> : null
        }
      />
      <PlaylistPickerModal
        visible={!!pickerTrack}
        getAccessToken={getValidAccessToken}
        onClose={() => setPickerTrack(null)}
        onSelect={handleSelectPlaylist}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logout: { color: '#1DB954', fontSize: 14 },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 15,
  },
  status: { color: '#b3b3b3', textAlign: 'center', marginTop: 24 },
  errorText: { color: '#f15e6c', textAlign: 'center', marginBottom: 8 },
});
