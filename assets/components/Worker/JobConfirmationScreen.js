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

const JobConfirmationScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchJobConfirmations();
    }, []);

    const fetchJobConfirmations = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetWorkerJobConfirmations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setJobs(data);
            } else {
                NotificationHelper.showError("Failed to fetch jobs.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Server error.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptJob = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/WorkerAcceptJobOffer/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                NotificationHelper.showSuccess("Job Accepted! You are now hired.");
                fetchJobConfirmations(); // Refresh
            } else {
                NotificationHelper.showError("Error accepting job.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network Error");
        }
    };

    const handleRejectJob = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/WorkerRejectJobOffer/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                NotificationHelper.showSuccess("Job offer rejected.");
                fetchJobConfirmations(); // Refresh
            } else {
                NotificationHelper.showError("Error rejecting job.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network Error");
        }
    };

    const handleDeleteJob = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/DeleteInterviewRequest/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Job request removed from your list.");
                setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
            } else {
                NotificationHelper.showError("Failed to remove request.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network Error");
        }
    };

    // Filter jobs by client name
    const filteredJobs = jobs.filter(job => 
        job.clientName && job.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderJobCard = (item) => {
        // Styling logic based on job type
        const isRejected = item.type === 'rejected';
        const borderColor = isRejected ? '#FF5252' : '#4CAF50';
        const statusBg = isRejected ? '#FFCDD2' : '#C8E6C9';
        const statusTextColor = isRejected ? '#D32F2F' : '#388E3C';

        return (
            <View key={item.id} style={[styles.card, { borderColor: borderColor }]}>
                <Text style={[styles.offerHeader, { color: isRejected ? '#FF5252' : '#4CAF50' }]}>
                    {isRejected ? 'Job Rejected!' : 'Job Offered!'}
                </Text>

                <View style={styles.clientRow}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ 
                                uri: item.clientImage && item.clientImage.startsWith('/') 
                                    ? `${SERVER_BASE}${item.clientImage}` 
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.verifiedIcon}>
                            <Icon name="account-check" size={12} color="#000" />
                        </View>
                    </View>

                    <View style={styles.nameCol}>
                        <Text style={styles.clientName}>{item.clientName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusText, { color: statusTextColor }]}>{item.status}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    <Text style={styles.detailItem}><Text style={styles.bold}>Interview Date:</Text> {item.date}</Text>
                    <Text style={styles.detailItem}><Text style={styles.bold}>Job Rule:</Text> {item.role}</Text>
                    <Text style={styles.detailItem}><Text style={styles.bold}>Address:</Text> {item.address}</Text>
                    <Text style={styles.messageText}>{item.message}</Text>
                </View>

                {/* Dynamic Action Buttons */}
                <View style={styles.buttonRow}>
                    {item.type === 'offered' && (
                        <>
                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectJob(item.id)}>
                                <Text style={styles.btnTextGrey}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptJob(item.id)}>
                                <Text style={styles.btnTextWhite}>Accept</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {item.type === 'rejected' && (
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteJob(item.id)}>
                            <Text style={styles.btnTextGrey}>Delete</Text>
                        </TouchableOpacity>
                    )}

                    {item.type === 'final' && (
                        <TouchableOpacity style={[styles.finalAcceptedBtn, { backgroundColor: '#008000' }]} disabled={true}>
                            <Text style={styles.btnTextWhite}>Accepted</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Decoration */}
            <View style={styles.blueCircle} />

            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.headerTitle}>Job Confirmation</Text>
                    <Image
                        source={{ uri: 'https://servantmaidonline.com/logo.png' }} // Use your local logo asset
                        style={styles.logo}
                    />
                </View>

                <View style={styles.searchBar}>
                    <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search by client name"
                        style={styles.searchInput}
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
                ) : filteredJobs.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>No job confirmations available.</Text>
                ) : (
                    filteredJobs.map(renderJobCard)
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    blueCircle: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    header: { padding: 20 },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        position: 'relative'
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    logo: { width: 40, height: 40, position: 'absolute', right: 0 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#CCC',
        paddingHorizontal: 15,
        height: 45,
        elevation: 2,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#000' },
    searchIcon: { marginRight: 10 },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 20 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        elevation: 3,
    },
    offerHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    imageContainer: { position: 'relative' },
    avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EEE' },
    verifiedIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 2,
        borderWidth: 1,
    },
    nameCol: { marginLeft: 15 },
    clientName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 3,
        borderRadius: 15,
        marginTop: 5,
        alignSelf: 'flex-start'
    },
    statusText: { fontSize: 13, fontWeight: 'bold' },
    detailsSection: { marginBottom: 15 },
    detailItem: { fontSize: 15, color: '#333', marginBottom: 4 },
    bold: { fontWeight: 'bold' },
    messageText: { fontSize: 14, color: '#444', lineHeight: 20, marginTop: 5 },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    rejectBtn: {
        backgroundColor: '#CFD8DC',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 15,
        elevation: 2
    },
    acceptBtn: {
        backgroundColor: '#1E64D3',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 2
    },
    deleteBtn: {
        backgroundColor: '#CFD8DC',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 2
    },
    finalAcceptedBtn: {
        backgroundColor: '#008000',
        paddingHorizontal: 40,
        paddingVertical: 10,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center'
    },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    btnTextGrey: { color: '#607D8B', fontWeight: 'bold', fontSize: 16 }
});

export default JobConfirmationScreen;