import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { HOME_THEME } from '../../constants/home-theme';

export default function TournamentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Tournaments" showBack={true} />
      <View style={styles.container}>
        <Text style={styles.title}>Coming soon</Text>
      </View>
      <AppFooter activeTab="tournaments" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HOME_THEME.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HOME_THEME.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: HOME_THEME.colors.headingText,
  },
});
