import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { createTournament } from '../../services/tournament.service';
import type { TournamentFormat } from '../../types/tournament.types';

export interface CreateTournamentFormProps {
  onClose?: () => void;
  onSuccess?: (tournamentId: number) => void;
  isModal?: boolean;
}

const DELIVERY_OPTIONS = ['Online', 'In-person', 'Hybrid'];
const FORMAT_OPTIONS = ['Swiss', 'Round Robin'];
const CATEGORY_OPTIONS = ['Open', 'U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18'];
const TIME_CONTROL_OPTIONS = [
  '10 + 5 rapid',
  '10 + 0 rapid',
  '15 + 10 rapid',
  '5 + 0 blitz',
  '3 + 2 blitz',
  '3 + 0 blitz',
];

export function CreateTournamentForm({
  onClose,
  onSuccess,
  isModal = false,
}: CreateTournamentFormProps) {
  const router = useRouter();

  // Form states matching user screenshots
  const [name, setName] = useState('');
  const [delivery, setDelivery] = useState('Online');
  const [format, setFormat] = useState('Swiss');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  const [category, setCategory] = useState('U-12');
  const [timeControl, setTimeControl] = useState('10 + 5 rapid');
  const [rounds, setRounds] = useState('5');
  const [entryFee, setEntryFee] = useState('250');
  const [capacity, setCapacity] = useState('64');
  const [venue, setVenue] = useState('');
  const [rules, setRules] = useState('');

  // Dropdown Picker Modal State
  const [pickerConfig, setPickerConfig] = useState<{
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  } | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openPicker = (
    title: string,
    options: string[],
    selected: string,
    onSelect: (val: string) => void
  ) => {
    setPickerConfig({ title, options, selected, onSelect });
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const tournamentName = name.trim() || 'Greenwood Junior Chess Cup';

    // Parse startsAt from dd-mm-yyyy or fallback to tomorrow
    let startsAtDate = new Date();
    startsAtDate.setDate(startsAtDate.getDate() + 1);
    startsAtDate.setHours(10, 0, 0, 0);

    if (date.trim()) {
      const parts = date.trim().split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d, 10, 0, 0);
        if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
          startsAtDate = parsed;
        }
      }
    }

    // Map format
    const backendFormat: TournamentFormat =
      format === 'Round Robin' ? 'ROUND_ROBIN' : 'SWISS';

    // Map timeControl
    let backendTc = '10+5';
    if (timeControl.includes('10 + 0')) backendTc = '10+0';
    else if (timeControl.includes('10 + 5')) backendTc = '10+5';
    else if (timeControl.includes('15 + 10')) backendTc = '15+10';
    else if (timeControl.includes('5 + 0')) backendTc = '5+0';
    else if (timeControl.includes('3 + 2')) backendTc = '3+2';
    else if (timeControl.includes('3 + 0')) backendTc = '3+0';

    const parsedCapacity = Math.min(Math.max(parseInt(capacity, 10) || 64, 2), 128);

    // Build description from venue, category, entry fee, and rules
    const venueText = venue.trim() ? `Venue: ${venue.trim()}` : `Venue: School hall or online room`;
    const feeText = entryFee.trim() ? `Entry fee: ₹${entryFee.trim()}` : 'Entry fee: ₹250';
    const rulesText = rules.trim() ? rules.trim() : 'Eligibility, Buchholz / SB, withdrawals, reconnect policy...';
    const description = `[${category} · ${delivery}] ${venueText} · ${feeText}\n\nRules: ${rulesText}`.slice(0, 490);

    setSubmitting(true);
    try {
      const res = await createTournament({
        name: tournamentName,
        description,
        format: backendFormat,
        timeControl: backendTc,
        maxPlayers: parsedCapacity,
        startsAt: startsAtDate.toISOString(),
        isRated: true,
      });

      if (onSuccess) {
        onSuccess(res.tournament.id);
      } else {
        router.replace(`/tournaments/${res.tournament.id}` as any);
      }
    } catch (err: unknown) {
      console.warn('[CreateTournamentForm] Failed to create tournament:', err);
      let msg = err instanceof Error ? err.message : 'Failed to create tournament';
      if ((err as any)?.response?.status === 404) {
        msg = 'Tournament API endpoint not found. Ensure your backend is running at http://localhost:4000.';
      } else if ((err as any)?.response?.status === 401) {
        msg = 'Please log in as an Organiser first (visit /dev/rbac to log in).';
      } else if ((err as any)?.response?.status === 403) {
        msg = 'Only Organisers or Admins have permission to create tournaments.';
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tournaments' as any);
    }
  };

  return (
    <View style={[styles.card, isModal && styles.modalCard]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create your tournament</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          activeOpacity={0.7}
          onPress={handleClose}
        >
          <Feather name="x" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        </View>
      ) : null}

      {/* Field: Tournament name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Tournament name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Greenwood Junior Chess Cup"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Row: Delivery & Format */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Delivery</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.7}
            onPress={() =>
              openPicker('Select Delivery', DELIVERY_OPTIONS, delivery, setDelivery)
            }
          >
            <Text style={styles.dropdownText}>{delivery}</Text>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Format</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.7}
            onPress={() =>
              openPicker('Select Format', FORMAT_OPTIONS, format, setFormat)
            }
          >
            <Text style={styles.dropdownText}>{format}</Text>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Row: Date & Category */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={styles.dateInput}
              placeholder="dd-mm-yyyy"
              placeholderTextColor="#9CA3AF"
              value={date}
              onChangeText={setDate}
            />
            <Feather name="calendar" size={16} color="#374151" style={styles.calendarIcon} />
          </View>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.7}
            onPress={() =>
              openPicker('Select Category', CATEGORY_OPTIONS, category, setCategory)
            }
          >
            <Text style={styles.dropdownText}>{category}</Text>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Row: Time control & Rounds */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Time control</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.7}
            onPress={() =>
              openPicker('Select Time Control', TIME_CONTROL_OPTIONS, timeControl, setTimeControl)
            }
          >
            <Text style={styles.dropdownText}>{timeControl}</Text>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Rounds</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={rounds}
            onChangeText={setRounds}
            placeholder="5"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Row: Entry fee & Capacity */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Entry fee (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={entryFee}
            onChangeText={setEntryFee}
            placeholder="250"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>Capacity</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="64"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Field: Venue / school room */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Venue / school room</Text>
        <TextInput
          style={styles.input}
          placeholder="School hall or online school room"
          placeholderTextColor="#9CA3AF"
          value={venue}
          onChangeText={setVenue}
        />
      </View>

      {/* Field: Rules, tie-breaks & refund policy */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Rules, tie-breaks & refund policy</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Eligibility, Buchholz / SB, withdrawals, reconnect policy..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={rules}
          onChangeText={setRules}
        />
      </View>

      {/* Notice Card */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          Creates a local sample draft for this session. Payments, public registration and room
          allocation are not activated.
        </Text>
      </View>

      {/* Action Button */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          activeOpacity={0.8}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Save demo draft</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Options Modal */}
      <Modal
        visible={Boolean(pickerConfig)}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerConfig(null)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerConfig(null)}>
          <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerConfig?.title}</Text>
              <TouchableOpacity onPress={() => setPickerConfig(null)}>
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={pickerConfig?.options || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === pickerConfig?.selected;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      pickerConfig?.onSelect(item);
                      setPickerConfig(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#134E39" />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  modalCard: {
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B2A22',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  calendarIcon: {
    marginLeft: 6,
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  noticeBox: {
    backgroundColor: '#EDF5EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2E4C38',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#134E39',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#134E39',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2A22',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: '#134E39',
  },
});
