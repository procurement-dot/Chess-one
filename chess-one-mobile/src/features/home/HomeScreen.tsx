import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoleStore } from '../roles/roleStore';
import { StudentHome } from './StudentHome';
import { ParentHome } from './ParentHome';
import { CoachHome } from './CoachHome';
import { SchoolHome } from './SchoolHome';
import { OrganiserHome } from './OrganiserHome';
import { COLORS } from '../../constants/chessone-theme';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';

export const HomeScreen = () => {
  const role = useRoleStore();

  const renderContent = () => {
    switch (role) {
      case 'Student':
        return <StudentHome />;
      case 'Parent':
        return <ParentHome />;
      case 'Coach':
        return <CoachHome />;
      case 'School':
        return <SchoolHome />;
      case 'Organiser':
        return <OrganiserHome />;
      default:
        return <StudentHome />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
      <AppFooter activeTab="home" />
    </SafeAreaView>
  );
};

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
  },
});
