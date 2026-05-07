import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, ScrollView, Image, TextInput,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DASHBOARD } from '../../config';

const API_BASE = API_DASHBOARD;

const ActiveRequestScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Pending', 'Approved'

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const clientId = await AsyncStorage.getItem('clientId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetActiveRequests/${clientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            NotificationHelper.showError("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    const handleHiringDecision = async (interviewId, decision) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateHiringStatus/${interviewId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hiringDecision: decision })
            });

            if (response.ok) {
                NotificationHelper.showSuccess(`Interview ${decision}!`);
                fetchRequests();
            } else {
                NotificationHelper.showError("Update failed.");
            }
        } catch (error) {
            NotificationHelper.showError("Network error.");
        }
    };

    const handleDelete = async (interviewId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/DeleteInterviewRequest/${interviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Request deleted.");
                setRequests(prev => prev.filter(r => r.interviewId !== interviewId));
            } else {
                NotificationHelper.showError("Failed to delete.");
            }
        } catch (error) {
            NotificationHelper.showError("Network error.");
        }
    };

    const renderRequestItem = (item) => {
        const { workerDecision, hiringDecision, workerImage, workerName, workerSkill } = item;

        const imageUrl = workerImage && workerImage.startsWith('/')
            ? { uri: `${SERVER_BASE}${workerImage}` }
            : (workerImage ? { uri: `${SERVER_BASE}/Images/${workerImage}` } : require('../../images/default-user.png'));

        // Rule 2 / Block 1: Worker rejected the interview
        if (workerDecision === 'Rejected') {
            return (
                <View key={item.interviewId} style={styles.card}>
                    <View style={styles.cardTopRow}>
                        <View style={styles.statusRow}>
                            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                            <Text style={styles.statusLabelBold}>Interview Rejected</Text>
                        </View>
                    </View>

                    <View style={styles.cardContent}>
                        <Image source={imageUrl} style={styles.workerImage} />
                        <View style={styles.middleCol}>
                            <Text style={styles.workerName}>{workerName}</Text>
                            <View style={styles.cancelBadge}>
                                <Text style={styles.cancelBadgeText}>Cancel</Text>
                            </View>
                            <Text style={styles.roleText}>{workerSkill}</Text>
                            <Text style={styles.notAvailableText}>Not Available right now</Text>
                        </View>
                        <View style={styles.rightCol}>
                            <TouchableOpacity style={styles.disabledBtn} disabled={true}>
                                <Text style={styles.disabledBtnText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.interviewId)} style={styles.deleteBtn}>
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        // Rule 5 / Block 4: Worker Accepted AND Client Approved
        if (workerDecision === 'Accepted' && hiringDecision === 'Accepted') {
            return (
                <View key={item.interviewId} style={styles.card}>
                    <View style={styles.cardTopRow}>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabelBold}>Interview Accepted</Text>
                        </View>
                    </View>

                    <View style={styles.cardContent}>
                        <Image source={imageUrl} style={styles.workerImage} />
                        <View style={styles.middleCol}>
                            <Text style={styles.workerName}>{workerName}</Text>
                            <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                                <Text style={styles.badgeTextWhite}>Accepted</Text>
                            </View>
                            <Text style={styles.roleText}>{workerSkill}</Text>
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                        <View style={styles.rightCol}>
                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleHiringDecision(item.interviewId, 'Rejected')}>
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.interviewId)} style={styles.deleteBtn}>
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        // Rule 4 / Block 3: Worker Decision is Accepted (Awaiting Client Approval)
        if (workerDecision === 'Accepted' && hiringDecision !== 'Accepted') {
            return (
                <View key={item.interviewId} style={styles.card}>
                    <View style={styles.cardContent}>
                        <Image source={imageUrl} style={styles.workerImage} />
                        <View style={styles.middleCol}>
                            <Text style={styles.workerName}>{workerName}</Text>
                            <View style={[styles.badge, { backgroundColor: '#D4E157' }]}>
                                <Text style={styles.badgeTextDark}>Pending</Text>
                            </View>
                            <Text style={styles.roleText}>{workerSkill}</Text>
                            <Text style={styles.awaitingText}>Awaiting Approbation</Text>
                        </View>
                        <View style={styles.rightColCentered}>
                            <TouchableOpacity style={styles.approveBtnGreen} onPress={() => handleHiringDecision(item.interviewId, 'Accepted')}>
                                <Text style={styles.approveBtnTextWhite}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.interviewId)} style={styles.deleteBtn}>
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        // Rule 3 / Block 2: Neither Rejected nor Accepted (In Process)
        return (
            <View key={item.interviewId} style={styles.card}>
                <View style={styles.cardTopRow}>
                    <View style={styles.statusRow}>
                        <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.statusLabelBold}>Inprocess</Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <Image source={imageUrl} style={styles.workerImage} />
                    <View style={styles.middleCol}>
                        <Text style={styles.workerName}>{workerName}</Text>
                        <View style={[styles.badge, { backgroundColor: '#D4E157' }]}>
                            <Text style={styles.badgeTextDark}>Pending</Text>
                        </View>
                        <Text style={styles.roleText}>{workerSkill}</Text>
                        <Text style={styles.pendingText}>Worker response pending</Text>
                    </View>
                    <View style={styles.rightCol}>
                        <TouchableOpacity style={styles.disabledBtn} disabled={true}>
                            <Text style={styles.disabledBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.interviewId)} style={styles.deleteBtn}>
                            <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // Filters before rendering
    const filteredRequests = requests.filter(item => {
        // Search Filter
        if (searchQuery && !item.workerName.toLowerCase().includes(searchQuery.toLowerCase()) && !item.workerSkill.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        // Tab Filter
        if (activeTab === 'Pending' && (item.workerDecision !== 'Pending' && item.hiringDecision !== 'Pending')) return false;
        if (activeTab === 'Approved' && item.hiringDecision !== 'Accepted') return false;

        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Icon name="arrow-left" size={24} color="#555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Interview List</Text>
                {/* Logo Image */}
                <Image source={require('../../images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={24} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or skills"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
                {['All', 'Pending', 'Approved'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#1E64D3" />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map(item => renderRequestItem(item))
                    ) : (
                        <Text style={styles.emptyText}>No requests match your criteria.</Text>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { padding: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    backCircle: { padding: 5, backgroundColor: '#E3EAF5', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 5 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 15, color: '#000' },
    headerLogo: { width: 50, height: 50, marginLeft: 'auto' },
    searchContainer: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
        marginHorizontal: 20, borderRadius: 25, paddingHorizontal: 15, elevation: 2, 
        borderWidth: 1, borderColor: '#DDD', height: 50 
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16 },
    tabsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 15 },
    tabButton: { 
        paddingVertical: 8, paddingHorizontal: 25, borderRadius: 20, 
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', marginHorizontal: 5
    },
    tabButtonActive: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    tabText: { color: '#555', fontWeight: 'bold' },
    tabTextActive: { color: '#FFF' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
    
    card: { 
        backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, 
        borderWidth: 1, borderColor: '#666', elevation: 1 
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -5 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
    statusLabelBold: { fontSize: 11, fontWeight: 'bold', color: '#000' },
    
    cardContent: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    workerImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EEE', marginRight: 15, borderWidth: 1, borderColor: '#CCC' },
    middleCol: { flex: 1, justifyContent: 'center' },
    workerName: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 5 },
    roleText: { fontSize: 13, color: '#999', marginVertical: 4 },
    
    cancelBadge: { backgroundColor: '#E0E0E0', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#CCC' },
    cancelBadgeText: { color: '#333', fontSize: 11 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 3, borderRadius: 10, elevation: 2 },
    badgeTextDark: { color: '#B71C1C', fontSize: 11, fontWeight: 'bold' },
    badgeTextWhite: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    
    notAvailableText: { color: '#E65100', fontSize: 12, marginTop: 5 },
    pendingText: { color: '#E65100', fontSize: 12, marginTop: 5 },
    awaitingText: { color: '#EF6C00', fontSize: 12, marginTop: 5 },
    verifiedText: { color: '#4CAF50', fontSize: 12, marginTop: 5 },
    
    rightCol: { alignItems: 'center', justifyContent: 'space-between', height: 70 },
    rightColCentered: { alignItems: 'center', justifyContent: 'center' },
    
    disabledBtn: { backgroundColor: '#E0E0E0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, width: 80, alignItems: 'center' },
    disabledBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    
    approveBtnGreen: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, width: 80, alignItems: 'center', marginBottom: 15, elevation: 2 },
    approveBtnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    
    rejectBtn: { backgroundColor: '#90CAF9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, width: 80, alignItems: 'center' },
    rejectBtnText: { color: '#B71C1C', fontWeight: 'bold', fontSize: 13 },
    
    deleteBtn: { marginTop: 10 },
    deleteBtnText: { color: '#F44336', fontWeight: 'bold', fontSize: 13 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 }
});

export default ActiveRequestScreen;