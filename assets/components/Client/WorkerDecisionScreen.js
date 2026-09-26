import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity, TextInput,
    ScrollView, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';

const API_BASE = API_DASHBOARD;

const WorkerDecisionScreen = ({ navigation }) => {
    const [decisions, setDecisions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
        fetchDecisions();
    }, []);

    const fetchDecisions = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetClientWorkerDecisions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDecisions(data);
            } else {
                NotificationHelper.showError("Failed to fetch decision tracking records.");
            }
        } catch (error) {
            NotificationHelper.showError("Network connection failure.");
        } finally {
            setIsLoading(false);
        }
    };

    // Rule 5: User confirms and finalizes accepted worker responses
    const handleFinalizeHiring = async (hiringId) => {
        setSubmittingId(hiringId);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/FinalizeHiringDecision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    HiringId: hiringId,
                    HiringDecision: 'Accepted'
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Hiring decision finalized successfully.');
                await fetchDecisions();
            } else {
                NotificationHelper.showError("Failed to update final hiring state.");
            }
        } catch (error) {
            NotificationHelper.showError("Network failure processing handshake.");
        } finally {
            setSubmittingId(null);
        }
    };

    const filteredDecisions = decisions.filter(item =>
        item.workerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.workerSkill?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header bar */}
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Worker Decision</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={22} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Worker name"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#1E64D3" style={styles.loader} />
            ) : filteredDecisions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="comment-question-outline" size={60} color="#BDC3C7" />
                    <Text style={styles.emptyText}>No pending active worker job offer decisions located.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {filteredDecisions.map((item) => {
                        const imgSource = item.workerImage
                            ? { uri: item.workerImage.startsWith('http') ? item.workerImage : `${SERVER_BASE}${item.workerImage}` }
                            : require('../../images/default-user.png');

                        const isAccepted = item.workerDecision === 'Accepted';
                        const isRejected = item.workerDecision === 'Rejected';
                        const isFinalized = item.hiringDecision === 'Accepted';
                        const canFinalize = isAccepted && item.hiringDecision === 'Pending';

                        return (
                            <View
                                key={item.hiringId}
                                style={[
                                    styles.card,
                                    isAccepted ? styles.cardAccepted : isRejected ? styles.cardRejected : {}
                                ]}
                            >
                                {/* Card header label */}
                                <Text style={[
                                    styles.cardLabel,
                                    isAccepted ? styles.cardLabelAccepted : styles.cardLabelRejected
                                ]}>
                                    {isAccepted ? 'Worker Accepted!' : isRejected ? 'Worker Rejected!' : 'Offer Pending'}
                                </Text>

                                {/* Avatar + Name row */}
                                <View style={styles.profileRow}>
                                    <View style={styles.avatarCircle}>
                                        <Image source={imgSource} style={styles.avatar} />
                                    </View>
                                    <View style={styles.nameBlock}>
                                        <Text style={styles.workerName}>{item.workerName}</Text>
                                        <JobTypeBadge jobType={item.jobType} small style={styles.jobTypeBadge} />
<SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} small style={styles.slotTimeLabel} />
                                        <View style={[
                                            styles.statusBadge,
                                            isAccepted ? styles.badgeAccepted : isRejected ? styles.badgeRejected : styles.badgePending
                                        ]}>
                                            <Icon
                                                name={isAccepted ? 'account-check' : isRejected ? 'account-cancel' : 'account-clock'}
                                                size={13}
                                                color={isAccepted ? '#15803D' : isRejected ? '#B91C1C' : '#92400E'}
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={[
                                                styles.statusBadgeText,
                                                isAccepted ? styles.badgeTextAccepted : isRejected ? styles.badgeTextRejected : styles.badgeTextPending
                                            ]}>
                                                {isAccepted ? 'Acceptance Confirm' : isRejected ? 'Rejected' : 'Offer Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Info section */}
                                <View style={styles.infoSection}>
                                    {item.hiringDate && (
                                        <Text style={styles.infoText}>
                                            <Text style={styles.bold}>Decision Date: </Text>
                                            {new Date(item.hiringDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                        </Text>
                                    )}
                                    <Text style={styles.infoText}>
                                        <Text style={styles.bold}>Job Role</Text>: {item.workerSkill}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        <Text style={styles.bold}>Address</Text>: {item.address}
                                    </Text>
                                    <Text style={styles.noteText}>
                                        {isAccepted
                                            ? `${item.workerName} is excited to start.`
                                            : isRejected
                                            ? `${item.workerName} has chosen another offer . Your other worker are below.`
                                            : 'Awaiting worker response.'}
                                    </Text>
                                </View>

                                {/* Action button */}
                                {canFinalize && (
                                    <View style={styles.actionRow}>
                                        {submittingId === item.hiringId ? (
                                            <ActivityIndicator size="small" color="#1E64D3" />
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.confirmBtn}
                                                onPress={() => handleFinalizeHiring(item.hiringId)}
                                            >
                                                <Text style={styles.confirmBtnText}>Confirm</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {isFinalized && (
                                    <View style={styles.actionRow}>
                                        <View style={styles.finalizedBadge}>
                                            <Icon name="check-all" size={16} color="#15803D" />
                                            <Text style={styles.finalizedText}>Hiring Handshake Finalized</Text>
                                        </View>
                                    </View>
                                )}

                                {isRejected && (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity style={styles.viewOtherBtn}>
                                            <Text style={styles.viewOtherBtnText}>View Other Worker</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    slotTimeLabel: { marginTop: 4 },
    jobTypeBadge: { marginTop: 4 },
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
        fontSize: 22,
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

    /* ── Search ── */
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        paddingVertical: 0,
    },

    /* ── Empty / Loader ── */
    loader: { marginTop: 40 },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#7F8C8D',
        fontSize: 15,
        marginTop: 10,
    },

    /* ── Scroll ── */
    scrollContainer: {
        paddingHorizontal: 16,
        paddingBottom: 28,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    cardAccepted: {
        borderColor: '#22C55E',
    },
    cardRejected: {
        borderColor: '#EF4444',
    },

    cardLabel: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
    },
    cardLabelAccepted: {
        color: '#16A34A',
    },
    cardLabelRejected: {
        color: '#DC2626',
    },

    /* Avatar */
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#DBEAFE',
        borderWidth: 2,
        borderColor: '#93C5FD',
        overflow: 'hidden',
        marginRight: 14,
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
    },
    nameBlock: {
        flex: 1,
    },
    workerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
    },

    /* Status badge */
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 14,
    },
    badgeAccepted: {
        backgroundColor: '#DCFCE7',
    },
    badgeRejected: {
        backgroundColor: '#FEE2E2',
    },
    badgePending: {
        backgroundColor: '#FEF3C7',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    badgeTextAccepted: { color: '#15803D' },
    badgeTextRejected: { color: '#B91C1C' },
    badgeTextPending:  { color: '#92400E' },

    /* Info */
    infoSection: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
        lineHeight: 20,
    },
    bold: {
        fontWeight: '700',
        color: '#111827',
    },
    noteText: {
        fontSize: 14,
        color: '#374151',
        marginTop: 6,
        lineHeight: 20,
    },

    /* Actions */
    actionRow: {
        alignItems: 'center',
        marginTop: 4,
    },
    confirmBtn: {
        backgroundColor: '#1E64D3',
        borderRadius: 24,
        paddingVertical: 12,
        width: '80%',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#1E64D3',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    viewOtherBtn: {
        backgroundColor: '#E5E7EB',
        borderRadius: 24,
        paddingVertical: 12,
        width: '80%',
        alignItems: 'center',
    },
    viewOtherBtnText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '700',
    },
    finalizedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCFCE7',
        paddingVertical: 10,
        borderRadius: 12,
        width: '80%',
    },
    finalizedText: {
        color: '#15803D',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 6,
    },
});

export default WorkerDecisionScreen;