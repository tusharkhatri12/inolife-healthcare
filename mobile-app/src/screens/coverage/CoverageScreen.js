import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { coverageService } from '../../services/coverageService';

const CoverageScreen = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadCoverage = useCallback(
    async (isRefresh = false) => {
      if (!user?._id) {
        console.warn('CoverageScreen: No user ID available');
        setError('User not logged in');
        setLoading(false);
        return;
      }
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await coverageService.getMrCoverage({
          mrId: user._id,
          month,
        });

        // Backend returns: { success: true, data: { groupBy, results: [...] } }
        // Service returns response.data (which is the full backend response)
        // So we access: response.data.results
        const results = response?.data?.results || [];
        
        if (results.length === 0) {
          console.log(`[Coverage] No coverage plans found for month ${month}`);
        } else {
          console.log(`[Coverage] Loaded ${results.length} coverage plan(s) for month ${month}`);
        }
        const parsed = results.map((item) => {
          const totalPlanned = item.totalPlanned || 0;
          const totalActual = item.totalActual || 0;
          const compliance =
            totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

          // Determine overdue: month ended and actual < planned
          const [yearStr, monthStr] = month.split('-');
          const year = Number(yearStr);
          const mNum = Number(monthStr); // 1-12
          const monthEnd = new Date(year, mNum, 0, 23, 59, 59, 999);
          const now = new Date();
          const overdue = now > monthEnd && totalActual < totalPlanned;

          return {
            id: item.doctor?._id || String(Math.random()),
            doctor: item.doctor,
            totalPlanned,
            totalActual,
            compliance: Number(compliance.toFixed(1)),
            overdue,
          };
        });

        setItems(parsed);
      } catch (err) {
        console.error('Error loading MR coverage:', err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load coverage. Please check your connection and try again.';
        setError(errorMsg);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?._id, month]
  );

  useEffect(() => {
    loadCoverage(false);
  }, [loadCoverage]);

  const onRefresh = () => {
    loadCoverage(true);
  };

  const renderItem = ({ item }) => {
    const progress = item.totalPlanned > 0
      ? Math.min(100, (item.totalActual / item.totalPlanned) * 100)
      : 0;

    return (
      <View style={[styles.card, item.overdue && styles.cardOverdue]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>{item.doctor?.name || 'Unknown Doctor'}</Text>
            <Text style={styles.doctorMeta}>
              {item.doctor?.specialization || ''}
              {item.doctor?.city ? ` • ${item.doctor.city}` : ''}
            </Text>
          </View>
          {item.overdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>OVERDUE</Text>
            </View>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Planned:</Text>
          <Text style={styles.value}>{item.totalPlanned}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Actual:</Text>
          <Text style={styles.value}>{item.totalActual}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Compliance:</Text>
          <Text style={styles.value}>{item.compliance}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>0%</Text>
          <Text style={styles.progressLabelText}>100%</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading coverage...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Coverage</Text>
        <Text style={styles.subtitle}>
          {format(new Date(month + '-01'), 'MMMM yyyy')}
        </Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          !loading && !error && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No coverage plans found for {format(new Date(month + '-01'), 'MMMM yyyy')}.
              </Text>
              <Text style={styles.emptySubtext}>
                Contact your manager to set up coverage plans.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardOverdue: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  doctorMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  overdueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  progressBar: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabelText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 12,
    color: '#B91C1C',
  },
});

export default CoverageScreen;

