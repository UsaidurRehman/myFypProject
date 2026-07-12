import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet, View, Text, Image, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DASHBOARD } from '../../config';

const UserDashboard = ({ navigation }) => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const sortWorkersByInterviewIdDesc = (list = []) => {
    return [...list].sort((a, b) => {
      const aId = Number(a.interviewId || a.id || 0);
      const bId = Number(b.interviewId || b.id || 0);
      return bId - aId;
    });
  };

  // States to hold user info loaded from AsyncStorage
  const [userName, setUserName] = useState("Client User");
  const [userPicture, setUserPicture] = useState("");
  const [userAddress, setUserAddress] = useState("Your Address");
  const [userPhone, setUserPhone] = useState("03XXXXXXX");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [hiredCount, setHiredCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);

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
          return !s.includes('terminate');
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
    return s.includes('terminate');
  };

  const renderWorkerCard = ({ item }) => {
    const rawStatus = (item.status || '').toString();
    const statusNorm = rawStatus.trim().toLowerCase();

    let normalizedKey = 'active';
    let displayStatus = 'On Work';

    if (!statusNorm || statusNorm === '' || statusNorm === 'on work' || statusNorm === 'onwork' || statusNorm === 'available') {
      normalizedKey = 'active';
      displayStatus = 'On Work';
    } else if (statusNorm.includes('resign')) {
      normalizedKey = 'resigned';
      displayStatus = 'Resigned';
    } else if (statusNorm.includes('terminate')) {
      normalizedKey = 'terminated';
      displayStatus = 'Terminated';
    } else if (item.type === 'alert' || statusNorm === 'alert') {
      normalizedKey = 'alert';
      displayStatus = rawStatus || 'Alert';
    } else {
      normalizedKey = statusNorm.replace(/\s+/g, '_') || 'active';
      displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
    }

    const isTerminatedOrResigned = isTerminatedWorker(item);

    return (
      <TouchableOpacity
        style={[styles.workerCard, (item.type === 'alert' || normalizedKey === 'resigned') && styles.alertBorder]}
        onPress={() => navigation.navigate('WorkerDetailScreen', { workerId: item.id })}
        activeOpacity={0.7}
      >
        {(item.type === 'alert' || normalizedKey === 'resigned') && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>Resignation Alert</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: item.picture && item.picture.startsWith('/')
                  ? `${SERVER_BASE}${item.picture}`
                  : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
              }}
              style={styles.workerImage}
            />
            <View style={styles.workerBadgeOverlay}>
              <Icon name="account" size={12} color="#FFF" />
            </View>
          </View>

          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{item.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={16} color="#E91E63" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
            <View style={styles.dateRow}>
              <Icon name="calendar-clock" size={14} color="#888" />
              <Text style={styles.dateText}>Joined on {item.date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={[styles.statusBadge, styles[`status_${normalizedKey}`] || styles.status_active]}>
            <Text style={[styles.statusText, styles[`text_${normalizedKey}`] || styles.text_active]}>
              {displayStatus}
            </Text>
          </View>

          {normalizedKey === 'active' ? (
            <TouchableOpacity
              style={[styles.mainBtn, styles.blueBtn]}
              onPress={() => navigation.navigate('TerminateContractScreen', {
                workerId: item.id,
                interviewId: item.interviewId
              })}
            >
              <Text style={styles.mainBtnText}>Terminate</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color="#555" />
      </TouchableOpacity>

      {/* Profile Header */}
      <View style={styles.profileSection}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>Good Morning</Text>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.smallBlueBtn} onPress={handleLogout}>
              <Text style={styles.smallBtnText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallBlueBtn} onPress={handleEditProfile}>
              <Text style={styles.smallBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
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

      {/* Address Card */}
      <View style={styles.addressCard}>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={20} color="#E91E63" />
          <Text style={styles.infoText}>{userAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color="#333" />
          <Text style={styles.infoText}>{userPhone}</Text>
        </View>
      </View>

      {/* Grid Menu */}
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('FindServiceScreen')}>
          <Text style={styles.menuBtnText}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ActiveRequestScreen')} style={styles.menuBtn}><Text style={styles.menuBtnText}>Interview Requests</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('WorkerDecisionScreen')} style={styles.menuBtn}><Text style={styles.menuBtnText}>Job Requests</Text></TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.navigate('ResignationsScreen')}
        >
          <Text style={styles.menuBtnText}>Resignations</Text>
        </TouchableOpacity>
      </View>

      {/* Status Counters */}
      <Text style={styles.sectionTitle}>Current Status</Text>
      <View style={styles.statusRow}>
        <View style={styles.counterBox}>
          <Icon name="account-group-outline" size={24} color="#333" />
          <Text style={styles.counterLabel}>Workers</Text>
          <Text style={styles.counterNum}>{hiredCount}</Text>
        </View>
        <View style={styles.counterBox}>
          <Icon name="account-clock-outline" size={24} color="#333" />
          <Text style={styles.counterLabel}>interview pending</Text>
          <Text style={styles.counterNum}>{pendingInterviewsCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Current Worker</Text>
    </View>
  );

  const renderTerminatedFooter = () => {
    const terminatedWorkers = workers.filter(isTerminatedWorker);

    if (terminatedWorkers.length === 0) return null;

    return (
      <View style={styles.footerSection}>
        <Text style={styles.sectionTitle}>Terminated Workers</Text>
        {terminatedWorkers.map(item => {
          const s = (item.status || '').toString().trim().toLowerCase();
          const normalizedKey = s.includes('resign') ? 'resigned' : 'terminated';

          return (
            <View
              key={item.interviewId || item.id}
              style={[styles.workerCard, styles.alertBorder]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.picture && item.picture.startsWith('/') ? `${SERVER_BASE}${item.picture}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                    style={styles.workerImage}
                  />
                </View>

                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{item.name}</Text>
                  <View style={styles.locationRow}>
                    <Icon name="map-marker" size={16} color="#E91E63" />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <View style={[styles.statusBadge, styles[`status_${normalizedKey}`] || styles.status_terminated]}>
                  <Text style={[styles.statusText, styles[`text_${normalizedKey}`] || styles.text_terminated]}>
                    {normalizedKey === 'resigned' ? 'Resigned' : 'Terminated'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Filter out any terminated or resigned items from the main content collection
  const activeWorkersList = workers.filter(w => !isTerminatedWorker(w));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E64D3" />
        </View>
      ) : (
        <FlatList
          data={activeWorkersList}
          renderItem={renderWorkerCard}
          keyExtractor={item => (item.interviewId || item.id || '').toString()}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderTerminatedFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>You haven't hired any active workers yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  listContent: { padding: 20 },
  profileSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  greetingText: { fontSize: 13, color: '#666', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#000', marginTop: 2 },
  backBtn: { padding: 10, alignSelf: 'flex-start', marginBottom: 5 },
  headerButtons: { flexDirection: 'row', marginTop: 15 },
  smallBlueBtn: {
    backgroundColor: '#1E64D3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#1E64D3',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  smallBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  profilePic: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#FFF', elevation: 5 },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 18,
    elevation: 4,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { marginLeft: 15, color: '#333', fontSize: 14, fontWeight: '500' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  menuBtn: {
    backgroundColor: '#1E64D3',
    width: '48%',
    height: 48,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#1E64D3',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  menuBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 18, color: '#000' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  counterBox: {
    backgroundColor: '#FFF',
    width: '48%',
    padding: 18,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  counterLabel: { flex: 1, marginLeft: 12, fontSize: 13, color: '#444', fontWeight: 'bold' },
  counterNum: { fontWeight: 'bold', fontSize: 18, color: '#000' },
  workerCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 18,
    marginBottom: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  alertBorder: { borderColor: '#FFD600', borderWidth: 2.5 },
  alertBadge: {
    position: 'absolute',
    top: -1,
    right: 30,
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderWidth: 1,
    borderColor: '#FBC02D',
    borderTopWidth: 0,
    zIndex: 10
  },
  alertText: { fontSize: 11, fontWeight: 'bold', color: '#F57F17', letterSpacing: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { position: 'relative' },
  workerImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#EEE' },
  workerBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  workerInfo: { marginLeft: 18, flex: 1 },
  nameRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  roleBadge: {
    borderWidth: 1,
    borderColor: '#1E64D3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#F0F7FF'
  },
  roleText: { fontSize: 10, color: '#1E64D3', fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  locationText: { fontSize: 13, color: '#777', marginLeft: 6, fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 12, color: '#888', marginLeft: 6 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  statusBadge: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 90,
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  status_active: { borderColor: '#1E64D3', backgroundColor: '#E8F0FE' },
  status_resigned: { borderColor: '#FFB300', backgroundColor: '#FFF9C4' },
  status_terminated: { borderColor: '#E53935', backgroundColor: '#FFEBEE' },
  status_alert: { borderColor: '#1E64D3', backgroundColor: '#E8F0FE' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  text_active: { color: '#0056B3' },
  text_resigned: { color: '#F57F17' },
  text_terminated: { color: '#D32F2F' },
  text_alert: { color: '#0056B3' },
  mainBtn: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  blueBtn: { backgroundColor: '#1E64D3' },
  redBtn: { backgroundColor: '#FF1744' },
  mainBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  footerSection: { paddingTop: 10 }
});

export default UserDashboard;