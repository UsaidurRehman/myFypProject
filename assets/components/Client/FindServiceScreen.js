import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    FlatList, Image, SafeAreaView, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';

const API_BASE = API_DASHBOARD;

const FindServiceScreen = ({ navigation, route }) => {
    const [search, setSearch] = useState('');
    const [categoriesList, setCategoriesList] = useState(['All']);
    const [categoryLookup, setCategoryLookup] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [workers, setWorkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clientName, setClientName] = useState('Client');
    const [clientPicture, setClientPicture] = useState('');

    // Unified Advanced Filters
    const [allFilters, setAllFilters] = useState({
        gender: '',
        city: '',
        categories: [],
        subSkills: {} // format: {CategoryName: [SubSkill1, SubSkill2]}
    });

    // Load saved data and dynamic categories
    useEffect(() => {
        AsyncStorage.getItem('userName').then(n => { if (n) setClientName(n); });
        AsyncStorage.getItem('userPicture').then(p => { if (p) setClientPicture(p); });
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetFiltersData`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const names = data.map(c => c.categoryName);
                setCategoriesList(['All', ...names]);
                const lookup = {};
                data.forEach(c => {
                    lookup[c.categoryId?.toString()] = c.categoryName;
                    lookup[c.categoryName] = c.categoryName;
                });
                setCategoryLookup(lookup);
            }
        } catch (error) {
            console.error("Failed to fetch top categories:", error);
        }
    };

    // Listen for filter params coming back from FilterationScreen
    useFocusEffect(
        useCallback(() => {
            if (route.params?.appliedFilters) {
                setAllFilters(route.params.appliedFilters);
                // Clear the params to prevent re-triggering on subsequent focuses
                navigation.setParams({ appliedFilters: undefined });
            }
        }, [route.params?.appliedFilters])
    );

    const getCategoryName = (selection) => {
        if (!selection) return '';
        const key = selection.toString();
        return categoryLookup[key] || key;
    };

    const fetchWorkers = useCallback(async (categoryTab, searchText, currentFilters) => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            // Build query string
            let url = `${API_BASE}/GetWorkersForClient?`;

            // Add search text if available
            if (searchText && searchText.trim()) {
                url += `search=${encodeURIComponent(searchText.trim())}&`;
            }

            // Gather all categories to filter by
            // Combine top tab selection with filters from filteration screen
            const selectedCategoryNames = (currentFilters.categories || [])
                .map(getCategoryName)
                .filter(cat => cat && cat !== 'All');

            const combinedCategories = [...new Set(selectedCategoryNames)];
            if (categoryTab && categoryTab !== 'All' && !combinedCategories.includes(categoryTab)) {
                combinedCategories.push(categoryTab);
            }

            combinedCategories.forEach(cat => {
                url += `categories=${encodeURIComponent(cat)}&`;
            });

            if (currentFilters.gender && currentFilters.gender !== 'Both') {
                url += `gender=${encodeURIComponent(currentFilters.gender)}&`;
            }

            if (currentFilters.city) {
                url += `city=${encodeURIComponent(currentFilters.city)}&`;
            }

            // Sub-skills AND logic
            // Add each selected sub-skill name as a 'subSkills' query parameter
            Object.keys(currentFilters.subSkills).forEach(catName => {
                currentFilters.subSkills[catName].forEach(skill => {
                    url += `subSkills=${encodeURIComponent(skill)}&`;
                });
            });

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWorkers(data);
            } else if (response.status === 401) {
                NotificationHelper.showError("Session Expired. Please login again.");
                navigation.replace('Login');
            } else {
                console.error("Failed to fetch workers:", await response.text());
            }
        } catch (err) {
            console.error("Network error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [navigation]);

    // Consolidated effect for ALL data fetching triggers (Category, Search, and Advanced Filters)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWorkers(selectedCategory, search, allFilters);
        }, 300); // Balanced delay for responsiveness and network efficiency
        return () => clearTimeout(timer);
    }, [selectedCategory, search, allFilters]);

    const extractCity = (address) => {
        if (!address || address === 'N/A') return 'N/A';
        const parts = address.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
    };

    const renderWorkerCard = ({ item }) => {
        const city = extractCity(item.city);

        return (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{
                                uri: item.picture && item.picture.startsWith('/')
                                    ? `${SERVER_BASE}${item.picture}`
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                            }}
                            style={styles.workerImage}
                        />
                        <View style={styles.ratingBadge}>
                            <Icon name="star" size={12} color="#FFD700" />
                            <Text style={styles.ratingText}>{item.rating || "0.0"}</Text>
                        </View>
                    </View>

                    <View style={styles.mainInfo}>
                        <View style={styles.headerRow}>
                            <Text style={styles.workerName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.salaryText}>{item.salary || 'N/A'}</Text>
                        </View>
                        <Text style={styles.genderText}>{item.gender || 'N/A'}</Text>
                        <Text style={styles.roleLabel}>{item.role}</Text>

                        <View style={styles.locationContainer}>
                            <Icon name="map-marker-outline" size={14} color="#666" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {city} • {item.gender}
                            </Text>
                        </View>

                        <View style={styles.badgeRow}>
                            <View style={[styles.skillBadge, { backgroundColor: item.availableStatus ? '#E8F0FE' : '#FFEBEE' }]}>
                                <Text style={[styles.skillBadgeText, { color: item.availableStatus ? '#1E64D3' : '#D32F2F', fontWeight: 'bold' }]}>
                                    {item.availableStatus ? 'Available' : 'Not Available'}
                                </Text>
                            </View>
                            {item.categories && item.categories.slice(0, 1).map((cat, index) => (
                                <View key={index} style={[styles.skillBadge, { backgroundColor: '#F1F3F4' }]}>
                                    <Text style={[styles.skillBadgeText, { color: '#5F6368' }]}>{cat}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('WorkerDetailScreen', { workerId: item.id })}
                >
                    <Text style={styles.actionButtonText}>View Profile & Interview</Text>
                    <Icon name="chevron-right" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={styles.welcomeText}>Welcome, {clientName}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={styles.subHeading}>FIND SERVICE</Text>
                        <Text style={styles.questionText}>What would you like to do?</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileContainer}
                        onPress={() => navigation.navigate('UserDashboardScreen')}
                    >
                        <Image
                            source={{
                                uri: clientPicture && clientPicture.startsWith('/')
                                    ? `${SERVER_BASE}${clientPicture}`
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png'
                            }}
                            style={styles.profilePic}
                            onError={() => console.log('Client image failed:', `${SERVER_BASE}${clientPicture}`)}
                        />
                        <View style={styles.profileBadge}>
                            <Icon name="account" size={14} color="#000" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Name"
                    value={search}
                    onChangeText={setSearch}
                />
                <Icon name="magnify" size={24} color="#333" style={styles.searchIcon} />
            </View>

            {/* Category Tabs */}
            <View style={styles.tabRow}>
                {categoriesList.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.tab, selectedCategory === cat && styles.activeTab]}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={[styles.tabText, selectedCategory === cat && styles.activeTabText]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Filter & Sort Row */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => navigation.navigate('FilterationScreen', { initialFilters: allFilters })}
                >
                    <Text style={styles.filterBtnText}>Filter</Text>
                    <Icon name="format-list-bulleted" size={18} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterBtn}>
                    <Text style={styles.filterBtnText}>Sort</Text>
                    <Icon name="arrow-up" size={18} color="#666" />
                </TouchableOpacity>
            </View>

            <Text style={styles.resultsCount}>{workers.length} Total Results</Text>

            {/* Workers List */}
            {isLoading ? (
                <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={workers}
                    keyExtractor={item => item.id}
                    renderItem={renderWorkerCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Icon name="account-search-outline" size={60} color="#CCC" />
                            <Text style={styles.emptyText}>No workers found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, marginTop: 30, zIndex: 10 },
    backCircle: { padding: 5, backgroundColor: '#F0F0F0', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 5 },
    welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#001F3F' },
    subHeading: { fontSize: 13, fontWeight: 'bold', color: '#333', marginTop: 2 },
    questionText: { fontSize: 13, color: '#666' },
    profileContainer: { position: 'relative' },
    profilePic: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#EEE' },
    profileBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEE', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#FFF', elevation: 2 },

    searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 15, borderRadius: 15, paddingHorizontal: 15, alignItems: 'center', borderWidth: 1, borderColor: '#DDD', elevation: 2 },
    searchInput: { flex: 1, height: 45 },
    searchIcon: { marginLeft: 10 },

    tabRow: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15, flexWrap: 'wrap' },
    tab: { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 20, marginRight: 8, marginBottom: 5, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD' },
    activeTab: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    tabText: { fontWeight: 'bold', color: '#333', fontSize: 13 },
    activeTabText: { color: '#FFF' },

    filterRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 5 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 30, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DDD' },
    filterBtnText: { marginRight: 8, color: '#333', fontWeight: '500' },
    resultsCount: { alignSelf: 'flex-end', marginRight: 20, fontSize: 12, color: '#999', marginVertical: 8 },

    listContent: { paddingHorizontal: 20, paddingBottom: 30 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#F0F0F0' },
    cardContent: { flexDirection: 'row' },
    imageWrapper: { position: 'relative' },
    workerImage: { width: 85, height: 85, borderRadius: 20, backgroundColor: '#F8F9FA' },
    ratingBadge: { position: 'absolute', bottom: 19, right: -5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2, color: '#333' },

    mainInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    workerName: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', flex: 1, marginRight: 8 },
    salaryText: { fontSize: 15, fontWeight: '700', color: '#00B14F' },
    genderText: { fontSize: 15, fontWeight: '700', color: 'grey' },
    roleLabel: { color: '#666', fontSize: 13, marginBottom: 4 },

    locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    locationText: { fontSize: 12, color: '#5F6368', marginLeft: 4 },

    badgeRow: { flexDirection: 'row', gap: 6 },
    skillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    skillBadgeText: { fontSize: 11, fontWeight: '600' },

    actionButton: { backgroundColor: '#1E64D3', borderRadius: 16, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, elevation: 2 },
    actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginRight: 4 },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
});

export default FindServiceScreen;