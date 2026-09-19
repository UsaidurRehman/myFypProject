import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Image
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
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header bar matching standard app header */}
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Accepted Requests</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeading}>
                    New Accepted Requests ({acceptedRequests.length})
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 40 }} />
                ) : acceptedRequests.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#999' }}>No accepted requests found.</Text>
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

                            <View style={styles.clientHeaderRow}>
                                <TouchableOpacity onPress={() => {
                                    if (item.clientId) {
                                        navigation.navigate('ClientProfileScreen', {
                                            clientId: item.clientId,
                                            id: item.clientId
                                        });
                                    } else {
                                        console.warn("Client ID is missing for this review.");
                                    }
                                }}
                                >
                                    <Text style={styles.clientName}>{item.client || "Customer"}</Text>
                                </TouchableOpacity>
                                <View style={styles.ratingBadge}>
                                    <Icon name="star" size={14} color="#FFD700" />
                                    <Text style={styles.ratingText}>{item.clientRating > 0 ? item.clientRating.toFixed(1) : "N/A"}</Text>
                                </View>
                            </View>

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
        backgroundColor: '#F3F6FC',
    },
    /* ── Header ── */
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
    scrollContent: {
        padding: 20,
        paddingBottom: 30,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
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
    clientHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    clientLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE599',
    },
    ratingText: {
        marginLeft: 3,
        fontSize: 13,
        fontWeight: '700',
        color: '#B45309',
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
