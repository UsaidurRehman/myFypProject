
import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet, View, Text, Image, ScrollView,
    TouchableOpacity, SafeAreaView, Switch, ActivityIndicator, Alert, Modal, TextInput, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DASHBOARD } from '../../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WorkerDashboardScreen = ({ navigation }) => {
    const [isDutyOn, setIsDutyOn] = useState(true);
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Tabs: 'Overview', 'Time Slots', 'Experience', 'Reviews'
    const tabs = ['Overview', 'Time Slots', 'Experience', 'Reviews'];
    const [activeTab, setActiveTab] = useState('Overview');
    const tabScrollViewRef = useRef(null);

    const [selectedRadius, setSelectedRadius] = useState('5 km');

    // Time Slots State
    const [timeSlots, setTimeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
    const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
    const [endTime, setEndTime] = useState(new Date(new Date().setHours(12, 0, 0, 0)));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submittingSlot, setSubmittingSlot] = useState(false);

    // Reviews State
    const [reviewsList, setReviewsList] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewsAverage, setReviewsAverage] = useState(null); // from GetWorkerReviews
    const [reviewsCount, setReviewsCount] = useState(null);     // from GetWorkerReviews
    const [reviewsError, setReviewsError] = useState(false);    // request failed (vs. genuinely empty)

    useFocusEffect(
        useCallback(() => {
            fetchWorkerDetails();
        }, [])
    );

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

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
                setIsDutyOn(data.availableStatus ?? true);
                if (data.radius) setSelectedRadius(`${data.radius} km`);
                fetchTimeSlots(workerId);
                fetchWorkerReviews(workerId);
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
                NotificationHelper.showError(`Error ${response.status}: ${errorMessage}`);
            }
        } catch (error) {
            NotificationHelper.showError("Network error. Verify connection and API IP.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Tab Bar Click
    const handleTabPress = (tab, index) => {
        setActiveTab(tab);
        tabScrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    // Handle Finger Swipe Left/Right
    const handleScrollEnd = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
        if (pageIndex >= 0 && pageIndex < tabs.length) {
            setActiveTab(tabs[pageIndex]);
        }
    };

    // --- REVIEWS API HANDLER ---
    const fetchWorkerReviews = async (id) => {
        if (!id) return;
        setLoadingReviews(true);
        setReviewsError(false);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetWorkerReviews/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                NotificationHelper.showError("Session expired. Please login again.");
                navigation.replace('Login');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data) ? data : (data?.reviews || []);
                setReviewsList(list);
                if (data?.averageRating != null) setReviewsAverage(String(data.averageRating));
                if (data?.reviewCount != null) setReviewsCount(data.reviewCount);
            } else {
                setReviewsList([]);
                setReviewsError(true);
                console.error(`GetWorkerReviews failed [${response.status}]`);
            }
        } catch (error) {
            setReviewsList([]);
            setReviewsError(true);
            console.error('Fetch reviews error:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    // --- TIME SLOTS API HANDLERS ---
    const fetchTimeSlots = async (id) => {
        setLoadingSlots(true);
        try {
            const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/GetWorkerTimeSlots/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTimeSlots(data);
            }
        } catch (error) {
            console.error('Fetch slots error:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleAddTimeSlot = async () => {
        if (!startTime || !endTime) {
            Alert.alert('Validation Error', 'Please enter start and end times (e.g., 09:00:00).');
            return;
        }

        setSubmittingSlot(true);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            
            const formatTime = (dateObj) => {
                const h = dateObj.getHours().toString().padStart(2, '0');
                const m = dateObj.getMinutes().toString().padStart(2, '0');
                const s = dateObj.getSeconds().toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            };

            const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/AddTimeSlot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: parseInt(workerId),
                    startTime: formatTime(startTime),
                    endTime: formatTime(endTime),
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Time slot added successfully!');
                setIsSlotModalVisible(false);
                fetchTimeSlots(workerId);
            } else {
                let errorObj;
                try {
                    errorObj = await response.json();
                } catch(e) {
                    errorObj = { message: await response.text() || 'Failed to add time slot.' };
                }
                Alert.alert('Error', errorObj.message || 'Failed to add time slot.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong while saving the time slot.');
        } finally {
            setSubmittingSlot(false);
        }
    };

    const handleDeleteSlot = (slotId) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this time slot?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/DeleteTimeSlot/${slotId}`, {
                            method: 'DELETE',
                        });
                        if (response.ok) {
                            setTimeSlots((prev) => prev.filter((item) => item.id !== slotId));
                        }
                    } catch (error) {
                        console.error('Delete slot error:', error);
                    }
                },
            },
        ]);
    };

    // --- RADIUS CHANGE HANDLER ---
    const handleRadiusChange = async (rad) => {
        setSelectedRadius(rad); // optimistic UI update
        const radiusVal = parseInt(rad.split(' ')[0]);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateWorkerRadius/${workerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(radiusVal)
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Radius update failed:', err.message);
                NotificationHelper.showError('Failed to update radius: ' + (err.message || ''));
            }
        } catch (error) {
            console.error('Radius update error:', error);
        }
    };

    // Increase / Decrease Radius Handlers
    const currentRadiusValue = parseInt(selectedRadius) || 1;

    const handleIncreaseRadius = () => {
        if (currentRadiusValue < 70) {
            handleRadiusChange(`${currentRadiusValue + 1} km`);
        }
    };

    const handleDecreaseRadius = () => {
        if (currentRadiusValue > 1) {
            handleRadiusChange(`${currentRadiusValue - 1} km`);
        }
    };

    // --- USER HANDLERS ---
    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.replace('Login');
    };

    const handleEditProfile = () => {
        navigation.navigate('Signup', { isEdit: true, initialData: worker });
    };

    const handleOpenMapLocation = () => {
        navigation.navigate('MapScreen', {
            userRole: 'Worker',
            workerId: worker?.id || worker?.workerId,
            latitude: worker?.latitude,
            longitude: worker?.longitude,
            requireLocationSave: false,
        });
    };

    const handleDutyToggle = async (value) => {
        setIsDutyOn(value);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateDutyStatus/${workerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(value)
            });

            if (!response.ok) {
                setIsDutyOn(!value);
                NotificationHelper.showError("Failed to update duty status.");
            }
        } catch (error) {
            setIsDutyOn(!value);
            NotificationHelper.showError("Network error.");
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    if (!worker) return null;

    const imagePath = worker.picture || worker.Picture || worker.imageUrl;

    const profileImageUri = imagePath
        ? imagePath.startsWith('http')
            ? imagePath
            : `${SERVER_BASE}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
        : null;

    return (
        <SafeAreaView style={styles.container}>
            {/* Non-scrollable Header Info */}
            <View style={styles.fixedHeaderPadding}>
                {/* 1. Header with Profile Picture */}
                <View style={styles.topHeader}>
                    <View style={styles.profileSection}>
                        {profileImageUri ? (
                            <Image source={{ uri: profileImageUri }} style={styles.profileAvatar} />
                        ) : (
                            <View style={styles.profileAvatarPlaceholder}>
                                <Icon name="account" size={32} color="#1E64D3" />
                            </View>
                        )}

                        <View style={{ flex: 1 }}>
                            <Text style={styles.greetingText}>GOOD AFTERNOON,</Text>
                            <Text style={styles.headerName}>{worker.name || 'Mesam Abbas'}</Text>
                            <View style={styles.roleAgeRow}>
                                <Text style={styles.roleText}>{worker.role || 'Cleaning'}</Text>
                                <Text style={styles.ageText}>  •  {worker.age || 45} Years Old</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerRightActions}>
                        <TouchableOpacity style={styles.pillEditBtn} onPress={handleEditProfile}>
                            <Icon name="square-edit-outline" size={16} color="#555" />
                            <Text style={styles.pillEditBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
                            <Icon name="logout" size={18} color="#D32F2F" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Info Bar */}
                <View style={styles.infoCard}>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>RATING</Text>
                        <Text style={styles.infoValue}>★ {worker.rating || "0.0"}</Text>
                        <Text style={styles.infoSub}>({worker.reviewCount || 0})</Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={[styles.infoCol, { flex: 2 }]}>
                        <Text style={styles.infoLabel}>LOCATION</Text>
                        <Text style={styles.infoValueLocation} numberOfLines={2}>
                            {worker.location || "RAWALPINDI"}
                        </Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>SALARY</Text>
                        <Text style={styles.infoValue}>Rs.{worker.salary || "0"}</Text>
                    </View>
                </View>

                {/* Underline Tabs Header */}
                <View style={styles.underlineTabContainer}>
                    {tabs.map((tab, idx) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.underlineTabBtn, isActive && styles.underlineTabBtnActive]}
                                onPress={() => handleTabPress(tab, idx)}
                            >
                                <Text style={[styles.underlineTabText, isActive && styles.underlineTabTextActive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Swipeable Tab Container */}
            <ScrollView
                ref={tabScrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                style={{ flex: 1 }}
            >
                {/* 1. OVERVIEW TAB */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContentPadding}>
                    {/* Duty Status Card */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.cardTitle}>Duty Status </Text>
                                    <View style={styles.onlineBadge}>
                                        <Text style={styles.onlineBadgeText}>{isDutyOn ? 'Online' : 'Offline'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.cardSubtext}>
                                    {isDutyOn ? "You are currently visible to customers" : "You are currently hidden"}
                                </Text>
                            </View>
                            <Switch
                                value={isDutyOn}
                                onValueChange={handleDutyToggle}
                                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Work Location */}
                        <View style={styles.cardRow}>
                            <View style={styles.iconCircleBg}>
                                <Icon name="map-marker-outline" size={20} color="#1E64D3" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.itemTitle}>Work Location</Text>
                                <Text style={styles.itemSubtext}>
                                    {worker.latitude && worker.longitude
                                        ? `Pinned (${parseFloat(worker.latitude).toFixed(3)}, ${parseFloat(worker.longitude).toFixed(3)})`
                                        : 'Location not pinned on map'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.bluePillBtn} onPress={handleOpenMapLocation}>
                                <Icon name="map-search-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                <Text style={styles.bluePillBtnText}>Set Location</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* Work Radius Adjustment Strip */}
                        <View style={styles.radiusRowHeader}>
                            <Text style={styles.itemTitle}>
                                Work Radius <Text style={{ color: '#8E8E93', fontWeight: 'normal' }}>(Service Area)</Text>
                            </Text>
                            <Text style={styles.radiusBadgeText}>{selectedRadius}</Text>
                        </View>

                        <View style={styles.radiusStripContainer}>
                            <TouchableOpacity
                                style={[styles.radiusAdjustBtn, currentRadiusValue <= 1 && styles.radiusBtnDisabled]}
                                onPress={handleDecreaseRadius}
                                disabled={currentRadiusValue <= 1}
                            >
                                <Icon name="minus" size={18} color={currentRadiusValue <= 1 ? '#C7C7CC' : '#1E64D3'} />
                            </TouchableOpacity>

                            <View style={styles.radiusTrackBackground}>
                                <View
                                    style={[
                                        styles.radiusTrackFill,
                                        { width: `${(currentRadiusValue / 70) * 100}%` }
                                    ]}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.radiusAdjustBtn, currentRadiusValue >= 70 && styles.radiusBtnDisabled]}
                                onPress={handleIncreaseRadius}
                                disabled={currentRadiusValue >= 70}
                            >
                                <Icon name="plus" size={18} color={currentRadiusValue >= 70 ? '#C7C7CC' : '#1E64D3'} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.radiusLimitText}>Max Limit: 70 km</Text>
                    </View>

                    {/* Interview Requests Notification Tab */}
                    <TouchableOpacity
                        style={styles.notifCard}
                        onPress={() => navigation.navigate('ActiveRequestsScreen')}
                    >
                        <View style={styles.iconCircleBg}>
                            <Icon name="email-outline" size={20} color="#333" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.notifTitle}>Interview Requests</Text>
                            <Text style={styles.notifSub}>Pending: {worker.pendingRequestCount || 0}</Text>
                        </View>
                        <View style={styles.redBadge}>
                            <Text style={styles.redBadgeText}>{worker.pendingRequestCount || 0}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Job Notifications Tab */}
                    <TouchableOpacity
                        style={styles.notifCard}
                        onPress={() => navigation.navigate('JobConfirmationScreen')}
                    >
                        <View style={styles.iconCircleBg}>
                            <Icon name="bell-outline" size={20} color="#333" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.notifTitle}>Job Notifications</Text>
                            <Text style={styles.notifSub}>Job Confirmations and Rejections</Text>
                        </View>
                        <View style={styles.redBadge}>
                            <Text style={styles.redBadgeText}>{worker.jobNotificationCount || 0}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Employment Actions & Termination Buttons */}
                    <View style={styles.actionCard}>
                        <View style={styles.sectionHeader}>
                            <Icon name="account-alert-outline" size={24} color="#FF4D4D" />
                            <Text style={styles.actionSectionTitle}>Employment Actions</Text>
                        </View>
                        <Text style={styles.actionSubtext}>Manage your job status and termination requests</Text>
                        <TouchableOpacity
                            style={styles.terminateBtn}
                            onPress={() => navigation.navigate('LeaveJobScreen')}
                        >
                            <Icon name="close-circle-outline" size={20} color="#FF4D4D" />
                            <Text style={styles.terminateText}>Resign from Job</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.checkStatusBtn}
                        onPress={() => navigation.navigate('WorkerTerminationScreen')}
                    >
                        <Text style={styles.btnTextWhite}>
                            Check Termination Status {worker.terminationCount > 0 ? `(${worker.terminationCount})` : ''}
                        </Text>
                    </TouchableOpacity>

                    {/* Habits — shown on the worker's own profile to clients */}
                    <TouchableOpacity
                        style={styles.habitsBtn}
                        onPress={() => navigation.navigate('MyHabitsScreen')}
                        activeOpacity={0.85}
                    >
                        <Icon name="clipboard-check-outline" size={18} color="#1E64D3" />
                        <Text style={styles.habitsBtnText}>
                            My Habits{worker.habits?.length ? ` (${worker.habits.length})` : ''}
                        </Text>
                        <Icon name="chevron-right" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                </ScrollView>

                {/* 2. TIME SLOTS TAB */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContentPadding}>
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={styles.iconCircleBg}>
                                <Icon name="clock-outline" size={20} color="#1E64D3" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.cardTitle}>Weekly Availability</Text>
                                <Text style={styles.cardSubtext}>Manage your free working hours</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.lightBlueBtn}
                                onPress={() => setIsSlotModalVisible(true)}
                            >
                                <Text style={styles.lightBlueBtnText}>+ Add Slot</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingSlots ? (
                            <ActivityIndicator size="small" color="#1E64D3" />
                        ) : timeSlots.length > 0 ? (
                            timeSlots.map((slot) => (
                                <View key={slot.id} style={styles.slotRowCard}>
                                    <View style={styles.greenDot} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.slotTimeText}>{slot.startTime} - {slot.endTime}</Text>
                                        <Text style={styles.slotSubText}>Available Shift</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteSlot(slot.id)}>
                                        <Icon name="trash-can-outline" size={18} color="#8E8E93" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyReviewsContainer}>
                                <Icon name="clock-outline" size={40} color="#D1D1D6" />
                                <Text style={styles.emptyText}>No available time slots yet.</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* 3. EXPERIENCE TAB */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContentPadding}>
                    <View style={styles.card}>
                        <Text style={styles.sectionHeading}>Experience History</Text>
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
                    </View>
                </ScrollView>

                {/* 4. REVIEWS TAB */}
                <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContentPadding}>
                    <View style={styles.card}>
                        <View style={styles.reviewsHeaderContainer}>
                            <Text style={styles.sectionHeading}>Customer Reviews</Text>
                            <View style={styles.overallRatingBadge}>
                                <Icon name="star" size={18} color="#FFD700" />
                                <Text style={styles.overallRatingText}>
                                    {reviewsAverage ?? worker.rating ?? "0.0"}
                                </Text>
                                <Text style={styles.overallCountText}>
                                    ({reviewsCount ?? worker.reviewCount ?? 0})
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {loadingReviews ? (
                            <ActivityIndicator size="small" color="#1E64D3" style={{ marginVertical: 20 }} />
                        ) : reviewsList && reviewsList.length > 0 ? (
                            reviewsList.map((item, index) => {
                                const reviewerName = item.reviewerName || item.name || item.clientName || 'Customer';
                                const starsGiven = Math.round(Number(item.rating) || 0);
                                return (
                                    <View key={item.id || index} style={styles.inlineReviewCard}>
                                        <View style={styles.reviewHeaderRow}>
                                            <View style={styles.reviewUserRow}>
                                                <View style={styles.reviewAvatarPlaceholder}>
                                                    <Text style={styles.reviewAvatarText}>
                                                        {reviewerName.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.clientNameText}>{reviewerName}</Text>
                                                    <Text style={styles.reviewDateText}>
                                                        {item.workedPeriod ? `Worked: ${item.workedPeriod}` : (item.date || 'Recent')}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.starsRow}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Icon
                                                        key={star}
                                                        name={star <= starsGiven ? "star" : "star-outline"}
                                                        size={16}
                                                        color={star <= starsGiven ? "#FFD700" : "#E0E0E0"}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.reviewCommentText}>
                                            {item.comment || item.reviewText || "No detailed comment provided."}
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyReviewsContainer}>
                                <Icon name={reviewsError ? "wifi-off" : "message-draw"} size={40} color="#D1D1D6" />
                                <Text style={styles.emptyText}>
                                    {reviewsError ? "Couldn't load reviews. Pull back into this screen to retry." : "No reviews found yet."}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </ScrollView>

            {/* ADD/EDIT TIME SLOT MODAL */}
            <Modal visible={isSlotModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Manage Time Slot</Text>
                        <Text style={styles.modalLabel}>Select Shift Timings</Text>

                        <TouchableOpacity style={styles.modalPickerBtn} onPress={() => setShowStartPicker(true)}>
                            <Icon name="clock-outline" size={20} color="#1E64D3" style={{ marginRight: 8 }} />
                            <Text style={styles.modalPickerBtnText}>
                                Start: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalPickerBtn} onPress={() => setShowEndPicker(true)}>
                            <Icon name="clock-outline" size={20} color="#1E64D3" style={{ marginRight: 8 }} />
                            <Text style={styles.modalPickerBtnText}>
                                End: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowStartPicker(false);
                                    if (selectedDate) setStartTime(selectedDate);
                                }}
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePicker
                                value={endTime}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEndPicker(false);
                                    if (selectedDate) setEndTime(selectedDate);
                                }}
                            />
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setIsSlotModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleAddTimeSlot}
                                disabled={submittingSlot}
                            >
                                {submittingSlot ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Save Slot</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// Internal Component
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
    container: { flex: 1, backgroundColor: '#F8F9FB', marginTop: 20 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fixedHeaderPadding: { paddingHorizontal: 16, paddingTop: 16 },
    tabContentPadding: { padding: 16 },

    // Header & Profile Image
    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    profileSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    profileAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, borderWidth: 1.5, borderColor: '#1E64D3' },
    profileAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EBF3FF', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#1E64D3' },
    greetingText: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5 },
    headerName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginVertical: 1 },
    roleAgeRow: { flexDirection: 'row', alignItems: 'center' },
    roleText: { fontSize: 14, fontWeight: '700', color: '#1E64D3' },
    ageText: { fontSize: 13, color: '#8E8E93' },
    headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pillEditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
    pillEditBtnText: { fontSize: 12, color: '#3A3A3C', fontWeight: '600' },
    logoutIconBtn: { backgroundColor: '#FEE2E2', padding: 7, borderRadius: 16 },

    // Top Summary Info Card
    infoCard: { flexDirection: 'row', backgroundColor: '#F0F4F8', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
    infoCol: { flex: 1, alignItems: 'center' },
    infoLabel: { fontSize: 10, color: '#8E8E93', fontWeight: 'bold', marginBottom: 2 },
    infoValue: { fontSize: 11, fontWeight: 'bold', color: '#1C1C1E', padding: 5 },
    infoValueLocation: { fontSize: 11, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center' },
    infoSub: { fontSize: 10, color: '#8E8E93' },
    verticalDivider: { width: 1, height: '80%', backgroundColor: '#D1D1D6' },

    // Underline Tabs Header
    underlineTabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', marginBottom: 4 },
    underlineTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    underlineTabBtnActive: { borderBottomColor: '#1E64D3' },
    underlineTabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
    underlineTabTextActive: { color: '#1E64D3', fontWeight: 'bold' },

    // Cards
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' },
    cardSubtext: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
    onlineBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
    onlineBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
    iconCircleBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
    itemSubtext: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
    bluePillBtn: { backgroundColor: '#1E64D3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    bluePillBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    // Dynamic Radius Interactive Strip
    radiusRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    radiusBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#1E64D3' },
    radiusStripContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    radiusAdjustBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EBF3FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radiusBtnDisabled: {
        backgroundColor: '#F2F2F7',
    },
    radiusTrackBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E5EA',
        borderRadius: 4,
        overflow: 'hidden',
    },
    radiusTrackFill: {
        height: '100%',
        backgroundColor: '#1E64D3',
        borderRadius: 4,
    },
    radiusLimitText: {
        fontSize: 10,
        color: '#8E8E93',
        textAlign: 'right',
        marginTop: 4,
    },

    // Notification Cards
    notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA' },
    notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
    notifSub: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
    redBadge: { backgroundColor: '#E53935', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    redBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

    // Availability Section
    lightBlueBtn: { backgroundColor: '#EBF3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    lightBlueBtnText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },
    dayPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F2F2F7', marginRight: 6 },
    dayPillActive: { backgroundColor: '#1E64D3' },
    dayPillText: { fontSize: 12, color: '#3A3A3C', fontWeight: '600' },
    dayPillTextActive: { color: '#FFF' },
    slotRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 8 },
    greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
    slotTimeText: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
    slotSubText: { fontSize: 11, color: '#8E8E93' },

    modalPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    modalPickerBtnText: {
        fontSize: 16,
        color: '#1C1C1E',
        fontWeight: '500',
    },

    // Employment & Experience Tab
    actionCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    actionSectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    actionSubtext: { fontSize: 13, color: '#666', marginBottom: 12 },
    terminateBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#FF4D4D' },
    terminateText: { color: '#FF4D4D', fontWeight: 'bold', marginLeft: 8 },
    checkStatusBtn: { backgroundColor: '#FF3B30', height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    habitsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF4FF', borderWidth: 1, borderColor: '#D8E6FF', height: 45, borderRadius: 22, marginBottom: 14, gap: 8 },
    habitsBtnText: { color: '#1E64D3', fontWeight: '700', fontSize: 14 },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },

    expItem: { flexDirection: 'row', minHeight: 70 },
    timeline: { alignItems: 'center', marginRight: 12 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CCC' },
    activeDot: { backgroundColor: '#1E64D3' },
    line: { flex: 1, width: 2, backgroundColor: '#E5E5EA' },
    expContent: { flex: 1, paddingBottom: 16 },
    expTitle: { fontWeight: 'bold', fontSize: 14, color: '#1C1C1E' },
    expBullet: { fontSize: 12, color: '#666', marginTop: 2 },
    expPeriod: { fontSize: 11, color: '#8E8E93', marginTop: 4 },

    // Reviews Section
    reviewsHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    overallRatingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    overallRatingText: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
    overallCountText: { fontSize: 12, color: '#8E8E93' },
    inlineReviewCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    reviewUserRow: { flexDirection: 'row', alignItems: 'center' },
    reviewAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EBF3FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    reviewAvatarText: { color: '#1E64D3', fontWeight: 'bold', fontSize: 14 },
    clientNameText: { fontWeight: 'bold', fontSize: 13, color: '#1C1C1E' },
    reviewDateText: { fontSize: 10, color: '#8E8E93' },
    starsRow: { flexDirection: 'row' },
    reviewCommentText: { fontSize: 13, color: '#3A3A3C', lineHeight: 18 },
    emptyReviewsContainer: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    emptyText: { color: '#8E8E93', fontStyle: 'italic', fontSize: 13 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#1C1C1E' },
    modalLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 14 },
    modalInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
    modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    modalCancelText: { color: '#8E8E93', fontWeight: '600' },
    modalSaveBtn: { backgroundColor: '#1E64D3', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    modalSaveText: { color: '#FFF', fontWeight: 'bold' }
});

export default WorkerDashboardScreen;