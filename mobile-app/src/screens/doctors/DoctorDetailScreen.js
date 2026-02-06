import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { doctorService } from '../../services/doctorService';
import { colors } from '../../theme';

const DoctorDetailScreen = ({ route, navigation }) => {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctor();
  }, []);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctor(doctorId);
      setDoctor(response.data?.doctor);
    } catch (error) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.centerContainer}>
        <Text>Doctor not found</Text>
      </View>
    );
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'A':
        return colors.error;
      case 'B':
        return colors.warning;
      case 'C':
        return colors.success;
      default:
        return colors.dark;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.name}>
              {doctor.name}
            </Text>
            <View style={styles.badgeRow}>
              {doctor.category && (
                <Chip
                  style={[
                    styles.categoryChip,
                    { backgroundColor: getCategoryColor(doctor.category) },
                  ]}
                  textStyle={styles.categoryText}
                >
                  Category {doctor.category}
                </Chip>
              )}
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      doctor.isApproved === false ? colors.warning : colors.success,
                  },
                ]}
                textStyle={styles.statusChipText}
              >
                {doctor.isApproved === false ? 'Pending Approval' : 'Approved'}
              </Chip>
            </View>
            <Text variant="titleMedium" style={styles.specialization}>
              {doctor.specialization}
            </Text>
            {doctor.qualification && (
              <Text variant="bodyMedium" style={styles.qualification}>
                {doctor.qualification}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Clinic Information
            </Text>
            {doctor.clinicName && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Clinic:
                </Text>
                <Text variant="bodyMedium">{doctor.clinicName}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Address:
              </Text>
              <Text variant="bodyMedium">{doctor.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                City:
              </Text>
              <Text variant="bodyMedium">{doctor.city}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                State:
              </Text>
              <Text variant="bodyMedium">{doctor.state}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Pincode:
              </Text>
              <Text variant="bodyMedium">{doctor.pincode}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contact Information
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Phone:
              </Text>
              <Text variant="bodyMedium">{doctor.phone}</Text>
            </View>
            {doctor.email && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Email:
                </Text>
                <Text variant="bodyMedium">{doctor.email}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {doctor.preferredVisitDay && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Visit Preferences
              </Text>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Preferred Day:
                </Text>
                <Text variant="bodyMedium">{doctor.preferredVisitDay}</Text>
              </View>
              {doctor.preferredVisitTime && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Preferred Time:
                  </Text>
                  <Text variant="bodyMedium">{doctor.preferredVisitTime}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={() =>
            navigation.navigate('VisitForm', { doctorId: doctor._id })
          }
          style={styles.button}
          icon="plus"
        >
          Log Visit
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryChip: {
    height: 28,
    minWidth: 90,
  },
  categoryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
    minWidth: 100,
  },
  statusChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  specialization: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  qualification: {
    color: colors.placeholder,
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
    minWidth: 80,
  },
  button: {
    marginTop: 8,
  },
});

export default DoctorDetailScreen;
