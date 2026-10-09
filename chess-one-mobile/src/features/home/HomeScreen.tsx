import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRoleStore } from '../roles/roleStore';
import { StudentHome } from './StudentHome';
import { ParentHome } from './ParentHome';
import { CoachHome } from './CoachHome';
import { SchoolHome } from './SchoolHome';
import { OrganiserHome } from './OrganiserHome';
import { COLORS } from '../../constants/chessone-theme';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
});
