import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet, View, Text, Image, ScrollView,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE = API_DASHBOARD;

const WorkerDetailScreen = ({ navigation, route }) => {
    const { workerId } = route.params;
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const horizontalScrollRef = useRef(null);

    // Compute dynamic tabs array
    const tabs = [
        'Overview',
        'Experience',
        'Reviews',
        // Conditional pages stay at the END so the pager indexes always line up.
        ...(worker?.isPartTimeAvailable ? ['Time Slots'] : []),
        ...(worker?.habits && worker.habits.length > 0 ? ['Habits'] : []),
    ];

    // Refetch when the screen regains focus, so after booking (or after the worker
    // changes something) the footer button no longer shows a stale state.
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchWorkerDetails();
        });
        return unsubscribe;
    }, [navigation, fetchWorkerDetails]);

    const fetchWorkerDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const clientId = await AsyncStorage.getItem('clientId');

            const response = await fetch(`${API_BASE}/GetWorkerDetail/${workerId}?clientIdParam=${clientId || ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
            } else {
                NotificationHelper.showError("Failed to fetch worker details.");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching worker details:", error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    }, [workerId, navigation]);

    const callLockRef = useRef(false);

    // Opens the interview booking screen. The lock makes a double tap harmless and the
    // guard means a tap that arrives before the worker payload exists cannot push a
    // screen without a workerId (which used to land the client back on the dashboard).
    const handleCallForInterview = () => {
        if (callLockRef.current) return;

        const id = worker?.id || route.params?.workerId;
        if (!id) {
            NotificationHelper.showError('Worker details are still loading. Please try again.');
            return;
        }

        callLockRef.current = true;
        setTimeout(() => { callLockRef.current = false; }, 800);

        navigation.navigate('InterviewSelectionScreen', {
            workerId: id,
            workerName: worker?.name || 'this worker',
        });
    };

    const handleTabPress = (index) => {
        setActiveTab(index);
        horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / SCREEN_WIDTH);
        if (index !== activeTab && index >= 0 && index < tabs.length) {
            setActiveTab(index);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    if (!worker) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header / Hero Section */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.profileHeader}>
                    <Image
                        source={{
                            uri: worker.picture && worker.picture.startsWith('/')
                                ? `${SERVER_BASE}${worker.picture}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.nameText}>{worker.name}</Text>
                        <Text style={styles.roleTitle}>{worker.role}</Text>

                        <View style={styles.badgeRow}>
                            <View style={[
                                styles.statusBadge,
                                (worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked") && styles.statusBadgeUnavailable
                            ]}>
                                <View style={[
                                    styles.statusDot,
                                    (worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked") && styles.statusDotUnavailable
                                ]} />
                                <Text style={[
                                    styles.statusText,
                                    (worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked") && styles.statusTextUnavailable
                                ]}>
                                    {worker.availability === "Available 24/7" ? "AVAILABLE" : worker.availability}
                                </Text>
                            </View>

                            {/* Conditional Part-Time Available Badge */}
                            {worker.isPartTimeAvailable && (
                                <View style={styles.partTimeTag}>
                                    <Icon name="clock-outline" size={11} color="#975A16" />
                                    <Text style={styles.partTimeTagText}>PART-TIME AVAILABLE</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.genderTitle}>{worker.gender ? worker.gender.toUpperCase() : ''} • {worker.age} Y/O</Text>
                    </View>
                </View>

                {/* Stat Grid */}
                <View style={styles.statsContainer}>
                    <StatItem
                        flex={0.8}
                        label="RATING"
                        value={`★ ${worker.rating || '0.0'}`}
                        subText={`(${worker.reviewCount || 0})`}
                    />
                    <View style={styles.divider} />
                    <StatItem
                        flex={1.8}
                        label="LOCATION"
                        value={worker.location ? worker.location.toUpperCase() : "N/A"}
                    />
                    <View style={styles.divider} />
                    <StatItem
                        flex={1.1}
                        label="SALARY"
                        value={`Rs.${worker.salary}`}
                    />
                </View>

                {/* Tab Controls */}
                <View style={styles.tabContainer}>
                    {tabs.map((tab, index) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === index && styles.activeTabButton]}
                            onPress={() => handleTabPress(index)}
                        >
                            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Horizontal Swipeable Container for Tabs */}
            <ScrollView
                ref={horizontalScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={{ flex: 1 }}
            >
                {/* ── OVERVIEW TAB ── */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Trust & Verification</Text>

                    <TouchableOpacity
                        style={styles.companyBadgeButton}
                        onPress={() => navigation.navigate('WorkerCertificationDetail', { workerId: worker.id || workerId })}
                    >
                        <Icon name="shield-check" size={22} color="#026597" />
                        <View style={styles.badgeTextContainer}>
                            <Text style={styles.companyBadgeTitle}>Verified Training</Text>
                            <Text style={styles.companyBadgeSubtitle}>
                                Certified by {worker.companyName || 'Proton Services'}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#026597" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.policeAlertButton}
                        onPress={() => navigation.navigate('workerPoliceRecord', { workerId: worker.id || workerId })}
                    >
                        <Icon name="shield-alert" size={22} color="#B91C1C" />
                        <View style={styles.badgeTextContainer}>
                            <Text style={styles.policeAlertTitle}>Criminal Background Check</Text>
                            <Text style={styles.policeAlertSubtitle}>Click to review FIR & verification status</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#B91C1C" />
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>About Worker</Text>
                    <Text style={styles.aboutDescription}>{worker.bio || "No description provided."}</Text>

                    <Text style={styles.sectionTitle}>Primary Skills</Text>
                    <View style={styles.chipWrapper}>
                        {worker.primarySkills && worker.primarySkills.length > 0 ? (
                            worker.primarySkills.map((skill, index) => (
                                <View key={index} style={styles.skillChip}>
                                    <Text style={styles.skillText}>{skill.toUpperCase()}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No primary skills listed.</Text>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Part-Time Services</Text>
                    {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
                        worker.partTimeSkills.map((item, index) => (
                            <View key={index} style={{ marginBottom: 10 }}>
                                <Text style={styles.subCategoryLabel}>{item.categoryName.toUpperCase()}</Text>
                                <View style={styles.chipWrapper}>
                                    {item.skills.map((skill, sIndex) => (
                                        <View key={sIndex} style={styles.skillChipSecondary}>
                                            <Text style={styles.skillTextSecondary}>{skill.toUpperCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No part-time skills added.</Text>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── EXPERIENCE TAB ── */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Work History</Text>
                    {worker.experiences && worker.experiences.length > 0 ? (
                        worker.experiences.map((exp, index) => (
                            <ExperienceItem
                                key={index}
                                title={exp.title}
                                period={exp.period}
                                bullets={[exp.details]}
                                isActive={index === 0}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No experience history available.</Text>
                    )}

                    <Text style={styles.sectionTitle}>Booking Procedure</Text>
                    <View style={styles.procedureCard}>
                        <ProcedureStep step="1" text="Send an interview request with preferred timings." />
                        <ProcedureStep step="2" text="Wait for status confirmation or callback." />
                        <ProcedureStep step="3" text="Finalize details & start service." />
                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── REVIEWS TAB ── */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Client Feedback & Ratings</Text>

                    <View style={styles.overallRatingCard}>
                        <Text style={styles.bigRatingText}>{worker.rating || "0.0"}</Text>
                        <View style={{ marginLeft: 12 }}>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Icon
                                        key={i}
                                        name={i <= Math.round(worker.rating || 0) ? "star" : "star-outline"}
                                        size={18}
                                        color={i <= Math.round(worker.rating || 0) ? "#FFD700" : "#CBD5E1"}
                                    />
                                ))}
                            </View>
                            <Text style={styles.totalReviewsSubText}>Based on {worker.reviewCount || 0} reviews</Text>
                        </View>
                    </View>

                    {worker.reviews && worker.reviews.length > 0 ? (
                        worker.reviews.map((rev, index) => (
                            <ReviewCard
                                key={index}
                                name={rev.reviewerName}
                                rating={rev.rating}
                                text={rev.comment}
                                date={rev.date}
                                workedPeriod={rev.workedPeriod}
                                onNamePress={() => {
                                    if (rev.clientId) {
                                        navigation.navigate('ClientProfileScreen', {
                                            clientId: rev.clientId,
                                            id: rev.clientId
                                        });
                                    } else {
                                        console.warn('Client ID is missing for this review.');
                                    }
                                }}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyReviewBox}>
                            <Icon name="message-outline" size={40} color="#94A3B8" />
                            <Text style={styles.emptyText}>No reviews submitted yet.</Text>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── TIME SLOTS TAB (RENDERED CONDITIONALLY) ── */}
                {worker.isPartTimeAvailable && (
                    <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Part-Time Available Slots</Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                            This worker is within your radius ({worker.distanceKm} km away).
                        </Text>

                        {worker.timeSlots && worker.timeSlots.length > 0 ? (
                            worker.timeSlots.map((slot) => (
                                <View key={slot.id} style={styles.slotCard}>
                                    <Icon name="clock-time-four-outline" size={20} color="#3182CE" />
                                    <Text style={styles.slotText}>{slot.startTime} - {slot.endTime}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyReviewBox}>
                                <Icon name="clock-alert-outline" size={36} color="#94A3B8" />
                                <Text style={styles.emptyText}>No active time slots defined for this worker.</Text>
                            </View>
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* ── HABITS TAB (RENDERED CONDITIONALLY) ── */}
                {worker.habits && worker.habits.length > 0 && (
                    <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>Habits</Text>
                        <Text style={styles.habitsSubtitle}>
                            Declared by the worker — worth knowing before they work in your home.
                        </Text>

                        <View style={styles.habitsGrid}>
                            {worker.habits.map((habit) => (
                                <View key={habit.id ?? habit.name} style={styles.habitChip}>
                                    <Icon name="check-circle-outline" size={15} color="#1E64D3" />
                                    <Text style={styles.habitChipText}>{habit.name}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>Looking for something specific?</Text>
                        <Text style={styles.habitsSubtitle}>
                            The filter on the search screen lets you show only workers who match the
                            habits you need — for example a non-smoker who is comfortable with pets.
                        </Text>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </ScrollView>

            {/* Bottom Sticky Action Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.callBtn,
                        (worker.hasActiveInterview || worker.availability === "NOT AVAILABLE") && styles.disabledBtn
                    ]}
                    disabled={worker.hasActiveInterview || worker.availability === "NOT AVAILABLE"}
                    onPress={handleCallForInterview}
                >
                    <Text style={styles.callBtnText}>
                        {['finalized', 'hired', 'accepted'].includes((worker.activeInterviewStatus || '').toString().toLowerCase())
                            ? 'Worker Hired'
                            : worker.availability === 'NOT AVAILABLE'
                                ? 'Worker Not Available'
                                : worker.hasActiveInterview
                                    ? 'Interview Request Pending'
                                    : 'Call For Interview'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Sub-components
const StatItem = ({ label, value, subText, flex = 1 }) => (
    <View style={[styles.statBox, { flex }]}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subText ? <Text style={styles.statSubText}>{subText}</Text> : null}
    </View>
);

const ExperienceItem = ({ title, period, bullets, isActive }) => (
    <View style={styles.expContainer}>
        <View style={styles.timelineCol}>
            <View style={[styles.dot, isActive && styles.activeDot]} />
            <View style={styles.line} />
        </View>
        <View style={styles.expContent}>
            <View style={styles.rowBetween}>
                <Text style={styles.expTitle}>{title}</Text>
                <Text style={styles.periodText}>{period}</Text>
            </View>
            {bullets.map((b, i) => (
                <Text key={i} style={styles.bulletText}>{b}</Text>
            ))}
        </View>
    </View>
);

const ReviewCard = ({ name, rating, date, text, workedPeriod, onNamePress }) => (
    <View style={styles.reviewCard}>
        <View style={styles.rowBetween}>
            <TouchableOpacity onPress={onNamePress}>
                <Text style={[styles.reviewName, { textDecorationLine: 'underline' }]}>{name}</Text>
            </TouchableOpacity>
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                    <Icon
                        key={i}
                        name={i <= rating ? "star" : "star-outline"}
                        size={14}
                        color={i <= rating ? "#FFD700" : "#CCC"}
                    />
                ))}
            </View>
        </View>
        <Text style={styles.reviewDuration}>{date}</Text>
        {workedPeriod ? (
            <View style={styles.reviewWorkedRow}>
                <Icon name="briefcase-outline" size={11} color="#1E64D3" />
                <Text style={styles.reviewWorkedText}>Worked: {workedPeriod}</Text>
            </View>
        ) : null}
        <Text style={styles.reviewText}>"{text}"</Text>
    </View>
);

const ProcedureStep = ({ step, text }) => (
    <View style={styles.procedureStepRow}>
        <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>{step}</Text></View>
        <Text style={styles.procedureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 8, alignSelf: 'flex-start', marginBottom: 8 },

    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 14 },
    profileInfo: { flex: 1 },
    nameText: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
    roleTitle: { fontSize: 14, color: '#1E64D3', fontWeight: '600', marginBottom: 4 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    genderTitle: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 4 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    statusBadgeUnavailable: { backgroundColor: '#FEE2E2' },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', marginRight: 4 },
    statusDotUnavailable: { backgroundColor: '#DC2626' },
    statusText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
    statusTextUnavailable: { color: '#B91C1C' },

    partTimeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEFCBF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 3
    },
    partTimeTagText: { fontSize: 10, fontWeight: '800', color: '#975A16' },

    statsContainer: {
        flexDirection: 'row',
        justify: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 16
    },
    statBox: {
        alignItems: 'center',
        justify: 'center',
        paddingHorizontal: 4
    },
    statLabel: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: '700',
        marginBottom: 4
    },
    statValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
        lineHeight: 15
    },
    statSubText: {
        fontSize: 10,
        fontWeight: '400',
        color: '#64748B',
        marginTop: 2
    },
    divider: {
        width: 1,
        height: '70%',
        backgroundColor: '#CBD5E1'
    },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTabButton: { borderBottomWidth: 2, borderBottomColor: '#1E64D3' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    activeTabText: { color: '#1E64D3', fontWeight: 'bold' },

    scrollContent: { padding: 16 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 12, marginBottom: 8 },
    aboutDescription: { fontSize: 13, color: '#475569', lineHeight: 20 },

    companyBadgeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 12, padding: 12, marginBottom: 8 },
    policeAlertButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 12 },
    badgeTextContainer: { flex: 1, marginLeft: 10 },
    companyBadgeTitle: { color: '#0369A1', fontSize: 13, fontWeight: '700' },
    companyBadgeSubtitle: { color: '#0284C7', fontSize: 11 },
    policeAlertTitle: { color: '#991B1B', fontSize: 13, fontWeight: '700' },
    policeAlertSubtitle: { color: '#B91C1C', fontSize: 11 },

    chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    skillChip: { backgroundColor: '#1E64D3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, marginBottom: 6 },
    skillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
    skillChipSecondary: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, marginBottom: 6 },
    skillTextSecondary: { fontSize: 11, fontWeight: '600', color: '#334155' },
    subCategoryLabel: { fontSize: 12, fontWeight: '700', color: '#1E64D3', marginBottom: 4 },
    emptyText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginVertical: 8 },

    expContainer: { flexDirection: 'row', marginBottom: 12 },
    timelineCol: { alignItems: 'center', marginRight: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
    activeDot: { backgroundColor: '#1E64D3' },
    line: { flex: 1, width: 2, backgroundColor: '#E2E8F0' },
    expContent: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expTitle: { fontWeight: '700', fontSize: 13, color: '#0F172A' },
    periodText: { fontSize: 10, color: '#64748B' },
    bulletText: { fontSize: 11, color: '#475569', marginTop: 4 },

    procedureCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    procedureStepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    stepNumberBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    stepNumberText: { fontSize: 10, fontWeight: '700', color: '#4338CA' },
    procedureText: { fontSize: 12, color: '#334155', flex: 1 },

    overallRatingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
    bigRatingText: { fontSize: 32, fontWeight: '800', color: '#0F172A' },
    starsRow: { flexDirection: 'row' },
    totalReviewsSubText: { fontSize: 11, color: '#64748B', marginTop: 2 },
    reviewCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    habitsSubtitle: { fontSize: 12.5, color: '#64748B', marginBottom: 14, lineHeight: 18 },
    habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    habitChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF4FF',
        borderWidth: 1,
        borderColor: '#D8E6FF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    habitChipText: { fontSize: 12.5, fontWeight: '700', color: '#1E293B', marginLeft: 6 },
    reviewName: { fontWeight: '700', fontSize: 12, color: '#0F172A' },
    reviewDuration: { fontSize: 10, color: '#94A3B8', marginVertical: 2 },
    reviewText: { fontSize: 12, color: '#334155', fontStyle: 'italic' },
    reviewWorkedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    reviewWorkedText: { fontSize: 10, color: '#1E64D3', fontWeight: '600', marginLeft: 4 },
    emptyReviewBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },

    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: '#BEE3F8'
    },
    slotText: { color: '#2B6CB0', fontWeight: '700', fontSize: 14 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    callBtn: { backgroundColor: '#1E64D3', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    disabledBtn: { backgroundColor: '#94A3B8' },
    callBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});

export default WorkerDetailScreen;