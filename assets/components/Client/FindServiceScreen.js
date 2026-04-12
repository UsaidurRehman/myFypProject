import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    FlatList, Image, SafeAreaView, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';

const API_BASE = API_DASHBOARD;

const FindServiceScreen = ({ navigation, route }) => {
    const [search, setSearch] = useState('');
    const [categoriesList, setCategoriesList] = useState(['All']);
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
            }
        } catch (error) {
            console.error("Failed to fetch top categories:", error);
        }
    };

    // Listen for filter params coming back from FilterationScreen
    useEffect(() => {
        if (route.params?.appliedFilters) {
            setAllFilters(route.params.appliedFilters);
        }
    }, [route.params?.appliedFilters]);

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
            const combinedCategories = [...currentFilters.categories];
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

    // Initial load + whenever filters change
    useEffect(() => {
        fetchWorkers(selectedCategory, search, allFilters);
    }, [selectedCategory, allFilters]);

    // Search on text change with a small delay
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWorkers(selectedCategory, search, allFilters);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const renderWorkerCard = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: item.picture && item.picture.startsWith('/')
                                ? `${SERVER_BASE}${item.picture}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }}
                        style={styles.workerImage}
                        onError={() => console.log('Worker image failed:', `${SERVER_BASE}${item.picture}`)}
                    />
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.workerName}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Icon name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>{item.rating || "0.0"}</Text>
                        </View>
                    </View>

                    <Text style={styles.roleText}>{item.role}</Text>

                    <View style={styles.chipRow}>
                        {item.categories && item.categories.length > 0 ? (
                            item.categories.map((cat, index) => (
                                <View key={index} style={styles.categoryChip}>
                                    <Text style={styles.categoryText}>{cat}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.categoryChip}>
                                <Text style={styles.categoryText}>{item.role}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.locationSalaryRow}>
                        <View>
                            <Text style={styles.label}>City</Text>
                            <Text style={styles.valueText}>{item.city || 'N/A'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.label}>Salary</Text>
                            <Text style={styles.salaryText}>{item.salary || 'N/A'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.callButton}
                onPress={() => navigation.navigate('WorkerDetailScreen', { workerId: item.id })}
            >
                <Text style={styles.callButtonText}>Call For Interview</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                        <Icon name="arrow-left" size={24} color="#555" />
                    </TouchableOpacity>
                    <Text style={[styles.welcomeText, { marginLeft: 10 }]}>Welcome, {clientName}</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
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
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 4, borderWidth: 1, borderColor: '#EEE' },
    cardHeader: { flexDirection: 'row' },
    imageContainer: { marginRight: 15 },
    workerImage: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#F0F0F0' },

    infoContainer: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    workerName: { fontSize: 16, fontWeight: 'bold', color: '#000', flex: 1 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFEE0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700' },
    ratingText: { fontSize: 11, fontWeight: 'bold', marginLeft: 3 },
    roleText: { color: '#1E64D3', fontSize: 13, marginVertical: 3 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    categoryChip: { backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginRight: 5 },
    categoryText: { fontSize: 11, color: '#333' },

    locationSalaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 10, color: '#999' },
    valueText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
    salaryText: { fontSize: 13, fontWeight: 'bold', color: '#00B14F' },

    callButton: { backgroundColor: '#1E64D3', borderRadius: 15, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    callButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
});

export default FindServiceScreen;