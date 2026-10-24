import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';

// Worker-selectable habits live in dbo.Habits and are served by api/Habits.
const API_HABITS = `${SERVER_BASE}/api/Habits`;

const getHabitId = habit => Number(habit?.habitId ?? habit?.id);
const normalizeHabitIds = ids => [...new Set((Array.isArray(ids) ? ids : [])
    .map(Number)
    .filter(id => Number.isInteger(id) && id > 0))];
const findExclusiveGroupConflict = (ids, catalog) => {
    const groups = new Set();
    for (const id of ids) {
        const habit = catalog.find(item => getHabitId(item) === Number(id));
        const group = habit?.exclusiveGroup?.trim().toLowerCase();
        if (!group) continue;
        if (groups.has(group)) return group;
        groups.add(group);
    }
    return null;
};

const MyHabitsScreen = ({ navigation, route }) => {
    const isSignup = route?.params?.isSignup;

    const [catalog, setCatalog] = useState([]);        // active worker-selectable habits
    const [selectedIds, setSelectedIds] = useState([]); // what this worker ticked
    const [savedIds, setSavedIds] = useState([]);       // what is in the DB right now
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            if (isSignup) {
                // In signup flow: fetch catalog without auth headers
                const catalogRes = await fetch(`${API_HABITS}/GetHabits`);
                if (catalogRes.ok) {
                    const list = await catalogRes.json();
                    setCatalog(Array.isArray(list) ? list : []);
                } else {
                    NotificationHelper.showError('Could not load the habit list.');
                }

                const initial = Array.isArray(route.params?.habits)
                    ? route.params.habits
                    : Array.isArray(route.params?.selectedHabitIds)
                        ? route.params.selectedHabitIds
                        : [];
                const normalizedInitial = normalizeHabitIds(initial);
                setSelectedIds(normalizedInitial);
                setSavedIds(normalizedInitial);
            } else {
                const token = await AsyncStorage.getItem('userToken');
                const workerId = await AsyncStorage.getItem('workerId');

                if (!workerId) {
                    NotificationHelper.showError('Session not found. Please login again.');
                    navigation.goBack();
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                const [catalogRes, mineRes] = await Promise.all([
                    fetch(`${API_HABITS}/GetHabits`, { headers }),
                    fetch(`${API_HABITS}/GetWorkerHabits/${workerId}`, { headers }),
                ]);

                if (catalogRes.ok) {
                    const list = await catalogRes.json();
                    setCatalog(Array.isArray(list) ? list : []);
                } else {
                    NotificationHelper.showError('Could not load the habit list.');
                }

                if (mineRes.ok) {
                    const mine = await mineRes.json();
                    const mineIds = normalizeHabitIds(mine.habitIds);
                    setSelectedIds(mineIds);
                    setSavedIds(mineIds);
                }
            }
        } catch (error) {
            console.error('My habits load failed:', error?.message);
            NotificationHelper.showError('Network error while loading habits.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [navigation, isSignup, route?.params]);

    useEffect(() => {
        fetchAll();
        const unsubscribe = navigation.addListener('focus', fetchAll);
        return unsubscribe;
    }, [navigation, fetchAll]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchAll();
    };

    const toggleHabit = (habitId) => {
        const id = Number(habitId);
        const target = catalog.find(item => getHabitId(item) === id);
        const targetGroup = target?.exclusiveGroup?.trim().toLowerCase();

        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter(selectedId => selectedId !== id);
            if (!targetGroup) return [...prev, id];

            const sameGroupIds = new Set(catalog
                .filter(item => item.exclusiveGroup?.trim().toLowerCase() === targetGroup)
                .map(getHabitId));
            return [...prev.filter(selectedId => !sameGroupIds.has(Number(selectedId))), id];
        });
    };

    const hasChanges =
        selectedIds.length !== savedIds.length ||
        selectedIds.some((id) => !savedIds.includes(id));
    const exclusiveConflict = findExclusiveGroupConflict(selectedIds, catalog);

    const handleBack = () => {
        if (isSignup && exclusiveConflict) {
            NotificationHelper.showError('Choose only one option from each opposite habit pair.');
            return;
        }

        if (isSignup) {
            navigation.navigate('Signup', {
                ...route.params,
                ...(route.params?.signupDraft || {}),
                habitsCompleted: true,
                habits: selectedIds,
            });
        } else {
            navigation.goBack();
        }
    };

    const handleSave = async () => {
        if (exclusiveConflict) {
            NotificationHelper.showError('Choose only one option from each opposite habit pair.');
            return;
        }

        if (selectedIds.length === 0) {
            NotificationHelper.showError('Please keep at least one habit ticked.');
            return;
        }

        if (isSignup) {
            navigation.navigate('Signup', {
                ...route.params,
                ...(route.params?.signupDraft || {}),
                habitsCompleted: true,
                habits: selectedIds,
            });
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            const workerId = await AsyncStorage.getItem('workerId');

            setIsSaving(true);
            const response = await fetch(`${API_HABITS}/UpdateWorkerHabits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ workerId: Number(workerId), habitIds: selectedIds }),
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                const saved = Array.isArray(result.habitIds) ? result.habitIds : selectedIds;
                setSelectedIds(saved);
                setSavedIds(saved);
                NotificationHelper.showSuccess(result.message || 'Habits updated.');
                navigation.goBack();
            } else {
                NotificationHelper.showError(result.message || 'Could not save your habits.');
            }
        } catch (error) {
            console.error('Save habits failed:', error?.message);
            NotificationHelper.showError('Network error while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isSignup ? 'Select Habits' : 'My Habits'}</Text>
            </View>
            <View style={styles.logoBox}>
                <Image source={require('../../images/logo.png')} style={styles.logoImage} />
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                {renderHeader()}
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1E64D3" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            {renderHeader()}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#1E64D3']} />
                }
            >
                <View style={styles.introCard}>
                    <Icon name="information-outline" size={16} color="#1E64D3" />
                    <Text style={styles.introText}>
                        Select the details that accurately describe you. Some can also be used
                        by clients as search filters. For paired options, choose one or leave both unselected.
                    </Text>
                </View>

                <View style={styles.countRow}>
                    <Text style={styles.countText}>
                        {selectedIds.length} of {catalog.length} selected
                    </Text>
                    {hasChanges ? (
                        <View style={styles.unsavedChip}>
                            <Text style={styles.unsavedChipText}>Unsaved changes</Text>
                        </View>
                    ) : null}
                </View>
                {exclusiveConflict ? (
                    <Text style={styles.conflictText}>
                        Conflicting choices are selected. Keep only one option for smoking status,
                        cooking preference, or pet comfort before saving.
                    </Text>
                ) : null}

                {catalog.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Icon name="clipboard-text-outline" size={38} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No habits available right now.</Text>
                    </View>
                ) : (
                    <View style={styles.listCard}>
                        {catalog.map((habit, index) => {
                            const habitId = getHabitId(habit);
                            const isChecked = selectedIds.includes(habitId);
                            return (
                                <TouchableOpacity
                                    key={habitId}
                                    style={[styles.habitRow, index === catalog.length - 1 && styles.habitRowLast]}
                                    onPress={() => toggleHabit(habitId)}
                                    activeOpacity={0.8}
                                >
                                    <Icon
                                        name={habit.exclusiveGroup
                                            ? (isChecked ? 'radiobox-marked' : 'radiobox-blank')
                                            : (isChecked ? 'checkbox-marked' : 'checkbox-blank-outline')}
                                        size={24}
                                        color={isChecked ? '#1E64D3' : '#C4CEDE'}
                                    />
                                    <Text style={[styles.habitText, isChecked && styles.habitTextActive]}>
                                        {habit.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, (isSaving || exclusiveConflict || (!isSignup && !hasChanges)) && styles.saveBtnIdle]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={isSaving || Boolean(exclusiveConflict) || (!isSignup && !hasChanges)}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>
                            {isSignup ? 'Confirm Habits' : hasChanges ? 'Save Habits' : 'No Changes'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F6FC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    logoBox: { width: 56, height: 42, alignItems: 'flex-end', justifyContent: 'center' },
    logoImage: { width: 46, height: 34, resizeMode: 'contain' },

    scrollContent: { padding: 16, paddingBottom: 24 },
    introCard: {
        flexDirection: 'row',
        backgroundColor: '#EEF4FF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#D8E6FF',
    },
    introText: { flex: 1, fontSize: 12.5, color: '#334155', lineHeight: 18, marginLeft: 8 },

    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        marginBottom: 8,
    },
    countText: { fontSize: 13, fontWeight: '700', color: '#475569' },
    conflictText: { color: '#B91C1C', fontSize: 12.5, lineHeight: 18, marginBottom: 10, paddingHorizontal: 2 },
    unsavedChip: {
        backgroundColor: '#FFF7E6',
        borderWidth: 1,
        borderColor: '#FCD9A4',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    unsavedChipText: { fontSize: 11, fontWeight: '700', color: '#B45309' },

    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        overflow: 'hidden',
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    habitRowLast: { borderBottomWidth: 0 },
    habitText: { flex: 1, fontSize: 14.5, color: '#64748B', marginLeft: 12 },
    habitTextActive: { color: '#111827', fontWeight: '700' },

    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        padding: 30,
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: '#94A3B8', marginTop: 8 },

    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEF1F6',
    },
    saveBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: '#16A34A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnIdle: { backgroundColor: '#C7D3E3' },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default MyHabitsScreen;
