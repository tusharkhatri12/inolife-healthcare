import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useOffline } from '../../contexts/OfflineContext';
import { visitService } from '../../services/visitService';
import { colors } from '../../theme';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { location, isTracking, startTracking, stopTracking } = useLocation();
  const { isOnline, pendingVisitsCount, syncPendingData } = useOffline();
  const [todayVisits, setTodayVisits] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodayVisits();
  }, []);

  const loadTodayVisits = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await visitService.getVisits({
        startDate: today.toISOString(),
        limit: 100,
      });
      setTodayVisits(response.data?.visits?.length || 0);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    await syncPendingData();
    loadTodayVisits();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadTodayVisits} />
      }
    >
      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.welcomeText}>
              Welcome, {user?.name}!
            </Text>
            <Text variant="bodyMedium" style={styles.employeeId}>
              {user?.employeeId}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Today's Visits
            </Text>
            <Text variant="displaySmall" style={styles.statValue}>
              {todayVisits}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="titleMedium">Location Tracking</Text>
              <Chip
                icon={isTracking ? 'check-circle' : 'circle'}
                style={[
                  styles.chip,
                  isTracking ? styles.chipActive : styles.chipInactive,
                ]}
              >
                {isTracking ? 'Active' : 'Inactive'}
              </Chip>
            </View>
            <Button
              mode={isTracking ? 'outlined' : 'contained'}
              onPress={isTracking ? stopTracking : startTracking}
              style={styles.button}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="titleMedium">Connection Status</Text>
              <Chip
                icon={isOnline ? 'wifi' : 'wifi-off'}
                style={[
                  styles.chip,
                  isOnline ? styles.chipActive : styles.chipInactive,
                ]}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Chip>
            </View>
            {pendingVisitsCount > 0 && (
              <View style={styles.pendingSection}>
                <Text variant="bodyMedium" style={styles.pendingText}>
                  {pendingVisitsCount} visit(s) pending sync
                </Text>
                {isOnline && (
                  <Button mode="contained" onPress={handleSync} style={styles.button}>
                    Sync Now
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Quick Actions
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('VisitForm')}
              style={styles.button}
              icon="plus"
            >
              Log New Visit
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Doctors')}
              style={styles.button}
              icon="people"
            >
              View Doctors
            </Button>
          </Card.Content>
        </Card>
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
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: colors.primary,
  },
  welcomeText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  employeeId: {
    color: colors.white,
    opacity: 0.9,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  statValue: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chip: {
    marginLeft: 8,
  },
  chipActive: {
    backgroundColor: colors.success,
  },
  chipInactive: {
    backgroundColor: colors.warning,
  },
  button: {
    marginTop: 8,
  },
  pendingSection: {
    marginTop: 12,
  },
  pendingText: {
    marginBottom: 8,
    color: colors.warning,
  },
});

export default HomeScreen;
