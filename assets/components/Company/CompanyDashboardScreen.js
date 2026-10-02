import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_BASE } from '../../config';
import { courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';

const imageUrl = path => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

export default function CompanyDashboardScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setImageFailed(false);
      const data = await courseApi('/api/company/dashboard');
      setProfile(data);
      if (data.picture) await AsyncStorage.setItem('userPicture', data.picture);
      if (data.companyName) await AsyncStorage.setItem('userName', data.companyName);
    } catch (error) {
      NotificationHelper.showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const editProfile = () => {
    if (!profile) return;
    navigation.navigate('Signup', {
      isEdit: true,
      role: 'Company',
      initialData: profile,
    });
  };

  const logout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            'userToken', 'userRole', 'userName', 'userPicture', 'userAddress',
            'userPhone', 'userEmail', 'companyId', 'userId', 'user',
          ]);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <Icon name="domain-off" size={50} color={C.muted} />
        <Text style={styles.errorText}>Unable to load Company dashboard.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const picture = imageUrl(profile.picture);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandIcon}>
              <Icon name="domain" size={25} color={C.primary} />
            </View>
            <Text style={styles.dashboardLabel}>COMPANY DASHBOARD</Text>
            <TouchableOpacity style={styles.logoutIcon} onPress={logout}>
              <Icon name="logout" size={21} color="#B91C1C" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.pictureShell}>
              {picture && !imageFailed ? (
                <Image
                  source={{ uri: picture }}
                  style={styles.companyPicture}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View style={[styles.companyPicture, styles.pictureFallback]}>
                  <Icon name="office-building" size={39} color={C.primary} />
                </View>
              )}
              <View style={styles.verifiedDot}>
                <Icon name="check" size={12} color={C.white} />
              </View>
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.companyName}>{profile.companyName}</Text>
              <Text style={styles.companyMeta}>{profile.licenseNumber}</Text>
              <Text style={styles.companyAddress} numberOfLines={2}>
                {profile.companyAddress}
              </Text>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={editProfile}>
              <Icon name="pencil-outline" size={17} color={C.primary} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EAF3FF' }]}>
              <Icon name="book-open-page-variant" size={22} color={C.primary} />
            </View>
            <Text style={styles.statValue}>{profile.totalCourses}</Text>
            <Text style={styles.statLabel}>Total Courses</Text>
            <Text style={styles.statHint}>{profile.activeCourses} active</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E7F7F0' }]}>
              <Icon name="account-group" size={22} color={C.success} />
            </View>
            <Text style={styles.statValue}>{profile.uniqueEnrolledWorkers}</Text>
            <Text style={styles.statLabel}>Enrolled Workers</Text>
            <Text style={styles.statHint}>{profile.totalEnrollments} enrollments</Text>
          </View>
        </View>

        <View style={styles.completionCard}>
          <View style={styles.completionIcon}>
            <Icon name="certificate-outline" size={25} color={C.primary} />
          </View>
          <View style={styles.completionCopy}>
            <Text style={styles.completionTitle}>Training completions</Text>
            <Text style={styles.completionText}>
              {profile.completedEnrollments} course enrollments completed and eligible for certification.
            </Text>
          </View>
          <Text style={styles.completionNumber}>{profile.completedEnrollments}</Text>
        </View>

        <Text style={styles.sectionHeading}>Manage</Text>
        <TouchableOpacity
          style={styles.courseAction}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CompanyCourseDashboardScreen')}
        >
          <View style={styles.courseActionIcon}>
            <Icon name="school-outline" size={27} color={C.white} />
          </View>
          <View style={styles.courseActionCopy}>
            <Text style={styles.courseActionTitle}>Course Management</Text>
            <Text style={styles.courseActionText}>
              Create courses, manage enrolled workers and issue certificates.
            </Text>
          </View>
          <Icon name="chevron-right" size={25} color={C.white} />
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Icon name="logout" size={20} color={C.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background ,marginTop:4},
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  content: { paddingBottom: 35 },
  hero: {
    backgroundColor: C.white,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 22,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  brandIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  dashboardLabel: { flex: 1, color: C.primary, fontWeight: '900', fontSize: 12, letterSpacing: 1, marginLeft: 10 },
  logoutIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  pictureShell: { position: 'relative' },
  companyPicture: { width: 75, height: 75, borderRadius: 22 },
  pictureFallback: { backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  verifiedDot: { position: 'absolute', right: -3, bottom: -3, width: 23, height: 23, borderRadius: 12, backgroundColor: C.success, borderWidth: 3, borderColor: C.white, alignItems: 'center', justifyContent: 'center' },
  profileCopy: { flex: 1, marginLeft: 14 },
  companyName: { color: C.text, fontSize: 21, fontWeight: '900' },
  companyMeta: { color: C.primary, fontSize: 12, fontWeight: '700', marginTop: 4 },
  companyAddress: { color: C.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.pale, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11 },
  editText: { color: C.primary, fontWeight: '800', fontSize: 12, marginLeft: 4 },
  sectionHeading: { color: C.text, fontSize: 16, fontWeight: '900', marginHorizontal: 17, marginTop: 22, marginBottom: 11 },
  statsRow: { flexDirection: 'row', marginHorizontal: 14, gap: 10 },
  statCard: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 15 },
  statIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: C.text, fontSize: 26, fontWeight: '900', marginTop: 12 },
  statLabel: { color: C.text, fontWeight: '800', fontSize: 12, marginTop: 2 },
  statHint: { color: C.muted, fontSize: 10, marginTop: 4 },
  completionCard: { marginHorizontal: 14, marginTop: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  completionIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  completionCopy: { flex: 1, marginLeft: 11 },
  completionTitle: { color: C.text, fontWeight: '800' },
  completionText: { color: C.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  completionNumber: { color: C.primary, fontSize: 22, fontWeight: '900' },
  courseAction: { marginHorizontal: 14, backgroundColor: C.primary, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center' },
  courseActionIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  courseActionCopy: { flex: 1, marginLeft: 12 },
  courseActionTitle: { color: C.white, fontWeight: '900', fontSize: 16 },
  courseActionText: { color: '#DCEBFF', fontSize: 11, lineHeight: 16, marginTop: 4 },
  // logoutButton: { marginHorizontal: 14, marginTop: 22, backgroundColor: C.white, borderWidth: 1, borderColor: '#F4C7C7', borderRadius: 13, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: C.danger, fontWeight: '800', marginLeft: 7 },
  errorText: { color: C.muted, marginTop: 12 },
  retryButton: { marginTop: 14, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
  retryText: { color: C.white, fontWeight: '800' },
});
