import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity,
    SafeAreaView, ScrollView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_BASE } from '../../config';

const WorkerTerminationScreen = ({ navigation }) => {
    const [termination, setTermination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTerminationStatus();
    }, []);

    const fetchTerminationStatus = async () => {
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');
            
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetLatestTermination/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTermination(data);
            }
        } catch (error) {
            console.error("Error fetching termination status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Termination Status</Text>
                <Image source={{ uri: 'https://servantmaidonline.com/logo.png' }} style={styles.logo} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {!termination ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.iconCircle}>
                            <Icon name="check-decagram" size={80} color="#4CAF50" />
                        </View>
                        <Text style={styles.emptyTitle}>Good News!</Text>
                        <Text style={styles.emptySubtitle}>
                            You currently have no recorded terminations. Your professional record is clean.
                        </Text>
                        <TouchableOpacity 
                            style={styles.goBackBtn} 
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.goBackText}>Return to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {/* Status Card */}
                        <View style={styles.statusCard}>
                            <View style={styles.statusHeader}>
                                <View style={styles.alertIcon}>
                                    <Icon name="alert-octagon" size={30} color="#E63917" />
                                </View>
                                <View>
                                    <Text style={styles.statusLabel}>Contract Status</Text>
                                    <Text style={styles.statusValue}>Terminated</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.dateRow}>
                                <Icon name="calendar-range" size={20} color="#666" />
                                <Text style={styles.dateText}>
                                    Terminated on: {new Date(termination.terminatedDate).toLocaleDateString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                </Text>
                            </View>
                        </View>

                        {/* Reason Section */}
                        <Text style={styles.sectionTitle}>Reason for Termination</Text>
                        <View style={styles.reasonCard}>
                            <Icon name="format-quote-open" size={24} color="#1E64D3" />
                            <Text style={styles.reasonText}>
                                {termination.terminatedReason || "No specific reason provided by the client."}
                            </Text>
                            <View style={{ alignSelf: 'flex-end' }}>
                                <Icon name="format-quote-close" size={24} color="#1E64D3" />
                            </View>
                        </View>

                        {/* Employer Info */}
                        <Text style={styles.sectionTitle}>Employer Details</Text>
                        <View style={styles.employerCard}>
                            <Image 
                                source={{ 
                                    uri: termination.clientPicture 
                                        ? `${SERVER_BASE}${termination.clientPicture}` 
                                        : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' 
                                }} 
                                style={styles.employerAvatar} 
                            />
                            <View style={styles.employerInfo}>
                                <Text style={styles.employerName}>{termination.clientName}</Text>
                                <Text style={styles.employerLabel}>Client / Employer</Text>
                            </View>
                        </View>

                        {/* Feedback / Next Steps */}
                        <View style={styles.infoBox}>
                            <Icon name="information-outline" size={22} color="#1E64D3" />
                            <Text style={styles.infoBoxText}>
                                Termination is a part of professional life. Don't be discouraged! 
                                Your profile is now visible for other potential employers.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.findJobBtn}
                            onPress={() => navigation.navigate('EarningsScreen')} // Or a job hunt screen
                        >
                            <Text style={styles.findJobText}>View My Earnings</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        elevation: 2,
    },
    backBtn: { position: 'absolute', left: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    logo: { width: 35, height: 35, position: 'absolute', right: 20 },

    scrollContent: { padding: 20 },

    // Empty State
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30
    },
    emptyTitle: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', marginBottom: 10 },
    emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    goBackBtn: {
        backgroundColor: '#1E64D3',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 3,
    },
    goBackText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // Active State
    statusCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 20, 
        padding: 20, 
        elevation: 4, 
        marginBottom: 25,
        borderLeftWidth: 8,
        borderLeftColor: '#E63917'
    },
    statusHeader: { flexDirection: 'row', alignItems: 'center' },
    alertIcon: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: '#FFEBEE', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: 15
    },
    statusLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
    statusValue: { fontSize: 24, fontWeight: 'bold', color: '#E63917' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateText: { marginLeft: 10, color: '#555', fontSize: 15, fontWeight: '500' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },
    reasonCard: { 
        backgroundColor: '#E3F2FD', 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#BBDEFB'
    },
    reasonText: { 
        fontSize: 16, 
        color: '#1E64D3', 
        lineHeight: 24, 
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 5,
        fontWeight: '500'
    },

    employerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 20,
        elevation: 2,
        marginBottom: 30
    },
    employerAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#EEE' },
    employerInfo: { marginLeft: 15 },
    employerName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    employerLabel: { fontSize: 14, color: '#999', marginTop: 2 },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 30
    },
    infoBoxText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#666', lineHeight: 20 },

    findJobBtn: {
        backgroundColor: '#1E64D3',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        marginBottom: 20
    },
    findJobText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default WorkerTerminationScreen;
