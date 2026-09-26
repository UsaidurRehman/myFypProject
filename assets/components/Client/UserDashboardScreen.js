import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet, View, Text, Image, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar, ActivityIndicator, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';

const UserDashboard = ({ navigation }) => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview', 'Active', 'Past'

  // User details state
  const [userName, setUserName] = useState("Client User");
  const [userPicture, setUserPicture] = useState("");
  const [userAddress, setUserAddress] = useState("Your Address");
  const [userPhone, setUserPhone] = useState("03XXXXXXX");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [hiredCount, setHiredCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);

  const sortWorkersByInterviewIdDesc = (list = []) => {
    return [...list].sort((a, b) => {
      const aId = Number(a.interviewId || a.id || 0);
      const bId = Number(b.interviewId || b.id || 0);
      return bId - aId;
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
      fetchWorkers();
    }, [])
  );

  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const pic = await AsyncStorage.getItem('userPicture');
      const addr = await AsyncStorage.getItem('userAddress');
      const phone = await AsyncStorage.getItem('userPhone');
      const email = await AsyncStorage.getItem('userEmail');
      const id = await AsyncStorage.getItem('clientId');

      if (name) setUserName(name);
      if (pic) setUserPicture(pic);
      if (addr) setUserAddress(addr);
      if (phone) setUserPhone(phone);
      if (email) setUserEmail(email);
      if (id) setUserId(id);
    } catch (error) {
      console.error("Error loading user info from AsyncStorage:", error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('Signup', {
      isEdit: true,
      role: 'Client',
      initialData: {
        id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        location: userAddress,
        picture: userPicture
      }
    });
  };

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetClientDashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const list = sortWorkersByInterviewIdDesc(data.hiredWorkers || []);

        const activeWorkers = list.filter(w => {
          const s = (w.status || '').toString().toLowerCase();
          return !s.includes('terminate') && !s.includes('resign');
        });

        setWorkers(list);
        setHiredCount(activeWorkers.length);
        setPendingInterviewsCount(data.pendingInterviewsCount || 0);
      } else if (response.status === 401) {
        NotificationHelper.showError("Session Expired. Please login again.");
        navigation.replace('Login');
      } else {
        console.error("Failed to fetch dashboard data", await response.text());
      }
    } catch (error) {
      console.error("Network error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const isTerminatedWorker = (item) => {
    const s = (item.status || '').toString().trim().toLowerCase();
    return s.includes('terminate') || s.includes('resign');
  };

  const activeWorkersList = workers.filter(w => !isTerminatedWorker(w));
  const pastWorkersList = workers.filter(w => isTerminatedWorker(w));

  const getDisplayedWorkers = () => {
    if (activeTab === 'Active') return activeWorkersList;
    if (activeTab === 'Past') return pastWorkersList;
    return [];
  };

  const renderWorkerCard = ({ item }) => {
    const rawStatus = (item.status || '').toString();
    const statusNorm = rawStatus.trim().toLowerCase();

    let displayStatus = 'On Work';
    if (statusNorm.includes('resign')) {
      displayStatus = 'Resigned';
    } else if (statusNorm.includes('terminate')) {
      displayStatus = 'Terminated';
    }

    const isPast = isTerminatedWorker(item);

    return (
      <TouchableOpacity
        style={styles.workerCard}
        onPress={() => navigation.navigate('WorkerDetailScreen', { workerId: item.id })}
        activeOpacity={0.85}
      >
        {/* Row 1 — who is working for you */}
        <View style={styles.cardHeader}>
          <Image
            source={{
              uri: item.picture && item.picture.startsWith('/')
                ? `${SERVER_BASE}${item.picture}`
                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            }}
            style={styles.workerImage}
          />

          <View style={styles.workerInfo}>
            <Text style={styles.workerName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.workerCaption} numberOfLines={1}>
              {isPast ? 'Contract closed' : 'Working with you'}
            </Text>
          </View>

          <View style={[styles.statusPill, isPast ? styles.resignedPill : styles.activePill]}>
            <Text style={[styles.statusPillText, isPast ? styles.resignedPillText : styles.activePillText]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        {/* Row 2 — part-time / full-time, and the reserved window when part-time */}
        <View style={styles.chipRow}>
          <JobTypeBadge jobType={item.jobType} small />
          <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} small />
        </View>

        {/* Row 3 — where the job is */}
        <View style={styles.locationRow}>
          <Icon name="map-marker-outline" size={15} color="#E91E63" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location || 'Location not set'}
          </Text>
        </View>

        <View style={styles.cardDivider} />

        {/* Row 4 — record + the only real action here */}
        <View style={styles.cardFooter}>
          <View style={styles.recordIdWrap}>
            <Icon name="file-document-outline" size={13} color="#A0AEC0" />
            <Text style={styles.recordIdText}>Record ID: #{item.interviewId || item.id || 'N/A'}</Text>
          </View>

          {!isPast && (
            <TouchableOpacity
              style={styles.terminateBtn}
              onPress={() => navigation.navigate('TerminateContractScreen', {
                workerId: item.id,
                interviewId: item.interviewId
              })}
              activeOpacity={0.85}
            >
              <Icon name="account-off-outline" size={14} color="#C53030" />
              <Text style={styles.terminateBtnText}>Terminate</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Navigation / Action Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBackBtn}>
          <Icon name="chevron-left" size={24} color="#4A5568" style={styles.centeredIcon} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.editPillBtn} onPress={handleEditProfile}>
            <Icon name="pencil-outline" size={14} color="#3182CE" />
            <Text style={styles.editPillText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutPillBtn} onPress={handleLogout}>
            <Icon name="logout" size={14} color="#E53E3E" />
            <Text style={styles.logoutPillText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info Overview */}
      <View style={styles.profileSection}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.greetingText}>GOOD MORNING</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <Image
          source={{
            uri: userPicture && userPicture.startsWith('/')
              ? `${SERVER_BASE}${userPicture}`
              : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png'
          }}
          style={styles.profilePic}
          onError={() => console.log('Dashboard profile image failed:', `${SERVER_BASE}${userPicture}`)}
        />
      </View>

      {/* Contact Card */}
      <View style={styles.addressCard}>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={16} color="#E91E63" />
          <Text style={styles.infoText}>{userAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={16} color="#2B6CB0" />
          <Text style={styles.infoText}>{userPhone}</Text>
        </View>
      </View>

      {/* Quick Access Service Cards Grid */}
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('FindServiceScreen')}>
          <View style={[styles.gridIconBg, { backgroundColor: '#EBF8FF' }]}>
            <Icon name="bag-personal-outline" size={20} color="#3182CE" />
          </View>
          <Text style={styles.gridCardText}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('ActiveRequestScreen')}>
          <View style={[styles.gridIconBg, { backgroundColor: '#FEFCBF' }]}>
            <Icon name="calendar-month-outline" size={20} color="#D69E2E" />
          </View>
          {pendingInterviewsCount > 0 && <View style={styles.orangeNotificationDot} />}
          <Text style={styles.gridCardText}>Interviews</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('WorkerDecisionScreen')}>
          <View style={[styles.gridIconBg, { backgroundColor: '#E6FFFA' }]}>
            <Icon name="briefcase-outline" size={20} color="#319795" />
          </View>
          <Text style={styles.gridCardText}>Job Reqs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('ResignationsScreen')}>
          <View style={[styles.gridIconBg, { backgroundColor: '#FFF5F5' }]}>
            <Icon name="file-document-outline" size={20} color="#E53E3E" />
          </View>
          <Text style={styles.gridCardText}>Resignations</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Tab Control Bar */}
      <View style={styles.segmentContainer}>
        {['Overview', 'Active', 'Past'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview View Content */}
      {activeTab === 'Overview' && (
        <View style={styles.overviewCardsRow}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewIconBgBlue}>
              <Icon name="account-group" size={22} color="#3182CE" />
            </View>
            <View style={styles.overviewCardTextCol}>
              <Text style={styles.overviewCardLabel}>Workers</Text>
              <Text style={styles.overviewCardNum}>{hiredCount}</Text>
            </View>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>Live</Text>
            </View>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIconBgOrange}>
              <Icon name="clock-outline" size={22} color="#DD6B20" />
            </View>
            <View style={styles.overviewCardTextCol}>
              <Text style={styles.overviewCardLabel}>Interview</Text>
              <Text style={styles.overviewCardNum}>{pendingInterviewsCount}</Text>
            </View>
            <View style={styles.pendingTag}>
              <Text style={styles.pendingTagText}>Pending</Text>
            </View>
          </View>
        </View>
      )}

      {/* Sub Header Row for Active and Past Lists */}
      {activeTab !== 'Overview' && (
        <View style={styles.subHeaderRow}>
          <Text style={styles.subHeaderText}>
            Showing {getDisplayedWorkers().length} {activeTab === 'Past' ? 'historical worker records' : 'active worker records'}
          </Text>
          {/* <TouchableOpacity>
            <Text style={styles.filterText}>Filter by Status</Text>
          </TouchableOpacity> */}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={true} />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3182CE" />
        </View>
      ) : (
        <FlatList
          data={getDisplayedWorkers()}
          renderItem={renderWorkerCard}
          keyExtractor={item => (item.interviewId || item.id || '').toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            activeTab !== 'Overview' ? (
              <Text style={styles.emptyListText}>
                No worker records found in {activeTab.toLowerCase()}.
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

    workerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8EDF5',
        elevation: 2,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    workerImage: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EAF2FF' },
    workerInfo: { marginLeft: 12, flex: 1, marginRight: 8 },
    workerName: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
    workerCaption: { fontSize: 11.5, color: '#94A3B8', marginTop: 2 },

    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexShrink: 0 },
    activePill: { backgroundColor: '#DCFCE7' },
    activePillText: { fontSize: 11, fontWeight: '800', color: '#166534' },
    resignedPill: { backgroundColor: '#FEF3C7' },
    resignedPillText: { fontSize: 11, fontWeight: '800', color: '#92400E' },
    statusPillText: { fontSize: 11, fontWeight: '800' },

    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },

    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    locationText: { fontSize: 12.5, color: '#64748B', marginLeft: 6, flex: 1 },

    cardDivider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 12, marginBottom: 10 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    recordIdWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    recordIdText: { fontSize: 11, color: '#94A3B8', marginLeft: 5, fontWeight: '600' },
    terminateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    terminateBtnText: { fontSize: 12, fontWeight: '800', color: '#C53030', marginLeft: 5 },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  headerContainer: { paddingTop: 4 },

  topBar: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  circleBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  centeredIcon: {
    alignSelf: 'center',
    textAlign: 'center'
  },
  headerRightActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  editPillText: { color: '#3182CE', fontSize: 13, fontWeight: '600' },
  logoutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  logoutPillText: { color: '#E53E3E', fontSize: 13, fontWeight: '600' },

  profileSection: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  greetingText: { fontSize: 11, fontWeight: '800', color: '#3182CE', letterSpacing: 0.5 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginTop: 2 },
  profilePic: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#3182CE' },

  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    gap: 8
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 8, color: '#4A5568', fontSize: 13 },

  gridContainer: {
    flexDirection: 'row',
    justify: 'space-between',
    marginBottom: 20,
    gap: 8
  },
  gridCard: {
    backgroundColor: '#FFF',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justify: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    position: 'relative'
  },
  gridIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  gridCardText: { fontSize: 11, fontWeight: '600', color: '#2D3748', textAlign: 'center' },
  orangeNotificationDot: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DD6B20'
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 22,
    padding: 4,
    marginBottom: 20
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18
  },
  segmentBtnActive: { backgroundColor: '#FFF' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#718096' },
  segmentTextActive: { color: '#3182CE', fontWeight: 'bold' },

  overviewCardsRow: {
    flexDirection: 'row',
    justify: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 16
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    position: 'relative'
  },
  overviewIconBgBlue: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF8FF',
    justify: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  overviewIconBgOrange: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFAF0',
    justify: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  overviewCardTextCol: { flex: 1 },
  overviewCardLabel: { fontSize: 11, color: '#718096', fontWeight: '600' },
  overviewCardNum: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginTop: 2 },
  liveTag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    top: 12,
    right: 10
  },
  liveTagText: { fontSize: 10, color: '#3182CE', fontWeight: 'bold' },
  pendingTag: {
    backgroundColor: '#FFFAF0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    top: 12,
    right: 10
  },
  pendingTagText: { fontSize: 10, color: '#DD6B20', fontWeight: 'bold' },

  subHeaderRow: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  subHeaderText: { fontSize: 12, color: '#718096', fontWeight: '500' },
  filterText: { fontSize: 12, color: '#3182CE', fontWeight: '600' },

  emptyListText: { textAlign: 'center', marginTop: 24, fontStyle: 'italic', color: '#A0AEC0', fontSize: 13 }
});

export default UserDashboard;