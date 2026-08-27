import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DIRECTORY } from '../../config';

const WorkerDirectoryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState(['All Workers', 'Cleaning', 'Driver', 'Cooking', 'Security']);
  const [selectedCategory, setSelectedCategory] = useState('All Workers');
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Company');
  const [companyPicture, setCompanyPicture] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchWorkers();
  }, []);

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      let companyId = await AsyncStorage.getItem('companyId') || await AsyncStorage.getItem('userId');

      if (!companyId) {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          companyId = userObj?.companyID || userObj?.companyId || userObj?.userId || userObj?.id;
        }
      }

      if (savedName) setCompanyName(savedName);

      if (companyId) {
        const response = await fetch(`${API_DIRECTORY}/GetCompanyProfile?companyId=${companyId}`);
        const data = await response.json();
        if (response.ok && data.companyPicture) {
          setCompanyPicture(data.companyPicture);
          await AsyncStorage.setItem('userPicture', data.companyPicture);
        }
      } else {
        const savedPic = await AsyncStorage.getItem('userPicture');
        if (savedPic) setCompanyPicture(savedPic);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_DIRECTORY}/GetAllWorkers`);
      const data = await response.json();

      if (response.ok) {
        setWorkers(data);
        setFilteredWorkers(data);
      } else {
        NotificationHelper.showError("Failed to fetch directory.");
      }
    } catch (error) {
      console.error(error);
      NotificationHelper.showError("Cannot reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAndFilter = (text, category) => {
    let result = workers;

    if (category && category !== 'All Workers') {
      result = result.filter(w =>
        (w.categories && w.categories.some(c => c.toLowerCase().includes(category.toLowerCase()))) ||
        (w.roleTitle && w.roleTitle.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (text && text.trim()) {
      result = result.filter(w =>
        w.name.toLowerCase().includes(text.toLowerCase()) ||
        w.roleTitle.toLowerCase().includes(text.toLowerCase())
      );
    }

    setFilteredWorkers(result);
  };

  const extractCity = (address) => {
    if (!address || address === 'N/A') return 'Rawalpindi';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/company_default.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  const renderWorkerCard = ({ item }) => {
    const city = extractCity(item.location);
    const avatarUri = getImageUri(item.picture);

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.workerImage}
              defaultSource={require('../../images/logo.png')}
            />
            <View style={styles.ratingBadge}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating || "4.0"}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.mainInfo}>
            <View style={styles.headerRow}>
              <Text style={styles.workerName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.salaryText}>{item.salary}</Text>
            </View>

            <Text style={styles.roleLabel} numberOfLines={1}>{item.roleTitle}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              {item.categories && item.categories.length > 0 ? (
                item.categories.slice(0, 2).map((cat, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillBadgeText}>{cat}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>General</Text>
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>City</Text>
              <Text style={styles.locationText}>{city}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('WorkerDetailsVerificationScreen', { workerId: item.workerId })}
        >
          <Text style={styles.actionButtonText}>Verify Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const companyPicUri = getImageUri(companyPicture);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome, {companyName}</Text>
            <Text style={styles.subHeading}>WORKFORCE DIRECTORY</Text>
            <Text style={styles.questionText}>Manage and verify your workforce directory.</Text>
          </View>

          {/* Profile Picture (Top Right) */}
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => navigation.navigate('UserDashboardScreen')}
          >
            {companyPicture && !imageError ? (
              <Image
                source={{ uri: companyPicUri }}
                style={styles.profilePic}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.profilePic, styles.profilePlaceholder]}>
                <Icon name="domain" size={28} color="#1E64D3" />
              </View>
            )}
            <View style={styles.profileBadge}>
              <Icon name="account" size={12} color="#000" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name or Role"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearchAndFilter(text, selectedCategory);
          }}
        />
        <Icon name="magnify" size={22} color="#333" style={styles.searchIcon} />
      </View>

      {/* Single-Line Scrollable Category Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {categoriesList.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, selectedCategory === cat && styles.activeTab]}
              onPress={() => {
                setSelectedCategory(cat);
                handleSearchAndFilter(searchQuery, cat);
              }}
            >
              <Text style={[styles.tabText, selectedCategory === cat && styles.activeTabText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Total Counter */}
      <Text style={styles.resultsCount}>{filteredWorkers.length} Total Professionals</Text>

      {/* Main List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item, index) => (item.workerId ? item.workerId.toString() : index.toString())}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="account-search-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No professionals found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, marginTop: 15 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#001F3F' },
  subHeading: { fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 2 },
  questionText: { fontSize: 13, color: '#666' },
  profileContainer: { position: 'relative', marginLeft: 10 },
  profilePic: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#EEE' },
  profilePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F0FE' },
  profileBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEE', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#FFF', elevation: 2 },

  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 12, borderRadius: 15, paddingHorizontal: 15, alignItems: 'center', borderWidth: 1, borderColor: '#DDD', elevation: 2 },
  searchInput: { flex: 1, height: 45, color: '#333' },
  searchIcon: { marginLeft: 10 },

  filterWrapper: { height: 40, marginBottom: 10 },
  filterScrollContent: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD' },
  activeTab: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
  tabText: { fontWeight: 'bold', color: '#333', fontSize: 13 },
  activeTabText: { color: '#FFF' },

  resultsCount: { alignSelf: 'flex-start', marginLeft: 20, fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 18, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  cardContent: { flexDirection: 'row' },
  imageWrapper: { position: 'relative' },
  workerImage: { width: 85, height: 85, borderRadius: 20, backgroundColor: '#F8F9FA' },
  ratingBadge: { position: 'absolute', bottom: -5, right: -5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, elevation: 3 },
  ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2, color: '#333' },

  mainInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workerName: { fontSize: 17, fontWeight: 'bold', color: '#1A1C1E', flex: 1, marginRight: 8 },
  salaryText: { fontSize: 14, fontWeight: '700', color: '#00B14F' },
  roleLabel: { color: '#1E64D3', fontSize: 13, fontWeight: '600', marginBottom: 6 },

  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  skillBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: '#EAEAEA' },
  skillBadgeText: { fontSize: 11, fontWeight: '600', color: '#444' },

  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationLabel: { fontSize: 11, color: '#888', marginRight: 4 },
  locationText: { fontSize: 12, color: '#333', fontWeight: 'bold' },

  actionButton: { backgroundColor: '#1E64D3', borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, elevation: 2 },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
});

export default WorkerDirectoryScreen;