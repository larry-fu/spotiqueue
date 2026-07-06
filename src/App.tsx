import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSpotifyAuth } from './src/auth/useSpotifyAuth';
import { LoginScreen } from './src/screens/LoginScreen';
import { SearchScreen } from './src/screens/SearchScreen';

export default function App() {
  const { isReady, isAuthenticated, isLoggingIn, canLogin, login, logout, getValidAccessToken } =
    useSpotifyAuth();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1DB954" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {isAuthenticated ? (
        <SearchScreen getValidAccessToken={getValidAccessToken} onLogout={logout} />
      ) : (
        <LoginScreen onLogin={login} isLoggingIn={isLoggingIn} canLogin={canLogin} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // RN's SafeAreaView only insets on iOS; Android's translucent status bar would
  // otherwise overlap (and swallow taps on) the header row, so pad it manually.
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0,
  },
  loading: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
});
