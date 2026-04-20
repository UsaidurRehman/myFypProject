import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, FlatList, TouchableOpacity, 
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
        <View style={styles.resignationBox}>
            <View style={styles.boxHeader}>
                <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.workerName}</Text>
                    <Text style={styles.workerRole}>{item.workerRole}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{item.submittedDate}</Text>
                </View>
            </View>

            <View style={styles.boxContent}>
                <Text style={styles.label}>Reason for Leaving:</Text>
                <Text style={styles.reasonText} numberOfLines={2}>
                    {item.reason}
                </Text>
            </View>

            <View style={styles.boxFooter}>
                <View style={styles.noticeInfo}>
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
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Worker Resignations</Text>
                <View style={{ width: 40 }} />
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
                            <Icon name="file-document-outline" size={60} color="#DDD" />
                            <Text style={styles.emptyText}>No resignation notices received yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        elevation: 2
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    backBtn: { padding: 5 },

    listContent: { padding: 20 },

    resignationBox: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    boxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 10,
        marginBottom: 12
    },
    workerName: { fontSize: 18, fontWeight: 'bold', color: '#1E64D3' },
    workerRole: { fontSize: 13, color: '#666', marginTop: 2 },
    dateBadge: { backgroundColor: '#F0F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    dateText: { fontSize: 11, color: '#1E64D3', fontWeight: '600' },

    boxContent: { marginBottom: 15 },
    label: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    reasonText: { fontSize: 14, color: '#444', fontStyle: 'italic', lineHeight: 20 },

    boxFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    noticeInfo: { flexDirection: 'row', alignItems: 'center' },
    lastDate: { fontSize: 13, color: '#333', fontWeight: '600', marginLeft: 6 },

    detailBtn: {
        backgroundColor: '#1E64D3',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2
    },
    detailBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, marginRight: 5 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', fontSize: 16, marginTop: 15, fontStyle: 'italic' }
});

export default ResignationsScreen;
