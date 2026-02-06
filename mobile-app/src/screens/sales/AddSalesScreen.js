import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { stockistService } from '../../services/stockistService';
import { doctorService } from '../../services/doctorService';
import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { colors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const STOCKIST_DISCOUNT = 0.275; // 27.5% off MRP
const STOCKIST_MULTIPLIER = 1 - STOCKIST_DISCOUNT; // 0.725

const AddSalesScreen = ({ navigation }) => {
  const [stockists, setStockists] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [stockistId, setStockistId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [lines, setLines] = useState([]); // [{ productId, productName, mrp, quantity, free, value }]
  const [remarks, setRemarks] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sRes, dRes, pRes] = await Promise.all([
        stockistService.getStockists({ isActive: true }),
        doctorService.getDoctors({ isActive: true }),
        productService.getProducts({ isActive: true }),
      ]);
      setStockists(sRes?.data?.stockists || []);
      setDoctors(dRes?.data?.doctors || []);
      setProducts(pRes?.data?.products || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stockistUnitPrice = (mrp) => (mrp != null && Number(mrp) >= 0 ? Number(mrp) * STOCKIST_MULTIPLIER : null);

  const addLine = () => {
    const first = products[0];
    if (!first) return;
    const mrp = first.mrp != null ? Number(first.mrp) : null;
    const qty = 0;
    const val = mrp != null ? qty * (mrp * STOCKIST_MULTIPLIER) : 0;
    setLines((prev) => [
      ...prev,
      {
        productId: first._id,
        productName: first.name,
        mrp,
        quantity: '0',
        free: '0',
        value: String(val),
      },
    ]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, text) => {
    setLines((prev) => {
      const next = prev.map((l, i) => {
        if (i !== index) return l;
        const updated = { ...l, [field]: text };
        if (field === 'quantity' && (l.mrp != null && l.mrp >= 0)) {
          const qty = parseFloat(text) || 0;
          updated.value = String((qty * (l.mrp * STOCKIST_MULTIPLIER)).toFixed(2));
        }
        return updated;
      });
      return next;
    });
  };

  const setLineProduct = (index, productId) => {
    const p = products.find((x) => x._id === productId);
    const mrp = p?.mrp != null ? Number(p.mrp) : null;
    const l = lines[index];
    const qty = parseFloat(l?.quantity) || 0;
    const val = mrp != null ? (qty * (mrp * STOCKIST_MULTIPLIER)).toFixed(2) : (l?.value || '0');
    setLines((prev) =>
      prev.map((li, i) =>
        i === index
          ? {
              ...li,
              productId,
              productName: p?.name || '',
              mrp,
              value: String(val),
            }
          : li
      )
    );
  };

  const totalValue = lines.reduce(
    (sum, l) => sum + (parseFloat(l.value) || 0),
    0
  );

  const handleSubmit = async () => {
    if (!stockistId) {
      Alert.alert('Required', 'Please select a stockist');
      return;
    }
    const validLines = lines.filter(
      (l) => (Number(l.quantity) || 0) > 0 || (Number(l.value) || 0) > 0
    );
    if (validLines.length === 0) {
      Alert.alert('Required', 'Add at least one product with quantity or value');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await salesService.createSale({
        date: new Date(date).toISOString(),
        stockistId,
        doctorId: doctorId || undefined,
        products: validLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity) || 0,
          free: Number(l.free) || 0,
          value: Number(l.value) || 0,
        })),
        remarks: remarks.trim() || undefined,
      });
      setSaved(true);
      setSubmitting(false);
      Alert.alert(
        'Sales entry saved',
        'Your sales entry has been saved successfully. Do you want to add another entry or go back?',
        [
          { text: 'Go back', onPress: () => navigation.goBack() },
          { text: 'Add another', onPress: () => { setSaved(false); setLines([]); setRemarks(''); } },
        ],
        { cancelable: false }
      );
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save sales');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Date & Stockist
            </Text>
            <TextInput
              label="Date"
              value={date}
              onChangeText={setDate}
              mode="outlined"
              style={styles.input}
            />
            <Text style={styles.label}>Stockist *</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={stockistId}
                onValueChange={setStockistId}
                style={styles.picker}
                prompt="Select stockist"
              >
                <Picker.Item label="Select stockist..." value="" />
                {stockists.map((s) => (
                  <Picker.Item key={s._id} label={`${s.name}${s.city ? `, ${s.city}` : ''}`} value={s._id} />
                ))}
              </Picker>
            </View>
            <Text style={styles.label}>Doctor (optional)</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={doctorId}
                onValueChange={setDoctorId}
                style={styles.picker}
                prompt="Select doctor"
              >
                <Picker.Item label="None" value="" />
                {doctors.map((d) => (
                  <Picker.Item key={d._id} label={`${d.name} (${d.specialization || ''})`} value={d._id} />
                ))}
              </Picker>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Products
              </Text>
              <Button mode="outlined" onPress={addLine} compact icon="plus">
                Add line
              </Button>
            </View>
            {lines.map((line, index) => {
              const unitPrice = stockistUnitPrice(line.mrp);
              return (
                <View key={index} style={styles.lineWrap}>
                  <View style={styles.lineRow}>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={line.productId}
                        onValueChange={(v) => setLineProduct(index, v)}
                        style={styles.picker}
                        prompt="Product"
                      >
                        {products.map((p) => (
                          <Picker.Item key={p._id} label={`${p.name} (${p.code || ''})`} value={p._id} />
                        ))}
                      </Picker>
                    </View>
                    <TextInput
                      label="Qty"
                      value={line.quantity}
                      onChangeText={(t) => updateLine(index, 'quantity', t)}
                      keyboardType="numeric"
                      mode="outlined"
                      dense
                      style={styles.qtyInput}
                    />
                    <TextInput
                      label="Free"
                      value={line.free}
                      onChangeText={(t) => updateLine(index, 'free', t)}
                      keyboardType="numeric"
                      mode="outlined"
                      dense
                      style={styles.qtyInput}
                    />
                    <TouchableOpacity onPress={() => removeLine(index)} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={28} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.valueRow}>
                    {unitPrice != null ? (
                      <Text variant="bodySmall" style={styles.rateText}>
                        Rate (27.5% off): ₹{unitPrice.toFixed(2)} → Value: ₹{line.value}
                      </Text>
                    ) : (
                      <TextInput
                        label="Value (₹)"
                        value={line.value}
                        onChangeText={(t) => updateLine(index, 'value', t)}
                        keyboardType="numeric"
                        mode="outlined"
                        dense
                        style={styles.valueInput}
                      />
                    )}
                  </View>
                </View>
              );
            })}
            {lines.length > 0 && (
              <Text variant="titleSmall" style={styles.total}>
                Total: ₹{totalValue.toLocaleString()}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Remarks (optional)"
              value={remarks}
              onChangeText={setRemarks}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {saved && (
          <Card style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#2E7D32', marginBottom: 8 }}>
                Sales entry saved successfully
              </Text>
              <Text variant="bodySmall" style={{ color: '#1B5E20' }}>
                Use the prompt above to go back or add another entry.
              </Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || saved || !stockistId || lines.length === 0}
          style={styles.submitBtn}
        >
          Save Sales Entry
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8 },
  label: { fontSize: 12, color: colors.dark, marginBottom: 4 },
  input: { marginBottom: 8 },
  pickerWrap: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 12 },
  picker: { minHeight: 48 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lineWrap: { marginBottom: 12 },
  lineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  valueRow: { marginLeft: 0 },
  rateText: { color: '#666', marginTop: 2 },
  qtyInput: { width: 64, marginHorizontal: 2 },
  valueInput: { width: 100, marginHorizontal: 2 },
  removeBtn: { padding: 4 },
  total: { marginTop: 8, fontWeight: 'bold' },
  errorText: { color: colors.error, marginBottom: 8 },
  submitBtn: { marginTop: 8 },
});

export default AddSalesScreen;
