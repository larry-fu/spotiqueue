import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getPlaylistTracks, removeTrackFromPlaylist, SpotifyApiError } from '../api/spotify';
import { TrackListItem } from '../components/TrackListItem';
import { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';

interface Props {
  visible: boolean;
  playlist: SpotifyPlaylist | null;
  getAccessToken: () => Promise<string | null>;
  onClose: () => void;
}

// Speed bump: removing a track from a playlist is destructive, so confirm first.
function confirmRemove(track: SpotifyTrack, playlistName: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert('Remove from playlist?', `Remove "${track.name}" from "${playlistName}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function PlaylistDetailModal({ visible, playlist, getAccessToken, onClose }: Props) {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyUri, setBusyUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !playlist) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTracks([]);
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        if (!cancelled) {
          setError('Session expired. Please log in again.');
          setLoading(false);
        }
        return;
      }
      try {
        const items = await getPlaylistTracks(token, playlist.id);
        if (!cancelled) setTracks(items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load tracks');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, playlist, getAccessToken]);

  const handleRemove = async (track: SpotifyTrack) => {
    if (!playlist) return;
    const ok = await confirmRemove(track, playlist.name);
    if (!ok) return;
    setBusyUri(track.uri);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Session expired. Please log in again.');
      await removeTrackFromPlaylist(token, playlist.id, track.uri);
      // Drop every instance of this URI from the local list.
      setTracks((prev) => prev.filter((t) => t.uri !== track.uri));
    } catch (e) {
      const message =
        e instanceof SpotifyApiError && e.status === 403
          ? "You don't have permission to edit this playlist."
          : e instanceof Error
          ? e.message
          : 'Could not remove track.';
      Alert.alert('Remove failed', message);
    } finally {
      setBusyUri(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText} numberOfLines={1}>
              {playlist?.name ?? 'Playlist'}
            </Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          {loading && <ActivityIndicator color="#1DB954" style={styles.spinner} />}
          {error && <Text style={styles.error}>{error}</Text>}

          {!loading && !error && (
            <FlatList
              data={tracks}
              keyExtractor={(t, i) => `${t.id}-${i}`}
              renderItem={({ item }) => (
                <TrackListItem
                  track={item}
                  right={
                    <Pressable
                      disabled={busyUri === item.uri}
                      onPress={() => handleRemove(item)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeText}>
                        {busyUri === item.uri ? '…' : 'Remove'}
                      </Text>
                    </Pressable>
                  }
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>This playlist has no tracks.</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#121212',
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, marginRight: 12 },
  close: { color: '#1DB954', fontSize: 15 },
  spinner: { marginVertical: 16 },
  error: { color: '#f15e6c', marginBottom: 12 },
  removeButton: {
    borderColor: '#f15e6c',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  removeText: { color: '#f15e6c', fontSize: 12, fontWeight: '700' },
  empty: { color: '#b3b3b3', textAlign: 'center', marginTop: 24 },
});
