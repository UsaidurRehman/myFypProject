import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';

const API_BASE = API_DASHBOARD;

const WorkerDecisionScreen = ({ navigation }) => {
    const [decisions, setDecisions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDecisions();
    }, []);

    const fetchDecisions = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetClientWorkerDecisions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDecisions(data);
            } else {
                NotificationHelper.showError("Failed to fetch decisions.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Server error.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/ClientConfirmWorkerAcceptance/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                NotificationHelper.showSuccess("Worker acceptance successfully confirmed!");
                fetchDecisions();
            } else {
                NotificationHelper.showError("Failed to confirm acceptance.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network Error");
        }
    };

    const handleDismiss = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/ClientDismissWorkerRejection/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setDecisions(prev => prev.filter(d => d.id !== id));
                navigation.navigate('FindServiceScreen'); // "View Other Worker" behavior
            } else {
                NotificationHelper.showError("Failed to dismiss.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network Error");
        }
    };

    const filteredDecisions = decisions.filter(d =>
        d.workerName && d.workerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderDecisionCard = (item) => {
        const isRejected = item.type === 'rejected';
        const borderColor = isRejected ? '#FF5252' : '#4CAF50';
        const statusBg = isRejected ? '#FFCDD2' : '#C8E6C9';
        const statusTextColor = isRejected ? '#D32F2F' : '#388E3C';

        return (
            <View key={item.id} style={[styles.card, { borderColor: borderColor }]}>
                <Text style={[styles.headerLabel, { color: isRejected ? '#FF5252' : '#4CAF50' }]}>
                    {isRejected ? 'Worker Rejected!' : 'Worker Accepted!'}
                </Text>

                <View style={styles.workerRow}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ 
                                uri: item.workerImage && item.workerImage.startsWith('/') 
                                    ? `${SERVER_BASE}${item.workerImage}` 
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.verifyIcon}>
                            <Icon name="account-check" size={12} color="#000" />
                        </View>
                    </View>

                    <View style={styles.nameContainer}>
                        <Text style={styles.workerName}>{item.workerName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusText, { color: statusTextColor }]}>{item.status}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoText}><Text style={styles.bold}>Decision Date:</Text> {item.date}</Text>
                    <Text style={styles.infoText}><Text style={styles.bold}>Job Role:</Text> {item.role}</Text>
                    <Text style={styles.infoText}><Text style={styles.bold}>Address:</Text> {item.address}</Text>
                    <Text style={styles.description}>{item.message}</Text>
                </View>

                <View style={styles.actionContainer}>
                    {item.type === 'accepted' ? (
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item.id)}>
                            <Text style={styles.confirmBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    ) : item.type === 'rejected' ? (
                        <TouchableOpacity style={styles.viewOtherBtn} onPress={() => handleDismiss(item.id)}>
                            <Text style={styles.viewOtherText}>View Other Worker</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.confirmBtn, { backgroundColor: '#4CAF50', opacity: 0.8 }]}>
                            <Text style={styles.confirmBtnText}>Hired</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Visual Background Decoration */}
            <View style={styles.bgDecoration} />

            <View style={styles.header}>
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={20} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>Worker Decision</Text>
                    <Image
                        source={{ uri: 'https://servantmaidonline.com/logo.png' }}
                        style={styles.logo}
                    />
                </View>

                <View style={styles.searchBox}>
                    <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search by Worker name"
                        style={styles.inputField}
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listPadding}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
                ) : filteredDecisions.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>No worker decisions available.</Text>
                ) : (
                    filteredDecisions.map(renderDecisionCard)
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    bgDecoration: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    header: { padding: 20 },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        position: 'relative'
    },
    backBtn: {
        position: 'absolute',
        left: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    logo: { width: 35, height: 35, position: 'absolute', right: 0 },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 15,
        height: 48,
        elevation: 2,
    },
    inputField: { flex: 1, fontSize: 15, color: '#000' },
    searchIcon: { marginRight: 8 },
    listPadding: { paddingHorizontal: 15, paddingBottom: 20 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    headerLabel: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
    workerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    imageWrapper: { position: 'relative' },
    avatar: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#F0F0F0' },
    verifyIcon: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 2,
        borderWidth: 1,
        borderColor: '#CCC'
    },
    nameContainer: { marginLeft: 15 },
    workerName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 15,
        marginTop: 6,
        alignSelf: 'flex-start'
    },
    statusText: { fontSize: 13, fontWeight: 'bold' },
    infoSection: { marginBottom: 20 },
    infoText: { fontSize: 15, color: '#333', marginBottom: 5 },
    bold: { fontWeight: 'bold' },
    description: { fontSize: 14, color: '#444', marginTop: 8, lineHeight: 20 },
    actionContainer: { alignItems: 'center' },
    confirmBtn: {
        backgroundColor: '#1E64D3',
        paddingVertical: 10,
        paddingHorizontal: 50,
        borderRadius: 20,
        elevation: 3,
    },
    confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    viewOtherBtn: {
        backgroundColor: '#B0BEC5',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        elevation: 2,
    },
    viewOtherText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default WorkerDecisionScreen;