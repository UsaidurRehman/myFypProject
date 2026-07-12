// import React, { useState, useEffect } from 'react';
// import {
//     StyleSheet, View, Text, ScrollView, Image, TextInput,
//     TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NotificationHelper from '../Notification/NotificationHelper';
// import { SERVER_BASE } from '../../config';

// const ActiveRequestScreen = ({ navigation }) => {
//     const [requests, setRequests] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [activeTab, setActiveTab] = useState('All'); // 'All', 'Pending', 'Approved'

//     useEffect(() => {
//         fetchRequests();
//     }, []);

//     const fetchRequests = async () => {
//         try {
//             setLoading(true);
//             const clientId = await AsyncStorage.getItem('clientId');
//             const token = await AsyncStorage.getItem('userToken');

//             const response = await fetch(
//                 `${SERVER_BASE}/api/Dashboard/GetActiveRequests/${clientId}`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             if (response.ok) {
//                 const data = await response.json();
//                 setRequests(data);
//             }
//         } catch (error) {
//             NotificationHelper.showError('Failed to load requests.');
//         } finally {
//             setLoading(false);
//         }
//     };

//   const handleApproveInterview = async (interviewId) => {
//     try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('userToken');

//         // Find the specific request item to grab its address data
//         const targetRequest = requests.find(r => r.interviewId === interviewId);
//         const addressPayload = targetRequest ? targetRequest.address : "";

//         const response = await fetch(
//             `${SERVER_BASE}/api/Dashboard/CreateHiring`,
//             {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     InterviewId: interviewId,
//                     WorkerDecision: 'Pending',
//                     HiringDecision: 'Pending',
//                     Address: addressPayload
//                 })
//             }
//         );

//         if (response.ok) {
//             NotificationHelper.showSuccess('Interview approved!');
//             await fetchRequests();
//         } else {
//             // Read backend error message if available
//             const errData = await response.json().catch(() => ({}));
//             NotificationHelper.showError(errData.message || 'Approval failed.');
//         }
//     } catch (error) {
//         NotificationHelper.showError('Network error.');
//     } finally {
//         setLoading(false);
//     }
// };

//     const handleDelete = async (interviewId) => {
//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             const response = await fetch(
//                 `${SERVER_BASE}/api/Dashboard/DeleteInterviewRequest/${interviewId}`,
//                 {
//                     method: 'DELETE',
//                     headers: { Authorization: `Bearer ${token}` },
//                 }
//             );

//             if (response.ok) {
//                 NotificationHelper.showSuccess('Request deleted.');
//                 setRequests((prev) => prev.filter((r) => r.interviewId !== interviewId));
//             } else {
//                 NotificationHelper.showError('Failed to delete.');
//             }
//         } catch (error) {
//             NotificationHelper.showError('Network error.');
//         }
//     };

//     const renderRequestItem = (item) => {
//         const {
//             interviewId,
//             workerDecision,
//             hiring = {},
//             workerImage,
//             workerName,
//             workerSkill,
//         } = item;

//         const hiringDecision = hiring?.hiringDecision;

//         const imageUrl =
//             workerImage && workerImage.startsWith('/')
//                 ? { uri: `${SERVER_BASE}${workerImage}` }
//                 : workerImage
//                     ? { uri: `${SERVER_BASE}/Images/${workerImage}` }
//                     : require('../../images/default-user.png');

//         // Dynamic config block based on state flags
//         let statusText = 'In Process';
//         let statusColor = '#E65100';
//         let statusBg = '#FFF3E0';
//         let renderRightActions = null;

//         if (workerDecision === 'Rejected') {
//             statusText = 'Rejected';
//             statusColor = '#D32F2F';
//             statusBg = '#FFEBEE';
//             renderRightActions = (
//                 <View style={styles.rightActionColumn}>
//                     <TouchableOpacity onPress={() => handleDelete(interviewId)} style={styles.actionIconBtn}>
//                         <Icon name="delete-outline" size={24} color="#D32F2F" />
//                     </TouchableOpacity>
//                 </View>
//             );
//         } else if (workerDecision === 'Accepted' && hiringDecision === 'Accepted') {
//             statusText = 'Hired';
//             statusColor = '#388E3C';
//             statusBg = '#E8F5E9';
//             renderRightActions = (
//                 <View style={styles.rightActionColumn}>
//                     <TouchableOpacity onPress={() => handleDelete(interviewId)} style={styles.actionIconBtn}>
//                         <Icon name="delete-outline" size={24} color="#D32F2F" />
//                     </TouchableOpacity>
//                 </View>
//             );
//         } else if (workerDecision === 'Accepted' && hiringDecision !== 'Accepted') {
//             statusText = 'Action Required';
//             statusColor = '#1E64D3';
//             statusBg = '#E3F2FD';
//             renderRightActions = (
//                 <View style={styles.rightActionColumn}>
//                     <TouchableOpacity 
//                         onPress={() => handleApproveInterview(interviewId)} 
//                         style={[styles.actionBtnTextOnly, { marginBottom: 8 }]}
//                     >
//                         <Text style={styles.approveActionText}>Approve</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity onPress={() => handleDelete(interviewId)}>
//                         <Text style={styles.deleteActionText}>Delete</Text>
//                     </TouchableOpacity>
//                 </View>
//             );
//         } else {
//             // Pending interview stage
//             renderRightActions = (
//                 <View style={styles.rightActionColumn}>
//                     <TouchableOpacity onPress={() => handleDelete(interviewId)} style={styles.actionIconBtn}>
//                         <Icon name="delete-outline" size={24} color="#D32F2F" />
//                     </TouchableOpacity>
//                 </View>
//             );
//         }

//         return (
//             <View key={interviewId} style={styles.card}>
//                 <View style={styles.cardMainContent}>
//                     <Image source={imageUrl} style={styles.workerAvatar} />
//                     <View style={styles.workerInfoColumn}>
//                         <Text style={styles.workerNameText}>{workerName}</Text>
//                         <Text style={styles.workerSkillText}>{workerSkill || 'General Worker'}</Text>

//                         <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
//                             <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
//                         </View>
//                     </View>
//                     {renderRightActions}
//                 </View>
//             </View>
//         );
//     };

//     const filteredRequests = requests.filter((item) => {
//         if (
//             searchQuery &&
//             !item.workerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
//             !item.workerSkill?.toLowerCase().includes(searchQuery.toLowerCase())
//         ) {
//             return false;
//         }
//         if (activeTab === 'Pending' && !(item.workerDecision === 'Pending' || item.hiring?.hiringDecision === 'Pending')) {
//             return false;
//         }
//         if (activeTab === 'Approved' && item.hiring?.hiringDecision !== 'Accepted') {
//             return false;
//         }
//         return true;
//     });

//     return (
//         <SafeAreaView style={styles.container}>
//             <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

//             {/* Top Navigation Row Layout */}
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//                     <Icon name="arrow-left" size={26} color="#000" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>Active Requests</Text>
//             </View>

//             {/* Structured Search Text Box */}
//             <View style={styles.searchContainer}>
//                 <Icon name="magnify" size={22} color="#868E96" style={styles.searchIcon} />
//                 <TextInput
//                     style={styles.searchInput}
//                     placeholder="Search requests by name or skill..."
//                     placeholderTextColor="#ADB5BD"
//                     value={searchQuery}
//                     onChangeText={setSearchQuery}
//                 />
//             </View>

//             {/* Filter Navigation Tabs */}
//             <View style={styles.tabsRow}>
//                 {['All', 'Pending', 'Approved'].map((tab) => (
//                     <TouchableOpacity
//                         key={tab}
//                         onPress={() => setActiveTab(tab)}
//                         style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
//                         activeOpacity={0.7}
//                     >
//                         <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
//                             {tab}
//                         </Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>

//             {loading ? (
//                 <View style={styles.centeredLoader}>
//                     <ActivityIndicator size="large" color="#1E64D3" />
//                 </View>
//             ) : (
//                 <ScrollView
//                     contentContainerStyle={styles.scrollContent}
//                     showsVerticalScrollIndicator={false}
//                 >
//                     {filteredRequests.length > 0 ? (
//                         filteredRequests.map((item) => renderRequestItem(item))
//                     ) : (
//                         <View style={styles.emptyContainer}>
//                             <Icon name="clipboard-text-search-outline" size={48} color="#CED4DA" />
//                             <Text style={styles.emptyText}>No requests match your criteria.</Text>
//                         </View>
//                     )}
//                 </ScrollView>
//             )}
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#FFF' },

//     // Header Style Setup
//     header: { 
//         paddingHorizontal: 16, 
//         paddingVertical: 18, 
//         flexDirection: 'row', 
//         alignItems: 'center',
//         borderBottomWidth: 1,
//         borderBottomColor: '#F8F9FA'
//     },
//     backButton: { padding: 4, marginRight: 12 },
//     headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1D20' },

//     // Search Box Design System 
//     searchContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#F8F9FA',
//         marginHorizontal: 20,
//         marginTop: 16,
//         paddingHorizontal: 14,
//         height: 48,
//         borderRadius: 12,
//         borderWidth: 1.5,
//         borderColor: '#E9ECEF'
//     },
//     searchIcon: { marginRight: 10 },
//     searchInput: { flex: 1, fontSize: 15, color: '#212529', fontWeight: '500' },

//     // Categories Selection Row Filter Layout
//     tabsRow: { 
//         flexDirection: 'row', 
//         paddingHorizontal: 20, 
//         marginTop: 16, 
//         marginBottom: 12 
//     },
//     tabButton: {
//         paddingVertical: 8,
//         paddingHorizontal: 20,
//         borderRadius: 20,
//         backgroundColor: '#FFF',
//         borderWidth: 1.5,
//         borderColor: '#E9ECEF',
//         marginRight: 8
//     },
//     tabButtonActive: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
//     tabText: { color: '#495057', fontWeight: '600', fontSize: 14 },
//     tabTextActive: { color: '#FFF' },

//     // Dynamic Request Element Display Cards
//     scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
//     card: {
//         backgroundColor: '#FFF',
//         borderRadius: 16,
//         padding: 16,
//         marginBottom: 14,
//         borderWidth: 1.5,
//         borderColor: '#F1F3F5',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.04,
//         shadowRadius: 3,
//         elevation: 1
//     },
//     cardMainContent: { flexDirection: 'row', alignItems: 'center' },
//     workerAvatar: { 
//         width: 64, 
//         height: 64, 
//         borderRadius: 32, 
//         backgroundColor: '#F1F3F5', 
//         marginRight: 16 
//     },
//     workerInfoColumn: { flex: 1, justifyContent: 'center' },
//     workerNameText: { fontSize: 16, fontWeight: '700', color: '#1A1D20', marginBottom: 2 },
//     workerSkillText: { fontSize: 13, color: '#868E96', marginBottom: 8 },

//     // Styled pill badging 
//     statusBadge: {
//         alignSelf: 'flex-start',
//         paddingHorizontal: 10,
//         paddingVertical: 3,
//         borderRadius: 6
//     },
//     statusBadgeText: { fontSize: 12, fontWeight: '700' },

//     // Action Layout Elements on Right 
//     rightActionColumn: { 
//         alignItems: 'flex-end', 
//         justifyContent: 'center', 
//         paddingLeft: 12 
//     },
//     actionIconBtn: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: '#FFF5F5',
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     actionBtnTextOnly: {
//         backgroundColor: '#4CAF50',
//         paddingHorizontal: 14,
//         paddingVertical: 7,
//         borderRadius: 8
//     },
//     approveActionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
//     deleteActionText: { color: '#D32F2F', fontSize: 13, fontWeight: '600' },

//     // State Loading & Core Placeholders 
//     centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
//     emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
//     emptyText: { textAlign: 'center', color: '#868E96', fontSize: 15, mt: 12, fontWeight: '500' }
// });

// export default ActiveRequestScreen;
import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, ScrollView, Image, TextInput,
    TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';

const ActiveRequestScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Pending', 'Approved'
    const [interactingIds, setInteractingIds] = useState([]);

    const sortRequestsByInterviewIdDesc = (list = []) => {
        return [...list].sort((a, b) => {
            const aId = Number(a.interviewId || a.id || 0);
            const bId = Number(b.interviewId || b.id || 0);
            return bId - aId;
        });
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const clientId = await AsyncStorage.getItem('clientId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(
                `${SERVER_BASE}/api/Dashboard/GetActiveRequests/${clientId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setRequests(sortRequestsByInterviewIdDesc(data));
            }
        } catch (error) {
            NotificationHelper.showError('Failed to load requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId, addressPayload) => {
        if (interactingIds.includes(requestId)) return;
        setInteractingIds(prev => [...prev, requestId]);

        try {
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/CreateHiring`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    InterviewId: requestId,
                    WorkerDecision: 'Pending',
                    HiringDecision: 'Pending',
                    Address: addressPayload || ""
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Interview Approved! Job Offer sent to worker.');
                // Optimistically mark this request as processed for the client UI
                setRequests(prev => sortRequestsByInterviewIdDesc(prev.map(r => r.interviewId === requestId ? {
                    ...r,
                    workerDecision: 'Accepted',
                    hiring: { ...(r.hiring || {}), hiringDecision: 'Accepted' }
                } : r)));
            } else {
                const errData = await response.json().catch(() => ({}));
                NotificationHelper.showError(errData.message || 'Failed to approve request.');
            }
        } catch (error) {
            NotificationHelper.showError('Connection error occurred during approval.');
        } finally {
            setInteractingIds(prev => prev.filter(id => id !== requestId));
        }
    };

    const handleDelete = async (requestId) => {
        if (interactingIds.includes(requestId)) return;
        setInteractingIds(prev => [...prev, requestId]);

        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/DeleteInterviewRequest/${requestId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Request removed successfully.');
                setRequests(prev => prev.filter(req => req.interviewId !== requestId));
            } else {
                NotificationHelper.showError('Failed to delete request.');
            }
        } catch (error) {
            NotificationHelper.showError('Connection error occurred.');
        } finally {
            setInteractingIds(prev => prev.filter(id => id !== requestId));
        }
    };

    const filteredRequests = requests.filter(item => {
        const searchValue = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !searchValue ||
            item.workerName?.toLowerCase().includes(searchValue) ||
            item.workerSkill?.toLowerCase().includes(searchValue);

        if (!matchesSearch) return false;

        const itemStatus = (item.status || item.workerDecision || '').toString().toLowerCase().trim();
        const isResigned = itemStatus.includes('resign');
        const isTerminated = itemStatus.includes('terminate');
        const isRejected = itemStatus.includes('reject');
        const isApproved = item.hiring?.hiringDecision === 'Accepted';
        const isFinalRecord = isApproved || isResigned || isTerminated || isRejected;

        if (activeTab === 'Pending') return !isFinalRecord;
        if (activeTab === 'Approved') return isApproved;
        return true;
    });

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar backgroundColor="#1E64D3" barStyle="light-content" />

            {/* Nav Header Row */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Active Requests</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {/* Search Architecture Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="magnify" size={22} color="#868E96" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by worker name or skill..."
                        placeholderTextColor="#A0A5AB"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Segmentation Switch Tabs */}
                <View style={styles.tabBarWrapper}>
                    {['All', 'Pending', 'Approved'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.segmentTabBtn, activeTab === tab && styles.activeSegmentTabBtn]}
                        >
                            <Text style={[styles.tabBtnText, activeTab === tab && styles.activeTabBtnText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#1E64D3" style={{ marginTop: 40 }} />
                ) : filteredRequests.length === 0 ? (
                    <View style={styles.emptyViewBox}>
                        <Icon name="folder-open-outline" size={60} color="#CCD1D7" />
                        <Text style={styles.emptyViewText}>No active requests located matching parameters.</Text>
                    </View>
                ) : (
                    filteredRequests.map((item) => {
                        const isCurrentlyProcessing = interactingIds.includes(item.interviewId);

                        // Parse status machine values
                        const workerDecision = item.workerDecision;
                        const hiringDecision = item.hiring?.hiringDecision;
                        const rawStatus = (item.status || workerDecision || '').toString().trim();
                        const normalizedStatus = rawStatus.toLowerCase();
                        const isResigned = normalizedStatus.includes('resign');
                        const isTerminated = normalizedStatus.includes('terminate');
                        const isRejected = normalizedStatus.includes('reject');
                        const isApproved = hiringDecision === 'Accepted';

                        let statusText = 'Pending Response';
                        let statusColor = '#B06000';
                        let statusBg = '#FFF3CD';
                        let canApprove = false;
                        let showDelete = true;

                        if (isResigned) {
                            statusText = 'Resigned';
                            statusColor = '#6F42C1';
                            statusBg = '#F3E5F5';
                            showDelete = false;
                        } else if (isTerminated) {
                            statusText = 'Terminated';
                            statusColor = '#D32F2F';
                            statusBg = '#FFEBEE';
                            showDelete = false;
                        } else if (isRejected) {
                            statusText = 'Rejected';
                            statusColor = '#D32F2F';
                            statusBg = '#FFEBEE';
                            showDelete = false;
                        } else if (isApproved) {
                            statusText = 'Processed';
                            statusColor = '#137333';
                            statusBg = '#E6F4EA';
                            showDelete = false;
                        } else if (workerDecision === 'Accepted' && hiringDecision !== 'Accepted') {
                            statusText = 'Action Required';
                            statusColor = '#1E64D3';
                            statusBg = '#E3F2FD';
                            canApprove = true;
                        }

                        const imageUrl = item.workerImage
                            ? { uri: item.workerImage.startsWith('http') ? item.workerImage : `${SERVER_BASE}${item.workerImage}` }
                            : require('../../images/default-user.png');

                        return (
                            <View key={item.interviewId} style={styles.requestItemCard}>
                                <Image source={imageUrl} style={styles.workerAvatarImg} />

                                <View style={styles.workerInfoColumn}>
                                    <Text style={styles.workerNameText}>{item.workerName || 'Worker Profile'}</Text>
                                    <Text style={styles.workerSkillText}>{item.workerSkill || 'General Assistant'}</Text>

                                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                                            {statusText}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rightActionColumn}>
                                    {isCurrentlyProcessing ? (
                                        <ActivityIndicator size="small" color="#1E64D3" />
                                    ) : (
                                        <>
                                                {canApprove && (
                                                <TouchableOpacity
                                                    onPress={() => handleApprove(item.interviewId, item.address)}
                                                    style={[styles.actionBtnTextOnly, { marginBottom: 8 }]}
                                                >
                                                    <Text style={styles.approveActionText}>Approve</Text>
                                                </TouchableOpacity>
                                            )}

                                            {showDelete ? (
                                                <TouchableOpacity
                                                    onPress={() => handleDelete(item.interviewId)}
                                                    style={styles.actionIconBtn}
                                                >
                                                    <Icon name="delete-outline" size={20} color="#D32F2F" />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.lockedFeedbackBox}>
                                                    <Icon name="check-circle" size={16} color="#137333" />
                                                    <Text style={[styles.lockedFeedbackText, { color: '#137333' }]}>Processed</Text>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    customHeader: { height: 60, backgroundColor: '#1E64D3', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, elevation: 4 },
    headerBackBtn: { padding: 4 },
    headerTitleText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    scrollBody: { padding: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, elevation: 1 },
    searchInput: { flex: 1, fontSize: 15, color: '#1A1D20', paddingVertical: 0 },
    tabBarWrapper: { flexDirection: 'row', backgroundColor: '#EDF2F7', borderRadius: 10, padding: 4, marginBottom: 20 },
    segmentTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeSegmentTabBtn: { backgroundColor: '#FFF', elevation: 2 },
    tabBtnText: { fontSize: 14, fontWeight: '600', color: '#718096' },
    activeTabBtnText: { color: '#1E64D3', fontWeight: '700' },
    emptyViewBox: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyViewText: { textAlign: 'center', color: '#868E96', fontSize: 15, marginTop: 12, lineHeight: 22 },
    requestItemCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
    workerAvatarImg: { width: 65, height: 65, borderRadius: 32.5, marginRight: 16, backgroundColor: '#EDF2F7' },
    workerInfoColumn: { flex: 1, justifyContent: 'center' },
    workerNameText: { fontSize: 16, fontWeight: '700', color: '#1A1D20', marginBottom: 2 },
    workerSkillText: { fontSize: 13, color: '#868E96', marginBottom: 8 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    rightActionColumn: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 12, minWidth: 85 },
    actionIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },
    actionBtnTextOnly: { backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, minWidth: 78, alignItems: 'center' },
    approveActionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    lockedFeedbackBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CEEAD6' },
    lockedFeedbackText: { fontSize: 12, fontWeight: '600', marginLeft: 4 }
});

export default ActiveRequestScreen;