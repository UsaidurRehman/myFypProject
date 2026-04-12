import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, ScrollView,
    TouchableOpacity, SafeAreaView, Switch, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';

const WorkerDashboardScreen = ({ navigation }) => {
    const [isDutyOn, setIsDutyOn] = useState(true);
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        fetchWorkerDetails();
    }, []);

    const fetchWorkerDetails = async () => {
        setIsLoading(true);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            if (!workerId || !token) {
                NotificationHelper.showError("Session not found. Please login again.");
                navigation.replace('Login');
                return;
            }

            const url = `${SERVER_BASE}/api/Dashboard/GetWorkerDetail/${workerId}`;
            console.log("Fetching Worker Dashboard from:", url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
            } else if (response.status === 401) {
                NotificationHelper.showError("Session expired. Please login again.");
                navigation.replace('Login');
            } else {
                let errorMessage = "Could not fetch dashboard data.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    if (text) errorMessage = text.substring(0, 100);
                }
                console.error("Dashboard Fetch Failed:", response.status, errorMessage);
                NotificationHelper.showError(`Error ${response.status}: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Dashboard Fetch Error (Network):", error);
            NotificationHelper.showError("Network error. Verify connection and API IP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.replace('Login');
    };

    const handleEditProfile = () => {
        navigation.navigate('Signup', {
            isEdit: true,
            initialData: worker
        });
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    if (!worker) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Afternoon,</Text>
                        <Text style={styles.workerName}>{worker.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.workerRole}>{worker.role}</Text>
                            <Text style={styles.ageBadge}> • {worker.age} Years Old</Text>
                        </View>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                                <Text style={styles.btnTextWhite}>Logout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
                                <Text style={styles.btnTextWhite}>Edit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Image
                        source={{
                            uri: worker.picture && worker.picture.startsWith('/')
                                ? `${SERVER_BASE}${worker.picture}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }}
                        style={styles.profileImage}
                    />
                </View>

                {/* Employment Actions */}
                <View style={styles.actionCard}>
                    <View style={styles.sectionHeader}>
                        <Icon name="account-alert-outline" size={24} color="#FF4D4D" />
                        <Text style={styles.sectionTitle}>Employment Actions</Text>
                    </View>
                    <Text style={styles.actionSubtext}>Manage your job status and termination requests</Text>
                    <TouchableOpacity style={styles.terminateBtn}>
                        <Icon name="close-circle-outline" size={24} color="#FF4D4D" />
                        <Text style={styles.terminateText}>Resign from Job</Text>
                    </TouchableOpacity>
                </View>

                {/* Duty Status */}
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text style={styles.cardTitle}>Duty Status</Text>
                            <Text style={styles.cardSubtext}>{isDutyOn ? "You are visible to customers" : "You are currently hidden"}</Text>
                        </View>
                        <Switch
                            value={isDutyOn}
                            onValueChange={setIsDutyOn}
                            trackColor={{ false: "#767577", true: "#4CAF50" }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* Notification Tabs (Dynamic Count) */}
                <NotificationTab
                    icon="email-outline"
                    title="Interview Requests"
                    subtitle={`Pending: ${worker.pendingRequestCount || 0}`}
                    count={worker.pendingRequestCount || "0"}
                    onPress={() => navigation.navigate('ActiveRequestsScreen')}
                />
                <NotificationTab
                    icon="bell-outline"
                    title="Job Notifications"
                    subtitle="Job Confirmations and Rejections"
                    count={worker.jobNotificationCount || "0"}
                    onPress={() => navigation.navigate('JobConfirmationScreen')}
                />

                <TouchableOpacity style={styles.checkStatusBtn}>
                    <Text style={styles.btnTextWhite}>Check Resignation Status</Text>
                </TouchableOpacity>

                {/* Profile Details */}
                <Text style={styles.mainHeading}>Profile Details</Text>
                <DetailRow label="Salary Expectation" value={`PKR ${worker.salary || "N/A"}`} />
                <DetailRow label="Gender" value={worker.gender?.toUpperCase() || "N/A"} />
                <DetailRow label="City" value={worker.location || "N/A"} />

                {/* Experience Timeline */}
                <Text style={styles.mainHeading}>Experience History</Text>
                {worker.experiences && worker.experiences.length > 0 ? (
                    worker.experiences.map((exp, index) => (
                        <ExperienceItem
                            key={index}
                            title={exp.title}
                            bullets={[exp.details]}
                            period={exp.period}
                            isActive={index === 0}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>No experiences recorded.</Text>
                )}

                {/* Skills Section */}
                <Text style={styles.mainHeading}>My Specialized Skills</Text>
                <View style={styles.skillsContainer}>
                    {worker.primarySkills && worker.primarySkills.length > 0 ? (
                        worker.primarySkills.map(skill => (
                            <View key={skill} style={styles.skillBadge}>
                                <Text style={styles.skillText}>{skill.toUpperCase()}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No specialized skills listed.</Text>
                    )}
                    <TouchableOpacity style={styles.addSkillBtn}>
                        <Text style={styles.addSkillText}>+ Edit Skills</Text>
                    </TouchableOpacity>
                </View>

                {/* Reviews Section */}
                <Text style={styles.mainHeading}>Recent Client Reviews</Text>
                <View style={styles.reviewsRow}>
                    <View style={styles.ratingBox}>
                        <Icon name="star" size={24} color="#FFD700" />
                        <Text style={styles.ratingText}>{worker.rating || "0.0"}</Text>
                    </View>
                    <TouchableOpacity style={styles.viewReviewsBtn}>
                        <Text style={styles.btnTextWhite}>View {worker.reviewCount || 0} Reviews</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

// Internal Components
const NotificationTab = ({ icon, title, subtitle, count, onPress }) => (
    <TouchableOpacity style={styles.notifTab} onPress={onPress}>
        <View style={styles.notifIconBg}>
            <Icon name={icon} size={24} color="#333" />
        </View>
        <View style={styles.notifTextContent}>
            <Text style={styles.notifTitle}>{title}</Text>
            <Text style={styles.notifSub}>{subtitle}</Text>
        </View>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
        </View>
    </TouchableOpacity>
);

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const ExperienceItem = ({ title, bullets, period, isActive }) => (
    <View style={styles.expItem}>
        <View style={styles.timeline}>
            <View style={[styles.dot, isActive && styles.activeDot]} />
            <View style={styles.line} />
        </View>
        <View style={styles.expContent}>
            <Text style={styles.expTitle}>{title}</Text>
            {bullets.map((b, i) => (
                <Text key={i} style={styles.expBullet}>• {b}</Text>
            ))}
            <Text style={styles.expPeriod}>{period}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scrollContent: { padding: 20 },

    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    greeting: { fontSize: 14, color: '#888' },
    workerName: { fontSize: 22, fontWeight: 'bold' },
    workerRole: { fontSize: 28, color: '#1E64D3', fontWeight: 'bold' },
    ageBadge: { fontSize: 16, color: '#444', fontWeight: '600' },
    headerButtons: { flexDirection: 'row', marginTop: 10, gap: 10 },
    logoutBtn: { backgroundColor: '#1E64D3', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    editBtn: { backgroundColor: '#1E64D3', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    profileImage: { width: 80, height: 80, borderRadius: 40 },

    actionCard: { backgroundColor: '#E0E0E0', borderRadius: 15, padding: 15, marginBottom: 15 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    actionSubtext: { fontSize: 14, color: '#555', marginBottom: 15 },
    terminateBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 45, borderRadius: 25, borderWidth: 1, borderColor: '#FF4D4D' },
    terminateText: { color: '#FF4D4D', fontWeight: 'bold', marginLeft: 10 },

    statusCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3, shadowOpacity: 0.1 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardSubtext: { fontSize: 12, color: '#888' },

    notifTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#DDD' },
    notifIconBg: { backgroundColor: '#F0F0F0', padding: 8, borderRadius: 10 },
    notifTextContent: { flex: 1, marginLeft: 15 },
    notifTitle: { fontWeight: 'bold', fontSize: 16 },
    notifSub: { fontSize: 11, color: '#888' },
    badge: { backgroundColor: '#D32F2F', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

    checkStatusBtn: { backgroundColor: '#FF0000', height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },

    mainHeading: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    detailLabel: { color: '#555' },
    detailValue: { fontWeight: 'bold' },

    expItem: { flexDirection: 'row', minHeight: 100 },
    timeline: { alignItems: 'center', marginRight: 15 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCC' },
    activeDot: { backgroundColor: '#2196F3' },
    line: { flex: 1, width: 2, backgroundColor: '#EEE' },
    expContent: { flex: 1, paddingBottom: 20 },
    expTitle: { fontWeight: 'bold', fontSize: 15 },
    expBullet: { fontSize: 13, color: '#777', fontStyle: 'italic', marginTop: 3 },
    expPeriod: { fontSize: 11, color: '#999', marginTop: 5, alignSelf: 'flex-end' },

    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    skillBadge: { backgroundColor: '#DDD', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    skillText: { fontWeight: 'bold', fontSize: 14 },
    addSkillBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#1E64D3' },
    addSkillText: { color: '#1E64D3', fontWeight: 'bold' },

    reviewsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 10, borderRadius: 20 },
    ratingText: { fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
    viewReviewsBtn: { backgroundColor: '#1E64D3', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    emptyText: { color: '#999', fontStyle: 'italic', marginTop: 5, fontSize: 13 }
});

export default WorkerDashboardScreen;