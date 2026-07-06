import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SpotifyTrack } from '../types/spotify';

interface Props {
  track: SpotifyTrack;
  // Optional right-aligned slot, e.g. a Remove button. Omit for a read-only row.
  right?: React.ReactNode;
}

export function TrackListItem({ track, right }: Props) {
  const artwork = track.album?.images?.[track.album.images.length - 1]?.url;
  const artistNames = track.artists?.map((a) => a.name).join(', ') ?? '';

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
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  art: { width: 48, height: 48, borderRadius: 4, backgroundColor: '#222' },
  artPlaceholder: { backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#b3b3b3', fontSize: 13, marginTop: 2 },
});
