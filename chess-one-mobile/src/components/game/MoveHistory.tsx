import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { GameMove, ChatMessage } from '../../types/game.types';
import { detectOpeningName } from '../../utils/chess.utils';
import { gameSocket } from '../../socket/game.socket';

export interface MoveHistoryProps {
  moves: GameMove[];
  gameId?: number | string;
  currentUserId?: number | null;
  currentUserName?: string;
  opponentName?: string;
  isAI?: boolean;
}

const QUICK_CHATS = [
  '👋 Hi!',
  '🍀 Good luck!',
  '👏 Nice move!',
  '🤝 Thanks!',
  '🔥 Great game!',
  '⚡ Well played!',
  '😅 Oops!',
];

const AI_RESPONSES = [
  'Good luck! May the best player win! ♟️',
  'Thanks! Let’s see what you’ve got! 🤖',
  'Interesting move! I am calculating... 🧠',
  'Nice game! Enjoying this match! ⚡',
  'Well played! Keep your guard up! 🛡️',
];

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  gameId,
  currentUserId,
  currentUserName = 'You',
  opponentName = 'Opponent',
  isAI = false,
}) => {
  const [activeTab, setActiveTab] = useState<'moves' | 'chat'>('moves');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const movesScrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  // Group moves into pairs (1. White Move, Black Move)
  const movePairs = useMemo(() => {
    const pairs: {
      moveNumber: number;
      white: string;
      black?: string;
      whiteIndex: number;
      blackIndex?: number;
    }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: whiteMove.san,
        black: blackMove?.san,
        whiteIndex: i,
        blackIndex: blackMove ? i + 1 : undefined,
      });
    }
    return pairs;
  }, [moves]);

  // Detected opening name based on played moves
  const openingName = useMemo(() => {
    if (moves.length === 0) return 'Starting Position';
    return detectOpeningName(moves.map((m) => m.san));
  }, [moves]);

  // Auto-scroll moves to bottom whenever a new move arrives
  useEffect(() => {
    if (activeTab === 'moves') {
      setTimeout(() => {
        movesScrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [moves.length, activeTab]);

  // Reset chat messages when switching gameId
  useEffect(() => {
    setMessages([]);
    setUnreadCount(0);
  }, [gameId]);

  // Listen to incoming chat messages from the socket room
  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = gameSocket.onChatMessage((msg: ChatMessage) => {
      if (!msg) return;

      // Ensure message belongs to this game
      if (
        msg.gameId &&
        String(msg.gameId) !== String(gameId) &&
        Number(msg.gameId) !== Number(gameId)
      ) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // If user is currently on 'moves' tab and message is not from self, increment unread
      const isFromMe =
        currentUserId && msg.senderId && Number(msg.senderId) === Number(currentUserId);
      if (!isFromMe) {
        setUnreadCount((prev) => {
          if (activeTab === 'chat') return 0;
          return prev + 1;
        });
      }

      // Auto-scroll chat to bottom
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 60);
    });

    return () => {
      unsubscribe();
    };
  }, [gameId, currentUserId, activeTab]);

  // Auto-scroll chat on new message or tab change
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadCount(0);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 60);
    }
  }, [activeTab, messages.length]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !gameId) return;

    // Send via socket
    gameSocket.sendChatMessage(
      gameId,
      text,
      currentUserId || null,
      currentUserName || 'You'
    );

    // If socket is offline or AI game, optimistically append message
    if (isAI || !gameSocket.getSocket()?.connected) {
      const localMsg: ChatMessage = {
        id: `local_${Date.now()}_${Math.random()}`,
        gameId,
        senderId: currentUserId || null,
        senderName: currentUserName || 'You',
        text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);

      // If AI mode, simulate automated bot response
      if (isAI) {
        setTimeout(() => {
          const randomReply =
            AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
          const aiMsg: ChatMessage = {
            id: `ai_${Date.now()}`,
            gameId,
            senderId: 999999,
            senderName: opponentName || 'Stockfish AI',
            text: randomReply,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }, 800);
      }
    }

    if (!textToSend) {
      setInputText('');
    }
  };

  const latestMoveIndex = moves.length - 1;

  return (
    <View style={styles.container}>
      {/* Top Tab Bar: Moves | Chat */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'moves' && styles.tabButtonActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('moves')}
        >
          <Text
            style={[styles.tabLabel, activeTab === 'moves' && styles.tabLabelActive]}
          >
            Moves
          </Text>
          {activeTab === 'moves' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chat' && styles.tabButtonActive]}
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('chat');
            setUnreadCount(0);
          }}
        >
          <View style={styles.chatTabHeaderRow}>
            <Text
              style={[styles.tabLabel, activeTab === 'chat' && styles.tabLabelActive]}
            >
              Chat
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          {activeTab === 'chat' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content: Moves Tab */}
      {activeTab === 'moves' ? (
        <View style={styles.contentContainer}>
          {/* Opening Name Header */}
          <View style={styles.openingHeader}>
            <Text style={styles.openingText} numberOfLines={1}>
              {openingName}
            </Text>
          </View>

          {/* Vertical Move Columns Table */}
          {moves.length === 0 ? (
            <View style={styles.emptyMovesContainer}>
              <Text style={styles.emptyMovesNumber}>1.</Text>
              <Text style={styles.emptyMovesText}>Match started. Awaiting first move...</Text>
            </View>
          ) : (
            <ScrollView
              ref={movesScrollRef}
              style={styles.movesScrollView}
              contentContainerStyle={styles.movesScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {movePairs.map((pair) => {
                const isWhiteLatest = pair.whiteIndex === latestMoveIndex;
                const isBlackLatest = pair.blackIndex === latestMoveIndex;

                return (
                  <View key={`row-${pair.moveNumber}`} style={styles.moveRow}>
                    {/* Move Number Column (e.g. "1.", "2.") */}
                    <Text style={styles.moveRowNumber}>{pair.moveNumber}.</Text>

                    {/* White Move Column */}
                    <View style={styles.moveCol}>
                      {isWhiteLatest ? (
                        <View style={styles.latestMoveBadge}>
                          <Text style={styles.latestMoveBadgeText}>{pair.white}</Text>
                        </View>
                      ) : (
                        <Text style={styles.normalMoveText}>{pair.white}</Text>
                      )}
                    </View>

                    {/* Black Move Column */}
                    <View style={styles.moveCol}>
                      {pair.black ? (
                        isBlackLatest ? (
                          <View style={styles.latestMoveBadge}>
                            <Text style={styles.latestMoveBadgeText}>{pair.black}</Text>
                          </View>
                        ) : (
                          <Text style={styles.normalMoveText}>{pair.black}</Text>
                        )
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : (
        /* Content: Chat Tab */
        <View style={styles.contentContainer}>
          {/* Messages List */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScrollView}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChatBox}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatText}>
                  No messages yet. Send a quick hello or cheer your opponent!
                </Text>
              </View>
            ) : (
              messages.map((item) => {
                const isMe =
                  Boolean(currentUserId && item.senderId && Number(item.senderId) === Number(currentUserId)) ||
                  item.senderName === 'You' ||
                  item.senderName === currentUserName;

                const timeStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.chatBubbleWrapper,
                      isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOpponent,
                    ]}
                  >
                    {!isMe && (
                      <Text style={styles.chatSenderName}>
                        {item.senderName || opponentName}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.chatBubble,
                        isMe ? styles.chatBubbleMe : styles.chatBubbleOpponent,
                      ]}
                    >
                      <Text style={styles.chatBubbleText}>{item.text}</Text>
                    </View>
                    {Boolean(timeStr) && (
                      <Text
                        style={[
                          styles.chatTimestamp,
                          isMe ? styles.chatTimestampMe : styles.chatTimestampOpponent,
                        ]}
                      >
                        {timeStr}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Chat Shortcut Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickChatBar}
            contentContainerStyle={styles.quickChatContent}
          >
            {QUICK_CHATS.map((chip, idx) => (
              <TouchableOpacity
                key={`qc-${idx}`}
                style={styles.quickChip}
                activeOpacity={0.7}
                onPress={() => handleSendMessage(chip)}
              >
                <Text style={styles.quickChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor="#71717A"
              value={inputText}
              onChangeText={setInputText}
              maxLength={200}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!inputText.trim()}
              onPress={() => handleSendMessage()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 215,
    backgroundColor: '#212121', // Dark charcoal matching Image 1
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#303030',
    overflow: 'hidden',
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#303030',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {},
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabLabelActive: {
    color: COLORS.textHeading,
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#D1D5DB', // Bright underline matching screenshot
  },
  chatTabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: COLORS.textHeading,
    fontSize: 10,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },

  /* Moves Tab Styles */
  openingHeader: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  openingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4D4D8',
    letterSpacing: 0.2,
  },
  emptyMovesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  emptyMovesNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    width: 28,
  },
  emptyMovesText: {
    fontSize: 13,
    color: '#71717A',
    fontStyle: 'italic',
  },
  movesScrollView: {
    flex: 1,
  },
  movesScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    paddingBottom: 10,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  moveRowNumber: {
    width: 32,
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  moveCol: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  normalMoveText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeading,
    paddingLeft: 4,
  },
  latestMoveBadge: {
    backgroundColor: '#3E3E42', // Gray highlight badge matching [d3] in Image 1
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  latestMoveBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
  },

  /* Chat Tab Styles */
  chatScrollView: {
    flex: 1,
  },
  chatScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emptyChatIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emptyChatText: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 16,
  },
  chatBubbleWrapper: {
    maxWidth: '82%',
    marginBottom: 2,
  },
  bubbleWrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleWrapperOpponent: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  chatSenderName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 2,
    paddingLeft: 2,
  },
  chatBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chatBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  chatBubbleOpponent: {
    backgroundColor: '#2D2D30',
    borderBottomLeftRadius: 2,
  },
  chatBubbleText: {
    fontSize: 13,
    color: COLORS.textHeading,
    lineHeight: 17,
  },
  chatTimestamp: {
    fontSize: 9,
    color: '#71717A',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  chatTimestampMe: {
    alignSelf: 'flex-end',
  },
  chatTimestampOpponent: {
    alignSelf: 'flex-start',
  },
  quickChatBar: {
    height: 32,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  quickChatContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  quickChip: {
    backgroundColor: '#2A2A2D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3D',
  },
  quickChipText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    gap: 6,
  },
  chatInput: {
    flex: 1,
    height: 34,
    backgroundColor: '#29292C',
    borderRadius: 17,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: COLORS.textHeading,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  sendButtonText: {
    color: COLORS.textHeading,
    fontSize: 12,
    fontWeight: '700',
  },
});
