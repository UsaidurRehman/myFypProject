import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity,
    TextInput, SafeAreaView, ScrollView, StatusBar,
    ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

const ResignationScreen = ({ route, navigation }) => {
    const { resignationId } = route.params || {};
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [rating, setRating] = useState(3);
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // "Confirmed" now means the CLIENT has confirmed + reviewed this contract.
    // (The API used to answer this off ANY review row for the interview, so the
    // worker's own review — written while resigning — locked this whole screen.)
    const isConfirmed = data?.isConfirmed === true;

    // Before confirming the stars are the client's input; afterwards they show the
    // rating that was actually stored.
    const shownRating = isConfirmed ? (data?.clientReview?.rating ?? 0) : rating;

    useEffect(() => {
        if (!resignationId) {
            NotificationHelper.showError("This resignation could not be opened.");
            navigation.goBack();
            return;
        }
        fetchResignationDetail();
    }, [resignationId]);

    const fetchResignationDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetResignationDetail/${resignationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const json = await response.json();
                setData(json);
            } else {
                NotificationHelper.showError("Failed to load details.");
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network error.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmResignation = async () => {
        if (!remarks.trim()) {
            NotificationHelper.showError("Please enter some remarks before confirming.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/ConfirmResignation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    InterviewId: data.interviewId,
                    Rating: rating,
                    Comment: remarks
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Resignation confirmed. Your review of the worker was saved.");
                // Back to the list, which refetches on focus — the row moves to Completed.
                navigation.navigate('ResignationsScreen');
            } else {
                const err = await response.json();
                NotificationHelper.showError(err.message || "Failed to confirm.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (size = 30) => (
        <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
                isConfirmed ? (
                    <Icon
                        key={star}
                        name={star <= shownRating ? 'star' : 'star-outline'}
                        size={size}
                        color={star <= shownRating ? '#FFC107' : '#D0D5DD'}
                    />
                ) : (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        activeOpacity={0.7}
                        style={styles.starTap}
                    >
                        <Icon
                            name={star <= shownRating ? 'star' : 'star-outline'}
                            size={size}
                            color={star <= shownRating ? '#FFC107' : '#D0D5DD'}
                        />
                    </TouchableOpacity>
                )
            ))}
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    if (!data) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Icon name="arrow-left" size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Resignation</Text>
                <Image source={require('../../images/logo.png')} style={styles.logo} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Who is resigning ── */}
                <View style={styles.profileCard}>
                    <Image
                        source={{
                            uri: data.workerAvatar && data.workerAvatar.startsWith('/')
                                ? `${SERVER_BASE}${data.workerAvatar}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileText}>
                        <Text style={styles.workerName} numberOfLines={1}>{data.workerName}</Text>
                        <View style={styles.roleChip}>
                            <Icon name="briefcase-outline" size={12} color="#1E64D3" />
                            <Text style={styles.workerRole} numberOfLines={1}>{data.workerRole}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Notice period ── */}
                <View style={styles.noticeCard}>
                    <View style={styles.noticeBlueHeader}>
                        <View>
                            <Text style={styles.noticeHeaderLabel}>Official Notice Period</Text>
                            <Text style={styles.noticeHeaderDays}>{data.totalNoticeDays} Days Total</Text>
                        </View>
                        <View style={styles.noticeBadge}>
                            <Text style={styles.noticeBadgeText}>{data.remainingDays} left</Text>
                        </View>
                    </View>
                    <View style={styles.noticeBody}>
                        <View style={styles.noticeStatusRow}>
                            <Text style={styles.noticeStatusLabel}>Notice Period Status</Text>
                            <Text style={styles.remainingText}>
                                Remaining Days: <Text style={styles.boldBlue}>{data.remainingDays}</Text>
                            </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(Math.max(data.progress * 100, 0), 100)}%` }]} />
                        </View>
                    </View>
                </View>

                {/* ── Dates & reason ── */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                            <Icon name="calendar-check-outline" size={16} color="#1E64D3" />
                        </View>
                        <View style={styles.infoTextCol}>
                            <Text style={styles.infoLabel}>Last Working Day</Text>
                            <Text style={styles.infoValue}>{data.lastWorkingDate}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                            <Icon name="text-box-outline" size={16} color="#1E64D3" />
                        </View>
                        <View style={styles.infoTextCol}>
                            <Text style={styles.infoLabel}>Reason for Leaving</Text>
                            <Text style={styles.infoValueReason}>{data.reason}</Text>
                        </View>
                    </View>
                </View>

                {/* ── What the worker said about you ── */}
                {data.workerReview ? (
                    <View style={styles.workerReviewCard}>
                        <View style={styles.workerReviewHeader}>
                            <View style={styles.workerReviewIconBox}>
                                <Icon name="comment-quote-outline" size={14} color="#1E64D3" />
                            </View>
                            <Text style={styles.workerReviewTitle} numberOfLines={1}>
                                {data.workerName}&apos;s review of you
                            </Text>
                        </View>

                        <View style={styles.reviewMetaRow}>
                            {renderStars(16)}
                            <Text style={styles.reviewRatingText}>
                                {Number(data.workerReview.rating || 0).toFixed(1)}
                            </Text>
                            <Text style={styles.reviewMetaDate}>· {data.workerReview.date}</Text>
                        </View>

                        {data.workerReview.comment ? (
                            <Text style={styles.reviewCommentQuoted}>
                                &quot;{data.workerReview.comment}&quot;
                            </Text>
                        ) : null}

                        {data.workerReview.workedPeriod ? (
                            <View style={styles.workedRow}>
                                <Icon name="briefcase-outline" size={12} color="#1E64D3" />
                                <Text style={styles.workedText}>Worked: {data.workerReview.workedPeriod}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {/* ── Your review ── */}
                <View style={styles.reviewCard}>
                    <View style={styles.reviewTopRow}>
                        <Text style={styles.reviewCardTitle}>Your Review</Text>
                        {isConfirmed ? (
                            <View style={styles.savedChip}>
                                <Icon name="check-circle" size={12} color="#15803D" />
                                <Text style={styles.savedChipText}>Saved</Text>
                            </View>
                        ) : null}
                    </View>

                    {isConfirmed ? (
                        <View>
                            <View style={styles.reviewMetaRow}>
                                {renderStars(18)}
                                <Text style={styles.reviewRatingText}>
                                    {Number(shownRating || 0).toFixed(1)}
                                </Text>
                                {data.clientReview?.date ? (
                                    <Text style={styles.reviewMetaDate}>· {data.clientReview.date}</Text>
                                ) : null}
                            </View>

                            {data.clientReview?.comment ? (
                                <Text style={styles.reviewCommentQuoted}>
                                    &quot;{data.clientReview.comment}&quot;
                                </Text>
                            ) : null}

                            <View style={styles.lockNote}>
                                <Icon name="lock-outline" size={13} color="#15803D" />
                                <Text style={styles.lockNoteText}>
                                    You confirmed this resignation
                                    {data.clientReview?.date ? ` on ${data.clientReview.date}` : ''}.
                                    Your rating of {data.workerName} is saved and can no longer be changed.
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.reviewHint}>
                                Tap a star to rate {data.workerName}, then write your remarks.
                            </Text>

                            <View style={styles.reviewMetaRow}>{renderStars(30)}</View>

                            <TextInput
                                style={styles.remarksInput}
                                placeholder="Enter your remarks here"
                                placeholderTextColor="#9CA3AF"
                                value={remarks}
                                onChangeText={setRemarks}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    )}
                </View>

                {/* ── Action ── */}
                {isConfirmed ? (
                    <View style={styles.confirmedBtnLocked}>
                        <Icon name="check-circle" size={19} color="#15803D" />
                        <Text style={styles.confirmedBtnLockedText}>Resignation Confirmed</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.confirmBtn, isSubmitting && styles.confirmBtnBusy]}
                        onPress={handleConfirmResignation}
                        disabled={isSubmitting}
                        activeOpacity={0.85}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <View style={styles.confirmBtnInner}>
                                <Icon name="check-circle-outline" size={20} color="#FFF" />
                                <Text style={styles.confirmBtnText}>Confirm Resignation</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F8FC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8FC' },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF1F6'
    },
    backCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    logo: { width: 40, height: 40 },

    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 },

    /* ── Worker ── */
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        padding: 14,
        marginBottom: 14
    },
    avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#EEF1F6' },
    profileText: { flex: 1, marginLeft: 14 },
    workerName: { fontSize: 19, fontWeight: '800', color: '#111827' },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#EEF4FF',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 3,
        marginTop: 6
    },
    workerRole: { fontSize: 12, fontWeight: '700', color: '#1E64D3', marginLeft: 5 },

    /* ── Notice period ── */
    noticeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        overflow: 'hidden',
        marginBottom: 14
    },
    noticeBlueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#4F7BF0',
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    noticeHeaderLabel: { color: '#DCE6FF', fontSize: 13, fontWeight: '600' },
    noticeHeaderDays: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
    noticeBadge: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    noticeBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    noticeBody: { padding: 16 },
    noticeStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    noticeStatusLabel: { fontSize: 15, fontWeight: '800', color: '#111827' },
    remainingText: { fontSize: 13, color: '#6B7280' },
    boldBlue: { color: '#1E64D3', fontWeight: '800' },
    progressBarContainer: {
        height: 7,
        backgroundColor: '#EEF1F6',
        borderRadius: 4,
        marginTop: 14,
        overflow: 'hidden',
        width: '100%'
    },
    progressBarFill: { height: '100%', backgroundColor: '#4F7BF0', borderRadius: 4 },

    /* ── Info card (dates + reason) ── */
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 14
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
    infoIconBox: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: '#EEF4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    infoTextCol: { flex: 1 },
    infoLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 3
    },
    infoValue: { fontSize: 15, color: '#1F2937', fontWeight: '600' },
    infoValueReason: { fontSize: 14, color: '#374151', lineHeight: 21 },
    divider: { height: 1, backgroundColor: '#F1F5F9' },

    /* ── Review blocks ── */
    workerReviewCard: {
        backgroundColor: '#F7FAFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D6E4FF',
        padding: 14,
        marginBottom: 14
    },
    workerReviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    workerReviewIconBox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#E4EEFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8
    },
    workerReviewTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#1F2937' },

    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        padding: 14,
        marginBottom: 18
    },
    reviewTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewCardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
    savedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF3',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 3
    },
    savedChipText: { fontSize: 11, fontWeight: '800', color: '#15803D', marginLeft: 4 },

    reviewHint: { fontSize: 13, color: '#6B7280', marginTop: 6, marginBottom: 10 },
    reviewMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
    starRow: { flexDirection: 'row', alignItems: 'center' },
    starTap: { paddingRight: 6 },
    reviewRatingText: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginLeft: 8 },
    reviewMetaDate: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
    reviewCommentQuoted: {
        fontSize: 14,
        color: '#334155',
        fontStyle: 'italic',
        lineHeight: 20,
        marginTop: 10
    },

    remarksInput: {
        minHeight: 84,
        borderWidth: 1,
        borderColor: '#DDE3EC',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#FBFCFF',
        marginTop: 12,
        textAlignVertical: 'top'
    },

    lockNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F2FBF5',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 9,
        marginTop: 12
    },
    lockNoteText: { flex: 1, fontSize: 12.5, color: '#166534', lineHeight: 18, marginLeft: 7 },

    workedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    workedText: { fontSize: 12, color: '#1E64D3', fontWeight: '700', marginLeft: 5 },

    /* ── Action ── */
    confirmBtn: {
        backgroundColor: '#16A34A',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmBtnBusy: { opacity: 0.7 },
    confirmBtnInner: { flexDirection: 'row', alignItems: 'center' },
    confirmBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginLeft: 8 },
    confirmedBtnLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: 14,
        backgroundColor: '#E9F9EF',
        borderWidth: 1,
        borderColor: '#A7E0BC'
    },
    confirmedBtnLockedText: { color: '#15803D', fontSize: 17, fontWeight: '800', marginLeft: 8 }
});

export default ResignationScreen;
