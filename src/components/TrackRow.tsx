import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SpotifyTrack } from '../types/spotify';

interface Props {
  track: SpotifyTrack;
  onAddToQueue: () => void;
  onAddToPlaylist: () => void;
  busy?: boolean;
}

export function TrackRow({ track, onAddToQueue, onAddToPlaylist, busy }: Props) {
  const artwork = track.album.images[track.album.images.length - 1]?.url;
  const artistNames = track.artists.map((a) => a.name).join(', ');

  return (
    <View style={styles.row}>
      {artwork ? (
        <Image source={{ uri: artwork }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {artistNames}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable disabled={busy} onPress={onAddToQueue} style={styles.actionButton}>
          <Text style={styles.actionText}>Queue</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={onAddToPlaylist} style={styles.actionButton}>
          <Text style={styles.actionText}>Playlist</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  art: { width: 48, height: 48, borderRadius: 4, backgroundColor: '#222' },
  artPlaceholder: { backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#b3b3b3', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row' },
  actionButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  actionText: { color: '#000', fontSize: 12, fontWeight: '700' },
});
