// import React from 'react';
// import {
//     StyleSheet,
//     View,
//     Text,
//     Image,
//     ScrollView,
//     SafeAreaView,
//     StatusBar,
//     TouchableOpacity
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// const WorkerTerminatedScreen = ({ navigation }) => {
//     // Static data from the design
//     const terminationData = {
//         worker: {
//             name: 'Muzammil Khan',
//             role: 'Driver',
//             address: 'Rawalpindi',
//             phone: '0330 32232453',
//             experience: '3 Years',
//             avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
//         },
//         details: {
//             status: 'Terminated',
//             date: '20-02-2025',
//             reason: 'Bad Driver Behaviour'
//         },
//         client: {
//             name: 'Fatima Batool',
//             address: '6th road, RWP',
//             avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
//         }
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <StatusBar barStyle="dark-content" />

//             {/* Background Decoration */}
//             <View style={styles.bgCircle} />

//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//                     <Icon name="arrow-left" size={24} color="#555" />
//                 </TouchableOpacity>
//                 <Text style={styles.breadcrumb}>Contract {'>'} Worker <Text style={styles.blueText}>Terminated</Text></Text>
//                 <Image
//                     source={{ uri: 'https://servantmaidonline.com/logo.png' }}
//                     style={styles.logo}
//                 />
//             </View>

//             <ScrollView contentContainerStyle={styles.scrollContent}>
//                 {/* Warning Banner */}
//                 <View style={styles.warningBanner}>
//                     <Icon name="alert" size={30} color="#FF3D00" />
//                     <Text style={styles.warningText}>WORKER TERMINATED</Text>
//                 </View>

//                 {/* Worker Details Section */}
//                 <View style={styles.sectionCard}>
//                     <View style={styles.sectionHeader}>
//                         <Icon name="account" size={20} color="#999" />
//                         <Text style={styles.sectionHeaderTitle}>WORKER DETAILS</Text>
//                     </View>

//                     <View style={styles.profileRow}>
//                         <Image source={{ uri: terminationData.worker.avatar }} style={styles.avatarLarge} />
//                         <View style={styles.infoCol}>
//                             <Text style={styles.infoLabel}>Name:<Text style={styles.bold}> {terminationData.worker.name}</Text></Text>
//                             <Text style={styles.infoLabel}>Job Role:{terminationData.worker.role}</Text>
//                             <Text style={styles.infoLabel}>Address:{terminationData.worker.address}</Text>
//                             <Text style={styles.infoLabel}>Phone:{terminationData.worker.phone}</Text>
//                             <Text style={styles.infoLabel}>Experience:{terminationData.worker.experience}</Text>
//                         </View>
//                     </View>

//                     <View style={styles.divider} />

//                     <View style={styles.statusSection}>
//                         <Text style={styles.statusItem}><Text style={styles.bold}>Status :</Text> {terminationData.details.status}</Text>
//                         <Text style={styles.statusItem}><Text style={styles.bold}>Date:</Text>{terminationData.details.date}</Text>
//                         <Text style={styles.statusItem}><Text style={styles.bold}>Reason:</Text>{terminationData.details.reason}</Text>
//                     </View>
//                 </View>

//                 <Text style={styles.footerNote}>You are terminated and no longer active.</Text>
//                 <View style={styles.bulletSection}>
//                     <Text style={styles.bullet}>• No further access to service</Text>
//                     <Text style={styles.bullet}>• Account deactivated and contract terminated</Text>
//                 </View>

//                 {/* Client Details Section */}
//                 <Text style={styles.clientMainTitle}>Client Details</Text>
//                 <View style={styles.clientCard}>
//                     <Image source={{ uri: terminationData.client.avatar }} style={styles.avatarSmall} />
//                     <View style={styles.clientInfo}>
//                         <Text style={styles.clientLabel}>Client Terminated Worker</Text>
//                         <Text style={styles.infoLabel}>Name:<Text style={styles.bold}> {terminationData.client.name}</Text></Text>
//                         <Text style={styles.infoLabel}>Address: {terminationData.client.address}</Text>
//                     </View>
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#FFF' },
//     bgCircle: {
//         position: 'absolute',
//         top: -40,
//         left: -40,
//         width: 150,
//         height: 150,
//         borderRadius: 75,
//         backgroundColor: '#E3F2FD',
//         zIndex: -1,
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         padding: 20,
//         paddingTop: 10,
//     },
//     backBtn: { padding: 5 },
//     breadcrumb: { fontSize: 16, color: '#666' },
//     blueText: { color: '#2C3BE0', fontWeight: 'bold' },
//     logo: { width: 40, height: 40 },
//     scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },

//     warningBanner: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#F0F4C3', // Light yellow/green from design
//         padding: 15,
//         borderRadius: 12,
//         borderWidth: 1,
//         borderColor: '#D4E157',
//         marginBottom: 20,
//         elevation: 2
//     },
//     warningText: { fontSize: 18, fontWeight: 'bold', color: '#000', marginLeft: 15 },

//     sectionCard: {
//         borderWidth: 1,
//         borderColor: '#999',
//         borderRadius: 8,
//         backgroundColor: '#FFF',
//         overflow: 'hidden',
//         marginBottom: 20
//     },
//     sectionHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 10,
//         borderBottomWidth: 1,
//         borderBottomColor: '#999'
//     },
//     sectionHeaderTitle: { fontSize: 16, color: '#666', marginLeft: 10, fontWeight: '500' },
//     profileRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
//     avatarLarge: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#EEE' },
//     infoCol: { marginLeft: 15, flex: 1 },
//     infoLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
//     bold: { fontWeight: 'bold', color: '#000' },
//     divider: { height: 1, backgroundColor: '#EEE', marginHorizontal: 15 },
//     statusSection: { padding: 15 },
//     statusItem: { fontSize: 16, color: '#333', marginBottom: 8 },

//     footerNote: { fontSize: 14, color: '#999', textAlign: 'center', marginVertical: 15 },
//     bulletSection: { paddingHorizontal: 10, marginBottom: 20 },
//     bullet: { fontSize: 12, color: '#333', fontStyle: 'italic', marginBottom: 2 },

//     clientMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
//     clientCard: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 15,
//         borderRadius: 25,
//         borderWidth: 1,
//         borderColor: '#DDD',
//         backgroundColor: '#FFF',
//         elevation: 3
//     },
//     avatarSmall: { width: 80, height: 80, borderRadius: 40 },
//     clientInfo: { marginLeft: 15 },
//     clientLabel: { color: '#2C3BE0', fontWeight: 'bold', fontSize: 14, marginBottom: 5 }
// });

// export default WorkerTerminatedScreen;
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_BASE } from '../../config';

const WorkerTerminatedScreen = ({ navigation, route }) => {
    const { workerId } = route?.params || {};

    const [terminationData, setTerminationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (workerId) {
            fetchTerminationDetails();
        } else {
            setErrorMsg('Worker routing parameters missing.');
            setLoading(false);
        }
    }, [workerId]);

    const fetchTerminationDetails = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            const token = await AsyncStorage.getItem('userToken');
            
            // Calling the new unified resignation/termination endpoint
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerEndContractDetails/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                
                setTerminationData({
                    worker: {
                        name: data.workerName,
                        role: data.workerSkill,
                        address: data.workerAddress,
                        phone: data.workerPhone,
                        experience: 'Active Job Record',
                        avatar: data.workerPicture ? `${SERVER_BASE}${data.workerPicture}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                    },
                    details: {
                        status: data.status, // Dynamic status state: "Resigned" or "Terminated"
                        date: data.date,
                        reason: data.reason
                    },
                    client: {
                        name: data.clientName,
                        address: data.clientAddress,
                        avatar: data.clientPicture ? `${SERVER_BASE}${data.clientPicture}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                    }
                });
            } else if (response.status === 404) {
                setErrorMsg('No contract exit status found for this worker.');
            } else {
                setErrorMsg('Failed to fetch job data from backend server.');
            }
        } catch (error) {
            setErrorMsg('Network connectivity error.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#2C3BE0" />
            </SafeAreaView>
        );
    }

    if (errorMsg || !terminationData) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Icon name="alert-circle-outline" size={60} color="#FF3D00" />
                <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginTop: 15, marginBottom: 20 }}>{errorMsg}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#2C3BE0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Dynamic strings depending on backend payload state flag values
    const isResigned = terminationData.details.status === 'Resigned';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Background Decoration */}
            <View style={styles.bgCircle} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#555" />
                </TouchableOpacity>
                <Text style={styles.breadcrumb}>Contract {'>'} Worker <Text style={styles.blueText}>{terminationData.details.status}</Text></Text>
                <Image
                    source={{ uri: 'https://servantmaidonline.com/logo.png' }}
                    style={styles.logo}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Warning Banner shifts message dynamically based on status context */}
                <View style={styles.warningBanner}>
                    <Icon name="alert" size={30} color="#FF3D00" />
                    <Text style={styles.warningText}>
                        {isResigned ? 'WORKER RESIGNED' : 'WORKER TERMINATED'}
                    </Text>
                </View>

                {/* Worker Details Section */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Icon name="account" size={20} color="#999" />
                        <Text style={styles.sectionHeaderTitle}>WORKER DETAILS</Text>
                    </View>

                    <View style={styles.profileRow}>
                        <Image source={{ uri: terminationData.worker.avatar }} style={styles.avatarLarge} />
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Name:<Text style={styles.bold}> {terminationData.worker.name}</Text></Text>
                            <Text style={styles.infoLabel}>Job Role: {terminationData.worker.role}</Text>
                            <Text style={styles.infoLabel}>Address: {terminationData.worker.address}</Text>
                            <Text style={styles.infoLabel}>Phone: {terminationData.worker.phone}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statusSection}>
                        <Text style={styles.statusItem}><Text style={styles.bold}>Status :</Text> {terminationData.details.status}</Text>
                        <Text style={styles.statusItem}><Text style={styles.bold}>Date:</Text> {terminationData.details.date}</Text>
                        <Text style={styles.statusItem}><Text style={styles.bold}>Reason:</Text> {terminationData.details.reason}</Text>
                    </View>
                </View>

                <Text style={styles.footerNote}>
                    {isResigned ? 'Worker has resigned and contract is closed.' : 'You have terminated this worker.'}
                </Text>
                <View style={styles.bulletSection}>
                    <Text style={styles.bullet}>• No further active duties under this handshake profile</Text>
                    <Text style={styles.bullet}>• Historic logs preserved into matching database tables successfully</Text>
                </View>

                {/* Client Details Section */}
                <Text style={styles.clientMainTitle}>Client Details</Text>
                <View style={styles.clientCard}>
                    <Image source={{ uri: terminationData.client.avatar }} style={styles.avatarSmall} />
                    <View style={styles.clientInfo}>
                        <Text style={styles.clientLabel}>
                            {isResigned ? 'Worker Left Job Profile' : 'Client Terminated Worker'}
                        </Text>
                        <Text style={styles.infoLabel}>Name:<Text style={styles.bold}> {terminationData.client.name}</Text></Text>
                        <Text style={styles.infoLabel}>Address: {terminationData.client.address}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    bgCircle: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
    },
    backBtn: { padding: 5 },
    breadcrumb: { fontSize: 16, color: '#666' },
    blueText: { color: '#2C3BE0', fontWeight: 'bold' },
    logo: { width: 40, height: 40 },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },

    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4C3',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D4E157',
        marginBottom: 20,
        elevation: 2
    },
    warningText: { fontSize: 18, fontWeight: 'bold', color: '#000', marginLeft: 15 },

    sectionCard: {
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 8,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#999'
    },
    sectionHeaderTitle: { fontSize: 16, color: '#666', marginLeft: 10, fontWeight: '500' },
    profileRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#EEE' },
    infoCol: { marginLeft: 15, flex: 1 },
    infoLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
    bold: { fontWeight: 'bold', color: '#000' },
    divider: { height: 1, backgroundColor: '#EEE', marginHorizontal: 15 },
    statusSection: { padding: 15 },
    statusItem: { fontSize: 16, color: '#333', marginBottom: 8 },

    footerNote: { fontSize: 14, color: '#999', textAlign: 'center', marginVertical: 15 },
    bulletSection: { paddingHorizontal: 10, marginBottom: 20 },
    bullet: { fontSize: 12, color: '#333', fontStyle: 'italic', marginBottom: 2 },

    clientMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    clientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
        elevation: 3
    },
    avatarSmall: { width: 80, height: 80, borderRadius: 40 },
    clientInfo: { marginLeft: 15 },
    clientLabel: { color: '#2C3BE0', fontWeight: 'bold', fontSize: 14, marginBottom: 5 }
});

export default WorkerTerminatedScreen;