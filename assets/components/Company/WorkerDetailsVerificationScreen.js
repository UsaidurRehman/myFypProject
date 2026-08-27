import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DIRECTORY } from '../../config';

// Extract base server URL (e.g., "http://10.0.2.2:5000") by stripping "/api/CompanyDirectory" or similar API suffixes
const SERVER_BASE = API_DIRECTORY ? API_DIRECTORY.split('/api')[0] : 'http://10.0.2.2:5000';

const WorkerDetailsVerificationScreen = ({ route, navigation }) => {
  const { workerId } = route.params || {};

  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [certificateTitle, setCertificateTitle] = useState('');
  const [trainingNotes, setTrainingNotes] = useState('');

  // Helper to format relative picture URIs into complete HTTP URLs
  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/worker_default.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  useEffect(() => {
    if (workerId) {
      fetchWorkerDetails();
    }
  }, [workerId]);

  const fetchWorkerDetails = async () => {
    try {
      setIsLoading(true);
      // Compatible with both route params (/GetWorkerDetails/1) and query params (?workerId=1)
      const response = await fetch(`${API_DIRECTORY}/GetWorkerDetails/${workerId}`);
      const data = await response.json();

      if (response.ok) {
        setWorker(data);
      } else {
        NotificationHelper.showError(data.message || "Could not load worker details.");
      }
    } catch (error) {
      console.error(error);
      NotificationHelper.showError("Server network error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!certificateTitle.trim()) {
      NotificationHelper.showError("Please enter a certificate title.");
      return;
    }

    try {
      setIsSubmitting(true);

      let companyIdRaw = await AsyncStorage.getItem('companyId') || await AsyncStorage.getItem('userId');

      if (!companyIdRaw) {
        const userObjStr = await AsyncStorage.getItem('user');
        if (userObjStr) {
          const parsedUser = JSON.parse(userObjStr);
          companyIdRaw = parsedUser?.companyID || parsedUser?.companyId || parsedUser?.userId || parsedUser?.id;
        }
      }

      const companyId = parseInt(companyIdRaw, 10);

      if (!companyId || isNaN(companyId)) {
        NotificationHelper.showError("Session expired: Please log out and log in again.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        workerId: parseInt(workerId, 10),
        companyId: companyId,
        certificateTitle: certificateTitle.trim(),
        trainingEvaluationNotes: trainingNotes.trim()
      };

      const response = await fetch(`${API_DIRECTORY}/IssueCertificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        NotificationHelper.showSuccess(data.message || "Certificate issued successfully!");
        navigation.goBack();
      } else {
        NotificationHelper.showError(data.message || "Failed to issue certificate.");
      }
    } catch (error) {
      console.error(error);
      NotificationHelper.showError("Network error issuing certificate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#026597" />
      </SafeAreaView>
    );
  }

  // Construct valid avatar HTTP URL using the helper
  const avatarUri = getImageUri(worker?.picture);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color="#1A1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Details & Certification</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Profile Summary Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: avatarUri }} 
                style={styles.avatar} 
              />
              <View style={styles.verifiedBadge}>
                <Icon name="check-decagram" size={22} color="#026597" />
              </View>
            </View>

            <Text style={styles.workerName}>{worker?.name}</Text>
            <Text style={styles.workerTitle}>{worker?.roleTitle}</Text>

            <View style={styles.divider} />

            {/* Info Table Rows */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNIC</Text>
              <Text style={styles.infoValue}>{worker?.cnic}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{worker?.phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {worker?.address}
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <Text style={styles.sectionLabel}>CERTIFICATE TITLE</Text>
          <View style={styles.inputContainer}>
            <Icon name="ribbon" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Advanced Cleaning Certification"
              placeholderTextColor="#999"
              value={certificateTitle}
              onChangeText={setCertificateTitle}
            />
          </View>

          <Text style={styles.sectionLabel}>TRAINING DETAILS</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Type training assessment and evaluation notes here..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={trainingNotes}
              onChangeText={setTrainingNotes}
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleIssueCertificate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Icon name="send-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Issue & Publish Certificate</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF'
  },
  backButton: { padding: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1C1E' },
  scrollContent: { padding: 20 },

  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#E0E0E0' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 1
  },
  workerName: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 2 },
  workerTitle: { fontSize: 12, fontWeight: '700', color: '#026597', letterSpacing: 0.6, marginBottom: 12 },
  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginVertical: 6
  },
  infoLabel: { fontSize: 13, color: '#888', width: 75, fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1C1E', textAlign: 'right' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, height: 50, fontSize: 14, color: '#333' },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 12 },
  textArea: { height: 110, width: '100%' },

  submitButton: {
    backgroundColor: '#026597',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    elevation: 3,
    shadowColor: '#026597',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  disabledButton: { opacity: 0.7 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});

export default WorkerDetailsVerificationScreen;