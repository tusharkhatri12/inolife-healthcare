import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, FAB, SegmentedButtons } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { visitService } from '../../services/visitService';
import { doctorService } from '../../services/doctorService';
import { colors } from '../../theme';
import { format, startOfDay, endOfDay } from 'date-fns';

const VisitsScreen = ({ navigation }) => {
  const [visits, setVisits] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'all'
  const [doctorFilterId, setDoctorFilterId] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState(''); // '' | 'met' | 'not_met'

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadVisits();
  }, [dateFilter, doctorFilterId, outcomeFilter]);

  const loadDoctors = async () => {
    try {
      const response = await doctorService.getDoctors({ isActive: true });
      setDoctors(response.data?.doctors || []);
    } catch (e) {
      console.error('Error loading doctors:', e);
    }
  };

  const loadVisits = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (dateFilter === 'today') {
        const today = new Date();
        params.startDate = startOfDay(today).toISOString();
        params.endDate = endOfDay(today).toISOString();
      }
      if (doctorFilterId) params.doctorId = doctorFilterId;
      if (outcomeFilter) params.outcomeFilter = outcomeFilter;
      const response = await visitService.getVisits(params);
      setVisits(response.data?.visits || []);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMet = (item) =>
    item.visitOutcome === 'MET_DOCTOR' || !item.visitOutcome;

  const getOutcomeBadge = (item) => {
    if (isMet(item)) return { label: 'Met', color: colors.success };
    return { label: 'Not Met', color: '#E65100' };
  };

  const renderVisit = ({ item }) => {
    const badge = getOutcomeBadge(item);
    const productsDiscussed = item.productsDiscussed?.filter((p) => p.productId) || [];
    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('VisitDetail', { visitId: item._id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.doctorName}>
                {item.doctorId?.name || 'Unknown Doctor'}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {format(new Date(item.visitDate || item.visitTime), 'HH:mm')}
              </Text>
            </View>
            <Chip
              style={[styles.outcomeChip, { backgroundColor: badge.color }]}
              textStyle={styles.outcomeChipText}
            >
              {badge.label}
            </Chip>
          </View>
          {!isMet(item) && item.notMetReason && (
            <Text variant="bodySmall" style={styles.reason}>
              Reason: {item.notMetReason}
            </Text>
          )}
          {isMet(item) && productsDiscussed.length > 0 && (
            <Text variant="bodySmall" style={styles.products}>
              Products: {productsDiscussed.map((p) => p.productId?.name || p.productId).filter(Boolean).join(', ')}
            </Text>
          )}
          {item.doctorId?.clinicName && (
            <Text variant="bodySmall" style={styles.clinic}>
              {item.doctorId.clinicName}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const isEmptyToday =
    dateFilter === 'today' && !loading && visits.length === 0;

  if (loading && visits.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Text variant="labelSmall" style={styles.filterLabel}>Date</Text>
        <SegmentedButtons
          value={dateFilter}
          onValueChange={setDateFilter}
          buttons={[
            { value: 'today', label: 'Today' },
            { value: 'all', label: 'All' },
          ]}
          style={styles.segmented}
        />
        <Text variant="labelSmall" style={styles.filterLabel}>Doctor</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={doctorFilterId}
            onValueChange={setDoctorFilterId}
            style={styles.picker}
            prompt="Filter by doctor"
          >
            <Picker.Item label="All doctors" value="" />
            {doctors.map((d) => (
              <Picker.Item key={d._id} label={d.name} value={d._id} />
            ))}
          </Picker>
        </View>
        <Text variant="labelSmall" style={styles.filterLabel}>Visit Status</Text>
        <SegmentedButtons
          value={outcomeFilter || 'all'}
          onValueChange={(v) => setOutcomeFilter(v === 'all' ? '' : v)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'met', label: 'Met' },
            { value: 'not_met', label: 'Not Met' },
          ]}
          style={styles.segmented}
        />
      </View>
      <FlatList
        data={visits}
        renderItem={renderVisit}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVisits} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {isEmptyToday ? 'No visits logged today' : 'No visits found'}
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Tap + to log a visit
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('VisitForm')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  filterLabel: {
    color: colors.placeholder,
    marginTop: 8,
    marginBottom: 4,
  },
  segmented: {
    marginBottom: 4,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  picker: {
    height: 44,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
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
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  doctorName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  date: {
    color: colors.placeholder,
  },
  outcomeChip: {
    height: 26,
  },
  outcomeChipText: {
    color: colors.white,
    fontSize: 12,
  },
  reason: {
    color: colors.warning,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  products: {
    color: colors.dark,
    marginBottom: 2,
  },
  clinic: {
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

export default VisitsScreen;
