import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Searchbar, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { doctorService } from '../../services/doctorService';
import { colors } from '../../theme';

const DoctorsScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctors({ isActive: true });
      setDoctors(response.data?.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(doctors);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const filtered = doctors.filter(
      (doctor) =>
        doctor.name?.toLowerCase().includes(q) ||
        doctor.specialization?.toLowerCase().includes(q) ||
        doctor.city?.toLowerCase().includes(q) ||
        doctor.area?.toLowerCase().includes(q)
    );
    setFilteredDoctors(filtered);
  };

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

  const renderDoctor = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: item._id })}
    >
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.doctorName}>
          {item.name}
        </Text>
        <View style={styles.badgeRow}>
          {item.category && (
            <Chip
              style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
              textStyle={styles.categoryText}
            >
              Cat. {item.category}
            </Chip>
          )}
          <Chip
            style={[
              styles.approvalChip,
              { backgroundColor: item.isApproved === false ? colors.warning : colors.success },
            ]}
            textStyle={styles.approvalChipText}
          >
            {item.isApproved === false ? 'Pending' : 'Approved'}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.specialization}>
          {item.specialization}
        </Text>
        {(item.area || item.city) && (
          <Text variant="bodySmall" style={styles.location}>
            {[item.area, item.city].filter(Boolean).join(' • ')}
            {item.state ? `, ${item.state}` : ''}
          </Text>
        )}
        {item.clinicName && !item.area && !item.city && (
          <Text variant="bodySmall" style={styles.clinic}>
            {item.clinicName}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading && doctors.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name, specialization, city, area..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDoctors} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No doctors found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Doctors assigned to you will appear here'}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('VisitForm', { openAddDoctor: true })}
        label="Add New Doctor"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  searchbar: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  doctorName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    height: 26,
    minWidth: 48,
  },
  categoryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  approvalChip: {
    height: 26,
    minWidth: 70,
  },
  approvalChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  specialization: {
    color: colors.dark,
    marginBottom: 4,
  },
  clinic: {
    color: colors.placeholder,
    marginBottom: 4,
  },
  location: {
    color: colors.placeholder,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: colors.dark,
    marginBottom: 4,
  },
  emptySubtext: {
    color: colors.placeholder,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default DoctorsScreen;
