import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD } from '../../config';

const ActiveRequestsScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const API_BASE = API_DASHBOARD;

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetWorkerRequests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(Array.isArray(data) ? data : []);
            } else {
                NotificationHelper.showError("Failed to load requests.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchRequests(false);
    }, []);

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
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header bar matching standard app header */}
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Active Requests</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E64D3"]} />
                }
            >
                <View style={styles.sectionHeadingRow}>
                    <Text style={styles.sectionHeading}>New Booking Requests ({requests.length})</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AcceptedRequestScreen')}>
                        <Text style={styles.gotoLink}>Goto Accepted</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
                ) : requests.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#999' }}>No pending requests.</Text>
                ) : (
                    requests.map((item, index) => {
                        const uniqueKey = item.id ? item.id.toString() : index.toString();
                        return (
                            <View key={uniqueKey} style={styles.requestCard}>
                                {/* Top Row: Service Tag and Time */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.serviceTag}>
                                        <Text style={styles.serviceText}>{item.service || "General Service"}</Text>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <View style={styles.activeDot} />
                                        <Text style={styles.timeText}>{item.time || "Just now"}</Text>
                                    </View>
                                </View>

                                {/* Client Info */}
                                <View style={styles.clientSection}>
                                    <View style={styles.clientHeaderRow}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.clientId) {
                                                    navigation.navigate('ClientProfileScreen', {
                                                        clientId: item.clientId,
                                                        id: item.clientId
                                                    });
                                                } else {
                                                    console.warn("Client ID is missing for this review.");
                                                }
                                            }}
                                        >
                                            <Text style={styles.clientName}>Client: {item.client || "Customer"}</Text>
                                        </TouchableOpacity>

                                        <View style={styles.ratingBadge}>
                                            <Icon name="star" size={14} color="#FFD700" />
                                            <Text style={styles.ratingText}>{item.clientRating > 0 ? item.clientRating.toFixed(1) : "N/A"}</Text>
                                        </View>
                                    </View>
                                    {item.location && (
                                        <View style={styles.locationRow}>
                                            <Icon name="map-marker" size={18} color="#E91E63" />
                                            <Text style={styles.locationText}>{item.location}</Text>
                                        </View>
                                    )}
                                    {item.clientPhone && (
                                        <View style={[styles.locationRow, { marginTop: 5 }]}>
                                            <Icon name="phone" size={18} color="#4CAF50" />
                                            <Text style={styles.locationText}>{item.clientPhone}</Text>
                                        </View>
                                    )}
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
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },
    /* ── Header ── */
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.3,
    },
    logoBox: {
        width: 110,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: 110,
        height: 90,
        resizeMode: 'contain',
    },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
    sectionHeadingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    sectionHeading: { fontSize: 17, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
    gotoLink: { color: '#1E64D3', fontWeight: 'bold', fontSize: 14 },

    requestCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    serviceTag: { borderColor: '#1E64D3', borderWidth: 1, paddingHorizontal: 15, paddingVertical: 4, borderRadius: 10 },
    serviceText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
    timeText: { fontSize: 12, color: '#888' },

    clientSection: { marginBottom: 15 },
    clientHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE599',
    },
    ratingText: {
        marginLeft: 3,
        fontSize: 13,
        fontWeight: '700',
        color: '#B45309',
    },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 14, color: '#666', marginLeft: 5 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    rejectBtn: { flex: 0.45, height: 45, borderRadius: 22.5, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
    rejectText: { color: '#666', fontWeight: 'bold' },
    acceptBtn: { flex: 0.45, height: 45, borderRadius: 22.5, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
    acceptText: { color: '#FFF', fontWeight: 'bold' }
});

export default ActiveRequestsScreen;