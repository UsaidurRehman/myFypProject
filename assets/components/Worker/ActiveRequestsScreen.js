import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import ResidenceBadge from '../helpers/ResidenceBadge';

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
                        const ratingValue = Number(item.clientRating) || 0;
                        const hasRating = ratingValue > 0;
                        const avatarUri = item.clientPicture
                            ? (item.clientPicture.startsWith('http') ? item.clientPicture : `${SERVER_BASE}${item.clientPicture}`)
                            : null;
                        return (
                            <View key={uniqueKey} style={styles.requestCard}>

                                {/* Row 1: what the request is + when it came in */}
                                <View style={styles.cardTopRow}>
                                    <View style={styles.serviceTag}>
                                        <Text style={styles.serviceText}>{item.service || 'General Service'}</Text>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <View style={styles.activeDot} />
                                        <Text style={styles.timeText}>{item.time || 'Just now'}</Text>
                                    </View>
                                </View>

                                {/* Row 2: who is asking + their rating */}
                                <View style={styles.clientRow}>
                                    <View style={styles.avatarWrap}>
                                        {avatarUri ? (
                                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                        ) : (
                                            <Icon name="account" size={26} color="#94A3B8" />
                                        )}
                                    </View>

                                    <View style={styles.clientInfo}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.clientId) {
                                                    navigation.navigate('ClientProfileScreen', {
                                                        clientId: item.clientId,
                                                        id: item.clientId
                                                    });
                                                }
                                            }}
                                            disabled={!item.clientId}
                                        >
                                            <Text style={styles.clientName} numberOfLines={1}>
                                                {item.client || 'Customer'}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.clientCaption} numberOfLines={1}>
                                            Wants to interview you
                                        </Text>
                                    </View>

                                    <View style={[styles.ratingBadge, !hasRating && styles.ratingBadgeMuted]}>
                                        <Icon
                                            name={hasRating ? 'star' : 'star-outline'}
                                            size={12}
                                            color={hasRating ? '#F59E0B' : '#94A3B8'}
                                        />
                                        <Text style={[styles.ratingText, !hasRating && styles.ratingTextMuted]}>
                                            {hasRating ? ratingValue.toFixed(1) : 'New'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Row 3: booking chips — wraps, so nothing can overlap */}
                                <View style={styles.chipRow}>
                                    <JobTypeBadge jobType={item.jobType} small />
                                    <ResidenceBadge isResidenceProvided={item.isResidenceProvided} small />
                                    <SlotTimeLabel
                                        startTime={item.slotStartTime}
                                        endTime={item.slotEndTime}
                                        small
                                    />
                                </View>

                                <View style={styles.divider} />

                                {/* Row 4: contact details */}
                                <View style={styles.detailRow}>
                                    <Icon name="map-marker-outline" size={16} color="#E91E63" />
                                    <Text style={styles.detailText} numberOfLines={2}>
                                        {item.location || 'Location not provided'}
                                    </Text>
                                </View>

                                {item.clientPhone ? (
                                    <View style={styles.detailRow}>
                                        <Icon name="phone-outline" size={16} color="#16A34A" />
                                        <Text style={styles.detailText}>{item.clientPhone}</Text>
                                    </View>
                                ) : null}

                                {/* Row 5: actions */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleStatusUpdate(item.id, 'Rejected')}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.rejectText}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => handleStatusUpdate(item.id, 'Accepted')}
                                        activeOpacity={0.85}
                                    >
                                        <Icon name="check" size={16} color="#FFF" />
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

    /* ── Request card ── */
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E8EDF5',
        elevation: 3,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },

    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    serviceTag: {
        backgroundColor: '#EAF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexShrink: 0,
    },
    serviceText: { color: '#1E64D3', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },
    timeRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginLeft: 10 },
    activeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E', marginRight: 6 },
    timeText: { fontSize: 11.5, color: '#6B7280', fontWeight: '600' },

    clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarWrap: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#EAF2FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatar: { width: 46, height: 46, borderRadius: 23 },
    clientInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
    clientName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    clientCaption: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7E6',
        borderWidth: 1,
        borderColor: '#FDE3A7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        flexShrink: 0,
    },
    ratingBadgeMuted: { backgroundColor: '#F4F6FA', borderColor: '#E2E8F0' },
    ratingText: { marginLeft: 3, fontSize: 12, fontWeight: '800', color: '#B45309' },
    ratingTextMuted: { color: '#8494AB' },

    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },

    divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 14, marginBottom: 12 },

    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    detailText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 18, marginLeft: 8 },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
    rejectBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectText: { color: '#64748B', fontWeight: '700', fontSize: 13.5 },
    acceptBtn: {
        flex: 1.45,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#16A34A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
    },
    acceptText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5, marginLeft: 6 }
});

export default ActiveRequestsScreen;