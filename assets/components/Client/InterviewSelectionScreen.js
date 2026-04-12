import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    SafeAreaView, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_BASE, API_DASHBOARD } from '../../config';

const InterviewSelectionScreen = ({ navigation, route }) => {
    const { workerId, workerName } = route.params;

    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [clientAddress, setClientAddress] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const addr = await AsyncStorage.getItem('userAddress');
            if (addr) setClientAddress(addr);
        };
        fetchUserData();
    }, []);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const showMode = (currentMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
    };

    const showTimepicker = () => {
        showMode('time');
    };

    const handleConfirmInterview = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            // Format date for C# backend to ensure local timezone preservation
            const offset = date.getTimezoneOffset() * 60000; 
            const localISOTime = (new Date(date - offset)).toISOString().slice(0, 19); // Keeps the 'T' separator

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/BookInterview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    WorkerId: workerId,
                    InterviewDate: localISOTime, // "YYYY-MM-DD HH:MM:SS"
                    Address: clientAddress,
                    Status: 'Pending'
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess(`Interview request sent to ${workerName}!`);
                navigation.navigate('UserDashboardScreen');
            } else {
                const err = await response.json();
                NotificationHelper.showError(err.message || "Failed to book interview.");
            }
        } catch (error) {
            console.error("Booking error:", error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Icon name="arrow-left" size={24} color="#555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Date & Time</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.subTitle}>When do you need to interview {workerName}?</Text>

                <View style={styles.pickerSection}>
                    <Text style={styles.sectionHeading}>Interview Date</Text>
                    <TouchableOpacity style={styles.selectorCard} onPress={showDatepicker} activeOpacity={0.8}>
                        <View style={styles.iconCircleBlue}>
                            <Icon name="calendar" size={24} color="#1E64D3" />
                        </View>
                        <View style={styles.selectorTextCol}>
                            <Text style={styles.selectorLabel}>Tap to choose date</Text>
                            <Text style={styles.selectorValue}>{date.toDateString()}</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>
                </View>

                <View style={styles.pickerSection}>
                    <Text style={styles.sectionHeading}>Interview Time</Text>
                    <TouchableOpacity style={styles.selectorCard} onPress={showTimepicker} activeOpacity={0.8}>
                        <View style={styles.iconCirclePurple}>
                            <Icon name="clock-outline" size={24} color="#6750A4" />
                        </View>
                        <View style={styles.selectorTextCol}>
                            <Text style={styles.selectorLabel}>Tap to choose time</Text>
                            <Text style={styles.selectorValue}>
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>
                </View>

                {show && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode={mode}
                        is24Hour={false}
                        display="default"
                        onChange={onChange}
                    />
                )}

                <View style={styles.pickerSection}>
                    <Text style={styles.sectionHeading}>Interview Location</Text>
                    <View style={styles.selectorCard}>
                        <View style={styles.iconCircleOrange}>
                            <Icon name="map-marker" size={24} color="#E65100" />
                        </View>
                        <View style={styles.selectorTextCol}>
                            <Text style={styles.selectorLabel}>Your Address</Text>
                            <Text style={styles.selectorValue} numberOfLines={2}>
                                {clientAddress || 'Loading address...'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmInterview}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    ); // Made with ❤️
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FBFF' },
    header: { padding: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    backCircle: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, elevation: 5, zIndex: 10 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#000' },
    
    scrollContent: { paddingHorizontal: 20 },
    subTitle: { fontSize: 16, color: '#555', marginBottom: 20 },
    
    pickerSection: { marginBottom: 25 },
    sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 10, marginLeft: 5 },
    
    selectorCard: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
        padding: 15, borderRadius: 15, elevation: 2, borderWidth: 1, borderColor: '#EEE'
    },
    iconCircleBlue: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconCirclePurple: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F3EDF7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconCircleOrange: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    
    selectorTextCol: { flex: 1 },
    selectorLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
    selectorValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F8FBFF' },
    confirmBtn: { backgroundColor: '#1E64D3', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    confirmBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default InterviewSelectionScreen;