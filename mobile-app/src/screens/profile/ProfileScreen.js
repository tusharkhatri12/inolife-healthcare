import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { colors } from '../../theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { isTracking, stopTracking } = useLocation();

  const handleLogout = async () => {
    if (isTracking) {
      await stopTracking();
    }
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.name}>
              {user?.name}
            </Text>
            <Text variant="bodyMedium" style={styles.employeeId}>
              {user?.employeeId}
            </Text>
            <Text variant="bodySmall" style={styles.role}>
              {user?.role}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contact Information
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Email:
              </Text>
              <Text variant="bodyMedium">{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Phone:
              </Text>
              <Text variant="bodyMedium">{user?.phone}</Text>
            </View>
            {user?.territory && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Territory:
                </Text>
                <Text variant="bodyMedium">{user.territory}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {user?.address && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Address
              </Text>
              <Text variant="bodyMedium">{user.address}</Text>
              {user.city && (
                <Text variant="bodyMedium">
                  {user.city}, {user.state} {user.pincode}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={colors.error}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  employeeId: {
    color: colors.primary,
    marginBottom: 4,
  },
  role: {
    color: colors.placeholder,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginRight: 8,
    minWidth: 100,
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default ProfileScreen;
