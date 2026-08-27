import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_DIRECTORY, SERVER_BASE } from '../../config';

const WorkerCertificateDetail = ({ navigation, route }) => {
  const { workerId } = route.params || {};
  const [certData, setCertData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [workerId]);

  const fetchCertificate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_DIRECTORY}/GetWorkerCertificateDetail/${workerId}`
      );
      const data = await response.json();

      if (response.ok) {
        setCertData(data);
      } else {
        setCertData(null);
      }
    } catch (error) {
      console.error('Certificate fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/worker_default.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0088CC" />
      </SafeAreaView>
    );
  }

  if (!certData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Icon name="certificate-outline" size={60} color="#CCC" />
        <Text style={styles.errorText}>No Certificate Record Found</Text>
        <TouchableOpacity
          style={styles.backBtnSimple}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Icon name="chevron-left" size={28} color="#1A1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verified Training Certificate</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Worker Card */}
        <View style={styles.workerCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: getImageUri(certData.workerPicture) }}
              style={styles.avatar}
              defaultSource={require('../../images/logo.png')}
            />
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{certData.workerName}</Text>
            <Text style={styles.workerSub}>VERIFIED PERSONNEL</Text>
          </View>
        </View>

        {/* Issuing Authority Card */}
        <View style={styles.authorityCard}>
          <View style={styles.buildingIconBox}>
            <Icon name="office-building" size={22} color="#FFF" />
          </View>
          <View style={styles.authorityInfo}>
            <Text style={styles.authorityLabel}>ISSUING AUTHORITY</Text>
            <Text style={styles.authorityName}>{certData.companyName}</Text>
            <View style={styles.dateRow}>
              <Icon
                name="calendar-month-outline"
                size={14}
                color="#64748B"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.dateText}>
                Issued Date: {certData.issuedDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Certificate Content Card */}
        <View style={styles.certCard}>
          {/* Main Shield Icon */}
          <View style={styles.badgeCircle}>
            <Icon name="shield-check" size={34} color="#FFF" />
          </View>

          {/* Title */}
          <Text style={styles.certTitle}>{certData.certificateTitle}</Text>

          <View style={styles.divider} />

          {/* Evaluation Notes */}
          <Text style={styles.notesLabel}>EVALUATION & TRAINING NOTES</Text>
          <Text style={styles.notesText}>
            "{certData.evaluationNotes && certData.evaluationNotes.trim().length > 0
              ? certData.evaluationNotes
              : 'Completed an accredited driver training program covering theoretical traffic regulations, highway maneuvering, reverse parking, and emergency braking procedures. Certified with a practical understanding of vehicle dynamics and modern road safety standards.'}"
          </Text>

          {/* Digital Signature Footer */}
          <View style={styles.signatureBlock}>
            <Text style={styles.digitalSignature}>Digital Signature</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.verificationId}>
              Verification ID: CERT-{certData.certificateId || '1'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Close Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1C1E' },
  iconButton: { padding: 4 },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Worker Card
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EEE' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#00B14F',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  workerInfo: { marginLeft: 14, flex: 1 },
  workerName: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
  workerSub: {
    fontSize: 12,
    color: '#1E64D3',
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  // Authority Card
  authorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBECEE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  buildingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorityInfo: { marginLeft: 12, flex: 1 },
  authorityLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  authorityName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dateText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Main Certificate Card
  certCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  badgeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0088CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  certTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 6,
    fontWeight: '400',
  },

  // Signature Section
  signatureBlock: { marginTop: 28, alignItems: 'center' },
  digitalSignature: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 6,
  },
  verificationId: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  closeButton: {
    backgroundColor: '#E2E8F0',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { color: '#1E293B', fontWeight: 'bold', fontSize: 16 },

  errorText: { color: '#888', fontSize: 16, marginTop: 12, marginBottom: 18 },
  backBtnSimple: {
    backgroundColor: '#1E64D3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },
});

export default WorkerCertificateDetail;