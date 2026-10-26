import React from 'react';
import {
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { CreateTournamentForm } from './CreateTournamentForm';

export interface CreateTournamentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (tournamentId: number) => void;
}

export function CreateTournamentModal({
  visible,
  onClose,
  onSuccess,
}: CreateTournamentModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <CreateTournamentForm
                isModal={true}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '94%',
  },
  modalContent: {
    width: '100%',
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 10,
  },
});
