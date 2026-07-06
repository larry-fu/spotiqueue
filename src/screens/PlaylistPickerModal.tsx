import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getUserPlaylists, playlistTrackCount } from '../api/spotify';
import { SpotifyPlaylist } from '../types/spotify';

interface Props {
  visible: boolean;
  getAccessToken: () => Promise<string | null>;
  onClose: () => void;
  onSelect: (playlist: SpotifyPlaylist) => void;
  title?: string;
}

export function PlaylistPickerModal({
  visible,
  getAccessToken,
  onClose,
  onSelect,
  title = 'Add to Playlist',
}: Props) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
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
        const items = await getUserPlaylists(token);
        if (!cancelled) setPlaylists(items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load playlists');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, getAccessToken]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          {loading && <ActivityIndicator color="#1DB954" style={styles.spinner} />}
          {error && <Text style={styles.error}>{error}</Text>}
          <FlatList
            data={playlists}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <Pressable style={styles.playlistRow} onPress={() => onSelect(item)}>
                <Text style={styles.playlistName}>{item.name}</Text>
                <Text style={styles.playlistCount}>{playlistTrackCount(item)} tracks</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              !loading && !error ? <Text style={styles.empty}>No playlists found.</Text> : null
            }
          />
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
  headerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  close: { color: '#1DB954', fontSize: 15 },
  spinner: { marginVertical: 16 },
  error: { color: '#f15e6c', marginBottom: 12 },
  playlistRow: { paddingVertical: 12, borderBottomColor: '#282828', borderBottomWidth: 1 },
  playlistName: { color: '#fff', fontSize: 15 },
  playlistCount: { color: '#b3b3b3', fontSize: 12, marginTop: 2 },
  empty: { color: '#b3b3b3', textAlign: 'center', marginTop: 24 },
});
