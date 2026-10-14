import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';
import { AppHeader } from '../components/navigation/AppHeader';
import { AppFooter } from '../components/navigation/AppFooter';
import { gameService } from '../services/game.service';
import { useAuthStore } from '../store/authStore';
import { Game } from '../types/game.types';

export default function AnalysisScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'My games' | 'World games'>('My games');
  const [analysisMode, setAnalysisMode] = useState<'Self' | 'AI Coach One' | 'My coach' | 'Invited members'>('Self');
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    gameService.getMyGames()
      .then((res) => {
        if (res.games && res.games.length > 0) {
          setGames(res.games);
        }
      })
      .catch((err) => {
        console.log('Error fetching games for analysis:', err);
      });
  }, [isAuthenticated]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setSavedNotes([...savedNotes, noteText.trim()]);
    setNoteText('');
  };

  const currentGame = games[selectedGameIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="Analysis" subtitle="Game Review & Deep Insights" showBack={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={styles.eyebrow}>ANALYSIS</Text>
          <Text style={styles.heading}>Your game. More ways to learn.</Text>
          <Text style={styles.subtitle}>Replay the position, add an idea and choose who helps you analyse.</Text>
        </View>

        {/* Scope Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'My games' && styles.tabBtnActive]}
            onPress={() => setActiveTab('My games')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'My games' && styles.tabBtnTextActive]}>My games</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'World games' && styles.tabBtnActive]}
            onPress={() => setActiveTab('World games')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'World games' && styles.tabBtnTextActive]}>World games</Text>
          </TouchableOpacity>
        </View>

        {/* Game Selector */}
        <View style={styles.whiteCard}>
          <Text style={styles.cardTitle}>Select game to analyse</Text>
          {games.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {games.slice(0, 5).map((g, idx) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.gameChip, selectedGameIndex === idx && styles.gameChipActive]}
                    onPress={() => setSelectedGameIndex(idx)}
                  >
                    <Text style={[styles.gameChipText, selectedGameIndex === idx && styles.gameChipTextActive]}>
                      Match #{g.id} ({g.result ? g.result.toLowerCase() : 'completed'})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.emptyNote}>
              Sample Opening Practice Game (Play games to populate your library)
            </Text>
          )}

          {currentGame && (
            <TouchableOpacity
              style={styles.reviewModalLink}
              onPress={() => router.push(`/game/result/${currentGame.id}` as any)}
            >
              <Text style={styles.reviewModalLinkText}>Open Full Move Review in Result Hub ›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Review Modes */}
        <View style={styles.tabsRow}>
          {(['Self', 'AI Coach One', 'My coach', 'Invited members'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.tabBtn, analysisMode === mode && styles.tabBtnActive]}
              onPress={() => setAnalysisMode(mode)}
            >
              <Text style={[styles.tabBtnText, analysisMode === mode && styles.tabBtnTextActive]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Analysis Guidance Box */}
        {analysisMode === 'Self' && (
          <View style={styles.whiteCard}>
            <Text style={styles.cardTitle}>You are the analyst.</Text>
            <Text style={styles.bodyText}>First, describe the threat. Then write candidate moves and explain your choice.</Text>
            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceText}>Checks → Captures → Threats → Piece safety</Text>
            </View>
          </View>
        )}

        {analysisMode === 'AI Coach One' && (
          <View style={styles.coachCard}>
            <View style={styles.coachHead}>
              <View style={styles.coachAvatar}><Text style={{ fontSize: 18 }}>🧙‍♂️</Text></View>
              <Text style={styles.cardTitle}>Coach One · Review Guidance</Text>
            </View>
            <Text style={styles.coachBodyText}>
              “Look at the piece development and central control. Are your pieces coordinating smoothly?”
            </Text>
          </View>
        )}

        {analysisMode === 'My coach' && (
          <View style={styles.whiteCard}>
            <Text style={styles.cardTitle}>Ask Meera Shah</Text>
            <Text style={styles.bodyText}>Level 3 FIDE Trainer · Junior Knights batch</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What would you like help with? e.g. Could you explain the opening?"
              placeholderTextColor={COLORS.textBody}
              multiline
            />
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Request Coach Feedback</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ideas and Notes */}
        <View style={styles.whiteCard}>
          <Text style={styles.cardTitle}>Ideas at this position</Text>
          {savedNotes.length > 0 ? (
            savedNotes.map((note, idx) => (
              <View key={idx} style={styles.savedNoteBox}>
                <Text style={styles.savedNoteText}>{note}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyNote}>No notes yet. What do you notice?</Text>
          )}

          <TextInput
            style={styles.textInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Your idea: What was the threat? Which move would you consider?"
            placeholderTextColor={COLORS.textBody}
            multiline
          />
          <TouchableOpacity style={styles.addNoteBtn} onPress={handleAddNote}>
            <Text style={styles.addNoteBtnText}>Add my note</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppFooter activeTab="learn" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
    gap: 14,
  },
  headerArea: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.progressFill,
    letterSpacing: 1.2,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textBody,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: COLORS.hero,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  bodyText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 17,
  },
  gameChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gameChipActive: {
    backgroundColor: COLORS.hero,
    borderColor: COLORS.primary,
  },
  gameChipText: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  gameChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyNote: {
    fontSize: 12,
    color: COLORS.textBody,
    fontStyle: 'italic',
  },
  reviewModalLink: {
    marginTop: 4,
  },
  reviewModalLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  guidanceBox: {
    backgroundColor: '#FAF7F0',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    marginTop: 4,
  },
  guidanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C86848',
    textAlign: 'center',
  },
  coachCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  coachHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachBodyText: {
    fontSize: 12,
    color: COLORS.textHeading,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: COLORS.textHeading,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  addNoteBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addNoteBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  savedNoteBox: {
    backgroundColor: COLORS.hero,
    padding: 10,
    borderRadius: 8,
  },
  savedNoteText: {
    fontSize: 12,
    color: COLORS.primary,
  },
});
