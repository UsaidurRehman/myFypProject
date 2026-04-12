import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD } from '../../config';

const API_BASE = API_DASHBOARD;

const AcceptedRequestScreen = ({ navigation }) => {
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAcceptedRequests();
    }, []);

    const fetchAcceptedRequests = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetAcceptedWorkerRequests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAcceptedRequests(data);
            } else {
                NotificationHelper.showError("Failed to load accepted requests.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ decision: 'Rejected' })
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Request Rejected successfully.");
                setAcceptedRequests(prev => prev.filter(r => r.id !== id));
            } else {
                NotificationHelper.showError("Failed to reject request.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Light Blue Circle Decoration */}
            <View style={styles.bgDecoration} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.mainTitle}>Accepted Request</Text>
                    <Text style={styles.subTitle}>Accepted Offers</Text>
                </View>

                <Text style={styles.sectionHeading}>
                    New Accepted Requests ({acceptedRequests.length})
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#4CAF50" />
                ) : acceptedRequests.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>No accepted requests found.</Text>
                ) : (
                    acceptedRequests.map((item) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.serviceBadge}>
                                    <Text style={styles.serviceText}>{item.service}</Text>
                                </View>
                                <View style={styles.statusContainer}>
                                    <View style={styles.greenDot} />
                                    <Text style={styles.statusText}>Accepted</Text>
                                </View>
                            </View>

                            <Text style={styles.clientLabel}>Client: {item.client}</Text>

                            <View style={styles.locationContainer}>
                                <View style={styles.pinBg}>
                                    <Icon name="map-marker" size={18} color="#E91E63" />
                                </View>
                                <Text style={styles.locationText}>{item.location}</Text>
                            </View>

                            <View style={[styles.locationContainer, { marginTop: -5 }]}>
                                <View style={styles.pinBg}>
                                    <Icon name="phone" size={18} color="#4CAF50" />
                                </View>
                                <Text style={styles.locationText}>{item.clientPhone}</Text>
                            </View>

                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
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
    scrollContent: {
        padding: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 10,
        elevation: 5,
    },
    headerTitleContainer: {
        marginBottom: 30,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    subTitle: {
        fontSize: 16,
        color: '#BDBDBD',
        marginTop: 5,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    serviceBadge: {
        borderWidth: 1,
        borderColor: '#1E64D3',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    serviceText: {
        fontSize: 12,
        color: '#1E64D3',
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    clientLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    pinBg: {
        marginRight: 8,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
    },
    rejectBtn: {
        alignSelf: 'flex-end',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 25,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    rejectBtnText: {
        color: '#9E9E9E',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default AcceptedRequestScreen;
