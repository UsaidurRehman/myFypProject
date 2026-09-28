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
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_POLICE, SERVER_BASE } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

// The verdict the officer records on the certificate.
const CHARACTER_STATUSES = [
  'Clear - No Record',
  'Good Character',
  'Verified - Satisfactory',
];

const IssueCharacterCertificateScreen = ({ route, navigation }) => {
  const workerId = route?.params?.workerId;

  const [worker, setWorker] = useState(null);
  const [existingCert, setExistingCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state (the "detailed" field set)
  const [certificateNo, setCertificateNo] = useState('');
  const [characterStatus, setCharacterStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [cnicVerified, setCnicVerified] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadWorker();
  }, [workerId]);

  const loadWorker = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_POLICE}/GetWorkerDetails/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setWorker(data);
        if (data.existingCertificate) {
          setExistingCert(data.existingCertificate);
          // Pre-fill for a renewal so the officer only changes what is needed.
          setCertificateNo(data.existingCertificate.certificateNo || '');
          setCharacterStatus(data.existingCertificate.characterStatus || '');
          setRemarks(data.existingCertificate.remarks || '');
        }
      } else {
        NotificationHelper.showError(data.message || 'Failed to load worker.');
      }
    } catch (error) {
      console.error('Error loading worker:', error);
      NotificationHelper.showError('Failed to load worker profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!characterStatus) {
      NotificationHelper.showError('Please select the character status.');
      return;
    }
    if (!cnicVerified) {
      NotificationHelper.showError("Please confirm you have verified the worker's CNIC.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        workerId: workerId,
        certificateNo: certificateNo.trim(), // blank → server auto-generates
        characterStatus: characterStatus,
        remarks: remarks.trim(),
        verifiedCnic: worker?.cnic || '',
        cnicVerified: cnicVerified,
      };

      const response = await fetch(`${API_POLICE}/IssueCharacterCertificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        NotificationHelper.showSuccess(
          `${result.message} (valid until ${result.expiryDate})`,
          () => navigation.goBack()
        );
      } else {
        const errorMsg = result.detail ? `${result.message} (${result.detail})` : (result.message || 'Failed to issue certificate.');
        NotificationHelper.showError(errorMsg);
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
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  const avatarUri = worker?.picture
    ? worker.picture.startsWith('http')
      ? worker.picture
      : `${SERVER_BASE}${worker.picture}`
    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  const isRenewal = existingCert && existingCert.isValid;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRenewal ? 'Renew Character Certificate' : 'Issue Character Certificate'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Worker Summary Card */}
        <View style={styles.workerCard}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker?.name || 'Worker Profile'}</Text>
            <Text style={styles.workerCnic}>CNIC: {worker?.cnic || 'N/A'}</Text>
          </View>
        </View>

        {existingCert ? (
          <View style={styles.noticeBox}>
            <Icon name="information-outline" size={16} color="#0F766E" />
            <Text style={styles.noticeText}>
              {existingCert.isValid
                ? `A valid certificate exists (until ${existingCert.expiryDate}). Submitting will renew it for another 5 years.`
                : `The previous certificate expired on ${existingCert.expiryDate}. Submitting will issue a fresh 5-year certificate.`}
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>Certificate Reference No.</Text>
        <View style={styles.inputContainer}>
          <Icon name="pound" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Leave blank to auto-generate"
            placeholderTextColor="#94A3B8"
            value={certificateNo}
            onChangeText={setCertificateNo}
          />
        </View>

        <Text style={styles.label}>Character Status *</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.7}
        >
          <Icon name="shield-check-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <Text style={[styles.textInput, !characterStatus && { color: '#94A3B8' }]}>
            {characterStatus || 'Select character status'}
          </Text>
          <Icon name="chevron-down" size={22} color="#64748B" />
        </TouchableOpacity>

        <Text style={styles.label}>Remarks / Verification Detail</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textAreaInput}
            placeholder="Enter background verification detail, references checked, station notes..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={remarks}
            onChangeText={setRemarks}
          />
        </View>

        {/* CNIC re-verification confirmation */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setCnicVerified(!cnicVerified)}
          activeOpacity={0.7}
        >
          <Icon
            name={cnicVerified ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={cnicVerified ? '#0F766E' : '#94A3B8'}
          />
          <Text style={styles.checkboxText}>
            I confirm I have physically re-verified this worker's CNIC ({worker?.cnic || 'N/A'}).
          </Text>
        </TouchableOpacity>

        <View style={styles.validityNote}>
          <Icon name="calendar-check" size={16} color="#475569" />
          <Text style={styles.validityText}>This certificate will be valid for 5 years from today.</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="certificate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>
                {isRenewal ? 'Renew Certificate (5 yrs)' : 'Issue Certificate (5 yrs)'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Character status dropdown */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Character Status</Text>
            {CHARACTER_STATUSES.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalItem}
                onPress={() => {
                  setCharacterStatus(item);
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
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  workerCnic: { fontSize: 13, color: '#64748B', marginTop: 3 },

  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 12, color: '#0F766E', lineHeight: 17 },

  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textAreaInput: { fontSize: 14, color: '#1E293B' },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkboxText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 18 },

  validityNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18, marginLeft: 4 },
  validityText: { fontSize: 12, color: '#475569', fontWeight: '600' },

  submitButton: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 15 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 14, color: '#334155' },
});

export default IssueCharacterCertificateScreen;
