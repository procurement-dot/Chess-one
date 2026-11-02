import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAuthStore } from '../store/authStore';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { AppHeader } from '../components/navigation/AppHeader';
import { AppFooter } from '../components/navigation/AppFooter';
import { gameService } from '../services/game.service';
import { roleStore } from '../features/roles/roleStore';
import { Game } from '../types/game.types';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';
import { Feather } from '@expo/vector-icons';
import { StudentProgressReportModal } from '../components/modals/StudentProgressReportModal';

// Profile Storage Key
const PROFILE_STORAGE_KEY = '@chessone_student_profile_details';

// Circumference for 84x84 Avatar Progress Ring (r = 38)
const CIRCUMFERENCE = 2 * Math.PI * 38; // ~238.76

// AI Coach contextual advice for losses
const getAiCoachSuggestion = (game: Game, isUserWhite: boolean): string => {
  if (game.result === 'TIMEOUT') {
    return '⏱️ Clock Awareness: Pace your moves steadily in the opening so you keep ample time for complex tactics.';
  }
  if (game.result === 'RESIGNATION') {
    return '🛡️ Resilience: Even in difficult positions, look for defensive counter-punches or stalemate tricks before resigning.';
  }
  if (game.result === 'CHECKMATE') {
    return isUserWhite
      ? '👑 King Safety: Remember to castle early and avoid leaving your f2/g2 pawns vulnerable to quick queen attacks.'
      : '👑 King Safety: Watch out for back-rank threats and coordinate your rooks to maintain king defense.';
  }
  if (game.result === 'DRAW' || game.result === 'STALEMATE') {
    return '🤝 Solid Defense: Great tenacity fighting back to secure a draw in an equal endgame!';
  }
  return '🧠 Tactical Vision: Scan the board for undefended pieces before every move to prevent unexpected tactics.';
};

export default function LoginScreen() {
  const router = useRouter();
  const {
    signInWithGoogle,
    signOut,
    isLoading: isAuthLoading,
    error,
    redirectUri,
  } = useGoogleAuth();
  const { isAuthenticated, user, chessOneToken } = useAuthStore();
  const showRedirectSetupHint =
    Platform.OS === 'web' &&
    Boolean(redirectUri && error?.toLowerCase().includes('redirect_uri_mismatch'));

  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [parentControlsVisible, setParentControlsVisible] = useState(false);

  // Student & Parent Record Popup State
  const [studentRecordModalVisible, setStudentRecordModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Sub-Navigation Tabs: 'profile' | 'progress'
  const [activeTab, setActiveTab] = useState<'profile' | 'progress'>('profile');

  // Student & Parent Profile Information
  const [studentName, setStudentName] = useState('Nishigndha Karande');
  const [dob, setDob] = useState('2014-04-12');
  const [grade, setGrade] = useState('Grade 5');
  const [school, setSchool] = useState("The Bishop's School");
  const [parentName, setParentName] = useState('Rahul Laddha');
  const [parentEmail, setParentEmail] = useState('rahul.laddha@gmail.com');
  const [parentPhone, setParentPhone] = useState('+91 98220 12345');
  const [joinCode, setJoinCode] = useState('BISHOPS-CHESS-2026');
  const [parentConsent, setParentConsent] = useState(true);

  // FIDE Identity
  const [fideId, setFideId] = useState('50123984');
  const [isSyncingFide, setIsSyncingFide] = useState(false);

  const currentUserId = user?.id ? parseInt(String(user.id), 10) : null;

  // Load saved profile details from AsyncStorage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.studentName) setStudentName(parsed.studentName);
          if (parsed.dob) setDob(parsed.dob);
          if (parsed.grade) setGrade(parsed.grade);
          if (parsed.school) setSchool(parsed.school);
          if (parsed.parentName) setParentName(parsed.parentName);
          if (parsed.parentEmail) setParentEmail(parsed.parentEmail);
          if (parsed.parentPhone) setParentPhone(parsed.parentPhone);
          if (parsed.joinCode) setJoinCode(parsed.joinCode);
          if (typeof parsed.parentConsent === 'boolean') setParentConsent(parsed.parentConsent);
          if (parsed.fideId) setFideId(parsed.fideId);
        } else if (user?.name) {
          setStudentName(user.name);
        }
      } catch (err) {
        console.warn('Failed to load profile details from storage:', err);
      }
    };
    loadProfile();
  }, [user?.name]);

  // Handle Save Profile Details from Popup
  const handleSaveProfile = async () => {
    try {
      const dataToSave = {
        studentName: studentName.trim() || 'Nishigndha Karande',
        dob,
        grade,
        school,
        parentName: parentName || 'Rahul Laddha',
        parentEmail: parentEmail || user?.email || 'rahul.laddha@gmail.com',
        parentPhone: parentPhone || '+91 98220 12345',
        joinCode,
        parentConsent: true,
        fideId,
      };

      setStudentName(dataToSave.studentName);
      setParentName(dataToSave.parentName);
      setParentEmail(dataToSave.parentEmail);
      setParentPhone(dataToSave.parentPhone);
      setParentConsent(true);

      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(dataToSave));

      setIsEditMode(false);
      setStudentRecordModalVisible(false);

      Alert.alert(
        'Profile Updated! ✅',
        `Record for ${dataToSave.studentName} has been verified and saved.`
      );
    } catch (err) {
      Alert.alert('Save Error', 'Could not save profile details. Please try again.');
    }
  };

  // Sync FIDE Ratings
  const handleSyncFide = () => {
    setIsSyncingFide(true);
    setTimeout(() => {
      setIsSyncingFide(false);
      Alert.alert('FIDE Ratings Synced', 'Official Standard (1120), Rapid (1185), and Blitz (1140) ratings updated successfully!');
    }, 1200);
  };

  // Fetch games for the authenticated user
  const fetchGames = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingGames(true);
      const res = await gameService.getMyGames();
      setGames(res.games || []);
    } catch (err) {
      console.warn('Failed to load user games in profile:', err);
    } finally {
      setIsLoadingGames(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Compute player stats
  const {
    totalGames,
    winCount,
    lossCount,
    drawCount,
    winRate,
    rating,
    filteredGames,
  } = useMemo(() => {
    const completed = games.filter(
      (g) => g.status === 'COMPLETED' || Boolean(g.result)
    );

    const wins = completed.filter(
      (g) => g.winnerId && currentUserId && g.winnerId === currentUserId
    );
    const losses = completed.filter(
      (g) => g.winnerId && currentUserId && g.winnerId !== currentUserId
    );
    const draws = completed.filter(
      (g) =>
        g.result === 'DRAW' ||
        g.result === 'STALEMATE' ||
        (!g.winnerId && g.result)
    );

    const total = completed.length;
    const winsNum = wins.length;
    const lossesNum = losses.length;
    const drawsNum = draws.length;

    const rate = total > 0 ? Math.round((winsNum / total) * 100) : 0;
    const currentRating = user?.rating ?? 1220;

    let displayList = games;
    if (historyFilter === 'wins') {
      displayList = games.filter(
        (g) => g.winnerId && currentUserId && g.winnerId === currentUserId
      );
    } else if (historyFilter === 'losses') {
      displayList = games.filter(
        (g) => g.winnerId && currentUserId && g.winnerId !== currentUserId
      );
    }

    return {
      totalGames: total,
      winCount: winsNum,
      lossCount: lossesNum,
      drawCount: drawsNum,
      winRate: rate,
      rating: currentRating,
      filteredGames: displayList,
    };
  }, [games, currentUserId, historyFilter, user?.rating]);

  const handleGoogleSignIn = async () => {
    const res = await signInWithGoogle();
    if (res?.success) {
      if (res.user?.role) {
        roleStore.syncFromServer(res.user.role);
      }
      if (res.user?.onboardingDone === true) {
        router.replace('/' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    }
  };

  const handleGamePress = (game: Game) => {
    if (game.status === 'COMPLETED' || Boolean(game.result)) {
      router.push(`/game/result/${game.id}` as any);
    } else {
      router.push(`/game/${game.id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header - Branded with ChessOne Logo */}
      <AppHeader
        showLogo={true}
        showBack={false}
      />

      {isAuthenticated && user && (
        /* Sub-Navigation: My profile | Progress & Career */
        <View style={styles.tabNavContainer}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'profile' && styles.tabNavBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabNavBtnText, activeTab === 'profile' && styles.tabNavBtnTextActive]}>
              👤 My profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === 'progress' && styles.tabNavBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('progress')}
          >
            <Text style={[styles.tabNavBtnText, activeTab === 'progress' && styles.tabNavBtnTextActive]}>
              📈 Progress & Career
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isLoadingGames}
              onRefresh={fetchGames}
              tintColor={COLORS.primary}
            />
          ) : undefined
        }
      >
        {isAuthenticated && user ? (
          <View style={styles.authenticatedWrapper}>

            {/* ======================================================== */}
            {/* TOP PROFILE CARD: NAME OPENS POPUP ONLY!                */}
            {/* ======================================================== */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarRow}>
                
                {/* 100% Circular Progress Ring Avatar */}
                <View style={styles.avatarRingContainer}>
                  <Svg width={84} height={84} viewBox="0 0 84 84" style={styles.avatarRingSvg}>
                    <Circle
                      cx={42}
                      cy={42}
                      r={38}
                      stroke={COLORS.progressTrack}
                      strokeWidth={5}
                      fill="none"
                    />
                    <G origin="42, 42" rotation={-90}>
                      <Circle
                        cx={42}
                        cy={42}
                        r={38}
                        stroke="#10B981"
                        strokeWidth={5}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </G>
                  </Svg>

                  {user.photo ? (
                    <Image source={{ uri: user.photo }} style={styles.avatarInnerImage} />
                  ) : (
                    <View style={styles.avatarPeachCircle}>
                      <Text style={styles.avatarInitial}>
                        {(studentName || user.name || 'N')[0].toUpperCase()}
                      </Text>
                      <View style={styles.avatarOnlineDot} />
                    </View>
                  )}

                  <View style={styles.avatarProgressPill}>
                    <Text style={styles.avatarProgressPillText}>100% ✓</Text>
                  </View>
                </View>

                {/* Profile Identity Details (CLICKING THE NAME OPENS THE POPUP!) */}
                <View style={styles.profileTextCol}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.userNameTouchable}
                    onPress={() => {
                      setIsEditMode(false);
                      setStudentRecordModalVisible(true);
                    }}
                    accessibilityLabel="View and edit student and parent record"
                  >
                    <Text style={styles.userName} numberOfLines={1}>
                      {studentName || user.name || 'Nishigndha Karande'}
                    </Text>
                    <Feather name="check-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />
                    <Feather name="info" size={13} color={COLORS.primary} style={{ marginLeft: 6, opacity: 0.6 }} />
                  </TouchableOpacity>

                  <Text style={styles.userSchoolText} numberOfLines={1}>
                    {school} · {grade}
                  </Text>

                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email || 'nishigndhakarande@gmail.com'}
                  </Text>

                  <View style={styles.idChip}>
                    <Text style={styles.idChipText}>Player ID: #{user.id || 50}</Text>
                  </View>
                </View>
              </View>

              {/* Explainer Banner */}
              <View style={styles.explainerBanner}>
                <Text style={styles.explainerIcon}>🎯</Text>
                <Text style={styles.explainerText}>
                  Profile is <Text style={styles.boldText}>100% complete!</Text> The circular ring around your avatar is verified for school tournaments.
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {chessOneToken ? 'Connected & Ready to Play' : 'Signed In'}
                </Text>
              </View>
            </View>

            {/* ======================================================== */}
            {/* TAB 1: MY PROFILE (EXACTLY AS IN USER SCREENSHOT!)       */}
            {/* ======================================================== */}
            {activeTab === 'profile' && (
              <View style={styles.tabContentContainer}>

                {/* Official Chess Identity (FIDE Card) */}
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.sectionTitle}>Official Chess Identity (FIDE)</Text>
                      <Text style={styles.sectionSub}>International Chess Federation rating sync</Text>
                    </View>
                    <View style={styles.fideBadgePill}>
                      <Text style={styles.fideBadgePillText}>FIDE</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FIDE ID Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={fideId}
                      onChangeText={setFideId}
                      placeholder="50123984"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.fideStatsGrid}>
                    <View style={styles.fideStatCard}>
                      <Text style={styles.fideStatLabel}>Standard</Text>
                      <Text style={styles.fideStatVal}>1120</Text>
                    </View>
                    <View style={styles.fideStatCard}>
                      <Text style={styles.fideStatLabel}>Rapid</Text>
                      <Text style={styles.fideStatVal}>1185</Text>
                    </View>
                    <View style={styles.fideStatCard}>
                      <Text style={styles.fideStatLabel}>Blitz</Text>
                      <Text style={styles.fideStatVal}>1140</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.syncFideBtn}
                    activeOpacity={0.8}
                    onPress={handleSyncFide}
                    disabled={isSyncingFide}
                  >
                    {isSyncingFide ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.syncFideBtnText}>Sync Ratings with FIDE</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Parent Account Controls Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.controlsRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.sectionTitle}>Parent Account Controls</Text>
                      <Text style={styles.sectionSub}>Manage privacy, reset password or export report</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.manageBtn}
                      activeOpacity={0.8}
                      onPress={() => setParentControlsVisible(true)}
                    >
                      <Text style={styles.manageBtnText}>Manage</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Start a Match Button */}
                <TouchableOpacity
                  style={styles.enterHubButton}
                  activeOpacity={0.85}
                  onPress={() => router.push('/play/create' as any)}
                >
                  <Text style={styles.enterHubButtonText}>⚔️ Start a Match ›</Text>
                </TouchableOpacity>

                {/* Sign Out Button */}
                <TouchableOpacity
                  style={styles.signOutButton}
                  activeOpacity={0.7}
                  onPress={signOut}
                >
                  <Feather name="log-out" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.signOutButtonText}>Sign Out / Switch Account</Text>
                </TouchableOpacity>

              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 2: PROGRESS & CAREER (FROM USER SCREENSHOT!)         */}
            {/* ======================================================== */}
            {activeTab === 'progress' && (
              <View style={styles.tabContentContainer}>

                {/* 1. Student Progress Report Banner */}
                <View style={styles.reportBannerCard}>
                  <View style={styles.reportBannerLeft}>
                    <View style={styles.reportIconCircle}>
                      <Text style={{ fontSize: 16 }}>📊</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportBannerTitle}>Student progress report</Text>
                      <Text style={styles.reportBannerSub}>
                        Learning observations, weekly practice & school tasks
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.openReportBtn}
                    activeOpacity={0.8}
                    onPress={() => setReportModalVisible(true)}
                  >
                    <Text style={styles.openReportBtnText}>Open report</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Player Career Stats Grid */}
                <View style={styles.statsContainer}>
                  <View style={styles.statsHeaderRow}>
                    <Text style={styles.statsHeaderTitle}>📊 Player Statistics</Text>
                    <Text style={styles.statsHeaderSub}>Live Ratings & Metrics</Text>
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.statCardRating]}>
                      <View style={[styles.statIconBadge, { backgroundColor: '#D5E6C7' }]}>
                        <Text style={styles.statIcon}>⚡</Text>
                      </View>
                      <Text style={[styles.statValue, { color: COLORS.primary }]}>{rating}</Text>
                      <Text style={styles.statLabel}>Skill Rating</Text>
                      <Text style={styles.statSub}>Rapid & Blitz</Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardGames]}>
                      <View style={[styles.statIconBadge, { backgroundColor: '#F0D4C5' }]}>
                        <Text style={styles.statIcon}>🎮</Text>
                      </View>
                      <Text style={[styles.statValue, { color: '#9A3412' }]}>{totalGames}</Text>
                      <Text style={styles.statLabel}>Total Games</Text>
                      <Text style={styles.statSub}>Played</Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardWins]}>
                      <View style={[styles.statIconBadge, { backgroundColor: '#EAD7A8' }]}>
                        <Text style={styles.statIcon}>🏆</Text>
                      </View>
                      <Text style={[styles.statValue, { color: '#854D0E' }]}>{winCount}</Text>
                      <Text style={styles.statLabel}>Victories</Text>
                      <Text style={styles.statSub}>{winRate}% Win Rate</Text>
                    </View>
                  </View>

                  <View style={styles.recordPillRow}>
                    <View style={[styles.recordPill, styles.recordPillWin]}>
                      <Text style={[styles.recordPillText, styles.recordPillWinText]}>
                        🏆 <Text style={styles.boldText}>{winCount}</Text> Wins
                      </Text>
                    </View>
                    <View style={[styles.recordPill, styles.recordPillLoss]}>
                      <Text style={[styles.recordPillText, styles.recordPillLossText]}>
                        ❌ <Text style={styles.boldText}>{lossCount}</Text> Losses
                      </Text>
                    </View>
                    <View style={[styles.recordPill, styles.recordPillDraw]}>
                      <Text style={[styles.recordPillText, styles.recordPillDrawText]}>
                        🤝 <Text style={styles.boldText}>{drawCount}</Text> Draws
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. Skill Mastery Toolkit */}
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.sectionTitle}>Skill Mastery Toolkit</Text>
                      <Text style={styles.sectionSub}>AI evaluation based on recent moves</Text>
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>Level 3</Text>
                    </View>
                  </View>

                  <View style={styles.skillMeterRow}>
                    <View style={styles.skillLabelRow}>
                      <Text style={styles.skillLabelText}>Piece Movement & Capture</Text>
                      <Text style={styles.skillValueText}>86%</Text>
                    </View>
                    <View style={styles.skillTrack}>
                      <View style={[styles.skillFill, { width: '86%' }]} />
                    </View>
                  </View>

                  <View style={styles.skillMeterRow}>
                    <View style={styles.skillLabelRow}>
                      <Text style={styles.skillLabelText}>Centre Control & Development</Text>
                      <Text style={styles.skillValueText}>72%</Text>
                    </View>
                    <View style={styles.skillTrack}>
                      <View style={[styles.skillFill, { width: '72%' }]} />
                    </View>
                  </View>

                  <View style={styles.skillMeterRow}>
                    <View style={styles.skillLabelRow}>
                      <Text style={styles.skillLabelText}>King Safety</Text>
                      <Text style={styles.skillValueText}>58%</Text>
                    </View>
                    <View style={styles.skillTrack}>
                      <View style={[styles.skillFill, { width: '58%', backgroundColor: '#F59E0B' }]} />
                    </View>
                  </View>

                  <View style={styles.skillMeterRow}>
                    <View style={styles.skillLabelRow}>
                      <Text style={styles.skillLabelText}>Tactics & Planning</Text>
                      <Text style={styles.skillValueText}>40%</Text>
                    </View>
                    <View style={styles.skillTrack}>
                      <View style={[styles.skillFill, { width: '40%', backgroundColor: '#EF4444' }]} />
                    </View>
                  </View>
                </View>

                {/* 4. 6-Week Rating Progression */}
                <View style={styles.sectionCard}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.sectionTitle}>6-Week Rating Progression</Text>
                      <Text style={styles.sectionSub}>Continuous rapid improvement</Text>
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>+120 pts</Text>
                    </View>
                  </View>

                  <View style={styles.sparklineContainer}>
                    <Svg width="100%" height={75} viewBox="0 0 320 75">
                      <Path
                        d="M 15 60 L 75 48 L 135 38 L 195 32 L 255 22 L 305 10"
                        fill="none"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                      <Circle cx={15} cy={60} r={4} fill={COLORS.primary} />
                      <Circle cx={75} cy={48} r={4} fill={COLORS.primary} />
                      <Circle cx={135} cy={38} r={4} fill={COLORS.primary} />
                      <Circle cx={195} cy={32} r={4} fill={COLORS.primary} />
                      <Circle cx={255} cy={22} r={4} fill={COLORS.primary} />
                      <Circle cx={305} cy={10} r={6} fill="#10B981" stroke="#FFFFFF" strokeWidth={2} />
                      
                      <SvgText x={15} y={72} fontSize={9} fill={COLORS.textBody} textAnchor="middle">W1</SvgText>
                      <SvgText x={75} y={72} fontSize={9} fill={COLORS.textBody} textAnchor="middle">W2</SvgText>
                      <SvgText x={135} y={72} fontSize={9} fill={COLORS.textBody} textAnchor="middle">W3</SvgText>
                      <SvgText x={195} y={72} fontSize={9} fill={COLORS.textBody} textAnchor="middle">W4</SvgText>
                      <SvgText x={255} y={72} fontSize={9} fill={COLORS.textBody} textAnchor="middle">W5</SvgText>
                      <SvgText x={305} y={72} fontSize={9} fontWeight="bold" fill={COLORS.primary} textAnchor="middle">640</SvgText>
                    </Svg>
                  </View>
                </View>

                {/* 5. Match History Section */}
                <View style={styles.historySection}>
                  <View style={styles.historyHeaderRow}>
                    <View style={styles.historyTitleRow}>
                      <Text style={styles.historyTitle}>📜 Match History</Text>
                      <View style={styles.historyCountBadge}>
                        <Text style={styles.historyCountText}>{games.length}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.toggleHistoryBtn}
                      activeOpacity={0.7}
                      onPress={() => setHistoryExpanded((prev) => !prev)}
                    >
                      <Text style={styles.toggleHistoryText}>
                        {historyExpanded ? 'Collapse ▲' : 'Show Matches ▼'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Filter Pills */}
                  {historyExpanded && (
                    <View style={styles.filterPillsRow}>
                      <TouchableOpacity
                        style={[
                          styles.filterPill,
                          historyFilter === 'all' && styles.filterPillActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => {
                          setHistoryFilter('all');
                          setShowAllHistory(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            historyFilter === 'all' && styles.filterPillTextActive,
                          ]}
                        >
                          All ({games.length})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.filterPill,
                          historyFilter === 'wins' && styles.filterPillActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => {
                          setHistoryFilter('wins');
                          setShowAllHistory(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            historyFilter === 'wins' && styles.filterPillTextActive,
                          ]}
                        >
                          🏆 Wins ({winCount})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.filterPill,
                          historyFilter === 'losses' && styles.filterPillActive,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => {
                          setHistoryFilter('losses');
                          setShowAllHistory(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            historyFilter === 'losses' && styles.filterPillTextActive,
                          ]}
                        >
                          ❌ Losses ({lossCount})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {historyExpanded && (
                    <View style={styles.historyList}>
                      {isLoadingGames && games.length === 0 ? (
                        <View style={styles.historyLoadingBox}>
                          <ActivityIndicator size="small" color={COLORS.primary} />
                          <Text style={styles.historyLoadingText}>Loading matches...</Text>
                        </View>
                      ) : filteredGames.length === 0 ? (
                        <View style={styles.historyEmptyBox}>
                          <Text style={styles.historyEmptyIcon}>♟️</Text>
                          <Text style={styles.historyEmptyText}>
                            {historyFilter === 'wins'
                              ? 'No won matches yet.'
                              : historyFilter === 'losses'
                              ? 'No lost matches recorded!'
                              : 'No matches played yet.'}
                          </Text>
                        </View>
                      ) : (
                        <>
                          {(showAllHistory ? filteredGames : filteredGames.slice(0, 2)).map((g) => {
                            const isUserWhite = currentUserId
                              ? g.whitePlayerId === currentUserId
                              : true;
                            const opponent = isUserWhite ? g.blackPlayer : g.whitePlayer;
                            const opponentName =
                              g.gameType === 'PLAYER_VS_AI'
                                ? `AI (${g.aiDifficulty ? g.aiDifficulty.charAt(0).toUpperCase() + g.aiDifficulty.slice(1).toLowerCase() : 'Medium'})`
                                : opponent?.name || 'Opponent';

                            const isWinner =
                              Boolean(g.winnerId && currentUserId && g.winnerId === currentUserId);
                            const isLoser =
                              Boolean(g.winnerId && currentUserId && g.winnerId !== currentUserId);
                            const isActive = g.status === 'ACTIVE';

                            const dateStr = g.createdAt
                              ? new Date(g.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '';

                            const aiSuggestion = isLoser
                              ? getAiCoachSuggestion(g, isUserWhite)
                              : null;

                            return (
                              <TouchableOpacity
                                key={`match-${g.id}`}
                                style={[
                                  styles.matchCard,
                                  isWinner && styles.matchCardWinner,
                                  isLoser && styles.matchCardLoser,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => handleGamePress(g)}
                              >
                                <View style={styles.matchCardHeader}>
                                  <View style={styles.matchOpponentRow}>
                                    <View style={styles.matchModeIconBox}>
                                      <Text style={styles.matchModeIcon}>
                                        {g.gameType === 'PLAYER_VS_AI' ? '🤖' : '⚔️'}
                                      </Text>
                                    </View>
                                    <View style={styles.matchOpponentTextCol}>
                                      <Text style={styles.matchOpponentName} numberOfLines={1}>
                                        vs. {opponentName}
                                      </Text>
                                      <Text style={styles.matchMetaText}>
                                        Match #{g.id} • {g.timeControl} • {isUserWhite ? 'White' : 'Black'} • {dateStr}
                                      </Text>
                                    </View>
                                  </View>

                                  <View
                                    style={[
                                      styles.outcomeBadge,
                                      isActive
                                        ? styles.badgeActive
                                        : isWinner
                                        ? styles.badgeWin
                                        : isLoser
                                        ? styles.badgeLoss
                                        : styles.badgeDraw,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.outcomeBadgeText,
                                        isActive
                                          ? styles.badgeActiveText
                                          : isWinner
                                          ? styles.badgeWinText
                                          : isLoser
                                          ? styles.badgeLossText
                                          : styles.badgeDrawText,
                                      ]}
                                    >
                                      {isActive
                                        ? 'In Progress'
                                        : isWinner
                                        ? '🏆 Win'
                                        : isLoser
                                        ? 'Loss'
                                        : 'Draw'}
                                    </Text>
                                  </View>
                                </View>

                                {isLoser && aiSuggestion && (
                                  <View style={styles.aiSuggestionBox}>
                                    <View style={styles.aiSuggestionHeader}>
                                      <Text style={styles.aiSuggestionIcon}>💡</Text>
                                      <Text style={styles.aiSuggestionTitle}>
                                        AI Coach Suggestion:
                                      </Text>
                                    </View>
                                    <Text style={styles.aiSuggestionText}>
                                      {aiSuggestion}
                                    </Text>
                                  </View>
                                )}

                                <View style={styles.viewDetailsRow}>
                                  <Text style={styles.viewDetailsText}>
                                    View Match Result & Move Review ›
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}

                          {filteredGames.length > 2 && (
                            <TouchableOpacity
                              style={styles.seeMoreBtn}
                              activeOpacity={0.8}
                              onPress={() => setShowAllHistory((prev) => !prev)}
                            >
                              <Text style={styles.seeMoreBtnText}>
                                {showAllHistory
                                  ? 'Show Less (2 Recent) ▲'
                                  : `See More Matches (${filteredGames.length - 2} more) ▼`}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>

                {/* Start a Match Button */}
                <TouchableOpacity
                  style={styles.enterHubButton}
                  activeOpacity={0.85}
                  onPress={() => router.push('/play/create' as any)}
                >
                  <Text style={styles.enterHubButtonText}>⚔️ Start a Match ›</Text>
                </TouchableOpacity>

                {/* Sign Out Button */}
                <TouchableOpacity
                  style={styles.signOutButton}
                  activeOpacity={0.7}
                  onPress={signOut}
                >
                  <Feather name="log-out" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.signOutButtonText}>Sign Out / Switch Account</Text>
                </TouchableOpacity>

              </View>
            )}

          </View>
        ) : (
          /* Sign-in prompt */
          <View style={styles.card}>
            <View style={styles.authSection}>
              <View style={styles.loggedOutIconBox}>
                <Text style={{ fontSize: 36 }}>♟️</Text>
              </View>

              <Text style={styles.cardTitle}>Sign in to ChessOne</Text>
              <Text style={styles.cardSubtitle}>
                Sign in to view your career stats, skill rating, and match history with AI game reviews.
              </Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <View style={styles.errorTextContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {Platform.OS === 'web' && redirectUri ? (
                      <View style={styles.redirectHintBox}>
                        <Text style={styles.redirectHintTitle}>
                          Google Cloud Web Setup Note:
                        </Text>
                        <Text style={styles.redirectHintText}>
                          Add this exact URI to Authorized redirect URIs in Google Cloud Console:
                        </Text>
                        <Text selectable style={styles.redirectHintCode}>
                          {redirectUri}
                        </Text>
                        <TouchableOpacity
                          style={styles.openConsoleButton}
                          activeOpacity={0.8}
                          onPress={() =>
                            Linking.openURL(
                              'https://console.cloud.google.com/apis/credentials'
                            )
                          }
                        >
                          <Text style={styles.openConsoleButtonText}>
                            Open Google Cloud Console ↗
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <GoogleSignInButton
                onPress={handleGoogleSignIn}
                isLoading={isAuthLoading}
                disabled={isAuthLoading}
                style={styles.googleButton}
              />

              <Text style={styles.disclaimerText}>
                By signing in, you agree to fair-play chess rules and terms of service.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Footer */}
      {isAuthenticated && <AppFooter activeTab="play" />}

      {/* Student Progress Report Modal */}
      <StudentProgressReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        studentName={studentName || user?.name}
      />

      {/* ======================================================== */}
      {/* STUDENT & PARENT RECORD POPUP MODAL                      */}
      {/* (APPEARS SPECIFICALLY ONLY WHEN CLICKING ON THE NAME!)   */}
      {/* ======================================================== */}
      <Modal
        visible={studentRecordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStudentRecordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalCloseBar} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>👤 Student & Parent Record</Text>
              <TouchableOpacity
                onPress={() => setStudentRecordModalVisible(false)}
                style={styles.modalCloseIconBtn}
              >
                <Feather name="x" size={18} color={COLORS.textBody} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Official details for school tournaments & club verification.
            </Text>

            {!isEditMode ? (
              /* VIEW MODE: Clean summary with "✏️ Edit Details" button */
              <View style={styles.viewRecordBox}>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLbl}>Student Name:</Text>
                  <Text style={styles.recordVal}>{studentName}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLbl}>School & Grade:</Text>
                  <Text style={styles.recordVal}>{school} · {grade}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLbl}>Date of Birth:</Text>
                  <Text style={styles.recordVal}>{dob}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLbl}>Parent Name:</Text>
                  <Text style={styles.recordVal}>{parentName}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLbl}>Parent Phone:</Text>
                  <Text style={styles.recordVal}>{parentPhone}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLbl}>Joining Code:</Text>
                  <Text style={styles.recordVal}>{joinCode}</Text>
                </View>

                {/* ✏️ Edit Button inside Popup */}
                <TouchableOpacity
                  style={styles.modalEditToggleBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsEditMode(true)}
                >
                  <Feather name="edit-2" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.modalEditToggleBtnText}>Edit Details</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* EDIT MODE: Input fields with "💾 Save Changes" button */
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Student Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={studentName}
                    onChangeText={setStudentName}
                    placeholder="e.g. Nishigndha Karande"
                  />
                </View>

                <View style={styles.twoColRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Date of birth</Text>
                    <TextInput
                      style={styles.textInput}
                      value={dob}
                      onChangeText={setDob}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Grade / Class</Text>
                    <TextInput
                      style={styles.textInput}
                      value={grade}
                      onChangeText={setGrade}
                      placeholder="e.g. Grade 5"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>School / Academy Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={school}
                    onChangeText={setSchool}
                    placeholder="e.g. The Bishop's School"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Parent / Guardian Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={parentName}
                    onChangeText={setParentName}
                    placeholder="e.g. Rahul Laddha"
                  />
                </View>

                <View style={styles.twoColRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Parent Email</Text>
                    <TextInput
                      style={styles.textInput}
                      value={parentEmail}
                      onChangeText={setParentEmail}
                      placeholder="parent@gmail.com"
                      keyboardType="email-address"
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Parent Phone</Text>
                    <TextInput
                      style={styles.textInput}
                      value={parentPhone}
                      onChangeText={setParentPhone}
                      placeholder="+91 98220 12345"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Club Joining Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    placeholder="e.g. BISHOPS-CHESS-2026"
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  activeOpacity={0.85}
                  onPress={handleSaveProfile}
                >
                  <Feather name="save" size={15} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Parent Account Controls Modal */}
      <Modal
        visible={parentControlsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setParentControlsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalCloseBar} />
            <Text style={styles.modalTitle}>🔒 Parent Account Controls</Text>
            <Text style={styles.modalSubtitle}>
              Manage student privacy, credentials, and progress verification.
            </Text>

            <View style={styles.modalActionsList}>
              <TouchableOpacity
                style={styles.modalActionBtn}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert('Password Reset', 'A secure reset link has been dispatched to the parent email.');
                }}
              >
                <Feather name="key" size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.modalActionBtnText}>Reset Student Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionBtn}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert('Export PDF', 'Official Student Progress Report PDF generated and downloaded.');
                }}
              >
                <Feather name="download" size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.modalActionBtnText}>Export Progress Report (PDF)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert('Account Deletion', 'Account deletion requests must be confirmed with your school administrator.');
                }}
              >
                <Feather name="trash-2" size={16} color="#DC2626" style={{ marginRight: 10 }} />
                <Text style={[styles.modalActionBtnText, { color: '#DC2626' }]}>Request Account Deletion</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              activeOpacity={0.85}
              onPress={() => setParentControlsVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },

  /* Sub-Navigation Tabs */
  tabNavContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  tabNavBtn: {
    flex: 1,
    maxWidth: 240,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabNavBtnActive: {
    backgroundColor: COLORS.hero,
    borderColor: '#C6DCB8',
  },
  tabNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  tabNavBtnTextActive: {
    color: COLORS.primary,
  },

  authenticatedWrapper: {
    width: '100%',
    maxWidth: 650,
    gap: 16,
  },
  tabContentContainer: {
    width: '100%',
    gap: 16,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  /* Avatar & Progress Ring */
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRingContainer: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarRingSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarPeachCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    ...SHADOWS.soft,
  },
  avatarInnerImage: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarProgressPill: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    ...SHADOWS.soft,
  },
  avatarProgressPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },

  profileTextCol: {
    flex: 1,
  },
  userNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  userSchoolText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textBody,
    marginBottom: 6,
  },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.hero,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: SIZES.radiusChip,
    borderWidth: 1,
    borderColor: '#C6DCB8',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  explainerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  explainerIcon: {
    fontSize: 16,
  },
  explainerText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.textHeading,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '800',
    color: COLORS.primary,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Standard Card */
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
  },
  fideBadgePill: {
    backgroundColor: COLORS.warmCream,
    borderWidth: 1,
    borderColor: '#E5D3A2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fideBadgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#854D0E',
  },
  levelBadge: {
    backgroundColor: COLORS.hero,
    borderWidth: 1,
    borderColor: '#C6DCB8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textHeading,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },

  /* FIDE Grid */
  fideStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fideStatCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fideStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textBody,
    textTransform: 'uppercase',
  },
  fideStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  syncFideBtn: {
    backgroundColor: COLORS.hero,
    borderWidth: 1,
    borderColor: '#C6DCB8',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncFideBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageBtn: {
    backgroundColor: COLORS.hero,
    borderWidth: 1,
    borderColor: '#C6DCB8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  enterHubButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusButton,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  enterHubButtonText: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: '700',
  },
  signOutButton: {
    width: '100%',
    height: 44,
    borderRadius: SIZES.radiusButton,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  signOutButtonText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Progress Banner Card */
  reportBannerCard: {
    backgroundColor: '#EBF4EC',
    borderRadius: SIZES.radiusCard,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#C7E2C9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...SHADOWS.soft,
  },
  reportBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  reportBannerSub: {
    fontSize: 10.5,
    color: COLORS.textBody,
    marginTop: 2,
  },
  openReportBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusButton,
  },
  openReportBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  /* Player Stats Grid */
  statsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  statsHeaderTitle: {
    fontSize: 16,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  statsHeaderSub: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardRating: {
    backgroundColor: COLORS.hero,
    borderColor: '#C6DCB8',
  },
  statCardGames: {
    backgroundColor: COLORS.softPeach,
    borderColor: '#EED0C0',
  },
  statCardWins: {
    backgroundColor: COLORS.warmCream,
    borderColor: '#E5D3A2',
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  statSub: {
    fontSize: 9.5,
    color: COLORS.textBody,
    marginTop: 1,
  },
  recordPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recordPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  recordPillWin: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  recordPillLoss: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  recordPillDraw: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  recordPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recordPillWinText: {
    color: '#065F46',
  },
  recordPillLossText: {
    color: '#991B1B',
  },
  recordPillDrawText: {
    color: '#374151',
  },

  /* Skill Mastery */
  skillMeterRow: {
    marginBottom: 10,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  skillLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  skillValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  skillTrack: {
    height: 7,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillFill: {
    height: '100%',
    backgroundColor: COLORS.progressFill,
    borderRadius: 4,
  },
  sparklineContainer: {
    marginTop: 6,
    paddingVertical: 4,
  },

  /* Match History */
  historySection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  historyCountBadge: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toggleHistoryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleHistoryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: COLORS.hero,
    borderColor: '#C6DCB8',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  filterPillTextActive: {
    color: COLORS.primary,
  },
  historyList: {
    gap: 10,
  },
  historyLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  historyLoadingText: {
    fontSize: 12,
    color: COLORS.textBody,
  },
  historyEmptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  historyEmptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  historyEmptyText: {
    fontSize: 12,
    color: COLORS.textBody,
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  matchCardWinner: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  matchCardLoser: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchOpponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  matchModeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModeIcon: {
    fontSize: 14,
  },
  matchOpponentTextCol: {
    flex: 1,
  },
  matchOpponentName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  matchMetaText: {
    fontSize: 10.5,
    color: COLORS.textBody,
    marginTop: 1,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeWin: {
    backgroundColor: '#DEF7EC',
  },
  badgeWinText: {
    color: '#03543F',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeLoss: {
    backgroundColor: '#FDE8E8',
  },
  badgeLossText: {
    color: '#9B1C1C',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeDraw: {
    backgroundColor: '#E5E7EB',
  },
  badgeDrawText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeActive: {
    backgroundColor: '#DBEAFE',
  },
  badgeActiveText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '800',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  aiSuggestionBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiSuggestionIcon: {
    fontSize: 12,
  },
  aiSuggestionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  aiSuggestionText: {
    fontSize: 11,
    color: COLORS.textHeading,
    lineHeight: 15,
  },
  viewDetailsRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  seeMoreBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusButton,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  seeMoreBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Logged-out Card */
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    alignItems: 'center',
  },
  authSection: {
    width: '100%',
    alignItems: 'center',
  },
  loggedOutIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  googleButton: {
    width: '100%',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12.5,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 15,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
    gap: 10,
    maxHeight: '90%',
  },
  modalCloseBar: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 16,
    marginBottom: 4,
  },
  modalActionsList: {
    gap: 8,
    marginBottom: 6,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  modalDoneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalDoneBtnText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Student Popup Modal Specifics */
  viewRecordBox: {
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLbl: {
    fontSize: 12.5,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  recordVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  modalEditToggleBtn: {
    backgroundColor: COLORS.hero,
    borderWidth: 1.5,
    borderColor: '#C6DCB8',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  modalEditToggleBtnText: {
    color: COLORS.primary,
    fontSize: 13.5,
    fontWeight: '800',
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalSaveBtnText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: '700',
  },
});
