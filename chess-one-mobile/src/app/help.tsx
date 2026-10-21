import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';
import { AppHeader } from '../components/navigation/AppHeader';
import { AppFooter } from '../components/navigation/AppFooter';
import { DEMO_FAQS } from '../mock/schoolDemo';
import { Feather } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'FAQs' | 'Getting started' | 'Contact us'>('FAQs');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setSubmitted(true);
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="Help & Support" subtitle="FAQs & Guidelines" showBack={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Area */}
        <View style={styles.headerArea}>
          <Text style={styles.eyebrow}>SUPPORT & GUIDANCE</Text>
          <Text style={styles.heading}>How can we help?</Text>
          <Text style={styles.subtitle}>Find a quick answer, ask for help or report a concern.</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['FAQs', 'Getting started', 'Contact us'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        {activeTab === 'FAQs' && (
          <View style={styles.whiteCard}>
            <Text style={styles.cardTitle}>Frequently asked questions</Text>
            {DEMO_FAQS.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <View key={idx} style={[styles.faqItem, idx < DEMO_FAQS.length - 1 && styles.borderBottom]}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    activeOpacity={0.7}
                    onPress={() => toggleFaq(idx)}
                  >
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Getting Started */}
        {activeTab === 'Getting started' && (
          <View style={styles.whiteCard}>
            <Text style={styles.cardTitle}>4 Simple Steps to Master ChessOne</Text>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Set up your profile</Text>
                <Text style={styles.stepSub}>Add your school, grade and chess background.</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text style={styles.linkText}>Profile ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Play your placement games</Text>
                <Text style={styles.stepSub}>Play friendly practice games to understand your level.</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/play' as any)}>
                <Text style={styles.linkText}>Play ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Learn & Complete Daily Moves</Text>
                <Text style={styles.stepSub}>Explore chapters, solve daily puzzles and earn XP.</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/learn' as any)}>
                <Text style={styles.linkText}>Learn ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Meet your chess circle</Text>
                <Text style={styles.stepSub}>Challenge classmates in school club & tournaments.</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/community' as any)}>
                <Text style={styles.linkText}>Social ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contact Us */}
        {activeTab === 'Contact us' && (
          <View style={styles.whiteCard}>
            <Text style={styles.cardTitle}>Contact ChessOne School Team</Text>
            <Text style={styles.bodyText}>
              Tell us what you need help with. Your school coordinator or coach can assist you.
            </Text>

            {submitted && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✓ Sample request saved for preview. School coordinator notified.</Text>
              </View>
            )}

            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe what happened or what help you need..."
              placeholderTextColor={COLORS.textBody}
              multiline
            />
            <TouchableOpacity style={styles.actionBtn} onPress={handleSendMessage}>
              <Text style={styles.actionBtnText}>Prepare Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* School Coordinator support note */}
        <View style={styles.schoolNoticeCard}>
          <Text style={styles.schoolNoticeTitle}>Need help from your school?</Text>
          <Text style={styles.schoolNoticeText}>
            Your Greenwood School coordinator can help with accounts, class schedules and permissions.
          </Text>
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
    paddingVertical: 8,
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
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 17,
  },
  faqItem: {
    paddingVertical: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 6,
    lineHeight: 18,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  stepSub: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: COLORS.textHeading,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 70,
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
  successBanner: {
    backgroundColor: COLORS.hero,
    padding: 8,
    borderRadius: 8,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  schoolNoticeCard: {
    backgroundColor: '#FAF7F0',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    gap: 4,
  },
  schoolNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C86848',
  },
  schoolNoticeText: {
    fontSize: 11,
    color: COLORS.textBody,
  },
});
