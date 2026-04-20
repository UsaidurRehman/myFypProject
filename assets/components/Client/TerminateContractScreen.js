import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity,
    TextInput, SafeAreaView, ScrollView, StatusBar,
    ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

const TerminateContractScreen = ({ navigation, route }) => {
    const { workerId, interviewId } = route.params;

    const [reason, setReason] = useState('');
    const [remarks, setRemarks] = useState('');
    const [rating, setRating] = useState(0);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchWorkerDetails();
    }, []);

    const fetchWorkerDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerDetail/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
            } else {
                NotificationHelper.showError("Failed to load worker details");
            }
        } catch (error) {
            console.error("Error fetching worker:", error);
            NotificationHelper.showError("Network error loading worker");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTerminate = async () => {
        if (!reason.trim()) {
            NotificationHelper.showError("Please enter a termination reason");
            return;
        }
        if (rating === 0) {
            NotificationHelper.showError("Please provide a rating for the worker");
            return;
        }
        if (!isConfirmed) {
            NotificationHelper.showError("Please confirm termination by checking the box");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = {
                InterviewId: interviewId,
                Reason: reason,
                Remarks: remarks,
                Rating: rating
            };

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/TerminateContract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Contract terminated successfully");
                navigation.navigate('UserDashboardScreen', { refresh: true });
            } else {
                const errorData = await response.json();
                NotificationHelper.showError(errorData.message || "Termination failed");
            }
        } catch (error) {
            console.error("Termination error:", error);
            NotificationHelper.showError("Network error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    if (!worker) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.bgDecoration} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Terminate Contract</Text>
                    <Image source={{ uri: 'https://servantmaidonline.com/logo.png' }} style={styles.logo} />
                </View>

                <View style={styles.profileCard}>
                    <Image
                        source={{ 
                            uri: worker.picture 
                                ? `${SERVER_BASE}${worker.picture}` 
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.nameCol}>
                        <Text style={styles.workerName}>{worker.name}</Text>
                        <Text style={styles.workerRole}>{worker.categoryName || 'Hired Worker'}</Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Termination Reason</Text>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Why are you ending this contract?"
                        placeholderTextColor="#999"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                    />
                </View>

                <View style={styles.remarksCard}>
                    <Text style={[styles.label, { marginBottom: 15 }]}>Rate their service</Text>
                    <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Icon
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={36}
                                    color={star <= rating ? "#FFD700" : "#CCC"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput
                        style={[styles.inputField, { height: 80, marginTop: 15 }]}
                        placeholder="Add additional remarks/feedback"
                        placeholderTextColor="#999"
                        value={remarks}
                        onChangeText={setRemarks}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setIsConfirmed(!isConfirmed)}
                    activeOpacity={0.8}
                >
                    <Icon
                        name={isConfirmed ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={26}
                        color={isConfirmed ? "#1E64D3" : "#666"}
                    />
                    <Text style={styles.checkboxLabel}>
                        I confirm that I want to terminate this contract and have cleared all dues as per the agreement.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.terminateBtn, (!isConfirmed || isSubmitting) && styles.disabledBtn]} 
                    onPress={handleTerminate}
                    disabled={!isConfirmed || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.terminateBtnText}>Confirm Termination</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bgDecoration: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    scrollContent: { padding: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        position: 'relative'
    },
    backBtn: {
        position: 'absolute',
        left: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    logo: { width: 40, height: 40, position: 'absolute', right: 0 },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#1E64D3' },
    nameCol: { marginLeft: 15 },
    workerName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    workerRole: { fontSize: 16, color: '#666', marginTop: 2 },

    inputGroup: { marginBottom: 25 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    inputField: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#F9F9F9',
        textAlignVertical: 'top',
        marginTop: 10
    },

    remarksCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 30,
        elevation: 2,
    },
    starRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },

    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 35, paddingHorizontal: 5 },
    checkboxLabel: { fontSize: 13, color: '#555', marginLeft: 12, flex: 1, lineHeight: 18 },

    terminateBtn: {
        backgroundColor: '#E63917',
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#E63917',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledBtn: { backgroundColor: '#FFA4A4' },
    terminateBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    cancelBtn: { marginTop: 20, paddingVertical: 10, alignItems: 'center' },
    cancelText: { fontSize: 16, fontWeight: '600', color: '#666' }
});

export default TerminateContractScreen;