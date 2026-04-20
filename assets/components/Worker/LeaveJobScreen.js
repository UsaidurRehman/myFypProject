import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity, 
    TextInput, SafeAreaView, ScrollView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

import DateTimePicker from '@react-native-community/datetimepicker';

const LeaveJobScreen = ({ navigation }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [jobData, setJobData] = useState(null);
    const [lastWorkingDay, setLastWorkingDay] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchActiveJob();
    }, []);

    const fetchActiveJob = async () => {
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');
            
            if (!workerId) {
                NotificationHelper.showError("Worker identity not found. Please re-login.");
                navigation.goBack();
                return;
            }

            const response = await fetch(`${API_DASHBOARD}/GetActiveJob/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setJobData(data);
            } else {
                const errData = await response.json().catch(() => ({}));
                NotificationHelper.showError(errData.message || "No active job found to resign from.");
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Connection error. Check API configuration.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResign = async () => {
        if (!reason.trim()) {
            NotificationHelper.showError("Please provide a reason for resignation.");
            return;
        }

        if (!jobData || !jobData.interviewId) {
            NotificationHelper.showError("Process error: Job data missing.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            
            const payload = {
                InterviewId: jobData.interviewId,
                ResignationReason: reason,
                LastWorkingDate: lastWorkingDay.toISOString().split('T', 1)[0]
            };

            console.log("Submitting Resignation:", payload);

            const response = await fetch(`${API_DASHBOARD}/SubmitResignation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Resignation submitted successfully.");
                navigation.navigate('WorkerDashboardScreen');
            } else {
                let errorMsg = "Failed to submit resignation.";
                try {
                    const err = await response.json();
                    errorMsg = err.message || errorMsg;
                    if (err.errors) {
                        console.log("Validation Errors:", err.errors);
                    }
                } catch (e) {
                    const txt = await response.text();
                    console.log("Server Error Response:", txt);
                }
                NotificationHelper.showError(errorMsg);
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network error. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.bgDecoration} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Resign from Job</Text>
                    <Image source={{ uri: 'https://servantmaidonline.com/logo.png' }} style={styles.logo} />
                </View>

                {jobData && (
                    <View style={styles.jobCard}>
                        <View style={styles.jobInfo}>
                            <Text style={styles.employerName}>{jobData.employerName}</Text>
                            <Text style={styles.employerAddress}>{jobData.employerAddress}</Text>
                        </View>
                        <View style={styles.noticeBadge}>
                            <Text style={styles.noticeText}>Standard 1-Week Notice</Text>
                        </View>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Proposed Last Working Day</Text>
                    <TouchableOpacity 
                        style={styles.dateDisplay} 
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dateText}>{lastWorkingDay.toLocaleDateString('en-US', { 
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                        })}</Text>
                        <Icon name="calendar-clock" size={24} color="#1E64D3" />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={lastWorkingDay}
                        mode="date"
                        display="default"
                        minimumDate={new Date()} // Cannot resign in the past
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setLastWorkingDay(selectedDate);
                        }}
                    />
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reason for Leaving</Text>
                    <TextInput
                        style={styles.reasonInput}
                        placeholder="Please explain why you are leaving..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        value={reason}
                        onChangeText={setReason}
                    />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleResign}>
                    <Text style={styles.submitBtnText}>Submit Resignation Notice</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Keep Current Job</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    scrollContent: { padding: 25 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    backBtn: { padding: 5 },
    logo: { width: 40, height: 40 },

    jobCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    employerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    employerAddress: { fontSize: 14, color: '#666', marginTop: 4 },
    noticeBadge: { 
        backgroundColor: '#E3F2FD', 
        alignSelf: 'flex-start', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 8,
        marginTop: 15
    },
    noticeText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },

    inputGroup: { marginBottom: 25 },
    inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
    dateDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        backgroundColor: '#F9F9F9'
    },
    dateText: { fontSize: 16, color: '#333' },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        padding: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        backgroundColor: '#F9F9F9'
    },

    submitBtn: {
        backgroundColor: '#E91E63',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 2
    },
    submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    cancelBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
    cancelBtnText: { color: '#666', fontSize: 16, fontWeight: '500' }
});

export default LeaveJobScreen;