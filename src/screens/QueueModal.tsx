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
import { getQueue } from '../api/spotify';
import { TrackListItem } from '../components/TrackListItem';
import { SpotifyTrack } from '../types/spotify';

interface Props {
  visible: boolean;
  getAccessToken: () => Promise<string | null>;
  onClose: () => void;
}

export function QueueModal({ visible, getAccessToken, onClose }: Props) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SpotifyTrack | null>(null);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
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
        const { currentlyPlaying, queue } = await getQueue(token);
        if (!cancelled) {
          setCurrentlyPlaying(currentlyPlaying);
          setQueue(queue);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load queue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, getAccessToken]);

  const empty = !currentlyPlaying && queue.length === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Up Next</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          {loading && <ActivityIndicator color="#1DB954" style={styles.spinner} />}
          {error && <Text style={styles.error}>{error}</Text>}

          {!loading && !error && (
            <FlatList
              data={queue}
              keyExtractor={(t, i) => `${t.id}-${i}`}
              renderItem={({ item }) => <TrackListItem track={item} />}
              ListHeaderComponent={
                currentlyPlaying ? (
                  <View>
                    <Text style={styles.sectionLabel}>Now playing</Text>
                    <TrackListItem track={currentlyPlaying} />
                    {queue.length > 0 && <Text style={styles.sectionLabel}>Next in queue</Text>}
                  </View>
                ) : null
              }
              ListEmptyComponent={
                empty ? (
                  <Text style={styles.empty}>
                    Nothing is queued. Start playing something in Spotify first.
                  </Text>
                ) : null
              }
              ListFooterComponent={
                !empty ? (
                  <Text style={styles.note}>
                    Spotify's API doesn't allow removing queued items, so this view is read-only.
                  </Text>
                ) : null
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
  headerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  close: { color: '#1DB954', fontSize: 15 },
  spinner: { marginVertical: 16 },
  error: { color: '#f15e6c', marginBottom: 12 },
  sectionLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  empty: { color: '#b3b3b3', textAlign: 'center', marginTop: 24 },
  note: { color: '#777', fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 8 },
});
