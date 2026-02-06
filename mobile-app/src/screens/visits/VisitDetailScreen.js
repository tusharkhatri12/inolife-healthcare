import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { visitService } from '../../services/visitService';
import { colors } from '../../theme';
import { format } from 'date-fns';

const VisitDetailScreen = ({ route, navigation }) => {
  const { visitId } = route.params;
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisit();
  }, []);

  const loadVisit = async () => {
    try {
      setLoading(true);
      const response = await visitService.getVisit(visitId);
      setVisit(response.data?.visit);
    } catch (error) {
      console.error('Error loading visit:', error);
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

  if (!visit) {
    return (
      <View style={styles.centerContainer}>
        <Text>Visit not found</Text>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return colors.success;
      case 'Cancelled':
        return colors.error;
      case 'Rescheduled':
        return colors.warning;
      default:
        return colors.dark;
    }
  };

  const isMet = visit.visitOutcome === 'MET_DOCTOR' || !visit.visitOutcome;
  const outcomeColor = isMet ? colors.success : '#E65100';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.doctorName}>
                {visit.doctorId?.name || 'Unknown Doctor'}
              </Text>
              <View style={styles.chipRow}>
                <Chip
                  style={[styles.outcomeChip, { backgroundColor: outcomeColor }]}
                  textStyle={styles.statusText}
                >
                  {isMet ? 'Met' : 'Not Met'}
                </Chip>
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(visit.status) },
                  ]}
                  textStyle={styles.statusText}
                >
                  {visit.status}
                </Chip>
              </View>
            </View>
            <Text variant="titleMedium" style={styles.specialization}>
              {visit.doctorId?.specialization}
            </Text>
            {visit.doctorId?.clinicName && (
              <Text variant="bodyMedium" style={styles.clinic}>
                {visit.doctorId.clinicName}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Visit Details
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Date:
              </Text>
              <Text variant="bodyMedium">
                {format(new Date(visit.visitDate), 'MMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Time:
              </Text>
              <Text variant="bodyMedium">
                {format(new Date(visit.visitTime), 'HH:mm')}
              </Text>
            </View>
            {!isMet && visit.notMetReason && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Reason:
                </Text>
                <Text variant="bodyMedium">{visit.notMetReason}</Text>
              </View>
            )}
            {!isMet && visit.attemptRemarks && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Remarks:
                </Text>
                <Text variant="bodyMedium">{visit.attemptRemarks}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Purpose:
              </Text>
              <Text variant="bodyMedium">{visit.purpose}</Text>
            </View>
            {visit.duration != null && visit.duration > 0 && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Duration:
                </Text>
                <Text variant="bodyMedium">{visit.duration} minutes</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {visit.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Notes
              </Text>
              <Text variant="bodyMedium">{visit.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {visit.doctorFeedback && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Doctor Feedback
              </Text>
              <Text variant="bodyMedium">{visit.doctorFeedback}</Text>
            </Card.Content>
          </Card>
        )}

        {visit.productsDiscussed && visit.productsDiscussed.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Products Discussed
              </Text>
              {visit.productsDiscussed.map((item, index) => (
                <View key={index} style={styles.productItem}>
                  <Text variant="bodyMedium">
                    {item.productId?.name || 'Unknown Product'}
                  </Text>
                  {item.notes && (
                    <Text variant="bodySmall" style={styles.productNotes}>
                      {item.notes}
                    </Text>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {visit.orders && visit.orders.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Orders
              </Text>
              {visit.orders.map((order, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text variant="bodyMedium">
                    {order.productId?.name || 'Unknown Product'}
                  </Text>
                  <Text variant="bodySmall">
                    Qty: {order.quantity} | Price: ₹{order.unitPrice || 0}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorName: {
    fontWeight: 'bold',
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomeChip: {
    height: 26,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
  },
  specialization: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  clinic: {
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
    minWidth: 100,
  },
  productItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  productNotes: {
    color: colors.placeholder,
    marginTop: 4,
  },
  orderItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
});

export default VisitDetailScreen;
