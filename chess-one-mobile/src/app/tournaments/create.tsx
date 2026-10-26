import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CreateTournamentForm } from '../../components/tournament/CreateTournamentForm';
import { COLORS } from '../../constants/chessone-theme';
import { useCan } from '../../hooks/useCan';

export default function CreateTournamentScreen() {
  const router = useRouter();
  const canCreate = useCan('TOURNAMENT_CREATE');

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tournaments' as any);
    }
  };

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.forbiddenContainer}>
          <Feather name="shield-off" size={48} color="#DC2626" style={{ marginBottom: 16 }} />
          <Text style={styles.forbiddenTitle}>Access Restricted</Text>
          <Text style={styles.forbiddenSubtitle}>
            Only tournament organisers have permission to create tournaments. Please switch to an Organiser role or account.
          </Text>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={handleClose}>
            <Text style={styles.backBtnText}>Back to Tournaments</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CreateTournamentForm
          onClose={handleClose}
          onSuccess={(tournamentId) => {
            router.replace(`/tournaments/${tournamentId}` as any);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forbiddenContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forbiddenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  forbiddenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textBody,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
