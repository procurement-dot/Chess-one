import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isAxiosError } from 'axios';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { PERMISSIONS, Permission } from '../../constants/permissions';
import { useAuthStore, authStore } from '../../store/authStore';
import { useCan } from '../../hooks/useCan';
import { roleStore } from '../../features/roles/roleStore';
import { Can } from '../../components/auth/Can';
import { apiClient, isForbiddenError } from '../../services/apiClient';

function PermissionRow({ permission }: { permission: Permission }) {
  const allowed = useCan(permission);
  return (
    <View style={styles.tableRow}>
      <Text style={styles.permissionName}>{permission}</Text>
      <Text style={styles.permissionStatus}>{allowed ? '✅' : '❌'}</Text>
    </View>
  );
}

const SEED_USERS = [
  { label: 'Student 1', email: 'student1@chessone.local' },
  { label: 'Organiser', email: 'organiser@chessone.local' },
  { label: 'Admin', email: 'admin@chessone.local' },
  { label: 'Parent', email: 'parent@chessone.local' },
];

export default function RbacDevScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!__DEV__) {
      router.replace('/');
    }
  }, [router]);

  if (!__DEV__) {
    return null;
  }

  const handleDevLogin = async (email: string) => {
    setLoadingAction(`login-${email}`);
    try {
      const res = await apiClient.post('/api/auth/dev-login', { email });
      if (res.data?.user && res.data?.token) {
        authStore.setGoogleAuth({
          user: res.data.user,
          idToken: null,
          chessOneToken: res.data.token,
        });
        if (res.data.user?.role) {
          roleStore.syncFromServer(res.data.user.role);
        }
        setTestResult(`Logged in as ${email}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestResult(`Dev-login error: ${err.message}`);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTestRoute = async (endpoint: string, label: string) => {
    setLoadingAction(label);
    try {
      const res = await apiClient.get(endpoint);
      setTestResult(`${label} -> ${res.status} OK: ${JSON.stringify(res.data)}`);
    } catch (err: unknown) {
      if (isForbiddenError(err)) {
        setTestResult(`${label} -> 403 FORBIDDEN: "${err.message}"`);
      } else if (isAxiosError(err)) {
        const status = err.response?.status ?? 'ERR';
        const msg = err.response?.data?.error?.message ?? err.message;
        setTestResult(`${label} -> ${status}: "${msg}"`);
      } else if (err instanceof Error) {
        setTestResult(`${label} -> Error: ${err.message}`);
      } else {
        setTestResult(`${label} -> Unexpected error`);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const permissionKeys = Object.keys(PERMISSIONS) as Permission[];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>RBAC Dev Screen</Text>
        <Text style={styles.subtitle}>Permissions & Access Control Tester</Text>

        {/* Current User Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current User</Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>ID: </Text>
            {user?.id ?? 'Not logged in'}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>Email: </Text>
            {user?.email ?? 'None'}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.label}>Role: </Text>
            {user?.role ?? 'None'}
          </Text>
        </View>

        {/* Quick Dev-Login Switcher */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Switch User</Text>
          <View style={styles.buttonRow}>
            {SEED_USERS.map((item) => (
              <TouchableOpacity
                key={item.email}
                style={[
                  styles.chipButton,
                  user?.email === item.email && styles.chipButtonActive,
                ]}
                onPress={() => handleDevLogin(item.email)}
                disabled={Boolean(loadingAction)}
              >
                <Text
                  style={[
                    styles.chipButtonText,
                    user?.email === item.email && styles.chipButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Permissions Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Permissions for Current Role</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCol}>Permission</Text>
            <Text style={styles.tableHeaderColRight}>Allowed</Text>
          </View>
          {permissionKeys.map((p) => (
            <PermissionRow key={p} permission={p} />
          ))}
        </View>

        {/* Backend Endpoint Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Test Routes</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleTestRoute('/api/rbac-test/whoami', 'GET /whoami')}
            disabled={Boolean(loadingAction)}
          >
            <Text style={styles.actionButtonText}>GET /api/rbac-test/whoami</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleTestRoute('/api/rbac-test/organiser', 'GET /organiser')}
            disabled={Boolean(loadingAction)}
          >
            <Text style={styles.actionButtonText}>GET /api/rbac-test/organiser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleTestRoute('/api/rbac-test/student', 'GET /student')}
            disabled={Boolean(loadingAction)}
          >
            <Text style={styles.actionButtonText}>GET /api/rbac-test/student</Text>
          </TouchableOpacity>

          {loadingAction && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.loadingText}>Running {loadingAction}...</Text>
            </View>
          )}

          {testResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Response Result:</Text>
              <Text style={styles.resultText}>{testResult}</Text>
            </View>
          )}
        </View>

        {/* Can Component Test Block */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>&lt;Can&gt; Component Check</Text>
          <Can permission="TOURNAMENT_CREATE">
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                You can see this because you can create tournaments
              </Text>
            </View>
          </Can>
          <Text style={styles.noticeHint}>
            (The banner above is only rendered for users with TOURNAMENT_CREATE permission)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: SIZES.fontHeading,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    color: COLORS.textBody,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 12,
  },
  cardText: {
    fontSize: SIZES.fontBody,
    color: COLORS.textHeading,
    marginBottom: 6,
  },
  label: {
    fontWeight: '700',
    color: COLORS.textBody,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusChip,
    backgroundColor: COLORS.boardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipButtonText: {
    fontSize: 13,
    color: COLORS.textHeading,
    fontWeight: '600',
  },
  chipButtonTextActive: {
    color: COLORS.white,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  tableHeaderCol: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textBody,
    textTransform: 'uppercase',
  },
  tableHeaderColRight: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textBody,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  permissionName: {
    fontSize: 14,
    color: COLORS.textHeading,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  permissionStatus: {
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusButton,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textBody,
  },
  resultBox: {
    marginTop: 12,
    backgroundColor: COLORS.boardLight,
    borderRadius: SIZES.radiusButton,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textBody,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  resultText: {
    fontSize: 13,
    color: COLORS.textHeading,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noticeBox: {
    backgroundColor: COLORS.hero,
    borderRadius: SIZES.radiusButton,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.progressFill,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  noticeHint: {
    fontSize: 12,
    color: COLORS.textBody,
    fontStyle: 'italic',
  },
});
