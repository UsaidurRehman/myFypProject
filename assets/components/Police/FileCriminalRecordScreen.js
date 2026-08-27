import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_POLICE, SERVER_BASE } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

const CRIME_TYPES = [
  'Theft / Burglary',
  'Physical Assault',
  'Fraud / Misrepresentation',
  'Property Damage',
  'Substance Abuse',
  'Other Violation',
];

const FileCriminalRecordScreen = ({ route, navigation }) => {
  const workerId = route?.params?.workerId || 1;

  const [policeId, setPoliceId] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [firNumber, setFirNumber] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [dateOfOffense, setDateOfOffense] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [flagOnly, setFlagOnly] = useState(true);
  const [details, setDetails] = useState('');

  // Dropdown Modal State
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadSessionAndWorker();
  }, [workerId]);

  const loadSessionAndWorker = async () => {
    try {
      const storedPoliceId = await AsyncStorage.getItem('policeId');
      if (storedPoliceId) {
        setPoliceId(parseInt(storedPoliceId, 10));
      }

      const response = await fetch(`${API_POLICE}/GetWorkerDetails/${workerId}`);
      const data = await response.json();
      if (response.ok) {
        setWorker(data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      NotificationHelper.showError('Failed to load worker profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlagOnly = (value) => {
    setFlagOnly(value);
    if (value) {
      setFirNumber('');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfOffense(selectedDate);
    }
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!flagOnly && !firNumber.trim()) {
      NotificationHelper.showError('FIR Number / Case ID is required when filing an official FIR.');
      return;
    }

    if (!crimeType || !details.trim()) {
      NotificationHelper.showError('Please complete all required crime report details.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        workerId: workerId,
        policeId: policeId || 0,
        firNumber: flagOnly ? null : firNumber.trim(),
        offenseCategory: crimeType,
        offenseDate: formatDateString(dateOfOffense),
        isFlagged: true,
        isBlocked: !flagOnly,
        caseDetails: details.trim(),
      };

      const response = await fetch(`${SERVER_BASE}/api/Police/FileCriminalRecord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = flagOnly 
          ? 'Warning issued and worker profile flagged successfully.' 
          : 'Official FIR filed successfully.';

        NotificationHelper.showSuccess(successMessage, () => {
          navigation.goBack();
        });
      } else {
        const errorMessage = result.error 
          ? `${result.message} - ${result.error}` 
          : (result.message || 'Failed to submit report.');
        NotificationHelper.showError(errorMessage);
      }
    } catch (error) {
      console.error('Submission error:', error);
      NotificationHelper.showError('Server network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E293B" />
      </View>
    );
  }

  const avatarUri = worker?.picture
    ? worker.picture.startsWith('http')
      ? worker.picture
      : `${SERVER_BASE}${worker.picture}`
    : 'https://via.placeholder.com/150';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Criminal Record</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Worker Summary Card */}
        <View style={styles.workerCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <Icon name="check-decagram" size={16} color="#0284C7" />
            </View>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker?.name || 'Worker Profile'}</Text>
            <Text style={styles.workerCnic}>CNIC: {worker?.cnic || 'N/A'}</Text>
          </View>
        </View>

        {/* Input: FIR Number */}
        <View style={[styles.inputContainer, flagOnly && styles.disabledInput]}>
          <Icon 
            name="badge-account-outline" 
            size={20} 
            color={flagOnly ? '#94A3B8' : '#64748B'} 
            style={styles.inputIcon} 
          />
          <TextInput
            style={[styles.textInput, flagOnly && styles.disabledTextInput]}
            placeholder={flagOnly ? 'FIR Number (Disabled for Warning)' : 'FIR Number / Case ID *'}
            placeholderTextColor="#94A3B8"
            value={firNumber}
            onChangeText={setFirNumber}
            editable={!flagOnly}
          />
        </View>

        {/* Dropdown: Select Crime Type */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.textInput, !crimeType && { color: '#94A3B8' }]}>
            {crimeType || 'Select Crime Type *'}
          </Text>
          <Icon name="chevron-down" size={22} color="#64748B" />
        </TouchableOpacity>

        {/* Calendar Field: Date of Offense */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Icon name="calendar-month-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <Text style={styles.textInput}>
            {formatDateString(dateOfOffense)}
          </Text>
          <Icon name="calendar" size={20} color="#0284C7" />
        </TouchableOpacity>

        {/* DateTimePicker Component */}
        {showDatePicker && (
          <DateTimePicker
            value={dateOfOffense}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* System Security Action Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleHeader}>SYSTEM SECURITY ACTION</Text>
            <Text style={styles.toggleSubtext}>
              {flagOnly ? 'Flag Only (Warning Badge Only)' : 'Official FIR (Flag Profile)'}
            </Text>
          </View>
          <Switch
            value={flagOnly}
            onValueChange={handleToggleFlagOnly}
            trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
            thumbColor={flagOnly ? '#0284C7' : '#F1F5F9'}
          />
        </View>

        {/* Text Area: Details */}
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textAreaInput}
            placeholder="Type detailed crime report and official legal investigation specifics here... *"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={details}
            onChangeText={setDetails}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, !flagOnly && styles.firSubmitButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.alertCircle}>
                <Icon name="alert" size={16} color={flagOnly ? '#D97706' : '#B91C1C'} />
              </View>
              <Text style={styles.submitButtonText}>
                {flagOnly ? 'Issue Warning & Flag Profile' : 'Submit Official FIR'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Crime Type Dropdown Modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Crime Type</Text>
            {CRIME_TYPES.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  setCrimeType(item);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatarWrapper: { position: 'relative', marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  workerCnic: { fontSize: 13, color: '#64748B', marginTop: 3 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  disabledInput: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  disabledTextInput: { color: '#64748B' },

  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  toggleTextContainer: { flex: 1, paddingRight: 10 },
  toggleHeader: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  toggleSubtext: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginTop: 4 },

  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  textAreaInput: { fontSize: 14, color: '#1E293B' },

  submitButton: {
    backgroundColor: '#D97706',
    borderRadius: 25,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  firSubmitButton: {
    backgroundColor: '#B91C1C',
    shadowColor: '#B91C1C',
  },
  alertCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 15 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 14, color: '#334155' },
});

export default FileCriminalRecordScreen;