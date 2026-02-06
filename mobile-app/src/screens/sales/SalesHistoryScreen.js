import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { format } from 'date-fns';
import { salesService } from '../../services/salesService';
import { colors } from '../../theme';

const SalesHistoryScreen = ({ navigation }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await salesService.getSales({});
      setSales(res?.data?.sales || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (sales.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No sales entries yet</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sales.map((s) => (
        <Card key={s._id} style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => toggleExpand(s._id)}
          >
            <Card.Content>
              <View style={styles.row}>
                <Text variant="titleSmall">
                  {s.date ? format(new Date(s.date), 'dd MMM yyyy') : '–'}
                </Text>
                <Text variant="titleSmall" style={styles.total}>
                  ₹{Number(s.totalValue || 0).toLocaleString()}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.meta}>
                {s.stockistId?.name || '–'}
                {s.doctorId?.name ? ` • ${s.doctorId.name}` : ''}
              </Text>
              {expandedId === s._id && (
                <View style={styles.productBlock}>
                  <Text variant="labelSmall" style={styles.productTitle}>
                    Product-wise breakdown
                  </Text>
                  {(Array.isArray(s.products) && s.products.length > 0) ? (
                    s.products.map((p, idx) => (
                      <View key={p.productId?._id || idx} style={styles.productRow}>
                        <Text variant="bodySmall" style={styles.productName}>
                          {p.productName || p.productId?.name || '–'}
                        </Text>
                        <Text variant="bodySmall">
                          Qty: {Number(p.quantity) || 0}
                          {(Number(p.free) || 0) > 0 ? ` • Free: ${Number(p.free)}` : ''} • ₹{Number(p.value || 0).toLocaleString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text variant="bodySmall" style={styles.emptyProducts}>
                      No product lines
                    </Text>
                  )}
                </View>
              )}
            </Card.Content>
          </TouchableOpacity>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  total: { fontWeight: '600' },
  meta: { color: '#666' },
  productBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  productTitle: { marginBottom: 6, color: '#666' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  productName: { flex: 1 },
  emptyProducts: { color: '#999' },
  errorText: { color: colors.error },
  emptyText: { color: '#666' },
});

export default SalesHistoryScreen;
