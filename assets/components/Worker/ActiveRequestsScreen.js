import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, ScrollView,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD } from '../../config';

const ActiveRequestsScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE = API_DASHBOARD;

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetWorkerRequests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                NotificationHelper.showError("Failed to load requests.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id, decision) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ workerDecision: decision })
            });

            if (response.ok) {
                NotificationHelper.showSuccess(`Request ${decision}!`);
                // Remove from the local list since it's no longer 'Pending'
                setRequests(prev => prev.filter(r => r.id !== id));
            } else {
                NotificationHelper.showError("Failed to update status.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Icon name="arrow-left" size={20} color="#666" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Active Requests</Text>
                    <View style={styles.headerSubRow}>
                        <Text style={styles.headerSubtitle}>Request pending</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AcceptedRequestScreen')}>
                            <Text style={styles.gotoLink}>Goto Accepted</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionHeading}>New Booking Requests ({requests.length})</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#1E64D3" />
                ) : requests.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>No pending requests.</Text>
                ) : (
                    requests.map((item) => (
                        <View key={item.id} style={styles.requestCard}>
                            {/* Top Row: Service Tag and Time */}
                            <View style={styles.cardHeader}>
                                <View style={styles.serviceTag}>
                                    <Text style={styles.serviceText}>{item.service}</Text>
                                </View>
                                <View style={styles.timeRow}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.timeText}>{item.time}</Text>
                                </View>
                            </View>

                            {/* Client Info */}
                            <View style={styles.clientSection}>
                                <Text style={styles.clientName}>Client: {item.client}</Text>
                                <View style={styles.locationRow}>
                                    <Icon name="map-marker" size={18} color="#E91E63" />
                                    <Text style={styles.locationText}>{item.location}</Text>
                                </View>
                                <View style={[styles.locationRow, { marginTop: 5 }]}>
                                    <Icon name="phone" size={18} color="#4CAF50" />
                                    <Text style={styles.locationText}>{item.clientPhone}</Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.rejectBtn}
                                    onPress={() => handleStatusUpdate(item.id, 'Rejected')}
                                >
                                    <Text style={styles.rejectText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.acceptBtn}
                                    onPress={() => handleStatusUpdate(item.id, 'Accepted')}
                                >
                                    <Text style={styles.acceptText}>Accept Booking</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { padding: 20, flexDirection: 'row', alignItems: 'flex-start', zIndex: 10 },
    backCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginTop: 5, zIndex: 10, elevation: 5 },
    headerTextContainer: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#000' },
    headerSubRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    headerSubtitle: { color: '#888', fontSize: 14 },
    gotoLink: { color: '#1E64D3', fontWeight: 'bold', fontSize: 14 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
    sectionHeading: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 20 },

    requestCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    serviceTag: { borderWeight: 1, borderColor: '#1E64D3', borderWidth: 1, paddingHorizontal: 15, paddingVertical: 4, borderRadius: 10 },
    serviceText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
    timeText: { fontSize: 12, color: '#888' },

    clientSection: { marginBottom: 15 },
    clientName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 5 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 14, color: '#666', marginLeft: 5 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    rejectBtn: { flex: 0.45, height: 45, borderRadius: 22.5, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
    rejectText: { color: '#666', fontWeight: 'bold' },
    acceptBtn: { flex: 0.45, height: 45, borderRadius: 22.5, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
    acceptText: { color: '#FFF', fontWeight: 'bold' }
});

export default ActiveRequestsScreen;