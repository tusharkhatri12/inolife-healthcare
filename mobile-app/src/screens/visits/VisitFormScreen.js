import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  ProgressBar,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { doctorService } from '../../services/doctorService';
import { productService } from '../../services/productService';
import { visitService } from '../../services/visitService';
import { stockistService } from '../../services/stockistService';
import { salesService } from '../../services/salesService';
import { offlineService } from '../../services/offlineService';
import { useLocation } from '../../contexts/LocationContext';
import { useOffline } from '../../contexts/OfflineContext';
import { colors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const PURPOSES = [
  'Product Presentation',
  'Sample Distribution',
  'Follow-up',
  'Order Collection',
  'Relationship Building',
  'Other',
];

const VISIT_OUTCOMES = [
  { value: 'MET_DOCTOR', label: 'Met Doctor' },
  { value: 'DOCTOR_NOT_AVAILABLE', label: 'Doctor Not Available' },
  { value: 'DOCTOR_DID_NOT_MEET', label: 'Doctor Did Not Meet' },
  { value: 'CLINIC_CLOSED', label: 'Clinic Closed' },
  { value: 'OTHER', label: 'Other' },
];

const VisitFormScreen = ({ route, navigation }) => {
  const { doctorId: initialDoctorId } = route.params || {};
  const { getCurrentLocation, location } = useLocation();
  const { isOnline } = useOffline();

  // Step management (1=Doctor, 2=Outcome; then met: 3-7 Location→Start→Products→Notes→Review, not-met: 3-6 Reason→Remarks→Location→Submit)
  const [currentStep, setCurrentStep] = useState(1);
  const [visitOutcome, setVisitOutcome] = useState(null);
  const [notMetReason, setNotMetReason] = useState('');
  const [attemptRemarks, setAttemptRemarks] = useState('');
  const isMetFlow = visitOutcome === 'MET_DOCTOR' || !visitOutcome;
  const totalSteps =
    !visitOutcome ? 2 : isMetFlow ? 7 : 6;

  // Data
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctorId || '');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productDropdownValue, setProductDropdownValue] = useState('');
  const [productPickerModalVisible, setProductPickerModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [doctorFeedback, setDoctorFeedback] = useState('');

  // Add New Doctor modal
  const [addDoctorVisible, setAddDoctorVisible] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    specialization: '',
    clinicName: '',
    area: '',
    city: '',
    phone: '',
  });
  const [addDoctorLoading, setAddDoctorLoading] = useState(false);
  const [addDoctorError, setAddDoctorError] = useState('');

  // Location & Timing
  const [visitLocation, setVisitLocation] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Optional sales (attach to visit)
  const [stockists, setStockists] = useState([]);
  const [selectedStockistId, setSelectedStockistId] = useState('');
  const [salesLines, setSalesLines] = useState([]); // [{ productId, productName, quantity, value }]

  // UI States
  const [loading, setLoading] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    loadDoctors();
    loadProducts();
    loadStockists();
    if (initialDoctorId) {
      setCurrentStep(2); // Skip to outcome step if doctor pre-selected
    }
  }, []);

  useEffect(() => {
    if (route.params?.openAddDoctor) {
      setAddDoctorVisible(true);
    }
  }, [route.params?.openAddDoctor]);

  const loadStockists = async () => {
    try {
      const response = await stockistService.getStockists({ isActive: true });
      setStockists(response.data?.stockists || []);
    } catch (e) {
      console.error('Error loading stockists:', e);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctors({ isActive: true });
      setDoctors(response.data?.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  // Searchable doctor list: only doctors assigned to logged-in MR (from API)
  const filteredDoctors = useMemo(() => {
    const term = (doctorSearch || '').toLowerCase().trim();
    if (!term) return doctors;
    return doctors.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(term)) ||
        (d.specialization && d.specialization.toLowerCase().includes(term)) ||
        (d.city && d.city.toLowerCase().includes(term)) ||
        (d.clinicName && d.clinicName.toLowerCase().includes(term)) ||
        (d.area && d.area.toLowerCase().includes(term))
    );
  }, [doctors, doctorSearch]);

  const handleAddDoctorField = (field, value) => {
    setNewDoctorForm((prev) => ({ ...prev, [field]: value }));
    setAddDoctorError('');
  };

  const handleOpenAddDoctor = () => {
    setNewDoctorForm({
      name: '',
      specialization: '',
      clinicName: '',
      area: '',
      city: '',
      phone: '',
    });
    setAddDoctorError('');
    setAddDoctorVisible(true);
  };

  const handleCloseAddDoctor = () => {
    setAddDoctorVisible(false);
    setAddDoctorError('');
  };

  const handleSubmitNewDoctor = async () => {
    const { name, specialization } = newDoctorForm;
    if (!name || !name.trim()) {
      setAddDoctorError('Doctor name is required');
      return;
    }
    if (!specialization || !specialization.trim()) {
      setAddDoctorError('Specialization is required');
      return;
    }
    setAddDoctorLoading(true);
    setAddDoctorError('');
    try {
      const response = await doctorService.createDoctor({
        name: name.trim(),
        specialization: specialization.trim(),
        clinicName: newDoctorForm.clinicName.trim() || undefined,
        area: newDoctorForm.area.trim() || undefined,
        city: newDoctorForm.city.trim() || undefined,
        phone: newDoctorForm.phone.trim() || undefined,
      });
      const created = response.data?.doctor;
      if (created && created._id) {
        await loadDoctors();
        setSelectedDoctor(created._id);
        handleCloseAddDoctor();
        Alert.alert('Doctor Added', 'Doctor added successfully. Pending admin approval. You can use them for visits.');
      } else {
        setAddDoctorError('Failed to add doctor');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to add doctor';
      setAddDoctorError(msg);
    } finally {
      setAddDoctorLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({ isActive: true });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleDoctorSelect = () => {
    if (!selectedDoctor) {
      Alert.alert('Required', 'Please select a doctor');
      return;
    }
    setCurrentStep(2); // Outcome step
  };

  const handleOutcomeSelect = (outcome) => {
    setVisitOutcome(outcome);
  };

  const handleOutcomeNext = () => {
    if (!visitOutcome) {
      Alert.alert('Required', 'Please select visit outcome');
      return;
    }
    if (visitOutcome === 'MET_DOCTOR') {
      setCurrentStep(3); // Location
    } else {
      setCurrentStep(3); // Reason (not met)
    }
  };

  const handleNotMetReasonNext = () => {
    if (!notMetReason.trim()) {
      Alert.alert('Required', 'Please select or enter reason for not meeting');
      return;
    }
    setCurrentStep(4); // Remarks
  };

  const handleNotMetRemarksNext = () => {
    setCurrentStep(5); // Location for attempted visit
  };

  const handleNotMetLocationNext = () => {
    setCurrentStep(6); // Submit attempted visit
  };

  const handleCaptureLocation = async () => {
    setCapturingLocation(true);
    setLocationError('');

    try {
      const locationData = await getCurrentLocation();

      if (!locationData || !locationData.coords) {
        setLocationError('Failed to capture location. Please ensure GPS is enabled.');
        return;
      }

      const location = {
        type: 'Point',
        coordinates: [
          locationData.coords.longitude,
          locationData.coords.latitude,
        ],
      };

      setVisitLocation(location);
      if (visitOutcome === 'MET_DOCTOR') {
        setCurrentStep(4); // Start visit
      } else {
        setCurrentStep(6); // Submit attempted visit
      }
    } catch (error) {
      console.error('Error capturing location:', error);
      setLocationError('Failed to capture location. Please try again.');
    } finally {
      setCapturingLocation(false);
    }
  };

  const handleStartVisit = () => {
    const now = new Date();
    setCheckInTime(now);
    setCurrentStep(5); // Products
  };

  const handleProductToggle = (productId) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.productId === productId);
      if (exists) {
        return prev.filter((p) => p.productId !== productId);
      } else {
        return [...prev, { productId, quantity: 0, notes: '' }];
      }
    });
  };

  const handleAddProductFromDropdown = (productId) => {
    const id = productId || productDropdownValue;
    if (!id) return;
    const exists = selectedProducts.some((p) => p.productId === id);
    if (!exists) {
      setSelectedProducts((prev) => [...prev, { productId: id, quantity: 0, notes: '' }]);
      setProductDropdownValue('');
      setProductPickerModalVisible(false);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
  };

  const handleProductQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, quantity: parseInt(quantity) || 0 } : p
      )
    );
  };

  const handleProductNotesChange = (productId, notes) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, notes } : p))
    );
  };

  const handleNextFromProducts = () => {
    setCurrentStep(6); // Notes
  };

  const handleEndVisit = () => {
    const now = new Date();
    setCheckOutTime(now);
    setCurrentStep(7); // Review
  };

  const handleAddSalesLine = () => {
    const firstProduct = products[0];
    if (!firstProduct) return;
    setSalesLines((prev) => [
      ...prev,
      {
        productId: firstProduct._id,
        productName: firstProduct.name,
        quantity: '0',
        value: '0',
      },
    ]);
  };

  const handleRemoveSalesLine = (index) => {
    setSalesLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSalesLineChange = (index, field, text) => {
    setSalesLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: text } : line))
    );
  };

  const handleSalesLineProductChange = (index, productId) => {
    const product = products.find((p) => p._id === productId);
    setSalesLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? { ...line, productId, productName: product?.name || '' }
          : line
      )
    );
  };

  const handleSubmitAttemptedVisit = async () => {
    if (!visitLocation) {
      Alert.alert('GPS Required', 'Please capture location before submitting');
      setCurrentStep(5);
      return;
    }
    setSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');
    const now = new Date();
    const visitData = {
      doctorId: selectedDoctor,
      visitDate: now.toISOString(),
      visitTime: now.toISOString(),
      visitOutcome,
      notMetReason: notMetReason.trim(),
      attemptRemarks: attemptRemarks.trim() || undefined,
      location: visitLocation,
      duration: 0,
      status: 'Completed',
      productsDiscussed: [],
      samplesGiven: [],
      orders: [],
    };
    try {
      if (isOnline) {
        await visitService.createVisit(visitData);
        setSubmitStatus('success');
        setSubmitMessage('Attempted visit logged successfully.');
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        await offlineService.savePendingVisit(visitData);
        setSubmitStatus('success');
        setSubmitMessage('Saved offline. Will sync when online.');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error.response?.data?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validate GPS location
    if (!visitLocation) {
      Alert.alert('GPS Required', 'Please capture location before submitting');
      setCurrentStep(3);
      return;
    }

    // Validate check-in and check-out times
    if (!checkInTime || !checkOutTime) {
      Alert.alert('Required', 'Please complete visit timing');
      return;
    }

    if (checkOutTime <= checkInTime) {
      Alert.alert('Invalid Time', 'Check-out time must be after check-in time');
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');

    try {
      // Calculate duration in minutes
      const duration = Math.round((checkOutTime - checkInTime) / (1000 * 60));

      const visitData = {
        doctorId: selectedDoctor,
        visitDate: checkInTime.toISOString(),
        visitTime: checkInTime.toISOString(),
        visitOutcome: 'MET_DOCTOR',
        purpose,
        productsDiscussed: selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          notes: p.notes,
        })),
        notes,
        doctorFeedback,
        status: 'Completed',
        checkInTime: checkInTime.toISOString(),
        checkOutTime: checkOutTime.toISOString(),
        duration,
        location: visitLocation,
      };

      if (isOnline) {
        try {
          await visitService.createVisit(visitData);
          if (
            selectedStockistId &&
            salesLines.length > 0 &&
            salesLines.some(
              (l) => (Number(l.quantity) || 0) > 0 || (Number(l.value) || 0) > 0
            )
          ) {
            try {
              await salesService.createSale({
                date: visitData.visitDate,
                doctorId: selectedDoctor || undefined,
                stockistId: selectedStockistId,
                products: salesLines.map((l) => ({
                  productId: l.productId,
                  quantity: Number(l.quantity) || 0,
                  value: Number(l.value) || 0,
                })),
                remarks: 'From visit',
              });
              setSubmitMessage('Visit and sales logged successfully!');
            } catch (salesErr) {
              console.warn('Sales entry failed:', salesErr);
              setSubmitMessage('Visit logged. Sales entry failed – you can add it later.');
            }
          } else {
            setSubmitMessage('Visit logged successfully!');
          }
          setSubmitStatus('success');
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        } catch (error) {
          // If online but API fails, save offline
          await offlineService.savePendingVisit(visitData);
          setSubmitStatus('success');
          setSubmitMessage('Visit saved offline. Will sync when online.');
          
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        }
      } else {
        await offlineService.savePendingVisit(visitData);
        setSubmitStatus('success');
        setSubmitMessage('Visit saved offline. Will sync when online.');
        
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting visit:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.response?.data?.message || 'Failed to save visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <ProgressBar progress={currentStep / totalSteps} color={colors.primary} />
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>
    );
  };

  const renderStep1 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          1. Select Doctor
        </Text>
        <Text variant="bodySmall" style={styles.stepDescription}>
          Only doctors assigned to you are shown. Search by name, specialization, or city.
        </Text>
        <TextInput
          label="Search doctor"
          value={doctorSearch}
          onChangeText={setDoctorSearch}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          placeholder="Type to search..."
        />
        <Text variant="labelMedium" style={styles.doctorListLabel}>
          Tap a doctor to select
        </Text>
        <View style={styles.doctorListContainer}>
          <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item._id}
            style={styles.doctorList}
            nestedScrollEnabled
            ListEmptyComponent={
              <Text variant="bodySmall" style={styles.emptyListText}>
                {doctorSearch ? 'No matching doctors' : 'No doctors assigned'}
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = selectedDoctor === item._id;
              const isUnapproved = item.isApproved === false;
              const getCategoryColor = (cat) => {
                if (cat === 'A') return colors.error;
                if (cat === 'B') return colors.warning;
                if (cat === 'C') return colors.success;
                return colors.dark;
              };
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedDoctor(item._id)}
                  style={[styles.doctorListItem, isSelected && styles.doctorListItemSelected]}
                >
                  <View style={styles.doctorListContent}>
                    <View style={styles.doctorListRow}>
                      <Text variant="titleMedium" style={styles.doctorListName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.doctorListBadges}>
                      {item.category && (
                        <View
                          style={[
                            styles.doctorListCategoryBadge,
                            { backgroundColor: getCategoryColor(item.category) },
                          ]}
                        >
                          <Text style={styles.doctorListBadgeText}>Cat. {item.category}</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.doctorListStatusBadge,
                          {
                            backgroundColor: isUnapproved ? colors.warning : colors.success,
                          },
                        ]}
                      >
                        <Text style={styles.doctorListBadgeText}>
                          {isUnapproved ? 'Pending' : 'Approved'}
                        </Text>
                      </View>
                    </View>
                    <Text variant="bodySmall" style={styles.doctorListMeta}>
                      {item.specialization}
                      {item.area ? ` • ${item.area}` : ''}
                      {item.city ? ` • ${item.city}` : ''}
                      {item.clinicName ? ` • ${item.clinicName}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        <Button
          mode="outlined"
          onPress={handleOpenAddDoctor}
          style={styles.button}
          icon="plus"
        >
          + Add New Doctor
        </Button>
        <Button
          mode="contained"
          onPress={handleDoctorSelect}
          disabled={!selectedDoctor}
          style={styles.button}
        >
          Next
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep2Outcome = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          2. Visit Outcome
        </Text>
        <Text variant="bodySmall" style={styles.stepDescription}>
          Did you meet the doctor or was it an attempted visit?
        </Text>
        <View style={styles.chipContainer}>
          {VISIT_OUTCOMES.map((o) => (
            <Chip
              key={o.value}
              selected={visitOutcome === o.value}
              onPress={() => handleOutcomeSelect(o.value)}
              style={styles.chip}
            >
              {o.label}
            </Chip>
          ))}
        </View>
        <Button
          mode="contained"
          onPress={handleOutcomeNext}
          disabled={!visitOutcome}
          style={styles.button}
        >
          Next
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep3Reason = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          3. Reason (required)
        </Text>
        <Text variant="bodySmall" style={styles.stepDescription}>
          Select or enter reason for not meeting the doctor.
        </Text>
        <View style={styles.chipContainer}>
          {VISIT_OUTCOMES.filter((o) => o.value !== 'MET_DOCTOR').map((o) => (
            <Chip
              key={o.value}
              selected={notMetReason === o.value}
              onPress={() => setNotMetReason(o.value)}
              style={styles.chip}
            >
              {o.label}
            </Chip>
          ))}
        </View>
        <TextInput
          label="Or type reason"
          value={notMetReason}
          onChangeText={setNotMetReason}
          mode="outlined"
          style={styles.input}
          placeholder="e.g. Doctor in surgery"
        />
        <Button
          mode="contained"
          onPress={handleNotMetReasonNext}
          disabled={!notMetReason.trim()}
          style={styles.button}
        >
          Next
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep4Remarks = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          4. Remarks (optional)
        </Text>
        <TextInput
          label="Remarks"
          value={attemptRemarks}
          onChangeText={setAttemptRemarks}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          placeholder="Any additional notes..."
        />
        <Button
          mode="contained"
          onPress={handleNotMetRemarksNext}
          style={styles.button}
        >
          Next
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep5LocationNotMet = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          5. Capture Location
        </Text>
        <Text variant="bodyMedium" style={styles.stepDescription}>
          GPS location is required for attempted visits.
        </Text>
        {visitLocation ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text variant="bodyLarge" style={styles.successText}>
              Location Captured
            </Text>
            <Button
              mode="contained"
              onPress={handleNotMetLocationNext}
              style={styles.button}
            >
              Next
            </Button>
          </View>
        ) : (
          <>
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
            <Button
              mode="contained"
              onPress={handleCaptureLocation}
              loading={capturingLocation}
              disabled={capturingLocation}
              style={styles.button}
              icon="location"
            >
              {capturingLocation ? 'Capturing...' : 'Capture Location'}
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );

  const renderStep6SubmitNotMet = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          6. Submit Attempted Visit
        </Text>
        <View style={styles.reviewSection}>
          <Text variant="bodyMedium">Doctor: {doctors.find((d) => d._id === selectedDoctor)?.name}</Text>
          <Text variant="bodyMedium">Outcome: {VISIT_OUTCOMES.find((o) => o.value === visitOutcome)?.label}</Text>
          <Text variant="bodyMedium">Reason: {notMetReason}</Text>
          {attemptRemarks ? (
            <Text variant="bodySmall" style={styles.stepDescription}>Remarks: {attemptRemarks}</Text>
          ) : null}
        </View>
        {submitStatus === 'success' && (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.successMessage}>{submitMessage}</Text>
          </View>
        )}
        {submitStatus === 'error' && (
          <View style={styles.statusContainer}>
            <Ionicons name="close-circle" size={48} color={colors.error} />
            <Text style={styles.errorMessage}>{submitMessage}</Text>
            <Button mode="contained" onPress={handleSubmitAttemptedVisit} style={styles.button}>
              Retry
            </Button>
          </View>
        )}
        {!submitStatus && (
          <Button
            mode="contained"
            onPress={handleSubmitAttemptedVisit}
            loading={submitting}
            disabled={submitting || !visitLocation}
            style={styles.button}
            icon="check"
          >
            Submit Attempted Visit
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          2. Capture Location
        </Text>
        <Text variant="bodyMedium" style={styles.stepDescription}>
          GPS location is required to log your visit
        </Text>
        {visitLocation ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text variant="bodyLarge" style={styles.successText}>
              Location Captured
            </Text>
            <Text variant="bodySmall" style={styles.coordinatesText}>
              Lat: {visitLocation.coordinates[1].toFixed(6)}
              {'\n'}
              Lng: {visitLocation.coordinates[0].toFixed(6)}
            </Text>
            <Button
              mode="outlined"
              onPress={handleCaptureLocation}
              style={styles.button}
            >
              Re-capture Location
            </Button>
            <Button
              mode="contained"
              onPress={() => setCurrentStep(4)}
              style={styles.button}
            >
              Continue
            </Button>
          </View>
        ) : (
          <>
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
            <Button
              mode="contained"
              onPress={handleCaptureLocation}
              loading={capturingLocation}
              disabled={capturingLocation}
              style={styles.button}
              icon="location"
            >
              {capturingLocation ? 'Capturing...' : 'Capture Location'}
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          3. Start Visit
        </Text>
        <Text variant="bodyMedium" style={styles.stepDescription}>
          Tap below when you start the visit
        </Text>
        {checkInTime ? (
          <View style={styles.timeContainer}>
            <Text variant="headlineSmall" style={styles.timeText}>
              Visit Started
            </Text>
            <Text variant="bodyLarge">
              {checkInTime.toLocaleTimeString()}
            </Text>
            <Button
              mode="outlined"
              onPress={() => setCurrentStep(4)}
              style={styles.button}
            >
              Continue to Products
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={handleStartVisit}
            style={styles.button}
            icon="play-circle"
          >
            Start Visit
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderStep4 = () => {
    const availableProducts = products.filter(
      (p) => !selectedProducts.some((s) => s.productId === p._id)
    );
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.stepTitle}>
            4. Products Discussed
          </Text>
          <Text variant="bodyMedium" style={styles.stepDescription}>
            Add products from the dropdown. Selected products are listed below.
          </Text>

          <Text variant="labelMedium" style={styles.productDropdownLabel}>
            Add product (tap to select)
          </Text>
          <TouchableOpacity
            style={styles.productSelectTouchable}
            onPress={() => setProductPickerModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text variant="bodyLarge" style={styles.productSelectTouchableText}>
              {availableProducts.length === 0
                ? 'All products already added'
                : 'Tap to choose a product...'}
            </Text>
            <Ionicons name="chevron-down" size={22} color={colors.placeholder} />
          </TouchableOpacity>
          <Modal
            visible={productPickerModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setProductPickerModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.productPickerModalOverlay}
              activeOpacity={1}
              onPress={() => setProductPickerModalVisible(false)}
            >
              <View
                style={styles.productPickerModalContent}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.productPickerModalHeader}>
                  <Text variant="titleMedium" style={styles.productPickerModalTitle}>
                    Select product
                  </Text>
                  <TouchableOpacity
                    onPress={() => setProductPickerModalVisible(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={28} color={colors.dark} />
                  </TouchableOpacity>
                </View>
                {availableProducts.length === 0 ? (
                  <Text variant="bodyMedium" style={styles.productPickerModalEmpty}>
                    No more products to add. All are already selected.
                  </Text>
                ) : (
                  <FlatList
                    data={availableProducts}
                    keyExtractor={(item) => item._id}
                    style={styles.productPickerModalList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.productPickerModalItem}
                        onPress={() => handleAddProductFromDropdown(item._id)}
                        activeOpacity={0.7}
                      >
                        <Text variant="bodyLarge" style={styles.productPickerModalItemName}>
                          {item.name || 'Unnamed'}
                        </Text>
                        {item.code ? (
                          <Text variant="bodySmall" style={styles.productPickerModalItemCode}>
                            {item.code}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </TouchableOpacity>
          </Modal>

          {selectedProducts.length > 0 ? (
            <>
              <Text variant="labelMedium" style={styles.selectedProductsLabel}>
                Already selected products
              </Text>
              <View style={styles.selectedProductsList}>
                {selectedProducts.map((sel, index) => {
                  const productId = sel && sel.productId != null ? String(sel.productId) : '';
                  const product = products.find((p) => p._id === productId);
                  const qty = sel.quantity != null ? Number(sel.quantity) : 0;
                  const notes = sel.notes != null ? String(sel.notes) : '';
                  return (
                    <View key={productId || `product-${index}`} style={styles.selectedProductRow}>
                      <View style={styles.selectedProductInfo}>
                        <Text variant="titleSmall">
                          {product?.name || productId || 'Product'}{' '}
                          {product?.code ? `(${product.code})` : ''}
                        </Text>
                        <View style={styles.selectedProductInputs}>
                          <TextInput
                            label="Qty"
                            value={String(qty)}
                            onChangeText={(t) =>
                              handleProductQuantityChange(productId, t)
                            }
                            keyboardType="numeric"
                            mode="outlined"
                            dense
                            style={styles.selectedProductQty}
                          />
                          <TextInput
                            label="Notes"
                            value={notes}
                            onChangeText={(t) =>
                              handleProductNotesChange(productId, t)
                            }
                            mode="outlined"
                            dense
                            style={styles.selectedProductNotes}
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveProduct(productId)}
                        style={styles.removeProductBtn}
                      >
                        <Ionicons name="close-circle" size={28} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <Text variant="bodySmall" style={styles.emptySelectedText}>
              No products selected. Use the dropdown above to add.
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleNextFromProducts}
            style={styles.button}
          >
            Continue
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderStep5 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.stepTitle}>
          5. Visit Notes
        </Text>
        <TextInput
          label="Visit Purpose"
          value={purpose}
          mode="outlined"
          editable={false}
          style={styles.input}
        />
        <View style={styles.chipContainer}>
          {PURPOSES.map((p) => (
            <Chip
              key={p}
              selected={purpose === p}
              onPress={() => setPurpose(p)}
              style={styles.chip}
            >
              {p}
            </Chip>
          ))}
        </View>
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          placeholder="Add visit notes..."
        />
        <TextInput
          label="Doctor Feedback"
          value={doctorFeedback}
          onChangeText={setDoctorFeedback}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          placeholder="Doctor's feedback..."
        />
        <Button
          mode="contained"
          onPress={handleEndVisit}
          style={styles.button}
          icon="stop-circle"
        >
          End Visit
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep6 = () => {
    const duration = checkInTime && checkOutTime
      ? Math.round((checkOutTime - checkInTime) / (1000 * 60))
      : 0;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.stepTitle}>
            6. Review & Submit
          </Text>
          
          <View style={styles.reviewSection}>
            <Text variant="titleMedium" style={styles.reviewLabel}>
              Visit Summary
            </Text>
            <View style={styles.reviewRow}>
              <Text variant="bodyMedium" style={styles.reviewKey}>
                Check-in:
              </Text>
              <Text variant="bodyMedium">
                {checkInTime?.toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.reviewRow}>
              <Text variant="bodyMedium" style={styles.reviewKey}>
                Check-out:
              </Text>
              <Text variant="bodyMedium">
                {checkOutTime?.toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.reviewRow}>
              <Text variant="bodyMedium" style={styles.reviewKey}>
                Duration:
              </Text>
              <Text variant="bodyMedium">{duration} minutes</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text variant="bodyMedium" style={styles.reviewKey}>
                Products:
              </Text>
              <Text variant="bodyMedium">
                {selectedProducts.length} product(s)
              </Text>
            </View>
          </View>

          <Text variant="titleMedium" style={[styles.reviewLabel, { marginTop: 16 }]}>
            Attach sales (optional)
          </Text>
          <Text variant="bodySmall" style={styles.stepDescription}>
            Link this visit to a stockist and product sales. Leave empty to skip.
          </Text>
          <View style={styles.productDropdownContainer}>
            <Picker
              selectedValue={selectedStockistId}
              onValueChange={setSelectedStockistId}
              style={styles.productPicker}
              prompt="Select stockist"
            >
              <Picker.Item label="Select stockist..." value="" />
              {stockists.map((s) => (
                <Picker.Item key={s._id} label={`${s.name}${s.city ? `, ${s.city}` : ''}`} value={s._id} />
              ))}
            </Picker>
          </View>
          {salesLines.map((line, index) => (
            <View key={index} style={styles.selectedProductRow}>
              <Picker
                selectedValue={line.productId}
                onValueChange={(v) => handleSalesLineProductChange(index, v)}
                style={[styles.productPicker, { flex: 1 }]}
                prompt="Product"
              >
                {products.map((p) => (
                  <Picker.Item key={p._id} label={`${p.name} (${p.code || ''})`} value={p._id} />
                ))}
              </Picker>
              <TextInput
                label="Qty"
                value={line.quantity}
                onChangeText={(t) => handleSalesLineChange(index, 'quantity', t)}
                keyboardType="numeric"
                mode="outlined"
                dense
                style={styles.selectedProductQty}
              />
              <TextInput
                label="Value (₹)"
                value={line.value}
                onChangeText={(t) => handleSalesLineChange(index, 'value', t)}
                keyboardType="numeric"
                mode="outlined"
                dense
                style={styles.selectedProductQty}
              />
              <TouchableOpacity onPress={() => handleRemoveSalesLine(index)} style={styles.removeProductBtn}>
                <Ionicons name="close-circle" size={28} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <Button
            mode="outlined"
            onPress={handleAddSalesLine}
            style={styles.addProductButton}
            compact
            icon="plus"
          >
            Add product line
          </Button>

          {submitStatus === 'success' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.successMessage}>{submitMessage}</Text>
            </View>
          )}

          {submitStatus === 'error' && (
            <View style={styles.statusContainer}>
              <Ionicons name="close-circle" size={48} color={colors.error} />
              <Text style={styles.errorMessage}>{submitMessage}</Text>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
              >
                Retry
              </Button>
            </View>
          )}

          {!submitStatus && (
            <>
              {!visitLocation && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={24} color={colors.warning} />
                  <Text style={styles.warningText}>
                    GPS location is required
                  </Text>
                </View>
              )}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || !visitLocation}
                style={styles.button}
                icon="check"
              >
                Submit Visit
              </Button>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2Outcome();
      case 3:
        return isMetFlow ? renderStep2() : renderStep3Reason();
      case 4:
        return isMetFlow ? renderStep3() : renderStep4Remarks();
      case 5:
        return isMetFlow ? renderStep4() : renderStep5LocationNotMet();
      case 6:
        return isMetFlow ? renderStep5() : renderStep6SubmitNotMet();
      case 7:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {renderStepIndicator()}
        {renderCurrentStep()}
      </ScrollView>

      {/* Add New Doctor modal */}
      <Modal
        visible={addDoctorVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseAddDoctor}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.stepTitle}>
              Add New Doctor
            </Text>
            <Text variant="bodySmall" style={styles.stepDescription}>
              New doctors are pending admin approval. You can use them for visits.
            </Text>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <TextInput
                label="Doctor Name *"
                value={newDoctorForm.name}
                onChangeText={(v) => handleAddDoctorField('name', v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Specialization *"
                value={newDoctorForm.specialization}
                onChangeText={(v) => handleAddDoctorField('specialization', v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Clinic/Hospital"
                value={newDoctorForm.clinicName}
                onChangeText={(v) => handleAddDoctorField('clinicName', v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Area/Locality"
                value={newDoctorForm.area}
                onChangeText={(v) => handleAddDoctorField('area', v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="City"
                value={newDoctorForm.city}
                onChangeText={(v) => handleAddDoctorField('city', v)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Phone (optional)"
                value={newDoctorForm.phone}
                onChangeText={(v) => handleAddDoctorField('phone', v)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
              {addDoctorError ? (
                <Text style={styles.errorText}>{addDoctorError}</Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={handleCloseAddDoctor} style={styles.modalButton}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitNewDoctor}
                loading={addDoctorLoading}
                disabled={addDoctorLoading}
                style={[styles.modalButton, styles.modalButtonSecond]}
              >
                Add Doctor
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    padding: 16,
    backgroundColor: colors.white,
  },
  stepText: {
    textAlign: 'center',
    marginTop: 8,
    color: colors.dark,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
  },
  stepDescription: {
    color: colors.placeholder,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 12,
  },
  doctorListLabel: {
    color: colors.dark,
    marginBottom: 8,
    fontWeight: '600',
  },
  doctorListContainer: {
    minHeight: 200,
    maxHeight: 320,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  doctorList: {
    flexGrow: 0,
  },
  doctorListItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.placeholder,
  },
  doctorListItemSelected: {
    backgroundColor: colors.primary + '18',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  doctorListContent: {
    flex: 1,
  },
  doctorListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  doctorListName: {
    fontWeight: '600',
    color: colors.dark,
    flex: 1,
  },
  doctorListBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  doctorListCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  doctorListStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  doctorListBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  doctorListMeta: {
    color: colors.placeholder,
    marginTop: 2,
    fontSize: 13,
  },
  emptyListText: {
    padding: 16,
    textAlign: 'center',
    color: colors.placeholder,
  },
  button: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successText: {
    color: colors.success,
    fontWeight: 'bold',
    marginTop: 8,
  },
  coordinatesText: {
    color: colors.placeholder,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    padding: 16,
  },
  timeText: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  productDropdownLabel: {
    marginTop: 8,
    marginBottom: 4,
    color: colors.dark,
  },
  productSelectTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.placeholder,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  productSelectTouchableText: {
    color: colors.dark,
    flex: 1,
  },
  productPickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  productPickerModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  productPickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.placeholder,
  },
  productPickerModalTitle: {
    fontWeight: '600',
    color: colors.dark,
  },
  productPickerModalEmpty: {
    padding: 24,
    color: colors.placeholder,
    textAlign: 'center',
  },
  productPickerModalList: {
    maxHeight: 360,
  },
  productPickerModalItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.placeholder,
  },
  productPickerModalItemName: {
    color: colors.dark,
    fontWeight: '500',
  },
  productPickerModalItemCode: {
    color: colors.placeholder,
    marginTop: 2,
  },
  productDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.placeholder,
    borderRadius: 4,
    marginBottom: 16,
  },
  productPicker: {
    flex: 1,
    height: 48,
  },
  addProductButton: {
    marginRight: 8,
  },
  selectedProductsLabel: {
    marginTop: 8,
    marginBottom: 6,
    color: colors.dark,
  },
  selectedProductsList: {
    marginBottom: 16,
  },
  selectedProductRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.placeholder,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductInputs: {
    flexDirection: 'row',
    marginTop: 8,
  },
  selectedProductQty: {
    width: 80,
    marginRight: 8,
  },
  selectedProductNotes: {
    flex: 1,
  },
  removeProductBtn: {
    padding: 4,
  },
  emptySelectedText: {
    color: colors.placeholder,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  productsContainer: {
    marginBottom: 16,
  },
  productCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.light,
  },
  productCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 8,
  },
  productCode: {
    color: colors.placeholder,
  },
  productDetails: {
    marginTop: 12,
    paddingLeft: 40,
  },
  productInput: {
    marginBottom: 8,
  },
  reviewSection: {
    backgroundColor: colors.light,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  reviewLabel: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewKey: {
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  successMessage: {
    color: colors.success,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorMessage: {
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: colors.warning,
    marginLeft: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    maxHeight: '85%',
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    minWidth: 100,
  },
  modalButtonSecond: {
    marginLeft: 8,
  },
});

export default VisitFormScreen;
