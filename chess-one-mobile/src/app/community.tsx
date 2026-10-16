import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { gameService } from '../services/game.service';
import { gameSocket } from '../socket/game.socket';
import { OnlineUser } from '../types/game.types';
import { AppHeader } from '../components/navigation/AppHeader';
import { AppFooter } from '../components/navigation/AppFooter';
import { OutgoingChallengeModal } from '../components/game/OutgoingChallengeModal';
import { MatchStartVsModal } from '../components/game/MatchStartVsModal';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { authStore, useAuthStore } from '../store/authStore';
import { gameStore } from '../store/gameStore';
import { COLORS, SIZES, SHADOWS } from '../constants/chessone-theme';
import {
  SAMPLE_CLASSMATES,
  SAMPLE_CLUBS,
  PRESET_MESSAGES,
  REPORT_REASONS,
  CommunityClassmate,
  CommunityClub,
} from '../data/community';
import { Feather } from '@expo/vector-icons';

type MainCommunityTab = 'My school' | 'Friends' | 'Clubs' | 'Play people';
const MAIN_TABS: MainCommunityTab[] = ['My school', 'Friends', 'Clubs', 'Play people'];

interface ClubMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  isTeacher?: boolean;
}

export default function CommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ timeControl?: string; tab?: string }>();
  const { user, isAuthenticated } = useAuthStore();

  const selectedTimeControl = params.timeControl || '5+0';

  // Active top tab
  const [activeTab, setActiveTab] = useState<MainCommunityTab>(
    (params.tab as MainCommunityTab) || 'My school'
  );

  // Community Feed & State (matching prototype HTML/JS)
  const [friendsList, setFriendsList] = useState<string[]>(['Riya S.']);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [clubsList, setClubsList] = useState<CommunityClub[]>(SAMPLE_CLUBS);
  const [clubMessages, setClubMessages] = useState<ClubMessage[]>([
    {
      id: 'm-1',
      sender: 'Ms. Shah',
      role: 'School chess teacher · Moderated',
      text: 'What did you notice about the knight today? Try the new level, then challenge a classmate to a friendly game.',
      time: 'Today · 10:15 AM',
      isTeacher: true,
    },
    {
      id: 'm-2',
      sender: 'Riya S.',
      role: 'Classmate · Sample post',
      text: 'I finished the knight challenge! Who wants to practise the opening together?',
      time: 'Today · 10:45 AM',
    },
  ]);

  // Modal visibility states
  const [askTeacherVisible, setAskTeacherVisible] = useState(false);
  const [teacherQuestionText, setTeacherQuestionText] = useState('');
  const [addFriendVisible, setAddFriendVisible] = useState(false);
  const [memberOptionsVisible, setMemberOptionsVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(REPORT_REASONS[0]);
  const [joinClubVisible, setJoinClubVisible] = useState(false);
  const [selectedClub, setSelectedClub] = useState<CommunityClub | null>(null);
  const [parentConsentChecked, setParentConsentChecked] = useState(false);
  const [sampleChallengeVisible, setSampleChallengeVisible] = useState(false);
  const [challengeTargetName, setChallengeTargetName] = useState<string | null>(null);
  const [challengeTimeControl, setChallengeTimeControl] = useState('10 + 5 rapid');

  // Filter tabs for "Play people" tab
  const [activeFilterTab, setActiveFilterTab] = useState<'online' | 'all'>('online');
  const [searchQuery, setSearchQuery] = useState('');

  // Online users hook (Preserving 100% of existing working live socket/multiplayer logic)
  const {
    users: allUsers,
    onlineCount,
    isLoading,
    refresh,
  } = useOnlineUsers(isAuthenticated);

  // Challenge states
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
  const [outgoingTarget, setOutgoingTarget] = useState<OnlineUser | null>(null);
  const [outgoingStatus, setOutgoingStatus] = useState<
    'sending' | 'waiting' | 'declined' | 'error'
  >('sending');
  const [outgoingError, setOutgoingError] = useState('');
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  // VS Faceoff Modal states
  const [vsModalVisible, setVsModalVisible] = useState(false);
  const [vsModalData, setVsModalData] = useState<{
    gameId: number;
    whitePlayerName: string;
    blackPlayerName: string;
    whitePlayerAvatar?: string | null;
    blackPlayerAvatar?: string | null;
    timeControl: string;
  } | null>(null);

  // Listen for outgoing challenge acceptance
  useEffect(() => {
    if (!activeGameId) return;

    const triggerVsFaceoff = (gData?: any) => {
      const targetId = activeGameId;
      const targetUser = outgoingTarget;
      setOutgoingTarget(null);
      setActiveGameId(null);

      const myName = authStore.getState().user?.name || 'You';
      const oppName = targetUser?.name || targetUser?.email || 'Opponent';

      let whiteName = myName;
      let blackName = oppName;

      if (gData?.whitePlayer?.name && gData?.blackPlayer?.name) {
        whiteName = gData.whitePlayer.name;
        blackName = gData.blackPlayer.name;
      } else if (gData?.playerColor === 'BLACK') {
        whiteName = oppName;
        blackName = myName;
      }

      try {
        if (typeof window !== 'undefined' && window.sessionStorage && targetId) {
          const myColor =
            gData?.playerColor ||
            (gData?.blackPlayerId === authStore.getState().user?.id ? 'BLACK' : 'WHITE');
          window.sessionStorage.setItem(`chess_game_color_${targetId}`, myColor);
        }
      } catch {}

      setVsModalData({
        gameId: targetId,
        whitePlayerName: whiteName,
        blackPlayerName: blackName,
        whitePlayerAvatar: null,
        blackPlayerAvatar: null,
        timeControl: gData?.timeControl || selectedTimeControl,
      });
      setVsModalVisible(true);
    };

    const unsubStarted = gameSocket.onGameStarted((payload: any) => {
      console.log('[Community] Challenge accepted! Starting face-off:', activeGameId);
      triggerVsFaceoff(payload);
    });

    const unsubDeclined = gameSocket.onInvitationDeclined(() => {
      console.log('[Community] Challenge declined by friend');
      setOutgoingStatus('declined');
    });

    // Polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const g = await gameService.getGame(activeGameId);
        if (g.status === 'ACTIVE') {
          triggerVsFaceoff(g);
        }
      } catch {}
    }, 1500);

    return () => {
      unsubStarted();
      unsubDeclined();
      clearInterval(pollInterval);
    };
  }, [activeGameId, outgoingTarget, selectedTimeControl]);

  // Handle challenging an online user via backend socket
  const handleChallengePlayer = async (target: OnlineUser) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to send game invitations to players.',
        [
          { text: 'Go to Login', onPress: () => router.push('/login' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setInvitingUserId(target.id);
    setOutgoingTarget(target);
    setOutgoingStatus('sending');
    setOutgoingError('');

    try {
      const res = await gameService.quickInvite(target.id, selectedTimeControl);
      setActiveGameId(res.gameId);
      setOutgoingStatus('waiting');
      gameSocket.joinGame(res.gameId);
    } catch (err: any) {
      setOutgoingStatus('error');
      setOutgoingError(
        err.userFriendlyMessage || err.message || 'Could not send invitation'
      );
    } finally {
      setInvitingUserId(null);
    }
  };

  // Filter and search players in "Play people"
  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (activeFilterTab === 'online') {
      list = list.filter((u) => u.isOnline);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id).includes(q)
      );
    }

    return list;
  }, [allUsers, activeFilterTab, searchQuery]);

  const currentUserId = user?.id ? parseInt(String(user.id), 10) : null;
  const schoolName = (user as any)?.school || 'Greenwood School';

  // Preset message sender
  const handleSendPresetMessage = (msg: string) => {
    const studentName = user?.name || 'Aarav';
    const newMsg: ClubMessage = {
      id: `m-${Date.now()}`,
      sender: studentName,
      role: 'Student · Preset message',
      text: msg,
      time: 'Just now',
    };
    setClubMessages((prev) => [...prev, newMsg]);
  };

  // Ask Teacher handler
  const handleSendTeacherQuestion = () => {
    if (!teacherQuestionText.trim()) {
      Alert.alert('Empty Question', 'Please type a chess question for your teacher.');
      return;
    }
    const studentName = user?.name || 'Aarav';
    const newMsg: ClubMessage = {
      id: `m-${Date.now()}`,
      sender: `${studentName} (Question for Teacher)`,
      role: 'Queued for teacher moderation',
      text: teacherQuestionText.trim(),
      time: 'Pending Review',
    };
    setClubMessages((prev) => [...prev, newMsg]);
    setTeacherQuestionText('');
    setAskTeacherVisible(false);

    const confirmation = 'Your question has been sent to your school chess teacher for moderation!';
    if (Platform.OS === 'web') {
      window.alert(confirmation);
    } else {
      Alert.alert('Question Sent', confirmation);
    }
  };

  // Add friend handler
  const handleAddFriend = (name: string) => {
    if (!friendsList.includes(name)) {
      setFriendsList((prev) => [...prev, name]);
      setAddFriendVisible(false);
      const msg = `${name} has been added to your chess friends!`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Friend Added', msg);
    }
  };

  // Remove friend handler
  const handleRemoveFriend = (name: string) => {
    setFriendsList((prev) => prev.filter((f) => f !== name));
    setMemberOptionsVisible(false);
  };

  // Block member handler
  const handleBlockMember = (name: string) => {
    setBlockedUsers((prev) => [...prev, name]);
    setMemberOptionsVisible(false);
    const msg = `${name} has been hidden for this session.`;
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Member Blocked', msg);
  };

  // Report member handler
  const handleReportSubmit = () => {
    setReportVisible(false);
    setMemberOptionsVisible(false);
    const msg = `Report submitted to school moderator: "${selectedReportReason}". Thank you for keeping our school community safe!`;
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Report Submitted', msg);
  };

  // Join club handler
  const handleJoinClubSubmit = () => {
    if (!parentConsentChecked) {
      Alert.alert('Parent Approval Required', 'Please confirm parent/school approval before submitting.');
      return;
    }
    if (selectedClub) {
      setClubsList((prev) =>
        prev.map((c) => (c.id === selectedClub.id ? { ...c, isJoined: true } : c))
      );
      setJoinClubVisible(false);
      setParentConsentChecked(false);
      const msg = `Join request sent for ${selectedClub.name}!`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Request Sent', msg);
    }
  };

  // Sample challenge handler for classmates
  const handleOpenClassmateChallenge = (name: string) => {
    setChallengeTargetName(name);
    setSampleChallengeVisible(true);
  };

  const visibleClassmates = useMemo(() => {
    return SAMPLE_CLASSMATES.filter((c) => !blockedUsers.includes(c.name));
  }, [blockedUsers]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Community"
        subtitle="Real friends. Better moves."
        showBack={true}
      />

      {/* 4 Main Community Tabs */}
      <View style={styles.mainTabsScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mainTabsContainer}
        >
          {MAIN_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.mainTabBtn, isActive && styles.mainTabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.mainTabBtnText, isActive && styles.mainTabBtnTextActive]}>
                  {tab === 'My school' ? '🏫 My school' : tab === 'Friends' ? '👥 Friends' : tab === 'Clubs' ? '♧ Clubs' : '⚔️ Play people'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          activeTab === 'Play people' ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor="#194E40"
            />
          ) : undefined
        }
      >
        {/* Child Safety & Moderation Notice Banner */}
        <View style={styles.safetyNoticeBanner}>
          <Feather name="shield" size={14} color="#1E4B3A" />
          <Text style={styles.safetyNoticeText}>
            School-verified & teacher-moderated. Child-safe presets & guardian controls active.
          </Text>
        </View>

        {/* ======================================================== */}
        {/* TAB 1: MY SCHOOL (School Club Circle)                    */}
        {/* ======================================================== */}
        {activeTab === 'My school' && (
          <View style={styles.tabContent}>
            {/* School Hero Banner */}
            <View style={styles.schoolHeroCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrowLight}>YOUR SCHOOL CLUB</Text>
                <Text style={styles.schoolTitle}>{schoolName} Chess Circle</Text>
                <Text style={styles.schoolSub}>120 students · Teacher-moderated · Grade 3–8</Text>
                
                <View style={styles.tagsRow}>
                  <View style={styles.heroTag}>
                    <Text style={styles.heroTagText}>✓ School verified</Text>
                  </View>
                  <View style={styles.heroTag}>
                    <Text style={styles.heroTagText}>Weekly club games</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroIconBox}>
                <Text style={{ fontSize: 26 }}>🏫</Text>
              </View>
            </View>

            {/* Club Conversation Feed */}
            <View style={styles.whiteCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.cardHeading}>Club Conversation</Text>
                  <View style={styles.moderatedPill}>
                    <Text style={styles.moderatedPillText}>Moderated</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.askTeacherBtn}
                  onPress={() => setAskTeacherVisible(true)}
                >
                  <Text style={styles.askTeacherBtnText}>Ask your teacher ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.messagesList}>
                {clubMessages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageItem,
                      msg.isTeacher && styles.messageTeacher,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={[styles.messageSender, msg.isTeacher && { color: COLORS.primary }]}>
                        {msg.sender}
                      </Text>
                      <Text style={styles.messageTime}>{msg.time}</Text>
                    </View>
                    <Text style={styles.messageRole}>{msg.role}</Text>
                    <Text style={styles.messageText}>{msg.text}</Text>
                  </View>
                ))}
              </View>

              {/* Child-Safe Preset Quick Reply Buttons */}
              <View style={styles.presetSection}>
                <Text style={styles.presetLabel}>QUICK SAFE REPLIES (PRESETS):</Text>
                <View style={styles.presetRow}>
                  {PRESET_MESSAGES.map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={styles.presetBtn}
                      onPress={() => handleSendPresetMessage(preset)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetBtnText}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Classmates to play with */}
            <View style={styles.whiteCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeading}>Classmates to Play With</Text>
                <Text style={styles.cardSubCount}>{visibleClassmates.length} available</Text>
              </View>

              <View style={styles.classmatesList}>
                {visibleClassmates.map((student) => (
                  <View key={student.id} style={styles.classmateRow}>
                    <View style={[styles.classmateAvatar, { backgroundColor: student.avatarColor }]}>
                      <Text style={styles.classmateAvatarText}>{student.name[0]}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.classmateName}>{student.name}</Text>
                      <Text style={styles.classmateSub}>
                        {student.grade} · {student.skillLevel} · {student.isOnline ? '🟢 Online' : '⚪ Away'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.playClassmateBtn}
                        onPress={() => handleOpenClassmateChallenge(student.name)}
                      >
                        <Text style={styles.playClassmateBtnText}>Play</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.optionsDotBtn}
                        onPress={() => {
                          setSelectedMember(student.name);
                          setMemberOptionsVisible(true);
                        }}
                      >
                        <Text style={styles.optionsDotText}>···</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Class Quest Card */}
            <View style={[styles.whiteCard, styles.classQuestCard]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.classQuestTitle}>Your Class Quest</Text>
                  <Text style={styles.classQuestSub}>
                    Review 100 practice games together. Celebrate learning, not just winning.
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarWrapper}>
                <View style={[styles.progressBarFill, { width: '64%' }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.progressText}>64 / 100 class games reviewed</Text>
                <TouchableOpacity onPress={() => router.push('/learn' as any)}>
                  <Text style={styles.questLinkText}>View level journey ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FRIENDS (Chess Circle)                            */}
        {/* ======================================================== */}
        {activeTab === 'Friends' && (
          <View style={styles.tabContent}>
            <View style={styles.whiteCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardHeading}>Your Chess Friends</Text>
                  <Text style={styles.cardSubCount}>{friendsList.length} approved friends</Text>
                </View>
                <TouchableOpacity
                  style={styles.addFriendHeaderBtn}
                  onPress={() => setAddFriendVisible(true)}
                >
                  <Feather name="user-plus" size={14} color={COLORS.white} />
                  <Text style={styles.addFriendHeaderBtnText}>Add a classmate</Text>
                </TouchableOpacity>
              </View>

              {friendsList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={{ fontSize: 32 }}>👥</Text>
                  <Text style={styles.emptyTitle}>No friends added yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add your school classmates to challenge them easily anytime!
                  </Text>
                  <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={() => setAddFriendVisible(true)}
                  >
                    <Text style={styles.refreshBtnText}>+ Add a Classmate</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.classmatesList}>
                  {friendsList.map((fName) => (
                    <View key={fName} style={styles.classmateRow}>
                      <View style={[styles.classmateAvatar, { backgroundColor: '#1E4B3A' }]}>
                        <Text style={[styles.classmateAvatarText, { color: COLORS.white }]}>{fName[0]}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.classmateName}>{fName}</Text>
                        <Text style={styles.classmateSub}>School classmate · Approved friend</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.playClassmateBtn}
                          onPress={() => handleOpenClassmateChallenge(fName)}
                        >
                          <Text style={styles.playClassmateBtnText}>Play</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.optionsDotBtn}
                          onPress={() => {
                            setSelectedMember(fName);
                            setMemberOptionsVisible(true);
                          }}
                        >
                          <Text style={styles.optionsDotText}>···</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.policyNoticeBox}>
                <Text style={styles.policyNoticeText}>
                  🛡️ Friend requests require mutual acceptance and school / guardian permissions in full compliance with child safety policies.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CLUBS (School & Junior Clubs)                     */}
        {/* ======================================================== */}
        {activeTab === 'Clubs' && (
          <View style={styles.tabContent}>
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeading}>School & Junior Clubs</Text>
              <Text style={styles.cardSubCount}>Supervised chess communities</Text>

              <View style={{ gap: 12, marginTop: 10 }}>
                {clubsList.map((club) => (
                  <View key={club.id} style={styles.clubCard}>
                    <View style={styles.clubHeaderRow}>
                      <View style={styles.clubIcon}>
                        <Text style={{ fontSize: 20 }}>♧</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clubTitle}>{club.name}</Text>
                        <Text style={styles.clubCategory}>{club.category}</Text>
                        <Text style={styles.clubMeta}>
                          {club.ageGroup} · {club.membersCount} students · {club.moderator}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.clubActionRow}>
                      {club.isJoined ? (
                        <View style={styles.joinedBadge}>
                          <Text style={styles.joinedBadgeText}>✓ Joined</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.joinRequestBtn}
                          onPress={() => {
                            setSelectedClub(club);
                            setJoinClubVisible(true);
                          }}
                        >
                          <Text style={styles.joinRequestBtnText}>Request to join ›</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PLAY PEOPLE (Live Socket Online Multiplayer)     */}
        {/* ======================================================== */}
        {activeTab === 'Play people' && (
          <View style={styles.tabContent}>
            {/* Sportsmanship Guidance Card (Matching reference prototype) */}
            <View style={styles.sportsmanshipCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>🤝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sportsmanshipTitle}>Make a friend across the board.</Text>
                  <Text style={styles.sportsmanshipSub}>
                    Say &ldquo;good luck&rdquo;, play fairly, then say &ldquo;good game&rdquo;. Review your game with Coach One after you finish.
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search players by name or ID..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {Boolean(searchQuery) && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeFilterTab === 'online' && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setActiveFilterTab('online')}
              >
                <View style={styles.tabRow}>
                  <View style={styles.greenDot} />
                  <Text
                    style={[
                      styles.tabBtnText,
                      activeFilterTab === 'online' && styles.tabBtnTextActive,
                    ]}
                  >
                    Online Now ({onlineCount})
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeFilterTab === 'all' && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setActiveFilterTab('all')}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeFilterTab === 'all' && styles.tabBtnTextActive,
                  ]}
                >
                  👥 All Players ({allUsers.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Players List */}
            {isLoading && allUsers.length === 0 ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#1E4B3A" />
                <Text style={styles.loadingText}>Loading community players...</Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>♟️</Text>
                <Text style={styles.emptyTitle}>
                  {activeFilterTab === 'online'
                    ? 'No players online right now'
                    : 'No players found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilterTab === 'online'
                    ? 'Switch to "All Players" to challenge registered friends, or share a match invitation.'
                    : 'Try adjusting your search query.'}
                </Text>

                <TouchableOpacity
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                  onPress={refresh}
                >
                  <Text style={styles.refreshBtnText}>🔄 Refresh Players</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.playersList}>
                {filteredUsers.map((item) => {
                  const isMe = currentUserId === item.id;
                  const isInviting = invitingUserId === item.id;
                  const initials = (item.name || item.email || 'P')[0].toUpperCase();

                  return (
                    <View key={`player-${item.id}`} style={styles.playerCard}>
                      <View style={styles.avatarWrapper}>
                        <View
                          style={[
                            styles.avatarBox,
                            item.isOnline ? styles.avatarOnline : styles.avatarOffline,
                          ]}
                        >
                          <Text style={styles.avatarInitial}>{initials}</Text>
                        </View>
                        <View
                          style={[
                            styles.avatarDot,
                            item.isOnline ? styles.dotOnline : styles.dotOffline,
                          ]}
                        />
                      </View>

                      <View style={styles.playerInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.playerName} numberOfLines={1}>
                            {item.name || item.email}
                          </Text>
                          <View style={styles.idChip}>
                            <Text style={styles.idChipText}>#{item.id}</Text>
                          </View>
                        </View>

                        <Text style={styles.playerStatusText}>
                          {item.isOnline ? '🟢 Online & Ready' : '⚪ Offline'}
                        </Text>
                      </View>

                      {isMe ? (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>You</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.challengeBtn,
                            item.isOnline
                              ? styles.challengeBtnOnline
                              : styles.challengeBtnOffline,
                            isInviting && styles.btnDisabled,
                          ]}
                          activeOpacity={0.8}
                          disabled={isInviting}
                          onPress={() => handleChallengePlayer(item)}
                        >
                          {isInviting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.challengeBtnText}>⚔️ Invite</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: ASK YOUR TEACHER                                */}
      {/* ======================================================== */}
      <Modal visible={askTeacherVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Ask your chess teacher</Text>
              <TouchableOpacity onPress={() => setAskTeacherVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Type your chess question below. It will be sent to Ms. Shah for teacher moderation before appearing in the club thread.
            </Text>

            <TextInput
              style={styles.modalTextArea}
              placeholder="e.g. Why can the knight jump over other pieces?"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={teacherQuestionText}
              onChangeText={setTeacherQuestionText}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAskTeacherVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSendTeacherQuestion}
              >
                <Text style={styles.modalSubmitBtnText}>Send Question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: ADD A CLASSMATE AS FRIEND                       */}
      {/* ======================================================== */}
      <Modal visible={addFriendVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add a school classmate</Text>
              <TouchableOpacity onPress={() => setAddFriendVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Choose a classmate from your school to add to your chess friends list:
            </Text>

            <View style={{ gap: 8, marginVertical: 10 }}>
              {SAMPLE_CLASSMATES.filter((c) => !friendsList.includes(c.name)).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.addFriendOptionRow}
                  onPress={() => handleAddFriend(c.name)}
                >
                  <Text style={styles.addFriendOptionName}>{c.name}</Text>
                  <Text style={styles.addFriendOptionAction}>+ Add Friend</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setAddFriendVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: MEMBER OPTIONS (···)                             */}
      {/* ======================================================== */}
      <Modal visible={memberOptionsVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{selectedMember} · Controls</Text>
              <TouchableOpacity onPress={() => setMemberOptionsVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginVertical: 10 }}>
              {selectedMember && friendsList.includes(selectedMember) ? (
                <TouchableOpacity
                  style={styles.memberActionBtn}
                  onPress={() => handleRemoveFriend(selectedMember)}
                >
                  <Text style={styles.memberActionText}>Remove from friends</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.memberActionBtn}
                  onPress={() => selectedMember && handleAddFriend(selectedMember)}
                >
                  <Text style={styles.memberActionText}>+ Add to friends</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.memberActionBtn, { borderColor: '#F59E0B' }]}
                onPress={() => setReportVisible(true)}
              >
                <Text style={[styles.memberActionText, { color: '#B45309' }]}>Report a concern</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.memberActionBtn, { borderColor: '#EF4444' }]}
                onPress={() => selectedMember && handleBlockMember(selectedMember)}
              >
                <Text style={[styles.memberActionText, { color: '#DC2626' }]}>Block member</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setMemberOptionsVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: REPORT A CONCERN TO MODERATOR                   */}
      {/* ======================================================== */}
      <Modal visible={reportVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Report to school moderator</Text>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              A school teacher or moderator will review this report. Choose a reason:
            </Text>

            <View style={{ gap: 8, marginVertical: 10 }}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.reportReasonRow,
                    selectedReportReason === r && styles.reportReasonActive,
                  ]}
                  onPress={() => setSelectedReportReason(r)}
                >
                  <Text style={[styles.reportReasonText, selectedReportReason === r && { fontWeight: '700', color: COLORS.primary }]}>
                    {r}
                  </Text>
                  {selectedReportReason === r && (
                    <Feather name="check" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReportVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleReportSubmit}
              >
                <Text style={styles.modalSubmitBtnText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: JOIN JUNIOR CLUB                                */}
      {/* ======================================================== */}
      <Modal visible={joinClubVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Join {selectedClub?.name}</Text>
              <TouchableOpacity onPress={() => setJoinClubVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Verified junior clubs support supervised learning and age-appropriate play. Parent or school approval is required before joining.
            </Text>

            <TouchableOpacity
              style={styles.consentCheckboxRow}
              onPress={() => setParentConsentChecked(!parentConsentChecked)}
            >
              <View style={[styles.checkboxBox, parentConsentChecked && styles.checkboxBoxChecked]}>
                {parentConsentChecked && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.consentCheckboxLabel}>
                Parent / school approval received for this request
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setJoinClubVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, !parentConsentChecked && { opacity: 0.5 }]}
                disabled={!parentConsentChecked}
                onPress={handleJoinClubSubmit}
              >
                <Text style={styles.modalSubmitBtnText}>Send Join Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 6: SAMPLE CLASSMATE CHALLENGE                      */}
      {/* ======================================================== */}
      <Modal visible={sampleChallengeVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Challenge {challengeTargetName}</Text>
              <TouchableOpacity onPress={() => setSampleChallengeVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Send a friendly game invitation to your classmate. Choose your preferred time control:
            </Text>

            <View style={{ gap: 8, marginVertical: 10 }}>
              {['10 + 5 rapid', '15 + 10 rapid', '5 + 3 blitz'].map((tc) => (
                <TouchableOpacity
                  key={tc}
                  style={[
                    styles.timeControlOptionRow,
                    challengeTimeControl === tc && styles.timeControlOptionActive,
                  ]}
                  onPress={() => setChallengeTimeControl(tc)}
                >
                  <Text style={[styles.timeControlOptionText, challengeTimeControl === tc && { fontWeight: '700', color: COLORS.primary }]}>
                    ⏱️ {tc}
                  </Text>
                  {challengeTimeControl === tc && (
                    <Feather name="check" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.challengeNoticeBox}>
              <Text style={styles.challengeNoticeText}>
                Unrated human game · Coach hints disabled · Preset greetings only
              </Text>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSampleChallengeVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => {
                  setSampleChallengeVisible(false);
                  const msg = `Challenge sent to ${challengeTargetName} (${challengeTimeControl})!`;
                  if (Platform.OS === 'web') window.alert(msg);
                  else Alert.alert('Invitation Sent', msg);
                }}
              >
                <Text style={styles.modalSubmitBtnText}>Send Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* EXISTING SOCKET MODALS (PRESERVED 100%)                  */}
      {/* ======================================================== */}
      {/* Outgoing Challenge Waiting Modal */}
      <OutgoingChallengeModal
        visible={Boolean(outgoingTarget)}
        targetUser={outgoingTarget}
        status={outgoingStatus}
        timeControl={selectedTimeControl}
        errorMessage={outgoingError}
        onCancel={() => {
          setOutgoingTarget(null);
          setActiveGameId(null);
        }}
      />

      {/* Horizontal Animated VS Face-off Modal */}
      {Boolean(vsModalData) && (
        <MatchStartVsModal
          visible={vsModalVisible}
          gameId={vsModalData!.gameId}
          whitePlayerName={vsModalData!.whitePlayerName}
          blackPlayerName={vsModalData!.blackPlayerName}
          whitePlayerAvatar={vsModalData!.whitePlayerAvatar}
          blackPlayerAvatar={vsModalData!.blackPlayerAvatar}
          timeControl={vsModalData!.timeControl}
          durationMs={2000}
          onComplete={() => {
            const gid = vsModalData!.gameId;
            setVsModalVisible(false);
            setVsModalData(null);
            gameStore.reset();
            router.replace(`/game/${gid}` as any);
          }}
        />
      )}

      {/* Persistent Bottom Footer */}
      <AppFooter activeTab="community" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 60,
  },
  mainTabsScrollWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mainTabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  mainTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusChip,
    backgroundColor: COLORS.background,
  },
  mainTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  mainTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  mainTabBtnTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  safetyNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 12,
  },
  safetyNoticeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  tabContent: {
    gap: 14,
  },
  schoolHeroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  eyebrowLight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  schoolTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  schoolSub: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTagText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  cardSubCount: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  moderatedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moderatedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  askTeacherBtn: {
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  askTeacherBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  messagesList: {
    gap: 8,
  },
  messageItem: {
    backgroundColor: '#F8FAF7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  messageTeacher: {
    backgroundColor: '#FAF7F0',
    borderColor: '#FDE68A',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  messageRole: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  messageText: {
    fontSize: 12.5,
    color: COLORS.textHeading,
    marginTop: 4,
    lineHeight: 18,
  },
  presetSection: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F3EE',
  },
  presetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    backgroundColor: '#F0F3EE',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  classmatesList: {
    gap: 10,
  },
  classmateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3EE',
  },
  classmateAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classmateAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  classmateName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  classmateSub: {
    fontSize: 10.5,
    color: COLORS.textBody,
    marginTop: 1,
  },
  playClassmateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playClassmateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  optionsDotBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsDotText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  classQuestCard: {
    backgroundColor: '#FAF7F0',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  classQuestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  classQuestSub: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
    lineHeight: 16,
  },
  progressBarWrapper: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.progressFill,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  questLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addFriendHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addFriendHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  policyNoticeBox: {
    backgroundColor: '#F8FAF7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  policyNoticeText: {
    fontSize: 10.5,
    color: COLORS.textBody,
    lineHeight: 16,
  },
  clubCard: {
    backgroundColor: '#F8FAF7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  clubHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clubIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E4EEDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  clubCategory: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  clubMeta: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
  },
  clubActionRow: {
    alignSelf: 'flex-start',
  },
  joinedBadge: {
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  joinedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  joinRequestBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  joinRequestBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sportsmanshipCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 14,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sportsmanshipTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  sportsmanshipSub: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
    lineHeight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: COLORS.textHeading, fontSize: 13 },
  clearSearchIcon: { color: COLORS.textBody, fontSize: 14, paddingHorizontal: 4 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF3E8',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4F8A5B' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textBody },
  tabBtnTextActive: { color: COLORS.white, fontWeight: '700' },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 12, color: COLORS.textBody },
  emptyBox: { paddingVertical: 30, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textHeading },
  emptySubtitle: { fontSize: 12, color: COLORS.textBody, textAlign: 'center', maxWidth: 260 },
  refreshBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EEF3E8',
    borderRadius: 8,
  },
  refreshBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  playersList: { gap: 10 },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: SIZES.radiusCard,
    gap: 12,
    ...SHADOWS.soft,
  },
  avatarWrapper: { position: 'relative', width: 40, height: 40 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarOnline: { backgroundColor: '#EEF3E8', borderWidth: 1, borderColor: '#D5DFC8' },
  avatarOffline: { backgroundColor: '#F5F7F2', borderWidth: 1, borderColor: '#E4E9E1' },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  avatarDot: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.white },
  dotOnline: { backgroundColor: '#4F8A5B' },
  dotOffline: { backgroundColor: '#74817A' },
  playerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  playerName: { fontSize: 13.5, fontWeight: '700', color: COLORS.textHeading, maxWidth: 150 },
  idChip: { backgroundColor: '#EEF3E8', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  idChipText: { fontSize: 9.5, fontWeight: '700', color: COLORS.primary },
  playerStatusText: { fontSize: 11, fontWeight: '500', color: COLORS.textBody },
  youBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#EEF3E8', borderRadius: 6 },
  youBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  challengeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  challengeBtnOnline: { backgroundColor: COLORS.primary },
  challengeBtnOffline: { backgroundColor: '#EEF3E8', borderWidth: 1, borderColor: '#D5DFC8' },
  btnDisabled: { opacity: 0.7 },
  challengeBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    gap: 12,
    ...SHADOWS.soft,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textBody,
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: COLORS.textHeading,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F3EE',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  addFriendOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addFriendOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  addFriendOptionAction: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberActionBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  memberActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  reportReasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAF7',
  },
  reportReasonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E4EEDB',
  },
  reportReasonText: {
    fontSize: 12,
    color: COLORS.textHeading,
  },
  consentCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentCheckboxLabel: {
    fontSize: 11.5,
    color: COLORS.textHeading,
    flex: 1,
  },
  timeControlOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAF7',
  },
  timeControlOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E4EEDB',
  },
  timeControlOptionText: {
    fontSize: 12.5,
    color: COLORS.textHeading,
  },
  challengeNoticeBox: {
    backgroundColor: '#FAF7F0',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  challengeNoticeText: {
    fontSize: 10,
    color: '#92400E',
    textAlign: 'center',
  },
});
