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
    const { resignationId } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [rating, setRating] = useState(3);
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isConfirmed = data?.isConfirmed;

    useEffect(() => {
        fetchResignationDetail();
    }, []);

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
                NotificationHelper.showSuccess("Resignation successfully confirmed.");
                navigation.navigate('UserDashboardScreen');
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

    const renderStars = () => {
        return (
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    isConfirmed ? (
                        <Icon
                            key={star}
                            name={star <= rating ? "star" : "star-outline"}
                            size={20}
                            color={star <= rating ? "#FFD700" : "#666"}
                        />
                    ) : (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Icon
                                name={star <= rating ? "star" : "star-outline"}
                                size={20}
                                color={star <= rating ? "#FFD700" : "#666"}
                            />
                        </TouchableOpacity>
                    )
                ))}
            </View>
        );
    };

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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Icon name="arrow-left" size={20} color="#666" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Resignation</Text>
                <Image source={{ uri: 'https://servantmaidonline.com/logo.png' }} style={styles.logo} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Header */}
                <View style={styles.profileRow}>
                    <Image
                        source={{
                            uri: data.workerAvatar && data.workerAvatar.startsWith('/')
                                ? `${SERVER_BASE}${data.workerAvatar}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileText}>
                        <Text style={styles.workerName}>{data.workerName}</Text>
                        <Text style={styles.workerRole}>{data.workerRole}</Text>
                    </View>
                </View>

                {/* Notice Period Card */}
                <View style={styles.noticeCard}>
                    <View style={styles.noticeBlueHeader}>
                        <Text style={styles.noticeHeaderTitle}>Official Notice Period</Text>
                        <Text style={styles.noticeHeaderDays}>{data.totalNoticeDays} Days Total</Text>
                    </View>
                    <View style={styles.noticeBody}>
                        <Text style={styles.noticeStatusLabel}>Notice Period Status</Text>
                        <Text style={styles.remainingText}>Remaining Days: <Text style={styles.boldBlue}>{data.remainingDays}</Text></Text>

                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${data.progress * 100}%` }]} />
                        </View>
                    </View>
                </View>

                {/* Last Working Day Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Last Working Day</Text>
                    <View style={styles.readonlyBox}>
                        <Text style={styles.readonlyText}>{data.lastWorkingDate}</Text>
                    </View>
                </View>

                {/* Reason Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reason for Leaving</Text>
                    <View style={styles.reasonBox}>
                        <Text style={styles.readonlyText}>{data.reason}</Text>
                    </View>
                </View>

                {/* Remarks & Rating Section */}
                <View style={styles.remarksCard}>
                    <View style={styles.remarksHeader}>
                        {renderStars()}
                    </View>
                    <View style={styles.remarksInputContainer}>
                        {isConfirmed ? (
                            <Text style={styles.confirmedText}>
                                This resignation has already been confirmed and is now readonly.
                            </Text>
                        ) : (
                            <TextInput
                                style={styles.remarksInput}
                                placeholder="Enter your remarks here"
                                placeholderTextColor="#999"
                                value={remarks}
                                onChangeText={setRemarks}
                                editable={!isConfirmed}
                            />
                        )}
                    </View>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        isConfirmed && styles.confirmBtnDisabled,
                        isSubmitting && { opacity: 0.7 }
                    ]}
                    onPress={handleConfirmResignation}
                    disabled={isSubmitting || isConfirmed}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.confirmBtnText}>
                            {isConfirmed ? 'Resignation Confirmed' : 'Confirm Resignation'}
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15
    },
    backCircle: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'center', marginLeft: -20 },
    logo: { width: 40, height: 40 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEE' },
    profileText: { marginLeft: 15 },
    workerName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    workerRole: { fontSize: 18, fontWeight: 'bold', color: '#5B4CF2' },

    noticeCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#DDD',
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 2
    },
    noticeBlueHeader: { backgroundColor: '#6289F4', padding: 15 },
    noticeHeaderTitle: { color: '#FFF', fontSize: 18, fontWeight: '500' },
    noticeHeaderDays: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    noticeBody: { padding: 15 },
    noticeStatusLabel: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    remainingText: { fontSize: 16, color: '#666', marginTop: 5 },
    boldBlue: { color: '#5B4CF2', fontWeight: 'bold' },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#EEE',
        borderRadius: 3,
        marginTop: 15,
        overflow: 'hidden',
        width: '100%'
    },
    progressBarFill: { height: '100%', backgroundColor: '#6289F4' },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 10 },
    readonlyBox: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#FFF'
    },
    reasonBox: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#FFF',
        minHeight: 100
    },
    readonlyText: { fontSize: 16, color: '#666' },

    remarksCard: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 15,
        padding: 10,
        marginBottom: 30
    },
    remarksHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
    starRow: { flexDirection: 'row' },
    remarksInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 45
    },
    remarksInput: { flex: 1, fontSize: 14, color: '#000' },
    submitSmallBtn: {
        backgroundColor: '#1E64D3',
        paddingHorizontal: 20,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        elevation: 3
    },
    submitBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

    confirmBtn: {
        backgroundColor: '#008000',
        height: 55,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5
    },
    confirmBtnDisabled: {
        backgroundColor: '#B0BEC5'
    },
    confirmBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    confirmedText: { fontSize: 15, color: '#2E7D32', lineHeight: 22, marginLeft: 10 }
});

export default ResignationScreen;
