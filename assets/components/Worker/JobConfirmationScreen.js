// import React, { useState, useEffect } from 'react';
// import {
//     StyleSheet,
//     View,
//     Text,
//     Image,
//     TouchableOpacity,
//     TextInput,
//     ScrollView,
//     SafeAreaView,
//     StatusBar,
//     ActivityIndicator
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NotificationHelper from '../Notification/NotificationHelper';
// import { API_DASHBOARD, SERVER_BASE } from '../../config';

// const API_BASE = API_DASHBOARD;

// const JobConfirmationScreen = ({ navigation }) => {
//     const [jobs, setJobs] = useState([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         fetchJobConfirmations();
//     }, []);

//     const fetchJobConfirmations = async () => {
//         setIsLoading(true);
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const response = await fetch(`${API_BASE}/GetWorkerJobConfirmations`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 setJobs(data);
//             } else {
//                 NotificationHelper.showError("Failed to fetch jobs.");
//             }
//         } catch (error) {
//             console.error(error);
//             NotificationHelper.showError("Server error.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleAcceptJob = async (id) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const response = await fetch(`${API_BASE}/WorkerAcceptJobOffer/${id}`, {
//                 method: 'PUT',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (response.ok) {
//                 NotificationHelper.showSuccess("Job Accepted! You are now hired.");
//                 fetchJobConfirmations(); // Refresh
//             } else {
//                 NotificationHelper.showError("Error accepting job.");
//             }
//         } catch (error) {
//             console.error(error);
//             NotificationHelper.showError("Network Error");
//         }
//     };

//     const handleRejectJob = async (id) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const response = await fetch(`${API_BASE}/WorkerRejectJobOffer/${id}`, {
//                 method: 'PUT',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (response.ok) {
//                 NotificationHelper.showSuccess("Job offer rejected.");
//                 fetchJobConfirmations(); // Refresh
//             } else {
//                 NotificationHelper.showError("Error rejecting job.");
//             }
//         } catch (error) {
//             console.error(error);
//             NotificationHelper.showError("Network Error");
//         }
//     };

//     const handleDeleteJob = async (id) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const response = await fetch(`${API_BASE}/DeleteInterviewRequest/${id}`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (response.ok) {
//                 NotificationHelper.showSuccess("Job request removed from your list.");
//                 setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
//             } else {
//                 NotificationHelper.showError("Failed to remove request.");
//             }
//         } catch (error) {
//             console.error(error);
//             NotificationHelper.showError("Network Error");
//         }
//     };

//     // Filter jobs by client name
//     const filteredJobs = jobs.filter(job => 
//         job.clientName && job.clientName.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     const renderJobCard = (item) => {
//         // Styling logic based on job type
//         const isRejected = item.type === 'rejected';
//         const isTerminated = item.type === 'terminated';
//         const isNegative = isRejected || isTerminated;

//         const borderColor = isNegative ? '#FF5252' : '#4CAF50';
//         const statusBg = isNegative ? '#FFCDD2' : '#C8E6C9';
//         const statusTextColor = isNegative ? '#D32F2F' : '#388E3C';

//         return (
//             <View key={item.id} style={[styles.card, { borderColor: borderColor }]}>
//                 <Text style={[styles.offerHeader, { color: borderColor }]}>
//                     {isTerminated ? 'Contract Terminated!' : (isRejected ? 'Job Rejected!' : 'Job Offered!')}
//                 </Text>

//                 <View style={styles.clientRow}>
//                     <View style={styles.imageContainer}>
//                         <Image
//                             source={{ 
//                                 uri: item.clientImage && item.clientImage.startsWith('/') 
//                                     ? `${SERVER_BASE}${item.clientImage}` 
//                                     : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
//                             }}
//                             style={styles.avatar}
//                         />
//                         <View style={styles.verifiedIcon}>
//                             <Icon name="account-check" size={12} color="#000" />
//                         </View>
//                     </View>

//                     <View style={styles.nameCol}>
//                         <Text style={styles.clientName}>{item.clientName}</Text>
//                         <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
//                             <Text style={[styles.statusText, { color: statusTextColor }]}>{item.status}</Text>
//                         </View>
//                     </View>
//                 </View>

//                 <View style={styles.detailsSection}>
//                     <Text style={styles.detailItem}><Text style={styles.bold}>Interview Date:</Text> {item.date}</Text>
//                     <Text style={styles.detailItem}><Text style={styles.bold}>Job Rule:</Text> {item.role}</Text>
//                     <Text style={styles.detailItem}><Text style={styles.bold}>Address:</Text> {item.address}</Text>
//                     <Text style={styles.messageText}>{item.message}</Text>
//                 </View>

//                 {/* Dynamic Action Buttons */}
//                 <View style={styles.buttonRow}>
//                     {item.type === 'offered' && (
//                         <>
//                             <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectJob(item.id)}>
//                                 <Text style={styles.btnTextGrey}>Reject</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptJob(item.id)}>
//                                 <Text style={styles.btnTextWhite}>Accept</Text>
//                             </TouchableOpacity>
//                         </>
//                     )}

//                     {(item.type === 'rejected' || item.type === 'terminated') && (
//                         <TouchableOpacity 
//                             style={[styles.deleteBtn, isTerminated && { backgroundColor: '#FF5252' }]} 
//                             onPress={() => handleDeleteJob(item.id)}
//                         >
//                             <Text style={[styles.btnTextGrey, isTerminated && { color: '#FFF' }]}>Delete</Text>
//                         </TouchableOpacity>
//                     )}

//                     {item.type === 'final' && (
//                         <TouchableOpacity style={[styles.finalAcceptedBtn, { backgroundColor: '#008000' }]} disabled={true}>
//                             <Text style={styles.btnTextWhite}>Accepted</Text>
//                         </TouchableOpacity>
//                     )}
//                 </View>
//             </View>
//         );
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <StatusBar barStyle="dark-content" />

//             {/* Background Decoration */}
//             <View style={styles.blueCircle} />

//             <View style={styles.header}>
//                 <View style={styles.titleRow}>
//                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//                         <Icon name="arrow-left" size={24} color="#555" />
//                     </TouchableOpacity>
//                     <Text style={styles.headerTitle}>Job Confirmation</Text>
//                     <Image
//                         source={{ uri: 'https://servantmaidonline.com/logo.png' }}
//                         style={styles.logo}
//                     />
//                 </View>

//                 <View style={styles.searchBar}>
//                     <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
//                     <TextInput
//                         placeholder="Search by client name"
//                         style={styles.searchInput}
//                         placeholderTextColor="#999"
//                         value={searchQuery}
//                         onChangeText={setSearchQuery}
//                     />
//                 </View>
//             </View>

//             <ScrollView contentContainerStyle={styles.scrollContent}>
//                 {isLoading ? (
//                     <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
//                 ) : filteredJobs.length === 0 ? (
//                     <Text style={{ textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' }}>No job confirmations available.</Text>
//                 ) : (
//                     filteredJobs.map(renderJobCard)
//                 )}
//             </ScrollView>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#FFF' },
//     blueCircle: {
//         position: 'absolute',
//         top: -50,
//         left: -50,
//         width: 200,
//         height: 200,
//         borderRadius: 100,
//         backgroundColor: '#E3F2FD',
//         zIndex: -1,
//     },
//     header: { padding: 20 },
//     titleRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 15,
//     },
//     backBtn: { padding: 5 },
//     headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
//     logo: { width: 40, height: 40, position: 'absolute', right: 0 },
//     searchBar: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#FFF',
//         borderRadius: 25,
//         borderWidth: 1,
//         borderColor: '#CCC',
//         paddingHorizontal: 15,
//         height: 45,
//         elevation: 2,
//     },
//     searchInput: { flex: 1, fontSize: 14, color: '#000' },
//     searchIcon: { marginRight: 10 },
//     scrollContent: { paddingHorizontal: 15, paddingBottom: 20 },
//     card: {
//         backgroundColor: '#FFF',
//         borderRadius: 15,
//         padding: 15,
//         marginBottom: 20,
//         borderWidth: 1,
//         elevation: 3,
//     },
//     offerHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
//     clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
//     imageContainer: { position: 'relative' },
//     avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EEE' },
//     verifiedIcon: {
//         position: 'absolute',
//         bottom: 0,
//         right: 0,
//         backgroundColor: '#FFF',
//         borderRadius: 10,
//         padding: 2,
//         borderWidth: 1,
//     },
//     nameCol: { marginLeft: 15 },
//     clientName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
//     statusBadge: {
//         paddingHorizontal: 15,
//         paddingVertical: 3,
//         borderRadius: 15,
//         marginTop: 5,
//         alignSelf: 'flex-start'
//     },
//     statusText: { fontSize: 13, fontWeight: 'bold' },
//     detailsSection: { marginBottom: 15 },
//     detailItem: { fontSize: 15, color: '#333', marginBottom: 4 },
//     bold: { fontWeight: 'bold' },
//     messageText: { fontSize: 14, color: '#444', lineHeight: 20, marginTop: 5 },
//     buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
//     rejectBtn: {
//         backgroundColor: '#CFD8DC',
//         paddingHorizontal: 30,
//         paddingVertical: 10,
//         borderRadius: 20,
//         marginRight: 15,
//         elevation: 2
//     },
//     acceptBtn: {
//         backgroundColor: '#1E64D3',
//         paddingHorizontal: 30,
//         paddingVertical: 10,
//         borderRadius: 20,
//         elevation: 2
//     },
//     deleteBtn: {
//         backgroundColor: '#CFD8DC',
//         paddingHorizontal: 30,
//         paddingVertical: 10,
//         borderRadius: 20,
//         elevation: 2
//     },
//     finalAcceptedBtn: {
//         backgroundColor: '#008000',
//         paddingHorizontal: 40,
//         paddingVertical: 10,
//         borderRadius: 20,
//         width: '100%',
//         alignItems: 'center'
//     },
//     btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
//     btnTextGrey: { color: '#607D8B', fontWeight: 'bold', fontSize: 16 }
// });

// export default JobConfirmationScreen;




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

// const JobConfirmationScreen = ({ navigation }) => {
//     const [jobs, setJobs] = useState([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         fetchJobConfirmations();
//     }, []);

//     const fetchJobConfirmations = async () => {
//         setLoading(true);
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             // you may need workerId if your endpoint requires it:
//             // const workerId = await AsyncStorage.getItem('workerId');
//             const res = await fetch(
//                 `${API_BASE}/GetWorkerJobConfirmations`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             if (!res.ok) {
//                 NotificationHelper.showError('Failed to fetch job offers.');
//                 return;
//             }
//             // Expect each item to include a nested `hiring` object
//             const data = await res.json();
//             setJobs(data);
//         } catch (err) {
//             console.error(err);
//             NotificationHelper.showError('Server error.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Worker accepts the offer
//     const handleAcceptJob = async (hiringId) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const res = await fetch(
//                 `${API_BASE}/WorkerAcceptJobOffer/${hiringId}`,
//                 { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
//             );
//             if (res.ok) {
//                 NotificationHelper.showSuccess('Job accepted!');
//                 fetchJobConfirmations();
//             } else {
//                 NotificationHelper.showError('Error accepting job.');
//             }
//         } catch {
//             NotificationHelper.showError('Network Error');
//         }
//     };

//     // Worker rejects the offer
//     const handleRejectJob = async (hiringId) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const res = await fetch(
//                 `${API_BASE}/WorkerRejectJobOffer/${hiringId}`,
//                 { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
//             );
//             if (res.ok) {
//                 NotificationHelper.showSuccess('Job offer rejected.');
//                 fetchJobConfirmations();
//             } else {
//                 NotificationHelper.showError('Error rejecting job.');
//             }
//         } catch {
//             NotificationHelper.showError('Network Error');
//         }
//     };

//     // After rejection or termination, remove the hiring record from the list
//     const handleDeleteJob = async (hiringId) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const res = await fetch(
//                 `${API_BASE}/DeleteHiringRecord/${hiringId}`,
//                 { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
//             );
//             if (res.ok) {
//                 NotificationHelper.showSuccess('Job request removed.');
//                 setJobs(jobs.filter(j => j.hiring.hiringId !== hiringId));
//             } else {
//                 NotificationHelper.showError('Failed to remove request.');
//             }
//         } catch {
//             NotificationHelper.showError('Network Error');
//         }
//     };

//     // Filter by client name
//     const filteredJobs = jobs.filter(job =>
//         job.clientName.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     const renderJobCard = (item) => {
//         const {
//             interviewId, clientName, clientImage,
//             date, role, address, message, hiring
//         } = item;
//         const { hiringId, workerDecision, hiringDecision } = hiring;

//         // Determine UI state
//         const pendingWorker = workerDecision === 'Pending' && hiringDecision === 'Pending';
//         const rejectedWorker = workerDecision === 'Rejected';
//         const acceptedWorker = workerDecision === 'Accepted' && hiringDecision === 'Pending';
//         const finalized = workerDecision === 'Accepted' && hiringDecision === 'Accepted';

//         // Colors
//         const borderColor = rejectedWorker ? '#FF5252' : '#4CAF50';
//         const statusBg = rejectedWorker ? '#FFCDD2' : '#C8E6C9';
//         const statusTextColor = rejectedWorker ? '#D32F2F' : '#388E3C';

//         // Avatar fallback
//         const avatarUri = clientImage && clientImage.startsWith('/')
//             ? `${SERVER_BASE}${clientImage}`
//             : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

//         return (
//             <View key={hiringId} style={[styles.card, { borderColor }]}>
//                 <Text style={[styles.offerHeader, { color: borderColor }]}>
//                     {rejectedWorker
//                         ? 'Job Rejected'
//                         : finalized
//                             ? 'Hired!'
//                             : pendingWorker
//                                 ? 'New Job Offer'
//                                 : 'Job Offer'}
//                 </Text>

//                 <View style={styles.clientRow}>
//                     <View style={styles.imageContainer}>
//                         <Image source={{ uri: avatarUri }} style={styles.avatar} />
//                         <View style={styles.verifiedIcon}>
//                             <Icon
//                                 name={rejectedWorker ? 'account-cancel' : 'account-check'}
//                                 size={12}
//                                 color="#000"
//                             />
//                         </View>
//                     </View>

//                     <View style={styles.nameCol}>
//                         <Text style={styles.clientName}>{clientName}</Text>
//                         <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
//                             <Text style={[styles.statusText, { color: statusTextColor }]}>
//                                 {workerDecision}
//                             </Text>
//                         </View>
//                     </View>
//                 </View>

//                 <View style={styles.detailsSection}>
//                     <Text style={styles.detailItem}>
//                         <Text style={styles.bold}>Interview Date:</Text> {date}
//                     </Text>
//                     <Text style={styles.detailItem}>
//                         <Text style={styles.bold}>Job Role:</Text> {role}
//                     </Text>
//                     <Text style={styles.detailItem}>
//                         <Text style={styles.bold}>Address:</Text> {address}
//                     </Text>
//                     <Text style={styles.messageText}>{message}</Text>
//                 </View>

//                 <View style={styles.buttonRow}>
//                     {pendingWorker && (
//                         <>
//                             <TouchableOpacity
//                                 style={styles.rejectBtn}
//                                 onPress={() => handleRejectJob(hiringId)}
//                             >
//                                 <Text style={styles.btnTextGrey}>Reject</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity
//                                 style={styles.acceptBtn}
//                                 onPress={() => handleAcceptJob(hiringId)}
//                             >
//                                 <Text style={styles.btnTextWhite}>Accept</Text>
//                             </TouchableOpacity>
//                         </>
//                     )}

//                     {rejectedWorker && (
//                         <TouchableOpacity
//                             style={styles.deleteBtn}
//                             onPress={() => handleDeleteJob(hiringId)}
//                         >
//                             <Text style={styles.btnTextGrey}>Delete</Text>
//                         </TouchableOpacity>
//                     )}

//                     {acceptedWorker && (
//                         <TouchableOpacity style={[styles.acceptBtn, { opacity: 0.7 }]} disabled>
//                             <Text style={styles.btnTextWhite}>Accepted</Text>
//                         </TouchableOpacity>
//                     )}

//                     {finalized && (
//                         <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: '#008000' }]} disabled>
//                             <Text style={styles.btnTextWhite}>Hired</Text>
//                         </TouchableOpacity>
//                     )}
//                 </View>
//             </View>
//         );
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             <StatusBar barStyle="dark-content" />

//             <View style={styles.blueCircle} />

//             <View style={styles.header}>
//                 <View style={styles.titleRow}>
//                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//                         <Icon name="arrow-left" size={24} color="#555" />
//                     </TouchableOpacity>
//                     <Text style={styles.headerTitle}>Job Confirmation</Text>
//                 </View>
//                 <View style={styles.searchBar}>
//                     <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
//                     <TextInput
//                         placeholder="Search by client name"
//                         style={styles.searchInput}
//                         value={searchQuery}
//                         onChangeText={setSearchQuery}
//                     />
//                 </View>
//             </View>

//             {loading ? (
//                 <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 20 }} />
//             ) : (
//                 <ScrollView contentContainerStyle={styles.scrollContent}>
//                     {filteredJobs.length === 0 ? (
//                         <Text style={styles.emptyText}>No job confirmations available.</Text>
//                     ) : (
//                         filteredJobs.map(renderJobCard)
//                     )}
//                 </ScrollView>
//             )}
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#FFF' },
//     blueCircle: {
//         position: 'absolute', top: -50, left: -50,
//         width: 200, height: 200, borderRadius: 100,
//         backgroundColor: '#E3F2FD', zIndex: -1
//     },
//     header: { padding: 20 },
//     titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
//     backBtn: { padding: 5 },
//     headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
//     searchBar: {
//         flexDirection: 'row', alignItems: 'center',
//         backgroundColor: '#FFF', borderRadius: 25,
//         borderWidth: 1, borderColor: '#CCC',
//         paddingHorizontal: 15, height: 45, elevation: 2
//     },
//     searchInput: { flex: 1, fontSize: 14, color: '#000' },
//     searchIcon: { marginRight: 10 },

//     scrollContent: { paddingHorizontal: 15, paddingBottom: 20 },
//     card: {
//         backgroundColor: '#FFF', borderRadius: 15,
//         padding: 15, marginBottom: 20,
//         borderWidth: 1, elevation: 3
//     },
//     offerHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
//     clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
//     imageContainer: { position: 'relative' },
//     avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EEE' },
//     verifiedIcon: {
//         position: 'absolute', bottom: 0, right: 0,
//         backgroundColor: '#FFF', borderRadius: 10, padding: 2,
//         borderWidth: 1, borderColor: '#CCC'
//     },
//     nameCol: { marginLeft: 15 },
//     clientName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
//     statusBadge: {
//         paddingHorizontal: 15, paddingVertical: 3,
//         borderRadius: 15, marginTop: 5
//     },
//     statusText: { fontSize: 13, fontWeight: 'bold' },

//     detailsSection: { marginBottom: 15 },
//     detailItem: { fontSize: 15, color: '#333', marginBottom: 4 },
//     bold: { fontWeight: 'bold' },
//     messageText: { fontSize: 14, color: '#444', lineHeight: 20, marginTop: 5 },

//     buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
//     rejectBtn: {
//         backgroundColor: '#CFD8DC', paddingHorizontal: 30,
//         paddingVertical: 10, borderRadius: 20, marginRight: 15, elevation: 2
//     },
//     acceptBtn: {
//         backgroundColor: '#1E64D3', paddingHorizontal: 30,
//         paddingVertical: 10, borderRadius: 20, elevation: 2
//     },
//     deleteBtn: {
//         backgroundColor: '#CFD8DC', paddingHorizontal: 30,
//         paddingVertical: 10, borderRadius: 20, elevation: 2
//     },
//     btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
//     btnTextGrey: { color: '#607D8B', fontWeight: 'bold', fontSize: 16 },

//     emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#999' },
// });

// export default JobConfirmationScreen;




import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, Image, TouchableOpacity,
    TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';

const API_BASE = `${SERVER_BASE}/api/Dashboard`;

const JobConfirmationScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchJobConfirmations();
    }, []);

    const fetchJobConfirmations = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/GetWorkerJobConfirmations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                NotificationHelper.showError('Failed to fetch job offers.');
                return;
            }
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            NotificationHelper.showError('Server error.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchJobConfirmations(false);
    }, []);

    // Worker accepts the offer
    const handleAcceptJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/WorkerAcceptJobOffer/${hiringId}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job accepted!');
                fetchJobConfirmations(false);
            } else {
                NotificationHelper.showError('Error accepting job.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // Worker rejects the offer
    const handleRejectJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/WorkerRejectJobOffer/${hiringId}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job offer rejected.');
                fetchJobConfirmations(false);
            } else {
                NotificationHelper.showError('Error rejecting job.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // After rejection or termination, remove the hiring record from the list
    const handleDeleteJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/ClientDismissWorkerRejection/${hiringId}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job request removed.');
                setJobs(prevJobs => prevJobs.filter(j => j?.id !== hiringId));
            } else {
                NotificationHelper.showError('Failed to remove request.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // Filter safely by client name
    const filteredJobs = jobs.filter(job =>
        job?.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderJobCard = (item) => {
        const {
            id, clientName, clientImage,
            date, role, address, message, type, status
        } = item;
        
        const hiringId = id;

        // Determine UI state
        const pendingWorker = type === 'offered';
        const rejectedWorker = type === 'rejected';
        const acceptedWorker = type === 'accepted';
        const finalized = type === 'final';
        const terminated = type === 'terminated';

        // Dynamic Card Color Configurations
        let borderColor = '#1E64D3'; // Default blue
        let statusBg = '#E3F2FD';
        let statusTextColor = '#1E64D3';
        let statusHeaderText = 'Job Offer';

        if (rejectedWorker) {
            borderColor = '#FF5252';
            statusBg = '#FFCDD2';
            statusTextColor = '#D32F2F';
            statusHeaderText = 'Job Rejected';
        } else if (finalized) {
            borderColor = '#4CAF50';
            statusBg = '#C8E6C9';
            statusTextColor = '#388E3C';
            statusHeaderText = 'Hired!';
        } else if (pendingWorker) {
            borderColor = '#FF9800'; // Amber alert warning status for explicit pending actions
            statusBg = '#FFE0B2';
            statusTextColor = '#E65100';
            statusHeaderText = 'New Job Offer';
        } else if (acceptedWorker) {
            borderColor = '#4CAF50';
            statusBg = '#C8E6C9';
            statusTextColor = '#388E3C';
            statusHeaderText = 'Awaiting Client Review';
        } else if (terminated) {
            borderColor = '#FF5252';
            statusBg = '#FFCDD2';
            statusTextColor = '#D32F2F';
            statusHeaderText = 'Contract Terminated';
        }

        // Avatar fallback URL
        const avatarUri = clientImage && clientImage.startsWith('/')
            ? `${SERVER_BASE}${clientImage}`
            : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

        return (
            <View key={hiringId.toString()} style={[styles.card, { borderColor }]}>
                <Text style={[styles.offerHeader, { color: borderColor }]}>
                    {statusHeaderText}
                </Text>

                <View style={styles.clientRow}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        <View style={styles.verifiedIcon}>
                            <Icon
                                name={rejectedWorker ? 'account-cancel' : 'account-check'}
                                size={12}
                                color={statusTextColor}
                            />
                        </View>
                    </View>

                    <View style={styles.nameCol}>
                        <Text style={styles.clientName}>{clientName || 'Client Profile'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusText, { color: statusTextColor }]}>
                                {status}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    <Text style={styles.detailItem}>
                        <Text style={styles.bold}>Interview Date:</Text> {date || 'N/A'}
                    </Text>
                    <Text style={styles.detailItem}>
                        <Text style={styles.bold}>Job Role:</Text> {role || 'N/A'}
                    </Text>
                    <Text style={styles.detailItem}>
                        <Text style={styles.bold}>Address:</Text> {address || 'N/A'}
                    </Text>
                    {message ? <Text style={styles.messageText}>{message}</Text> : null}
                </View>

                <View style={styles.buttonRow}>
                    {pendingWorker && (
                        <>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleRejectJob(hiringId)}
                            >
                                <Text style={styles.btnTextGrey}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() => handleAcceptJob(hiringId)}
                            >
                                <Text style={styles.btnTextWhite}>Accept</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {(rejectedWorker || terminated) && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteJob(hiringId)}
                        >
                            <Text style={styles.btnTextGrey}>Delete</Text>
                        </TouchableOpacity>
                    )}

                    {acceptedWorker && (
                        <TouchableOpacity style={[styles.acceptBtn, { opacity: 0.6, backgroundColor: '#666' }]} disabled>
                            <Text style={styles.btnTextWhite}>Accepted</Text>
                        </TouchableOpacity>
                    )}

                    {finalized && (
                        <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: '#4CAF50' }]} disabled>
                            <Text style={styles.btnTextWhite}>Hired</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.blueCircle} />

            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Job Confirmation</Text>
                </View>
                <View style={styles.searchBar}>
                    <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search by client name"
                        placeholderTextColor="#999"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E64D3"]} />
                    }
                >
                    {filteredJobs.length === 0 ? (
                        <Text style={styles.emptyText}>No job confirmations available.</Text>
                    ) : (
                        filteredJobs.map((item, index) => renderJobCard(item, index))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    blueCircle: {
        position: 'absolute', top: -50, left: -50,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#E3F2FD', zIndex: -1
    },
    header: { padding: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 25,
        borderWidth: 1, borderColor: '#CCC',
        paddingHorizontal: 15, height: 45, elevation: 2
    },
    searchInput: { flex: 1, fontSize: 14, color: '#000', paddingVertical: 0 },
    searchIcon: { marginRight: 10 },

    scrollContent: { paddingHorizontal: 15, paddingBottom: 20 },
    card: {
        backgroundColor: '#FFF', borderRadius: 15,
        padding: 15, marginBottom: 20,
        borderWidth: 1, elevation: 3,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, shadowRadius: 1.41
    },
    offerHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    imageContainer: { position: 'relative' },
    avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#EEE' },
    verifiedIcon: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#FFF', borderRadius: 10, padding: 2,
        borderWidth: 1, borderColor: '#CCC'
    },
    nameCol: { marginLeft: 15, flex: 1 },
    clientName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 15, paddingVertical: 3,
        borderRadius: 15, marginTop: 5
    },
    statusText: { fontSize: 13, fontWeight: 'bold' },

    detailsSection: { marginBottom: 15 },
    detailItem: { fontSize: 15, color: '#333', marginBottom: 4 },
    bold: { fontWeight: 'bold' },
    messageText: { fontSize: 14, color: '#444', lineHeight: 20, marginTop: 5 },

    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    rejectBtn: {
        backgroundColor: '#CFD8DC', paddingHorizontal: 30,
        paddingVertical: 10, borderRadius: 20, marginRight: 15, elevation: 2
    },
    acceptBtn: {
        backgroundColor: '#1E64D3', paddingHorizontal: 30,
        paddingVertical: 10, borderRadius: 20, elevation: 2
    },
    deleteBtn: {
        backgroundColor: '#CFD8DC', paddingHorizontal: 30,
        paddingVertical: 10, borderRadius: 20, elevation: 2
    },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    btnTextGrey: { color: '#607D8B', fontWeight: 'bold', fontSize: 16 },

    emptyText: { textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#999' },
});

export default JobConfirmationScreen;