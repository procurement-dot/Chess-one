import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { gameStore, ConnectionStatus } from '../../store/gameStore';
import { gameSocket } from '../../socket/game.socket';
import { gameService } from '../../services/game.service';
import { getApiBaseUrl } from '../../services/apiClient';

interface ConnectionStatusPillProps {
  onRetry?: () => void;
  style?: any;
}

export const ConnectionStatusPill: React.FC<ConnectionStatusPillProps> = ({ onRetry, style }) => {
  const router = useRouter();
  const liveState = useSyncExternalStore(
    (cb) => gameStore.subscribe(cb),
    () => gameStore.getState()
  );
  const status: ConnectionStatus = liveState.connectionStatus;

  // Check ?debug=1 from query parameters
  const [isDebug, setIsDebug] = useState(false);
  const [debugPresence, setDebugPresence] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location) {
      const search = window.location.search || '';
      if (search.includes('debug=1')) {
        setIsDebug(true);
      }
    }
  }, []);

  const loadDebugPresence = async () => {
    try {
      setDebugLoading(true);
      const res = await gameService.getPresence();
      setDebugPresence(res);
    } catch (err: any) {
      setDebugPresence({ error: err.message || 'Failed to fetch presence' });
    } finally {
      setDebugLoading(false);
    }
  };

  useEffect(() => {
    if (isDebug) {
      loadDebugPresence();
    }
  }, [isDebug, status]);

  const handleRetry = () => {
    gameSocket.ensureConnected();
    if (onRetry) {
      onRetry();
    }
    if (isDebug) {
      loadDebugPresence();
    }
  };

  const isConnected = status === 'connected' || status === 'authenticated';
  const isConnecting = status === 'connecting';
  const isAuthError = status === 'auth_error';
  const isOffline = status === 'offline' || status === 'disconnected';

  const socketDebug = gameSocket.getDebugInfo();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.pill,
          isConnected && styles.pillConnected,
          isConnecting && styles.pillConnecting,
          isOffline && styles.pillOffline,
          isAuthError && styles.pillAuthError,
        ]}
      >
        <View
          style={[
            styles.dot,
            isConnected && styles.dotConnected,
            isConnecting && styles.dotConnecting,
            isOffline && styles.dotOffline,
            isAuthError && styles.dotAuthError,
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected && 'Connected'}
          {isConnecting && 'Connecting…'}
          {isOffline && 'Offline'}
          {isAuthError && 'Session expired'}
        </Text>

        {isOffline && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleRetry}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}

        {isAuthError && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/login')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionText}>Sign in</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Debug Info Panel when ?debug=1 is in URL */}
      {isDebug && (
        <View style={styles.debugBox}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>🔧 Debug Info (?debug=1)</Text>
            <TouchableOpacity onPress={loadDebugPresence} disabled={debugLoading}>
              <Text style={styles.debugRefresh}>
                {debugLoading ? 'Refreshing...' : '🔄 Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.debugLine}>
            <Text style={styles.debugKey}>API URL: </Text>
            {getApiBaseUrl()}
          </Text>
          <Text style={styles.debugLine}>
            <Text style={styles.debugKey}>Socket ID: </Text>
            {socketDebug.socketId || 'Not connected'}
          </Text>
          <Text style={styles.debugLine}>
            <Text style={styles.debugKey}>Transport: </Text>
            {socketDebug.transport || 'none'}
          </Text>
          <Text style={styles.debugLine}>
            <Text style={styles.debugKey}>Socket Status: </Text>
            {status}
          </Text>
          {debugPresence && (
            <View style={styles.debugSubBox}>
              <Text style={styles.debugKey}>Presence (/api/users/presence):</Text>
              <Text style={styles.debugSubLine}>
                Me: ID {debugPresence.me?.id ?? 'N/A'} | Online:{' '}
                {debugPresence.me?.isOnline ? 'YES' : 'NO'} | Sockets:{' '}
                {debugPresence.me?.socketCount ?? 0}
              </Text>
              <Text style={styles.debugSubLine}>
                Online IDs: [{debugPresence.onlineUserIds?.join(', ') || 'none'}]
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillConnected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  pillConnecting: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FFF59D',
  },
  pillOffline: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  pillAuthError: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotConnected: {
    backgroundColor: '#2E7D32',
  },
  dotConnecting: {
    backgroundColor: '#F57F17',
  },
  dotOffline: {
    backgroundColor: '#C62828',
  },
  dotAuthError: {
    backgroundColor: '#E65100',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  actionBtn: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
  },
  debugBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#444444',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 4,
  },
  debugTitle: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugRefresh: {
    color: '#64B5F6',
    fontSize: 11,
    fontWeight: '600',
  },
  debugLine: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  debugKey: {
    color: '#81D4FA',
    fontWeight: 'bold',
  },
  debugSubBox: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  debugSubLine: {
    color: '#EEEEEE',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
