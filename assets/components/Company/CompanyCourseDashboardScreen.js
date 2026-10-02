import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SERVER_BASE } from '../../config';
import { courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';

const resolveCompanyPicture = path => {
  if (!path || typeof path !== 'string') return null;
  const clean = path.trim().replace(/\\/g, '/');
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  const relative = clean.startsWith('/')
    ? clean
    : clean.startsWith('Images/')
      ? `/${clean}`
      : `/Images/${clean}`;
  return `${SERVER_BASE}${relative}?v=${Date.now()}`;
};

export default function CompanyCourseDashboardScreen({ navigation }) {
  const [scope, setScope] = useState('active');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyPicture, setCompanyPicture] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [result, company] = await Promise.all([
        courseApi(`/api/company/courses?scope=${scope}`),
        courseApi('/api/company/dashboard'),
      ]);
      setItems(Array.isArray(result) ? result : []);
      const freshPicture = company?.picture || await AsyncStorage.getItem('userPicture');
      setCompanyPicture(freshPicture);
      if (freshPicture) await AsyncStorage.setItem('userPicture', freshPicture);
      setImageFailed(false);
    } catch (error) {
      NotificationHelper.showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const removeCourse = async courseId => {
    try {
      const result = await courseApi(`/api/company/courses/${courseId}`, {
        method: 'DELETE',
      });
      NotificationHelper.showSuccess(result.message);
      load();
    } catch (error) {
      NotificationHelper.showError(error.message);
    }
  };

  const renderCourse = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('CompanyCourseDetailScreen', {
        courseId: item.courseId,
      })}
    >
      <View style={styles.courseRow}>
        <View style={styles.courseIcon}>
          <Icon name="school-outline" size={24} color={C.primary} />
        </View>

        <View style={styles.courseContent}>
          <Text style={styles.courseTitle}>{item.courseName}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar-range" size={13} color={C.muted} />
            <Text style={styles.metaText}>
              {item.startDate} — {item.endDate}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Icon name="clock-outline" size={13} color={C.muted} />
            <Text style={styles.metaText}>{item.classTimings}</Text>
          </View>
        </View>

        <Icon name="chevron-right" size={24} color={C.muted} />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.countText}>
          {item.enrollmentCount} enrolled · {item.completedCount} completed
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeCourse(item.courseId)}
        >
          <Icon name="trash-can-outline" size={19} color={C.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="book-open-page-variant-outline" size={44} color={C.primary} />
      <Text style={styles.emptyTitle}>No {scope} courses</Text>
      <Text style={styles.emptyText}>
        Create a professional training course to get started.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('WorkerDirectoryScreen')}>
          <Icon name="account-group-outline" size={25} color={C.white} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.heading}>Course Management</Text>
          <Text style={styles.headerSubtitle}>Build skills. Certify achievement.</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CompanyCourseFormScreen')}
          >
            <Icon name="plus" size={21} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAvatarButton}
            onPress={() => navigation.navigate('CompanyDashboardScreen')}
          >
            {companyPicture && !imageFailed ? (
              <Image
                source={{ uri: resolveCompanyPicture(companyPicture) }}
                defaultSource={require('../../images/logo.png')}
                style={styles.headerAvatar}
                resizeMode="cover"
                onError={event => {
                  console.warn('Course header picture failed:', resolveCompanyPicture(companyPicture), event.nativeEvent?.error);
                  setImageFailed(true);
                }}
              />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                <Icon name="domain" size={21} color={C.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {['active', 'past', 'archived'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, scope === tab && styles.activeTab]}
            onPress={() => setScope(tab)}
          >
            <Text style={[styles.tabText, scope === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={C.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.courseId)}
          renderItem={renderCourse}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: { flex: 1, marginLeft: 14 },
  heading: { color: C.white, fontSize: 21, fontWeight: '800' },
  headerSubtitle: { color: '#DCEBFF', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButton: { backgroundColor: C.white, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerAvatarButton: { borderWidth: 2, borderColor: C.white, borderRadius: 13 },
  headerAvatar: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.white },
  headerAvatarFallback: { backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', padding: 14, gap: 8 },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  activeTab: { backgroundColor: C.primary },
  tabText: { color: C.muted, fontWeight: '700' },
  activeTabText: { color: C.white },
  loader: { marginTop: 60 },
  list: { padding: 14, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  courseRow: { flexDirection: 'row', alignItems: 'center' },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.pale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseContent: { flex: 1 },
  courseTitle: { color: C.text, fontWeight: '800', fontSize: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  metaText: { color: C.muted, fontSize: 12, marginLeft: 5 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  deleteButton: { padding: 4 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginTop: 10 },
  emptyText: { color: C.muted, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
