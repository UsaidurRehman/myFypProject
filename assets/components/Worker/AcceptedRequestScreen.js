import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';

const API_BASE = API_DASHBOARD;

const AcceptedRequestScreen = ({ navigation }) => {
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAcceptedRequests();
    }, []);

    const fetchAcceptedRequests = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetAcceptedWorkerRequests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAcceptedRequests(data);
            } else {
                NotificationHelper.showError("Failed to load accepted requests.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ decision: 'Rejected' })
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Request Rejected successfully.");
                setAcceptedRequests(prev => prev.filter(r => r.id !== id));
            } else {
                NotificationHelper.showError("Failed to reject request.");
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
                    <Text style={styles.headerTitle}>Accepted Requests</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeading}>
                    New Accepted Requests ({acceptedRequests.length})
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 40 }} />
                ) : acceptedRequests.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#999' }}>No accepted requests found.</Text>
                ) : (
                    acceptedRequests.map((item) => {
                        const ratingValue = Number(item.clientRating) || 0;
                        const hasRating = ratingValue > 0;
                        const avatarUri = item.clientPicture
                            ? (item.clientPicture.startsWith('http') ? item.clientPicture : `${SERVER_BASE}${item.clientPicture}`)
                            : null;
                        return (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardTopRow}>
                                <View style={styles.serviceBadge}>
                                    <Text style={styles.serviceText}>{item.service || 'Interview Request'}</Text>
                                </View>
                                <View style={styles.statusContainer}>
                                    <View style={styles.greenDot} />
                                    <Text style={styles.statusText}>Accepted</Text>
                                </View>
                            </View>

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
                                        {item.time || 'Just now'}
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

                            <View style={styles.chipRow}>
                                <JobTypeBadge jobType={item.jobType} small />
                                <SlotTimeLabel
                                    startTime={item.slotStartTime}
                                    endTime={item.slotEndTime}
                                    small
                                />
                            </View>

                            <View style={styles.divider} />

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

                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleReject(item.id)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 30,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    card: {
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
    serviceBadge: {
        backgroundColor: '#EAF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    serviceText: { color: '#1E64D3', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    greenDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E', marginRight: 6 },
    statusText: { color: '#16A34A', fontSize: 11.5, fontWeight: '800' },

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

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 14, marginBottom: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    detailText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 18, marginLeft: 8 },

    rejectBtn: {
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    rejectBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 13.5 }
});

export default AcceptedRequestScreen;
