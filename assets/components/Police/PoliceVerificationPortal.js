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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_POLICE, SERVER_BASE } from '../../config';

const PoliceVerificationPortal = ({ navigation }) => {
  const [searchCnic, setSearchCnic] = useState('');
  const [workers, setWorkers] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkers = async (cnicQuery = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_POLICE}/GetWorkersForVerification?searchCnic=${cnicQuery}`);
      const data = await response.json();
      if (response.ok) {
        setWorkers(data.workers || []);
        setTotalResults(data.totalResults || 0);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers('');
  }, []);

  const handleSearch = (text) => {
    setSearchCnic(text);
    fetchWorkers(text);
  };

  const renderWorkerCard = ({ item }) => {
    const imageUri = item.picture
      ? (item.picture.startsWith('http') ? item.picture : `${SERVER_BASE}${item.picture}`)
      : 'https://via.placeholder.com/150';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: imageUri }} style={styles.avatar} />
          <View style={styles.infoContainer}>
            <Text style={styles.workerName}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.categoryText}>{item.category || item.profession}</Text>
              <Text style={styles.cnicText}>CNIC: {item.cnic}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('FileCriminalRecordScreen', { workerId: item.id })}
        >
          <Text style={styles.reviewButtonText}>REVIEW & FLAG WORKER</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Police Verification Portal</Text>
          <Text style={styles.headerSubtitle}>CRIMINAL RECORD DATABASE</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Icon name="magnify" size={22} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search worker by CNIC..."
          placeholderTextColor="#94A3B8"
          value={searchCnic}
          onChangeText={handleSearch}
          keyboardType="numeric"
        />
      </View>

      {/* Subheader */}
      <View style={styles.subHeader}>
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>All Workers List</Text>
        </View>
        <Text style={styles.totalResultsText}>{totalResults} Total Results</Text>
      </View>

      {/* Workers List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#111E2E" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },

  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 25,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },

  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#111E2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  totalResultsText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },

  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  workerName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  metaRow: { marginTop: 4 },
  categoryText: { fontSize: 13, color: '#0284C7', fontWeight: '600' },
  cnicText: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },

  reviewButton: {
    backgroundColor: '#111E2E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default PoliceVerificationPortal;