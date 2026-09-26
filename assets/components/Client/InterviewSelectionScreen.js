import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    SafeAreaView, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import { jobTypeLabel } from '../helpers/JobTypeBadge';

const toDateKey = (value) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const InterviewSelectionScreen = ({ navigation, route }) => {
    const { workerId, workerName } = route.params || {};

    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [clientAddress, setClientAddress] = useState('');

    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [hasSlots, setHasSlots] = useState(true);
    const [isPartTime, setIsPartTime] = useState(false);
    const [radius, setRadius] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const submittingRef = useRef(false);
    const readyRef = useRef(false);

    const dateKey = toDateKey(date);

    useEffect(() => {
        const fetchUserData = async () => {
            const addr = await AsyncStorage.getItem('userAddress');
            if (addr) setClientAddress(addr);
        };
        fetchUserData();
    }, []);

    // A booking must never be created by a stray touch. Two things are handled here:
    //   1. no workerId  -> nothing to book
    //   2. the Confirm button lives in the same bottom strip as the button that opened
    //      this screen, so a fall-through/double tap can reach it before the user has
    //      read anything. The button therefore stays inert for 500 ms after mount
    //      (and even then, a Part-Time booking still requires picking a slot first).
    useEffect(() => {
        if (!workerId) {
            NotificationHelper.showError('Worker information is missing. Please open the worker again.');
            navigation.goBack();
            return;
        }

        const timer = setTimeout(() => {
            readyRef.current = true;
            setIsReady(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [workerId, navigation]);

    const fetchSlots = useCallback(async () => {
        try {
            setSlotsLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(
                `${SERVER_BASE}/api/Dashboard/GetWorkerAvailableSlots/${workerId}?date=${dateKey}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setSlots(Array.isArray(data.slots) ? data.slots : []);
                setHasSlots(!!data.hasSlots);
                setIsPartTime(!!data.isPartTimeAvailable);
                setRadius(data.radius ?? null);
                setDistanceKm(data.distanceKm ?? null);
            } else {
                setSlots([]);
            }
        } catch (error) {
            console.error('Slot fetch error:', error);
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    }, [workerId, dateKey]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    useEffect(() => {
        setSelectedSlotId(null);
    }, [dateKey]);

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

    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
    const bookingBlockedBySlots = isPartTime && !slotsLoading && (!hasSlots || slots.length === 0);
    const needsSlot = isPartTime && !bookingBlockedBySlots;
    const canConfirm = isReady && !isLoading && !slotsLoading && !bookingBlockedBySlots && (!needsSlot || !!selectedSlot);

    const handleConfirmInterview = async () => {
        // ignore the very first moments and every repeat tap while a request is in flight
        if (!readyRef.current || submittingRef.current) return;

        if (bookingBlockedBySlots) {
            NotificationHelper.showError('This worker has not published any time slots yet.');
            return;
        }

        if (needsSlot && !selectedSlot) {
            NotificationHelper.showError('Please pick one of the worker\'s time slots.');
            return;
        }

        submittingRef.current = true;
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date - offset)).toISOString().slice(0, 19);

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/BookInterview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    WorkerId: workerId,
                    InterviewDate: localISOTime,
                    Address: clientAddress,
                    Status: 'Pending',
                    SlotId: isPartTime && selectedSlot ? selectedSlot.id : null
                })
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                const typeLabel = data.jobType ? jobTypeLabel(data.jobType) : '';
                const slotLabel = isPartTime && selectedSlot
                    ? ` (${selectedSlot.startTime} - ${selectedSlot.endTime})`
                    : '';
                NotificationHelper.showSuccess(
                    `${typeLabel} interview request sent to ${workerName}${slotLabel}!`
                );
                navigation.replace('UserDashboardScreen');
            } else {
                const err = await response.json().catch(() => ({}));
                NotificationHelper.showError(err.message || 'Failed to book interview.');
            }
        } catch (error) {
            console.error('Booking error:', error);
            NotificationHelper.showError('Could not connect to server.');
        } finally {
            submittingRef.current = false;
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

                {isPartTime && (
                    <View style={styles.typeBanner}>
                        <View style={styles.typeBannerTop}>
                            <Icon name="map-marker-radius" size={16} color="#B45309" />
                            <Text style={styles.typeBannerText}>PART-TIME BOOKING</Text>
                            {distanceKm !== null && (
                                <Text style={styles.typeBannerHint}>{distanceKm} km away</Text>
                            )}
                        </View>
                        <Text style={styles.typeBannerBody}>
                            You are inside this worker's {radius ?? 5} km radius.
                            {hasSlots
                                ? ' Pick the time window you need the worker for from the list below.'
                                : ' This worker has not published time slots yet.'}
                        </Text>
                    </View>
                )}

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

                {isPartTime && (
                    <View style={styles.pickerSection}>
                        <Text style={styles.sectionHeading}>Worker's Time Slots</Text>
                        <Text style={styles.sectionHint}>
                            Choose the window you need {workerName} for on {date.toDateString()}.
                        </Text>

                        {slotsLoading ? (
                            <ActivityIndicator size="small" color="#1E64D3" style={styles.slotsLoader} />
                        ) : bookingBlockedBySlots ? (
                            <View style={styles.slotsEmptyBox}>
                                <Icon name="calendar-remove-outline" size={30} color="#B45309" />
                                <Text style={styles.slotsEmptyText}>
                                    This worker has not published any time slots yet, so a part-time
                                    booking cannot be created. Please try another worker or check back later.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.slotsWrap}>
                                {slots.map((slot) => {
                                    const isSelected = slot.id === selectedSlotId;
                                    return (
                                        <TouchableOpacity
                                            key={slot.id}
                                            disabled={slot.isTaken}
                                            onPress={() => setSelectedSlotId(slot.id)}
                                            style={[
                                                styles.slotChip,
                                                isSelected && styles.slotChipActive,
                                                slot.isTaken && styles.slotChipTaken
                                            ]}
                                        >
                                            <Text style={[
                                                styles.slotChipText,
                                                isSelected && styles.slotChipTextActive,
                                                slot.isTaken && styles.slotChipTextTaken
                                            ]}>
                                                {slot.startTime} - {slot.endTime}
                                            </Text>
                                            {slot.isTaken && <Text style={styles.slotTakenText}>Booked</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
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

                <View style={styles.spacer} />
            </ScrollView>

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
                    onPress={handleConfirmInterview}
                    disabled={!canConfirm}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.confirmBtnText}>
                            {bookingBlockedBySlots
                                ? 'No Slots Available'
                                : needsSlot && !selectedSlot
                                    ? 'Pick A Time Slot'
                                    : 'Confirm Booking'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FBFF' },
    header: { padding: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    backCircle: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, elevation: 5, zIndex: 10 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#000' },

    scrollContent: { paddingHorizontal: 20 },
    subTitle: { fontSize: 16, color: '#555', marginBottom: 20 },

    typeBanner: {
        backgroundColor: '#FFF4E5',
        borderWidth: 1,
        borderColor: '#FCD9A4',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 20,
    },
    typeBannerTop: { flexDirection: 'row', alignItems: 'center' },
    typeBannerText: { fontSize: 12, fontWeight: '800', color: '#B45309', marginLeft: 6 },
    typeBannerHint: { fontSize: 11, fontWeight: '700', color: '#B45309', marginLeft: 'auto' },
    typeBannerBody: { fontSize: 12, color: '#7C4A03', marginTop: 6, lineHeight: 17 },

    pickerSection: { marginBottom: 25 },
    sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 10, marginLeft: 5 },
    sectionHint: { fontSize: 12, color: '#777', marginBottom: 10, marginLeft: 5 },

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

    slotsLoader: { marginTop: 10 },
    slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChip: {
        minWidth: 110,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#D8E6FF',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
    },
    slotChipActive: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    slotChipTaken: { backgroundColor: '#F2F2F7', borderColor: '#E5E5EA', elevation: 0 },
    slotChipText: { fontSize: 13, fontWeight: '700', color: '#1E64D3' },
    slotChipTextActive: { color: '#FFF' },
    slotChipTextTaken: { color: '#A1A1AA', textDecorationLine: 'line-through' },
    slotTakenText: { fontSize: 10, fontWeight: '700', color: '#A1A1AA', marginTop: 2 },

    slotsEmptyBox: {
        backgroundColor: '#FFF4E5',
        borderWidth: 1,
        borderColor: '#FCD9A4',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    slotsEmptyText: { fontSize: 12, color: '#7C4A03', textAlign: 'center', marginTop: 8, lineHeight: 17 },

    spacer: { height: 120 },
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F8FBFF' },
    confirmBtn: { backgroundColor: '#1E64D3', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    confirmBtnDisabled: { backgroundColor: '#B9CCEA', elevation: 0 },
    confirmBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default InterviewSelectionScreen;
