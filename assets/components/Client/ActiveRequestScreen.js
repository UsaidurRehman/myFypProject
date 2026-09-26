import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, Image, TextInput,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';

const ActiveRequestScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [interactingIds, setInteractingIds] = useState([]);

    const sortRequestsByInterviewIdDesc = (list = []) => {
        return [...list].sort((a, b) => {
            const aId = Number(a.interviewId || a.id || 0);
            const bId = Number(b.interviewId || b.id || 0);
            return bId - aId;
        });
    };

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const clientId = await AsyncStorage.getItem('clientId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(
                `${SERVER_BASE}/api/Dashboard/GetActiveRequests/${clientId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setRequests(sortRequestsByInterviewIdDesc(data));
            }
        } catch (error) {
            NotificationHelper.showError('Failed to load requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleApprove = async (requestId, addressPayload) => {
        if (interactingIds.includes(requestId)) return;
        setInteractingIds(prev => [...prev, requestId]);

        try {
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/CreateHiring`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    InterviewId: requestId,
                    WorkerDecision: 'Pending',
                    HiringDecision: 'Pending',
                    Address: addressPayload || ""
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Interview Approved! Job Offer sent to worker.');
                setRequests(prev => sortRequestsByInterviewIdDesc(prev.map(r => r.interviewId === requestId ? {
                    ...r,
                    status: 'Approved',
                    hiringStatus: 'Pending'
                } : r)));
            } else {
                const errData = await response.json().catch(() => ({}));
                NotificationHelper.showError(errData.message || 'Failed to approve request.');
            }
        } catch (error) {
            NotificationHelper.showError('Connection error occurred during approval.');
        } finally {
            setInteractingIds(prev => prev.filter(id => id !== requestId));
        }
    };

    const handleDelete = async (requestId) => {
        if (interactingIds.includes(requestId)) return;
        setInteractingIds(prev => [...prev, requestId]);

        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/DeleteInterviewRequest/${requestId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Request removed successfully.');
                setRequests(prev => prev.filter(req => req.interviewId !== requestId));
            } else {
                NotificationHelper.showError('Failed to delete request.');
            }
        } catch (error) {
            NotificationHelper.showError('Connection error occurred.');
        } finally {
            setInteractingIds(prev => prev.filter(id => id !== requestId));
        }
    };

    const filteredRequests = requests.filter(item => {
        const searchValue = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !searchValue ||
            item.workerName?.toLowerCase().includes(searchValue) ||
            item.workerSkill?.toLowerCase().includes(searchValue);

        if (!matchesSearch) return false;

        const itemStatus = (item.status || item.workerDecision || '').toString().toLowerCase().trim();
        const isResigned = itemStatus.includes('resign');
        const isTerminated = itemStatus.includes('terminate');
        const isRejected = itemStatus.includes('reject');
        const isApproved = (item.hiring?.hiringDecision ?? item.hiringStatus) === 'Accepted';
        const isFinalRecord = isApproved || isResigned || isTerminated || isRejected;

        if (activeTab === 'Pending') return !isFinalRecord;
        if (activeTab === 'Approved') return isApproved;
        return true;
    });

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>Interview List</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
                <View style={styles.searchContainer}>
                    <Icon name="magnify" size={22} color="#6B7280" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or skills"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.tabRow}>
                    {['All', 'Pending', 'Approved'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tabBtn,
                                activeTab === tab ? styles.tabBtnActive : styles.tabBtnInactive
                            ]}
                        >
                            <Text style={[
                                styles.tabBtnText,
                                activeTab === tab ? styles.tabBtnTextActive : styles.tabBtnTextInactive
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 40 }} />
                ) : filteredRequests.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Icon name="folder-open-outline" size={60} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No active requests found.</Text>
                    </View>
                ) : (
                    filteredRequests.map((item) => {
                        const isProcessing = interactingIds.includes(item.interviewId);

                        const workerDecision = item.workerDecision;
                        const hiringDecision = item.hiring?.hiringDecision ?? item.hiringStatus;
                        const offerSent = norm === 'approved';
                        const rawStatus = (item.status || workerDecision || '').toString().trim();
                        const norm = rawStatus.toLowerCase();
                        const isResigned = norm.includes('resign');
                        const isTerminated = norm.includes('terminate');
                        const isRejected = norm.includes('reject');
                        const isApproved = hiringDecision === 'Accepted';
                        const isFinalCard = isApproved || isResigned || isTerminated;

                        let badgeLabel = 'Pending';
                        let badgeBg = '#EAB308';
                        let badgeColor = '#fff';

                        let topTag = null;
                        let topTagColor = '#1F2937';

                        let subtext = 'Worker response pending';
                        let subtextColor = '#EF4444';

                        let canApprove = false;
                        let showDelete = true;

                        if (isResigned) {
                            badgeLabel = 'Resigned'; badgeBg = '#8B5CF6'; badgeColor = '#fff';
                            subtext = 'Contract Resigned'; subtextColor = '#8B5CF6';
                            showDelete = false;
                        } else if (isTerminated) {
                            badgeLabel = 'Terminated'; badgeBg = '#EF4444'; badgeColor = '#fff';
                            subtext = 'Contract Terminated'; subtextColor = '#EF4444';
                            showDelete = false;
                        } else if (isRejected) {
                            badgeLabel = 'Cancel'; badgeBg = '#9CA3AF'; badgeColor = '#fff';
                            topTag = 'Interview Rejected'; topTagColor = '#1F2937';
                            subtext = 'Not Available right now'; subtextColor = '#EF4444';
                            showDelete = true; canApprove = false;
                        } else if (isApproved) {
                            badgeLabel = 'Accepted'; badgeBg = '#22C55E'; badgeColor = '#fff';
                            topTag = 'Interview Accepted'; topTagColor = '#1F2937';
                            subtext = 'Verified'; subtextColor = '#22C55E';
                            showDelete = false; canApprove = false;
                        } else if (workerDecision === 'Accepted' && !offerSent) {
                            badgeLabel = 'Pending'; badgeBg = '#EAB308'; badgeColor = '#fff';
                            topTag = 'Inprocess'; topTagColor = '#22C55E';
                            subtext = 'Awaiting your approval'; subtextColor = '#EF4444';
                            canApprove = true; showDelete = true;
                        } else if (workerDecision === 'Accepted' && offerSent) {
                            badgeLabel = 'Approved'; badgeBg = '#22C55E'; badgeColor = '#fff';
                            topTag = 'Job Offer Sent'; topTagColor = '#22C55E';
                            subtext = 'Waiting for worker to accept'; subtextColor = '#1E64D3';
                            canApprove = false; showDelete = false;
                        } else {
                            topTag = 'Inprocess'; topTagColor = '#22C55E';
                            subtext = 'Worker response pending'; subtextColor = '#EF4444';
                            showDelete = true;
                        }

                        const imageUrl = item.workerImage
                            ? { uri: item.workerImage.startsWith('http') ? item.workerImage : `${SERVER_BASE}${item.workerImage}` }
                            : require('../../images/default-user.png');

                        return (
                            <View key={item.interviewId} style={styles.card}>
                                {topTag && (
                                    <View style={styles.topTagContainer}>
                                        {topTagColor === '#22C55E' && (
                                            <View style={styles.greenDot} />
                                        )}
                                        <Text style={[styles.topTagText, { color: topTagColor }]}>{topTag}</Text>
                                    </View>
                                )}

                                <View style={styles.cardBody}>
                                    <View style={styles.avatarCircle}>
                                        <Image source={imageUrl} style={styles.avatarImg} />
                                    </View>
                                    <View style={styles.infoCol}>
                                        <Text style={styles.workerName} numberOfLines={1}>
                                            {item.workerName || 'Worker Profile'}
                                        </Text>
                                        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                                            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                                        </View>
                                        <JobTypeBadge jobType={item.jobType} small style={styles.jobTypeBadge} />
<SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} small style={styles.slotTimeLabel} />
                                        <Text style={styles.skillText}>{item.workerSkill || 'General'}</Text>
                                        <Text style={[styles.subtextLabel, { color: subtextColor }]}>{subtext}</Text>
                                    </View>
                                    <View style={styles.actionCol}>
                                        {isProcessing ? (
                                            <ActivityIndicator size="small" color="#1E64D3" />
                                        ) : (
                                            <>
                                                {isFinalCard ? null : workerDecision === 'Accepted' && offerSent ? (
                                                    <View style={styles.approvedStateBtn}>
                                                        <Icon name="check-circle" size={14} color="#FFFFFF" />
                                                        <Text style={styles.approvedStateText}>Accepted</Text>
                                                    </View>
                                                ) : canApprove ? (
                                                    <TouchableOpacity
                                                        style={styles.approveBtn}
                                                        onPress={() => handleApprove(item.interviewId, item.address)}
                                                    >
                                                        <Text style={styles.approveBtnText}>Approve</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <View style={styles.approveBtnDisabled}>
                                                        <Text style={styles.approveBtnDisabledText}>Approve</Text>
                                                    </View>
                                                )}

                                                {showDelete && (
                                                    <TouchableOpacity
                                                        style={styles.deleteBtn}
                                                        onPress={() => handleDelete(item.interviewId)}
                                                    >
                                                        <Text style={styles.deleteBtnText}>Delete</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </>
                                        )}
                                    </View>
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
    slotTimeLabel: { marginTop: 4 },
    safeContainer: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },
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
    screenTitle: {
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
    scrollBody: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 30,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
    tabRow: {
        flexDirection: 'row',
        marginBottom: 18,
        gap: 8,
    },
    tabBtn: {
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: '#1E64D3',
        elevation: 3,
        shadowColor: '#1E64D3',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
    },
    tabBtnInactive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    tabBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    tabBtnTextActive: {
        color: '#FFFFFF',
    },
    tabBtnTextInactive: {
        color: '#374151',
    },
    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 15,
        marginTop: 12,
    },
    jobTypeBadge: { marginTop: 6 },
  card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 14,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 5,
    },
    topTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        marginRight: 5,
    },
    topTagText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#DBEAFE',
        borderWidth: 2,
        borderColor: '#93C5FD',
        overflow: 'hidden',
        marginRight: 12,
    },
    avatarImg: {
        width: 68,
        height: 68,
        borderRadius: 34,
    },
    infoCol: {
        flex: 1,
    },
    workerName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 3,
        borderRadius: 14,
        marginBottom: 5,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    skillText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 3,
    },
    subtextLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionCol: {
        width: 85,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    approveBtn: {
        backgroundColor: '#22C55E',
        borderRadius: 18,
        paddingVertical: 9,
        width: 82,
        alignItems: 'center',
        elevation: 2,
    },
    approveBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    approveBtnDisabled: {
        backgroundColor: '#E5E7EB',
        borderRadius: 18,
        paddingVertical: 9,
        width: 82,
        alignItems: 'center',
    },
    approveBtnDisabledText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '700',
    },
    approvedStateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16A34A',
        borderRadius: 18,
        paddingVertical: 9,
        width: 82,
        elevation: 2,
    },
    approvedStateText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 4,
    },
    deleteBtn: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        paddingVertical: 8,
        width: 82,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
    },
    deleteBtnText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '700',
    },
});

export default ActiveRequestScreen;