import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, FlatList, TouchableOpacity,
    SafeAreaView, ActivityIndicator, StatusBar, RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD } from '../../config';

const ResignationsScreen = ({ navigation }) => {
    const [resignations, setResignations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchResignations();
    }, []);

    const fetchResignations = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetClientResignations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setResignations(data);
            } else {
                console.error("Failed to fetch resignations");
            }
        } catch (error) {
            console.error("Error fetching resignations:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchResignations();
    };

    const renderResignationBox = ({ item }) => (
        <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.workerName}</Text>
                    <Text style={styles.workerRole}>{item.workerRole}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{item.submittedDate}</Text>
                </View>
            </View>

            {/* Reason */}
            <View style={styles.cardContent}>
                <Text style={styles.label}>Reason for Leaving:</Text>
                <Text style={styles.reasonText} numberOfLines={2}>
                    {item.reason}
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <View style={styles.lastDayRow}>
                    <Icon name="calendar-clock" size={16} color="#E91E63" />
                    <Text style={styles.lastDate}>Last Day: {item.lastWorkingDate}</Text>
                </View>
                <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => navigation.navigate('ResignationScreen', { resignationId: item.resignationId })}
                >
                    <Text style={styles.detailBtnText}>View Detail</Text>
                    <Icon name="chevron-right" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header — matches ActiveRequestScreen & WorkerDecisionScreen style */}
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Worker Resignations</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1E64D3" />
                </View>
            ) : (
                <FlatList
                    data={resignations}
                    renderItem={renderResignationBox}
                    keyExtractor={item => item.resignationId.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#1E64D3"]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="file-document-outline" size={60} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No resignation notices received yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* ── Header (same as ActiveRequestScreen & WorkerDecisionScreen) ── */
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.3,
    },
    logoBox: {
        width: 110,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: 110,
        height: 90,
        resizeMode: 'contain',
    },

    /* ── List ── */
    listContent: {
        padding: 16,
        paddingBottom: 28,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
        marginBottom: 12,
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E64D3',
        marginBottom: 2,
    },
    workerRole: {
        fontSize: 13,
        color: '#6B7280',
    },
    dateBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    dateText: {
        fontSize: 11,
        color: '#1E64D3',
        fontWeight: '700',
    },

    /* ── Content ── */
    cardContent: {
        marginBottom: 14,
    },
    label: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
        fontWeight: '600',
    },
    reasonText: {
        fontSize: 14,
        color: '#374151',
        fontStyle: 'italic',
        lineHeight: 20,
    },

    /* ── Footer ── */
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    lastDayRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastDate: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '700',
        marginLeft: 6,
    },
    detailBtn: {
        backgroundColor: '#1E64D3',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#1E64D3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    detailBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
        marginRight: 4,
    },

    /* ── Empty ── */
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 15,
        marginTop: 15,
        textAlign: 'center',
    },
});

export default ResignationsScreen;
