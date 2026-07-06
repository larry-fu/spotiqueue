import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onLogin: () => void;
  isLoggingIn: boolean;
  canLogin: boolean;
}

export function LoginScreen({ onLogin, isLoggingIn, canLogin }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>spotiQueue</Text>
      <Text style={styles.subtitle}>
        Search for songs, then add them to your playback queue or a playlist.
      </Text>
      <Pressable
        style={[styles.button, !canLogin && styles.buttonDisabled]}
        onPress={onLogin}
        disabled={!canLogin || isLoggingIn}
      >
        {isLoggingIn ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Connect with Spotify</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#b3b3b3', fontSize: 15, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#1DB954', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
