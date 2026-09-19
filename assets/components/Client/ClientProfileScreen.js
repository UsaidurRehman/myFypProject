import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';



const ClientProfileScreen = ({ route, navigation }) => {
  const { clientId, id } = route.params || {};
  const targetClientId = clientId || id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (targetClientId) {
      fetchClientProfile();
    } else {
      setLoading(false);
    }
  }, [targetClientId]);

const fetchClientProfile = async () => {
  if (!targetClientId) {
    setLoading(false);
    return;
  }

  try {
    // Retrieve token from storage
    const token = await AsyncStorage.getItem('userToken'); // Replace 'userToken' with your exact storage key name

    const res = await fetch(`${API_DASHBOARD}/GetClientDetail/${targetClientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to fetch client profile:", res.status, errorData.message);
      Toast.show({
        type: 'error',
        text1: `Failed to fetch client profile: ${res.status} ${res.statusText}`
      });
      setProfile(null);
    }
  } catch (err) {
    console.error("Error fetching client profile:", err);
    setProfile(null);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E64D3" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Client profile unavailable.</Text>
      </View>
    );
  }

  const displayedReviews = showAllReviews ? (profile.reviews || []) : (profile.reviews?.slice(0, 2) || []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Read-Only Profile Card */}
        <View style={styles.profileHeader}>
          <Image
            source={{ 
              uri: profile.picture?.startsWith('/') 
                ? `${SERVER_BASE}${profile.picture}` 
                : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' 
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.location}>
            <Icon name="map-marker" size={14} color="#666" /> {profile.address || 'Location Not Specified'}
          </Text>

          {/* Average Rating Banner */}
          <View style={styles.ratingBadge}>
            <Icon name="star" size={18} color="#FFD700" />
            <Text style={styles.ratingText}>
              {profile.rating > 0 ? profile.rating.toFixed(1) : 'New'} 
              <Text style={styles.reviewCountText}> ({profile.reviewCount || 0} reviews)</Text>
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Worker Reviews Section */}
        <Text style={styles.sectionTitle}>Reviews from Workers</Text>

        {displayedReviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews have been left for this client yet.</Text>
        ) : (
          displayedReviews.map((item) => (
            <View key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ 
                      uri: item.reviewerImage?.startsWith('/') 
                        ? `${SERVER_BASE}${item.reviewerImage}` 
                        : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' 
                    }}
                    style={styles.reviewerAvatar}
                  />
                  <Text style={styles.reviewerName}>{item.reviewerName}</Text>
                </View>
                <View style={styles.starRow}>
                  <Icon name="star" size={14} color="#FFD700" />
                  <Text style={styles.singleRatingText}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.comment}>{item.comment}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          ))
        )}

        {profile.reviews && profile.reviews.length > 2 && !showAllReviews && (
          <TouchableOpacity 
            style={styles.viewAllBtn} 
            onPress={() => setShowAllReviews(true)}
          >
            <Text style={styles.viewAllText}>View All ({profile.reviews.length}) Reviews</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE'
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  backBtn: { padding: 4 },
  profileHeader: { alignItems: 'center', marginVertical: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF9E6', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginTop: 10 
  },
  ratingText: { marginLeft: 6, fontSize: 15, fontWeight: '700', color: '#111' },
  reviewCountText: { fontSize: 13, fontWeight: '400', color: '#666' },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  reviewCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#EEEEEE' 
  },
  reviewerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  reviewerName: { fontWeight: '600', fontSize: 14, color: '#222' },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  singleRatingText: { fontSize: 13, fontWeight: '700', marginLeft: 3, color: '#333' },
  comment: { color: '#444', marginVertical: 6, fontSize: 13, lineHeight: 18 },
  date: { color: '#999', fontSize: 11 },
  emptyText: { fontStyle: 'italic', color: '#888', textAlign: 'center', marginVertical: 10 },
  viewAllBtn: { marginTop: 8, padding: 12, alignItems: 'center', backgroundColor: '#E8F0FE', borderRadius: 8 },
  viewAllText: { color: '#1E64D3', fontWeight: '600' }
});

export default ClientProfileScreen;