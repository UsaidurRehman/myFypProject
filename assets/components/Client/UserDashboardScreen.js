import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, Image, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DASHBOARD } from '../../config';

const UserDashboard = ({ navigation }) => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States to hold user info loaded from AsyncStorage
  const [userName, setUserName] = useState("Client User");
  const [userPicture, setUserPicture] = useState("");
  const [userAddress, setUserAddress] = useState("Your Address");
  const [userPhone, setUserPhone] = useState("03XXXXXXX");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [hiredCount, setHiredCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);

  useEffect(() => {
    loadUserInfo();
    fetchWorkers();
  }, []);

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
      // Fetch hired workers and stats for this client
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetClientDashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkers(data.hiredWorkers || []);
        setHiredCount(data.hiredCount || 0);
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

  const renderWorkerCard = ({ item }) => (
    <View style={[styles.workerCard, item.type === 'alert' && styles.alertBorder]}>
      {item.type === 'alert' && (
        <View style={styles.alertBadge}>
          <Text style={styles.alertText}>Resignation Alert</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} // Placeholder for Worker Pic
          style={styles.workerImage}
        />
        <View style={styles.workerInfo}>
          <View style={styles.nameRoleRow}>
            <Text style={styles.workerName}>{item.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={16} color="#E91E63" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={[styles.statusBadge, styles[`status_${item.type}`]]}>
          <Text style={[styles.statusText, styles[`text_${item.type}`]]}>{item.status}</Text>
        </View>
        <TouchableOpacity style={[styles.mainBtn, item.type === 'active' || item.type === 'alert' ? styles.blueBtn : styles.redBtn]}>
          <Text style={styles.mainBtnText}>
            {item.type === 'active' || item.type === 'alert' ? 'Terminate' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
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
          <Text style={styles.menuBtnText}>Find Services</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ActiveRequestScreen')} style={styles.menuBtn}><Text style={styles.menuBtnText}>Interview Requests</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('WorkerDecisionScreen')} style={styles.menuBtn}><Text style={styles.menuBtnText}>Job Requests</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}><Text style={styles.menuBtnText}>Resignations</Text></TouchableOpacity>
      </View>

      {/* Status Counters */}
      <Text style={styles.sectionTitle}>Current Status</Text>
      <View style={styles.statusRow}>
        <View style={styles.counterBox}>
          <Icon name="account-group-outline" size={24} color="#333" />
          <Text style={styles.counterLabel}>Hired Workers</Text>
          <Text style={styles.counterNum}>{hiredCount}</Text>
        </View>
        <View style={styles.counterBox}>
          <Icon name="account-clock-outline" size={24} color="#333" />
          <Text style={styles.counterLabel}>Interview Pending</Text>
          <Text style={styles.counterNum}>{pendingInterviewsCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Hired Workforce</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E64D3" />
        </View>
      ) : (
        <FlatList
          data={workers}
          renderItem={renderWorkerCard}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>You haven't hired any workers yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  listContent: { padding: 20 },

  // Header Styles
  profileSection: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  greetingText: { fontSize: 14, color: '#666' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  headerButtons: { flexDirection: 'row', marginTop: 10 },
  smallBlueBtn: { backgroundColor: '#1E64D3', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginRight: 10 },
  smallBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  profilePic: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#EEE' },

  addressCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, elevation: 4, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 10, color: '#333', fontSize: 14 },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuBtn: { backgroundColor: '#1E64D3', width: '48%', height: 45, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  counterBox: { backgroundColor: '#FFF', width: '48%', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: '#EEE' },
  counterLabel: { flex: 1, marginLeft: 10, fontSize: 12, color: '#333' },
  counterNum: { fontWeight: 'bold', fontSize: 16 },

  // Worker Card Styles
  workerCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 15, marginBottom: 15, elevation: 4, borderWidth: 1, borderColor: '#EEE', position: 'relative' },
  alertBorder: { borderColor: '#FFEB3B', borderWidth: 2 },
  alertBadge: { position: 'absolute', top: 0, right: 20, backgroundColor: '#FFEB3B', paddingHorizontal: 10, paddingVertical: 2, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  alertText: { fontSize: 10, fontWeight: 'bold', color: '#FF0000' },
  cardHeader: { flexDirection: 'row' },
  workerImage: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F0F0' },
  workerInfo: { marginLeft: 15, flex: 1 },
  nameRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workerName: { fontSize: 16, fontWeight: 'bold' },
  roleBadge: { borderWidth: 1, borderColor: '#1E64D3', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  roleText: { fontSize: 10, color: '#1E64D3' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  locationText: { fontSize: 12, color: '#666', marginLeft: 5 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  statusBadge: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 15, borderWidth: 1 },
  status_active: { borderColor: '#1E64D3', backgroundColor: '#FFF' },
  status_resigned: { borderColor: '#CCC', backgroundColor: '#F9F9F9' },
  status_terminated: { borderColor: '#FFEB3B', backgroundColor: '#FFF' },
  status_alert: { borderColor: '#1E64D3', backgroundColor: '#FFF' },

  statusText: { fontSize: 12, fontWeight: 'bold' },
  text_active: { color: '#1E64D3' },
  text_resigned: { color: '#666' },
  text_terminated: { color: '#999' },
  text_alert: { color: '#1E64D3' },

  mainBtn: { paddingHorizontal: 25, paddingVertical: 8, borderRadius: 12 },
  blueBtn: { backgroundColor: '#1E64D3' },
  redBtn: { backgroundColor: '#FF0000' },
  mainBtnText: { color: '#FFF', fontWeight: 'bold' },
});

export default UserDashboard;