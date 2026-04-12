import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, ScrollView,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';

const API_BASE = API_DASHBOARD;

const WorkerDetailScreen = ({ navigation, route }) => {
    const { workerId } = route.params;
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWorkerDetails();
    }, [workerId]);

    const fetchWorkerDetails = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetWorkerDetail/${workerId}`, {
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
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    if (!worker) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" transparent />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Image Section */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: worker.picture && worker.picture.startsWith('/')
                                ? `${SERVER_BASE}${worker.picture}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }}
                        style={styles.profileImg}
                    />
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, worker.availability !== "Available 24/7" && { backgroundColor: '#FF5722' }]} />
                        <Text style={[styles.statusText, worker.availability !== "Available 24/7" && { color: '#FF5722' }]}>
                            {worker.availability === "Available 24/7" ? "ACTIVE" : "BOOKED"}
                        </Text>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.contentBody}>
                    {/* Name and Rating */}
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.nameText}>{worker.name}</Text>
                            <View style={styles.roleRow}>
                                <Text style={styles.roleTitle}>{worker.role}</Text>
                                <Text style={styles.genderTitle}>{worker.gender.toUpperCase()} • {worker.age} Y/O</Text>
                            </View>
                        </View>
                        <View style={styles.ratingBox}>
                            <View style={styles.starRow}>
                                <Icon name="star" size={20} color="#FFD700" />
                                <Text style={styles.ratingScore}>{worker.rating}</Text>
                            </View>
                            <Text style={styles.reviewCount}>({worker.reviewCount} Reviews)</Text>
                        </View>
                    </View>

                    {/* Statistics Row */}
                    <View style={styles.statsContainer}>
                        <StatItem label="EXPERIENCE" value={worker.experiences.length > 0 ? worker.experiences[0].period : "N/A"} />
                        <View style={styles.divider} />
                        <StatItem label="LOCATION" value={worker.location.toUpperCase()} />
                        <View style={styles.divider} />
                        <StatItem label="SALARY" value={`Rs.${worker.salary}`} />
                    </View>

                    {/* About Section */}
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.aboutDescription}>
                        {worker.bio}
                    </Text>

                    {/* Skills Section (Primary) */}
                    <Text style={styles.sectionTitle}>Skills</Text>
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

                    {/* Part-Time Section (Secondary) */}
                    <Text style={styles.sectionTitle}>Part-Time</Text>
                    {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
                        worker.partTimeSkills.map((item, index) => (
                            <View key={index} style={{ marginBottom: 15 }}>
                                <Text style={styles.subCategoryLabel}>{item.categoryName.toUpperCase()}</Text>
                                <View style={styles.chipWrapper}>
                                    {item.skills.map((skill, sIndex) => (
                                        <View key={sIndex} style={styles.skillChip}>
                                            <Text style={styles.skillText}>{skill.toUpperCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Not Available yet any</Text>
                    )}

                    {/* Work Experience Timeline */}
                    <Text style={styles.sectionTitle}>Work Experience</Text>
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

                    {/* Reviews Section */}
                    <View style={styles.reviewHeader}>
                        <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        <TouchableOpacity><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
                    </View>

                    {worker.reviews && worker.reviews.length > 0 ? (
                        worker.reviews.map((rev, index) => (
                            <ReviewCard
                                key={index}
                                name={rev.reviewerName}
                                rating={rev.rating}
                                text={rev.comment}
                                date={rev.date}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No reviews yet.</Text>
                    )}

                    {/* Booking Procedure (Static) */}
                    <Text style={styles.sectionTitle}>Booking Procedure</Text>
                    <View style={styles.procedureList}>
                        <ProcedureStep text="Send a booking request with your preferred date." />
                        <ProcedureStep text="Wait for the worker to accept (usually within 30m)." />
                        <ProcedureStep text="Confirm the location and start the service." />
                    </View>

                    {/* Padding for bottom button */}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Sticky Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.callBtn, worker.hasActiveInterview && { backgroundColor: '#B0BEC5' }]}
                    disabled={worker.hasActiveInterview}
                    onPress={() => navigation.navigate('InterviewSelectionScreen', {
                        workerId: worker.id,
                        workerName: worker.name
                    })}
                >
                    <Text style={styles.callBtnText}>
                        {worker.activeInterviewStatus === "Finalized" || worker.activeInterviewStatus === "Hired" 
                            ? "Worker Hired" 
                            : worker.hasActiveInterview 
                                ? "Interview Request Pending" 
                                : "Call For Interview"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Sub-components for cleaner code
const StatItem = ({ label, value }) => (
    <View style={styles.statBox}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
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
                <Text key={i} style={styles.bulletText}>• {b}</Text>
            ))}
        </View>
    </View>
);

const ReviewCard = ({ name, duration, text }) => (
    <View style={styles.reviewCard}>
        <View style={styles.rowBetween}>
            <Text style={styles.reviewName}>{name}</Text>
            <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={14} color="#FFD700" />)}
            </View>
        </View>
        <Text style={styles.reviewDuration}>{duration}</Text>
        <Text style={styles.reviewText}>"{text}"</Text>
    </View>
);

const ProcedureStep = ({ text }) => (
    <Text style={styles.procedureText}>• {text}</Text>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    imageContainer: { position: 'relative', width: '100%', height: 400, zIndex: 1 },
    profileImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    backButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20, zIndex: 10, elevation: 5 },
    statusBadge: { position: 'absolute', bottom: 15, left: 15, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWeight: 1, borderColor: '#EEE' },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
    statusText: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },

    contentBody: { paddingHorizontal: 20, marginTop: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    nameText: { fontSize: 26, fontWeight: 'bold', color: '#000' },
    roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    roleTitle: { fontSize: 18, color: '#1E64D3', fontWeight: 'bold', marginRight: 15 },
    genderTitle: { fontSize: 18, color: '#4CAF50', fontWeight: 'bold' },
    availableText: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold', marginTop: 4 },
    ratingBox: { alignItems: 'flex-end' },
    starRow: { flexDirection: 'row', alignItems: 'center' },
    ratingScore: { fontSize: 22, fontWeight: 'bold', marginLeft: 5 },
    reviewCount: { fontSize: 12, color: '#999' },

    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginVertical: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 10, color: '#999', marginBottom: 5 },
    statValue: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    divider: { width: 1, height: '100%', backgroundColor: '#EEE' },

    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginTop: 15, marginBottom: 10 },
    aboutDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 10 },

    chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    skillChip: { backgroundColor: '#E0E0E0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
    skillText: { fontSize: 12, fontWeight: '900', color: '#333' },

    subCategoryLabel: { fontSize: 14, fontWeight: 'bold', color: '#1E64D3', marginBottom: 8, marginTop: 5 },
    emptyText: { fontSize: 13, color: '#999', marginBottom: 10, fontStyle: 'italic' },

    expContainer: { flexDirection: 'row', minHeight: 80 },
    timelineCol: { alignItems: 'center', marginRight: 10 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#DDD' },
    activeDot: { backgroundColor: '#1E64D3' },
    line: { flex: 1, width: 2, backgroundColor: '#EEE' },
    expContent: { flex: 1, paddingBottom: 20 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
    expTitle: { fontWeight: 'bold', fontSize: 14 },
    periodText: { fontSize: 10, color: '#999' },
    bulletText: { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4 },

    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    viewAllText: { color: '#1E64D3', fontWeight: 'bold' },
    reviewCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
    reviewName: { fontWeight: 'bold', fontSize: 14 },
    stars: { flexDirection: 'row' },
    reviewDuration: { fontSize: 12, color: '#666', marginVertical: 5 },
    reviewText: { fontSize: 13, color: '#444', fontStyle: 'italic' },

    procedureList: { paddingLeft: 10 },
    procedureText: { fontSize: 13, color: '#666', marginBottom: 8 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(255,255,255,0.9)' },
    callBtn: { backgroundColor: '#1E64D3', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', elevation: 5 },
    callBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default WorkerDetailScreen;