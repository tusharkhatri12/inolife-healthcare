import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { stockistService } from '../../services/stockistService';
import { schemeService } from '../../services/schemeService';
import { colors } from '../../theme';

const SCHEME_TYPES = ['Discount', 'FreeQty', 'Credit', 'Other'];

const AddSchemeScreen = ({ navigation }) => {
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [stockistId, setStockistId] = useState('');
  const [schemeType, setSchemeType] = useState(SCHEME_TYPES[0]);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadStockists();
  }, []);

  const loadStockists = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await stockistService.getStockists({ isActive: true });
      setStockists(res?.data?.stockists || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load stockists');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!stockistId) {
      Alert.alert('Required', 'Please select a stockist');
      return;
    }
    if (!startDate) {
      Alert.alert('Required', 'Please enter start date');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await schemeService.createScheme({
        stockistId,
        schemeType,
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setSaved(true);
      setSubmitting(false);
      Alert.alert(
        'Scheme saved',
        'Scheme has been added successfully. Admin can review or edit later. Add another or go back?',
        [
          { text: 'Go back', onPress: () => navigation.goBack() },
          {
            text: 'Add another',
            onPress: () => {
              setSaved(false);
              setStockistId('');
              setSchemeType(SCHEME_TYPES[0]);
              setDescription('');
              setStartDate(new Date().toISOString().split('T')[0]);
              setEndDate('');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save scheme');
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
              Scheme details
            </Text>
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
            <Text style={styles.label}>Scheme type</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={schemeType}
                onValueChange={setSchemeType}
                style={styles.picker}
                prompt="Type"
              >
                {SCHEME_TYPES.map((t) => (
                  <Picker.Item key={t} label={t.replace(/([A-Z])/g, ' $1').trim()} value={t} />
                ))}
              </Picker>
            </View>
            <TextInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            <TextInput
              label="Start date *"
              value={startDate}
              onChangeText={setStartDate}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              label="End date (optional)"
              value={endDate}
              onChangeText={setEndDate}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
          </Card.Content>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {saved && (
          <Card style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#2E7D32', marginBottom: 8 }}>
                Scheme saved successfully
              </Text>
              <Text variant="bodySmall" style={{ color: '#1B5E20' }}>
                Use the prompt above to go back or add another scheme.
              </Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || saved || !stockistId || !startDate}
          style={styles.submitBtn}
        >
          Add Scheme
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
  input: { marginBottom: 12 },
  pickerWrap: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 12 },
  picker: { minHeight: 48 },
  errorText: { color: colors.error, marginBottom: 8 },
  submitBtn: { marginTop: 8 },
});

export default AddSchemeScreen;
