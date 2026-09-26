import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity,
    TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import ResidenceBadge from '../helpers/ResidenceBadge';

const API_BASE = `${SERVER_BASE}/api/Dashboard`;

const JobConfirmationScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchJobConfirmations();
    }, []);

    const fetchJobConfirmations = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/GetWorkerJobConfirmations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                NotificationHelper.showError('Failed to fetch job offers.');
                return;
            }
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            NotificationHelper.showError('Server error.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchJobConfirmations(false);
    }, []);

    // Worker accepts the offer
    const handleAcceptJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/WorkerAcceptJobOffer/${hiringId}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job accepted!');
                fetchJobConfirmations(false);
            } else {
                NotificationHelper.showError('Error accepting job.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // Worker rejects the offer
    const handleRejectJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/WorkerRejectJobOffer/${hiringId}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job offer rejected.');
                fetchJobConfirmations(false);
            } else {
                NotificationHelper.showError('Error rejecting job.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // After rejection or termination, remove the hiring record from the list
    const handleDeleteJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/ClientDismissWorkerRejection/${hiringId}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job request removed.');
                setJobs(prevJobs => prevJobs.filter(j => j?.id !== hiringId));
            } else {
                NotificationHelper.showError('Failed to remove request.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // Filter safely by client name
    const filteredJobs = jobs.filter(job =>
        job?.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderJobCard = (item) => {
        const {
            id, clientId, clientName, clientImage, clientRating,
            date, role, address, message, type, status, jobType, isResidenceProvided, slotStartTime, slotEndTime
        } = item;
        const hiringId = id;

        // Determine UI state
        const pendingWorker = type === 'offered';
        const rawStatus = status ? status.toString() : '';
        const statusLower = rawStatus.toLowerCase();
        const rejectedByClient = statusLower.includes('unable') || statusLower.includes('sorry') || statusLower.includes('rejected');
        const rejectedWorker = type === 'rejected' || rejectedByClient;
        const acceptedWorker = type === 'accepted' && !rejectedByClient;
        const finalized = type === 'final';
        const terminated = type === 'terminated';

        // Dynamic Card Color Configurations
        let borderColor = '#1E64D3'; // Default blue
        let statusBg = '#E3F2FD';
        let statusTextColor = '#1E64D3';
        let statusHeaderText = 'Job Offer';

        if (rejectedWorker) {
            borderColor = '#FF5252';
            statusBg = '#FFCDD2';
            statusTextColor = '#D32F2F';
            statusHeaderText = 'Job Rejected';
        } else if (finalized) {
            borderColor = '#4CAF50';
            statusBg = '#C8E6C9';
            statusTextColor = '#388E3C';
            statusHeaderText = 'Hired!';
        } else if (pendingWorker) {
            borderColor = '#FF9800'; // Amber alert warning status for explicit pending actions
            statusBg = '#FFE0B2';
            statusTextColor = '#E65100';
            statusHeaderText = 'New Job Offer';
        } else if (acceptedWorker) {
            borderColor = '#90A4AE';
            statusBg = '#ECEFF1';
            statusTextColor = '#455A64';
            statusHeaderText = 'Accepted';
        } else if (terminated) {
            borderColor = '#FF5252';
            statusBg = '#FFCDD2';
            statusTextColor = '#D32F2F';
            statusHeaderText = 'Contract Terminated';
        }

        const displayStatus = rejectedWorker
            ? 'Rejected'
            : terminated
                ? 'Contract Terminated'
                : acceptedWorker
                    ? 'Accepted'
                    : status || 'Pending';

        const ratingValue = Number(clientRating) || 0;
        const hasRating = ratingValue > 0;

        const avatarUri = clientImage
            ? (clientImage.startsWith('http') ? clientImage : `${SERVER_BASE}${clientImage}`)
            : null;

        const detailRows = [
            { icon: 'calendar-range', label: 'Interview Date', value: date || 'Not set' },
            { icon: 'briefcase-outline', label: 'Job Role', value: role || 'Not set' },
            { icon: 'tag-outline', label: 'Job Type', value: jobType || 'Full-Time' },
            { icon: 'map-marker-outline', label: 'Address', value: address || 'Not set' },
        ];

        return (
            <View key={hiringId.toString()} style={styles.card}>
                <View style={[styles.cardAccent, { backgroundColor: borderColor }]} />

                {/* Row 1 — state + booking type */}
                <View style={styles.cardTopRow}>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                        <View style={[styles.statusDot, { backgroundColor: borderColor }]} />
                        <Text style={[styles.statusPillText, { color: statusTextColor }]}>
                            {statusHeaderText}
                        </Text>
                    </View>
                    <JobTypeBadge jobType={jobType} small />
                </View>

                {/* Row 2 — who sent the offer */}
                <View style={styles.clientRow}>
                    <View style={styles.imageContainer}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Icon name="account" size={28} color="#94A3B8" />
                            </View>
                        )}
                        <View style={styles.verifiedIcon}>
                            <Icon
                                name={rejectedWorker ? 'account-cancel' : 'account-check'}
                                size={12}
                                color={statusTextColor}
                            />
                        </View>
                    </View>

                    <View style={styles.nameCol}>
                        <TouchableOpacity
                            onPress={() => {
                                if (clientId) {
                                    navigation.navigate('ClientProfileScreen', { clientId: clientId, id: clientId });
                                }
                            }}
                            disabled={!clientId}
                        >
                            <Text style={styles.clientName} numberOfLines={1} ellipsizeMode="tail">
                                {clientName || 'Client Profile'}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.clientCaption} numberOfLines={1}>
                            {pendingWorker ? 'Sent you a job offer' : displayStatus}
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

                {/* Row 3 — the reserved window (part-time only) + residence badge + current state */}
                <View style={styles.chipRow}>
                    <ResidenceBadge isResidenceProvided={isResidenceProvided} small />
                    <SlotTimeLabel startTime={slotStartTime} endTime={slotEndTime} small />
                    <View style={styles.stateChip}>
                        <Text style={styles.stateChipText}>{displayStatus}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Row 4 — the offer details */}
                <View style={styles.detailsSection}>
                    {detailRows.map((row) => (
                        <View key={row.label} style={styles.detailRow}>
                            <View style={styles.detailIconBox}>
                                <Icon name={row.icon} size={15} color={statusTextColor} />
                            </View>
                            <Text style={styles.detailLabel}>{row.label}</Text>
                            <Text style={styles.detailValue} numberOfLines={2}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Row 5 — the client's message */}
                {message ? (
                    <View style={styles.messageBox}>
                        <Icon name="message-text-outline" size={14} color="#64748B" />
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                ) : null}

                {/* Row 6 — actions */}
                <View style={styles.buttonRow}>
                    {pendingWorker && (
                        <>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleRejectJob(hiringId)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.btnTextGrey}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() => handleAcceptJob(hiringId)}
                                activeOpacity={0.85}
                            >
                                <Icon name="check" size={16} color="#FFF" />
                                <Text style={styles.btnTextWhite}>Accept</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {acceptedWorker && (
                        <View style={[styles.stateButton, styles.stateButtonAccepted]}>
                            <Icon name="check-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.btnTextWhite}>Accepted — awaiting client</Text>
                        </View>
                    )}

                    {finalized && (
                        <View style={[styles.stateButton, styles.stateButtonHired]}>
                            <Icon name="briefcase-check" size={16} color="#FFFFFF" />
                            <Text style={styles.btnTextWhite}>Hired</Text>
                        </View>
                    )}

                    {(rejectedWorker || terminated) && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteJob(hiringId)}
                            activeOpacity={0.85}
                        >
                            <Icon name="trash-can-outline" size={16} color="#DC2626" />
                            <Text style={styles.btnTextRed}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.blueCircle} />

            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Job Confirmation</Text>
                </View>
                <View style={styles.searchBar}>
                    <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search by client name"
                        placeholderTextColor="#999"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E64D3"]} />
                    }
                >
                    {filteredJobs.length === 0 ? (
                        <Text style={styles.emptyText}>No job confirmations available.</Text>
                    ) : (
                        filteredJobs.map((item, index) => renderJobCard(item, index))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFF' },
    blueCircle: {
        position: 'absolute', top: -50, left: -50,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#E3F2FD', zIndex: -1,
    },
    header: { padding: 20, paddingBottom: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 25,
        borderWidth: 1, borderColor: '#E2E8F0',
        paddingHorizontal: 15, height: 46, elevation: 2,
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A', paddingVertical: 0 },
    searchIcon: { marginRight: 10 },

    scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },

    /* ── Job offer card ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E8EDF5',
        elevation: 3,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    cardAccent: { height: 4, width: '100%' },

    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusPillText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },

    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    imageContainer: { position: 'relative' },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAF2FF' },
    avatarFallback: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#EAF2FF',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#DBEAFE',
    },
    verifiedIcon: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: '#FFF', borderRadius: 10, padding: 2,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    nameCol: { flex: 1, marginLeft: 12, marginRight: 8 },
    clientName: { fontSize: 16.5, fontWeight: '800', color: '#0F172A' },
    clientCaption: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    ratingBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF7E6', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 10, borderWidth: 1, borderColor: '#FDE3A7', flexShrink: 0,
    },
    ratingBadgeMuted: { backgroundColor: '#F4F6FA', borderColor: '#E2E8F0' },
    ratingText: { marginLeft: 3, fontSize: 12, fontWeight: '800', color: '#B45309' },
    ratingTextMuted: { color: '#8494AB' },

    chipRow: {
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
        gap: 8, paddingHorizontal: 16, paddingTop: 12,
    },
    stateChip: {
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    },
    stateChipText: { fontSize: 10.5, fontWeight: '800', color: '#475569' },

    divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 14 },

    detailsSection: { paddingHorizontal: 16, paddingTop: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    detailIconBox: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
    },
    detailLabel: { width: 105, fontSize: 12.5, color: '#8494AB', fontWeight: '600' },
    detailValue: { flex: 1, fontSize: 13.5, color: '#1E293B', fontWeight: '700' },

    messageBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E8EDF5',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 2,
    },
    messageText: { flex: 1, fontSize: 12.5, color: '#475569', lineHeight: 18, marginLeft: 8 },

    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 16,
    },
    rejectBtn: {
        flex: 1, height: 44, borderRadius: 12,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
        alignItems: 'center', justifyContent: 'center',
    },
    acceptBtn: {
        flex: 1, height: 44, borderRadius: 12,
        backgroundColor: '#1E64D3',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        elevation: 1,
    },
    deleteBtn: {
        flex: 1, height: 44, borderRadius: 12,
        backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    stateButton: {
        flex: 1, height: 44, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    stateButtonAccepted: { backgroundColor: '#16A34A' },
    stateButtonHired: { backgroundColor: '#0F766E' },

    btnTextWhite: { color: '#FFF', fontWeight: '800', fontSize: 13.5, marginLeft: 6 },
    btnTextGrey: { color: '#64748B', fontWeight: '800', fontSize: 13.5 },
    btnTextRed: { color: '#DC2626', fontWeight: '800', fontSize: 13.5, marginLeft: 6 },

    emptyText: { textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#94A3B8' },
});

export default JobConfirmationScreen;