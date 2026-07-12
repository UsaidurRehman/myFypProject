// // import React, { useState, useEffect } from 'react';
// // import {
// //     StyleSheet,
// //     View,
// //     Text,
// //     Image,
// //     TouchableOpacity,
// //     TextInput,
// //     ScrollView,
// //     SafeAreaView,
// //     StatusBar,
// //     ActivityIndicator
// // } from 'react-native';
// // import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import NotificationHelper from '../Notification/NotificationHelper';
// // import { API_DASHBOARD, SERVER_BASE } from '../../config';

// // const API_BASE = API_DASHBOARD;

// // const WorkerDecisionScreen = ({ navigation }) => {
// //     const [decisions, setDecisions] = useState([]);
// //     const [searchQuery, setSearchQuery] = useState('');
// //     const [isLoading, setIsLoading] = useState(true);

// //     useEffect(() => {
// //         fetchDecisions();
// //     }, []);

// //     const fetchDecisions = async () => {
// //         setIsLoading(true);
// //         try {
// //             const token = await AsyncStorage.getItem('userToken');
// //             const response = await fetch(`${API_BASE}/GetClientWorkerDecisions`, {
// //                 headers: { 'Authorization': `Bearer ${token}` }
// //             });

// //             if (response.ok) {
// //                 const data = await response.json();
// //                 setDecisions(data);
// //             } else {
// //                 NotificationHelper.showError("Failed to fetch decisions.");
// //             }
// //         } catch (error) {
// //             console.error(error);
// //             NotificationHelper.showError("Server error.");
// //         } finally {
// //             setIsLoading(false);
// //         }
// //     };

// //     const handleConfirm = async (id) => {
// //         try {
// //             const token = await AsyncStorage.getItem('userToken');
// //             const response = await fetch(`${API_BASE}/ClientConfirmWorkerAcceptance/${id}`, {
// //                 method: 'PUT',
// //                 headers: { 'Authorization': `Bearer ${token}` }
// //             });
// //             if (response.ok) {
// //                 NotificationHelper.showSuccess("Worker acceptance successfully confirmed!");
// //                 fetchDecisions();
// //             } else {
// //                 NotificationHelper.showError("Failed to confirm acceptance.");
// //             }
// //         } catch (error) {
// //             console.error(error);
// //             NotificationHelper.showError("Network Error");
// //         }
// //     };

// //     const handleDismiss = async (id) => {
// //         try {
// //             const token = await AsyncStorage.getItem('userToken');
// //             const response = await fetch(`${API_BASE}/ClientDismissWorkerRejection/${id}`, {
// //                 method: 'DELETE',
// //                 headers: { 'Authorization': `Bearer ${token}` }
// //             });
// //             if (response.ok) {
// //                 setDecisions(prev => prev.filter(d => d.id !== id));
// //                 navigation.navigate('FindServiceScreen'); // "View Other Worker" behavior
// //             } else {
// //                 NotificationHelper.showError("Failed to dismiss.");
// //             }
// //         } catch (error) {
// //             console.error(error);
// //             NotificationHelper.showError("Network Error");
// //         }
// //     };

// //     const filteredDecisions = decisions.filter(d =>
// //         d.workerName && d.workerName.toLowerCase().includes(searchQuery.toLowerCase())
// //     );

// //     const renderDecisionCard = (item) => {
// //         const isRejected = item.type === 'rejected';
// //         const borderColor = isRejected ? '#FF5252' : '#4CAF50';
// //         const statusBg = isRejected ? '#FFCDD2' : '#C8E6C9';
// //         const statusTextColor = isRejected ? '#D32F2F' : '#388E3C';

// //         return (
// //             <View key={item.id} style={[styles.card, { borderColor: borderColor }]}>
// //                 <Text style={[styles.headerLabel, { color: isRejected ? '#FF5252' : '#4CAF50' }]}>
// //                     {isRejected ? 'Worker Rejected!' : 'Worker Accepted!'}
// //                 </Text>

// //                 <View style={styles.workerRow}>
// //                     <View style={styles.imageWrapper}>
// //                         <Image
// //                             source={{ 
// //                                 uri: item.workerImage && item.workerImage.startsWith('/') 
// //                                     ? `${SERVER_BASE}${item.workerImage}` 
// //                                     : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
// //                             }}
// //                             style={styles.avatar}
// //                         />
// //                         <View style={styles.verifyIcon}>
// //                             <Icon name="account-check" size={12} color="#000" />
// //                         </View>
// //                     </View>

// //                     <View style={styles.nameContainer}>
// //                         <Text style={styles.workerName}>{item.workerName}</Text>
// //                         <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
// //                             <Text style={[styles.statusText, { color: statusTextColor }]}>{item.status}</Text>
// //                         </View>
// //                     </View>
// //                 </View>

// //                 <View style={styles.infoSection}>
// //                     <Text style={styles.infoText}><Text style={styles.bold}>Decision Date:</Text> {item.date}</Text>
// //                     <Text style={styles.infoText}><Text style={styles.bold}>Job Role:</Text> {item.role}</Text>
// //                     <Text style={styles.infoText}><Text style={styles.bold}>Address:</Text> {item.address}</Text>
// //                     <Text style={styles.description}>{item.message}</Text>
// //                 </View>

// //                 <View style={styles.actionContainer}>
// //                     {item.type === 'accepted' ? (
// //                         <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item.id)}>
// //                             <Text style={styles.confirmBtnText}>Confirm</Text>
// //                         </TouchableOpacity>
// //                     ) : item.type === 'rejected' ? (
// //                         <TouchableOpacity style={styles.viewOtherBtn} onPress={() => handleDismiss(item.id)}>
// //                             <Text style={styles.viewOtherText}>View Other Worker</Text>
// //                         </TouchableOpacity>
// //                     ) : (
// //                         <View style={[styles.confirmBtn, { backgroundColor: '#4CAF50', opacity: 0.8 }]}>
// //                             <Text style={styles.confirmBtnText}>Hired</Text>
// //                         </View>
// //                     )}
// //                 </View>
// //             </View>
// //         );
// //     };

// //     return (
// //         <SafeAreaView style={styles.container}>
// //             <StatusBar barStyle="dark-content" />

// //             {/* Visual Background Decoration */}
// //             <View style={styles.bgDecoration} />

// //             <View style={styles.header}>
// //                 <View style={styles.topRow}>
// //                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
// //                         <Icon name="arrow-left" size={20} color="#666" />
// //                     </TouchableOpacity>
// //                     <Text style={styles.screenTitle}>Worker Decision</Text>
// //                     <Image
// //                         source={{ uri: 'https://servantmaidonline.com/logo.png' }}
// //                         style={styles.logo}
// //                     />
// //                 </View>

// //                 <View style={styles.searchBox}>
// //                     <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
// //                     <TextInput
// //                         placeholder="Search by Worker name"
// //                         style={styles.inputField}
// //                         placeholderTextColor="#999"
// //                         value={searchQuery}
// //                         onChangeText={setSearchQuery}
// //                     />
// //                 </View>
// //             </View>

// //             <ScrollView contentContainerStyle={styles.listPadding}>
// //                 {isLoading ? (
// //                     <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
// //                 ) : filteredDecisions.length === 0 ? (
// //                     <Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>No worker decisions available.</Text>
// //                 ) : (
// //                     filteredDecisions.map(renderDecisionCard)
// //                 )}
// //             </ScrollView>
// //         </SafeAreaView>
// //     );
// // };

// // const styles = StyleSheet.create({
// //     container: { flex: 1, backgroundColor: '#FFF' },
// //     bgDecoration: {
// //         position: 'absolute',
// //         top: -40,
// //         left: -40,
// //         width: 180,
// //         height: 180,
// //         borderRadius: 90,
// //         backgroundColor: '#E3F2FD',
// //         zIndex: -1,
// //     },
// //     header: { padding: 20 },
// //     topRow: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         justifyContent: 'center',
// //         marginBottom: 15,
// //         position: 'relative'
// //     },
// //     backBtn: {
// //         position: 'absolute',
// //         left: 0,
// //         width: 36,
// //         height: 36,
// //         borderRadius: 18,
// //         backgroundColor: '#F5F5F5',
// //         justifyContent: 'center',
// //         alignItems: 'center'
// //     },
// //     screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
// //     logo: { width: 35, height: 35, position: 'absolute', right: 0 },
// //     searchBox: {
// //         flexDirection: 'row',
// //         alignItems: 'center',
// //         backgroundColor: '#FFF',
// //         borderRadius: 25,
// //         borderWidth: 1,
// //         borderColor: '#E0E0E0',
// //         paddingHorizontal: 15,
// //         height: 48,
// //         elevation: 2,
// //     },
// //     inputField: { flex: 1, fontSize: 15, color: '#000' },
// //     searchIcon: { marginRight: 8 },
// //     listPadding: { paddingHorizontal: 15, paddingBottom: 20 },
// //     card: {
// //         backgroundColor: '#FFF',
// //         borderRadius: 12,
// //         padding: 15,
// //         marginBottom: 20,
// //         borderWidth: 1,
// //         elevation: 3,
// //         shadowColor: '#000',
// //         shadowOpacity: 0.1,
// //         shadowRadius: 4,
// //         shadowOffset: { width: 0, height: 2 },
// //     },
// //     headerLabel: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
// //     workerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
// //     imageWrapper: { position: 'relative' },
// //     avatar: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#F0F0F0' },
// //     verifyIcon: {
// //         position: 'absolute',
// //         bottom: 2,
// //         right: 2,
// //         backgroundColor: '#FFF',
// //         borderRadius: 10,
// //         padding: 2,
// //         borderWidth: 1,
// //         borderColor: '#CCC'
// //     },
// //     nameContainer: { marginLeft: 15 },
// //     workerName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
// //     statusBadge: {
// //         paddingHorizontal: 12,
// //         paddingVertical: 3,
// //         borderRadius: 15,
// //         marginTop: 6,
// //         alignSelf: 'flex-start'
// //     },
// //     statusText: { fontSize: 13, fontWeight: 'bold' },
// //     infoSection: { marginBottom: 20 },
// //     infoText: { fontSize: 15, color: '#333', marginBottom: 5 },
// //     bold: { fontWeight: 'bold' },
// //     description: { fontSize: 14, color: '#444', marginTop: 8, lineHeight: 20 },
// //     actionContainer: { alignItems: 'center' },
// //     confirmBtn: {
// //         backgroundColor: '#1E64D3',
// //         paddingVertical: 10,
// //         paddingHorizontal: 50,
// //         borderRadius: 20,
// //         elevation: 3,
// //     },
// //     confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
// //     viewOtherBtn: {
// //         backgroundColor: '#B0BEC5',
// //         paddingVertical: 10,
// //         paddingHorizontal: 30,
// //         borderRadius: 20,
// //         elevation: 2,
// //     },
// //     viewOtherText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
// // });

// // export default WorkerDecisionScreen;


// import React, { useState, useEffect } from 'react';
// import {
//     StyleSheet, View, Text, Image, TouchableOpacity,
//     TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NotificationHelper from '../Notification/NotificationHelper';
// import { SERVER_BASE } from '../../config';

// const API_BASE = `${SERVER_BASE}/api/Dashboard`;

// const WorkerDecisionScreen = ({ navigation }) => {
//     const [decisions, setDecisions] = useState([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         fetchDecisions();
//     }, []);

//     const fetchDecisions = async () => {
//         setIsLoading(true);
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const res = await fetch(
//                 `${API_BASE}/GetClientWorkerDecisions`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             if (!res.ok) {
//                 NotificationHelper.showError('Failed to fetch decisions.');
//                 return;
//             }

//             const data = await res.json();
//             setDecisions(data);
//         } catch (err) {
//             console.error(err);
//             NotificationHelper.showError('Server error.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleConfirm = async (hiringId) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const res = await fetch(
//                 `${API_BASE}/ClientConfirmWorkerAcceptance/${hiringId}`,
//                 { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
//             );
//             if (res.ok) {
//                 NotificationHelper.showSuccess('Worker acceptance confirmed!');
//                 fetchDecisions();
//             } else {
//                 NotificationHelper.showError('Failed to confirm acceptance.');
//             }
//         } catch (err) {
//             console.error(err);
//             NotificationHelper.showError('Network Error');
//         }
//     };

//     const handleDismiss = async (hiringId) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const res = await fetch(
//                 `${API_BASE}/ClientDismissWorkerRejection/${hiringId}`,
//                 { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
//             );
//             if (res.ok) {
//                 NotificationHelper.showSuccess('You can view other workers now.');
//                 // Remove from local state
//                 setDecisions(prev => prev.filter(d => d.id !== hiringId));
//                 navigation.navigate('FindServiceScreen');
//             } else {
//                 NotificationHelper.showError('Failed to dismiss.');
//             }
//         } catch (err) {
//             console.error(err);
//             NotificationHelper.showError('Network Error');
//         }
//     };

//     const filtered = decisions.filter(d =>
//         d.workerName.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     const renderDecisionCard = (item) => {
//         const { id, workerName, workerImage, date, role, address, message, status, type } = item;

//         const isRejected = type === 'rejected';
//         const isAccepted = type === 'accepted' || type === 'finalized';
//         const clientConfirmed = type === 'finalized';

//         // Colors
//         const borderColor = isRejected ? '#FF5252' : '#4CAF50';
//         const statusBg = isRejected ? '#FFCDD2' : '#C8E6C9';
//         const statusTextColor = isRejected ? '#D32F2F' : '#388E3C';

//         // Worker avatar fallback
//         const avatarUri = workerImage && workerImage.startsWith('/')
//             ? `${SERVER_BASE}${workerImage}`
//             : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

//         return (
//             <View key={id} style={[styles.card, { borderColor }]}>
//                 <Text style={[styles.headerLabel, { color: borderColor }]}>
//                     {isRejected ? 'Worker Rejected!' : 'Worker Accepted!'}
//                 </Text>

//                 <View style={styles.workerRow}>
//                     <View style={styles.imageWrapper}>
//                         <Image source={{ uri: avatarUri }} style={styles.avatar} />
//                         <View style={styles.verifyIcon}>
//                             <Icon name={isRejected ? "account-cancel" : "account-check"} size={12} color="#000" />
//                         </View>
//                     </View>
//                     <View style={styles.nameContainer}>
//                         <Text style={styles.workerName}>{workerName}</Text>
//                         <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
//                             <Text style={[styles.statusText, { color: statusTextColor }]}>
//                                 {status}
//                             </Text>
//                         </View>
//                     </View>
//                 </View>

//                 <View style={styles.infoSection}>
//                     <Text style={styles.infoText}>
//                           <Text style={styles.bold}>Decision Date:</Text> {date}
//                       </Text>
//                       <Text style={styles.infoText}>
//                           <Text style={styles.bold}>Job Role:</Text> {role}
//                       </Text>
//                       <Text style={styles.infoText}>
//                           <Text style={styles.bold}>Address:</Text> {address}
//                       </Text>
//                     <Text style={styles.description}>{message}</Text>
//                 </View>

//                 <View style={styles.actionContainer}>
//                     {isAccepted && !clientConfirmed && (
//                         <TouchableOpacity
//                             style={styles.confirmBtn}
//                             onPress={() => handleConfirm(id)}
//                         >
//                             <Text style={styles.confirmBtnText}>Confirm</Text>
//                         </TouchableOpacity>
//                     )}

//                     {isRejected && (
//                         <TouchableOpacity
//                             style={styles.viewOtherBtn}
//                             onPress={() => handleDismiss(id)}
//                         >
//                             <Text style={styles.viewOtherText}>View Other Worker</Text>
//                         </TouchableOpacity>
//                     )}

//                     {isAccepted && clientConfirmed && (
//                         <View style={[styles.confirmBtn, { backgroundColor: '#4CAF50', opacity: 0.8 }]}>
//                             <Text style={styles.confirmBtnText}>Hired</Text>
//                         </View>
//                     )}
//                 </View>
//             </View>
//         );
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <StatusBar barStyle="dark-content" />

//             <View style={styles.bgDecoration} />

//             <View style={styles.header}>
//                 <View style={styles.topRow}>
//                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//                         <Icon name="arrow-left" size={20} color="#666" />
//                     </TouchableOpacity>
//                     <Text style={styles.screenTitle}>Worker Decision</Text>
//                 </View>

//                 <View style={styles.searchBox}>
//                     <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
//                     <TextInput
//                         placeholder="Search by worker name"
//                         style={styles.inputField}
//                         value={searchQuery}
//                         onChangeText={setSearchQuery}
//                     />
//                 </View>
//             </View>

//             <ScrollView contentContainerStyle={styles.listPadding}>
//                 {isLoading ? (
//                     <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
//                 ) : filtered.length === 0 ? (
//                     <Text style={styles.emptyText}>
//                         No worker decisions available.
//                     </Text>
//                 ) : (
//                     filtered.map(renderDecisionCard)
//                 )}
//             </ScrollView>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#FFF' },
//     bgDecoration: {
//         position: 'absolute', top: -40, left: -40,
//         width: 180, height: 180, borderRadius: 90,
//         backgroundColor: '#E3F2FD', zIndex: -1
//     },
//     header: { padding: 20 },
//     topRow: {
//         flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//         marginBottom: 15, position: 'relative'
//     },
//     backBtn: {
//         position: 'absolute', left: 0, width: 36, height: 36,
//         borderRadius: 18, backgroundColor: '#F5F5F5',
//         justifyContent: 'center', alignItems: 'center'
//     },
//     screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
//     searchBox: {
//         flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
//         borderRadius: 25, borderWidth: 1, borderColor: '#E0E0E0',
//         paddingHorizontal: 15, height: 48, elevation: 2,
//     },
//     inputField: { flex: 1, fontSize: 15, color: '#000' },
//     searchIcon: { marginRight: 8 },
//     listPadding: { paddingHorizontal: 15, paddingBottom: 20 },

//     card: {
//         backgroundColor: '#FFF', borderRadius: 12, padding: 15,
//         marginBottom: 20, borderWidth: 1, elevation: 3,
//         shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
//         shadowOffset: { width: 0, height: 2 },
//     },
//     headerLabel: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
//     workerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
//     imageWrapper: { position: 'relative' },
//     avatar: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#F0F0F0' },
//     verifyIcon: {
//         position: 'absolute', bottom: 2, right: 2,
//         backgroundColor: '#FFF', borderRadius: 10, padding: 2,
//         borderWidth: 1, borderColor: '#CCC'
//     },
//     nameContainer: { marginLeft: 15 },
//     workerName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
//     statusBadge: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 15, marginTop: 6 },
//     statusText: { fontSize: 13, fontWeight: 'bold' },

//     infoSection: { marginBottom: 20 },
//     infoText: { fontSize: 15, color: '#333', marginBottom: 5 },
//     bold: { fontWeight: 'bold' },
//     description: { fontSize: 14, color: '#444', marginTop: 8, lineHeight: 20 },

//     actionContainer: { alignItems: 'center' },
//     confirmBtn: {
//         backgroundColor: '#1E64D3', paddingVertical: 10,
//         paddingHorizontal: 50, borderRadius: 20, elevation: 3,
//     },
//     confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

//     viewOtherBtn: {
//         backgroundColor: '#B0BEC5', paddingVertical: 10,
//         paddingHorizontal: 30, borderRadius: 20, elevation: 2,
//     },
//     viewOtherText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

//     emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' },
// });

// export default WorkerDecisionScreen;
import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity, TextInput,
    ScrollView, SafeAreaView, StatusBar, ActivityIndicator
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
    const [submittingId, setSubmittingId] = useState(null);

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
                NotificationHelper.showError("Failed to fetch decision tracking records.");
            }
        } catch (error) {
            NotificationHelper.showError("Network connection failure.");
        } finally {
            setIsLoading(false);
        }
    };

    // Rule 5: User confirms and finalizes accepted worker responses
    const handleFinalizeHiring = async (hiringId) => {
        setSubmittingId(hiringId);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/FinalizeHiringDecision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    HiringId: hiringId,
                    HiringDecision: 'Accepted'
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Hiring decision finalized successfully.');
                await fetchDecisions();
            } else {
                NotificationHelper.showError("Failed to update final hiring state.");
            }
        } catch (error) {
            NotificationHelper.showError("Network failure processing handshake.");
        } finally {
            setSubmittingId(null);
        }
    };

    const filteredDecisions = decisions.filter(item =>
        item.workerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.workerSkill?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#1E64D3" barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Worker Job Decisions</Text>
                <TouchableOpacity onPress={fetchDecisions}>
                    <Icon name="refresh" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
                <Icon name="magnify" size={22} color="#7F8C8D" />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search by worker name or role..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#1E64D3" style={styles.loader} />
            ) : filteredDecisions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="comment-question-outline" size={60} color="#BDC3C7" />
                    <Text style={styles.emptyText}>No pending active worker job offer decisions located.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {filteredDecisions.map((item) => {
                        const imgSource = item.workerImage
                            ? { uri: item.workerImage.startsWith('http') ? item.workerImage : `${SERVER_BASE}${item.workerImage}` }
                            : require('../../images/default-user.png');

                        // Style configurations dynamically parsed out of Hiring state values
                        let badgeBg = '#E0F7FA';
                        let badgeTextCol = '#006064';
                        let trackingLabel = 'Offer Pending';

                        if (item.workerDecision === 'Accepted') {
                            badgeBg = '#E8F5E9';
                            badgeTextCol = '#2E7D32';
                            trackingLabel = 'Worker Accepted Offer';
                        } else if (item.workerDecision === 'Rejected') {
                            badgeBg = '#FFEBEE';
                            badgeTextCol = '#C62828';
                            trackingLabel = 'Worker Declined Offer';
                        }

                        return (
                            <View key={item.hiringId} style={styles.card}>
                                <View style={styles.profileRow}>
                                    <Image source={imgSource} style={styles.avatar} />
                                    <View style={styles.nameContainer}>
                                        <Text style={styles.workerName}>{item.workerName}</Text>
                                        <Text style={styles.workerSkill}>{item.workerSkill}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                                            <Text style={[styles.statusText, { color: badgeTextCol }]}>{trackingLabel}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.infoSection}>
                                    <Text style={styles.infoText}><Text style={styles.bold}>Service Location: </Text>{item.address}</Text>
                                    {item.hiringDate && (
                                        <Text style={styles.infoText}>
                                            <Text style={styles.bold}>Sent Date: </Text>
                                            {new Date(item.hiringDate).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>

                                {/* Show operational action buttons only if worker accepted and hiring decision is still pending */}
                                {item.workerDecision === 'Accepted' && item.hiringDecision === 'Pending' && (
                                    <View style={styles.actionRow}>
                                        {submittingId === item.hiringId ? (
                                            <ActivityIndicator size="small" color="#1E64D3" />
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.confirmBtn]}
                                                onPress={() => handleFinalizeHiring(item.hiringId)}
                                            >
                                                <Text style={styles.confirmBtnText}>Finalize Hire</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {item.hiringDecision === 'Accepted' && (
                                    <View style={styles.completedBadge}>
                                        <Icon name="check-all" size={16} color="#155724" />
                                        <Text style={styles.completedBadgeText}>Hiring Handshake Finalized</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFC' },
    header: { height: 60, backgroundColor: '#1E64D3', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, elevation: 4 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 15, paddingHorizontal: 12, borderRadius: 10, height: 45, borderWidth: 1, borderColor: '#EAEAEA' },
    searchBar: { flex: 1, marginLeft: 8, fontSize: 15, color: '#000' },
    loader: { marginTop: 40 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', color: '#7F8C8D', fontSize: 15, marginTop: 10 },
    scrollContainer: { paddingHorizontal: 15, paddingBottom: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EAEAEA', elevation: 2 },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F0F0' },
    nameContainer: { marginLeft: 15, flex: 1 },
    workerName: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
    workerSkill: { fontSize: 14, color: '#7F8C8D', marginBottom: 4 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    infoSection: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10, marginBottom: 12 },
    infoText: { fontSize: 14, color: '#34495E', marginBottom: 4 },
    bold: { fontWeight: '600', color: '#2C3E50' },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 },
    actionBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10, minWidth: 100, alignItems: 'center' },
    declineBtn: { backgroundColor: '#FADBD8' },
    declineBtnText: { color: '#C0392B', fontWeight: '700', fontSize: 13 },
    confirmBtn: { backgroundColor: '#1E64D3' },
    confirmBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4EDDA', paddingVertical: 8, borderRadius: 8, marginTop: 5 },
    completedBadgeText: { color: '#155724', fontWeight: '600', fontSize: 13, marginLeft: 6 }
});

export default WorkerDecisionScreen;