import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD } from '../../config';

const RatingAndReviewsScreen = ({ navigation, route }) => {
    const { workerId, initialRating, initialReviewCount } = route.params || {};

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(initialRating || "0.0");
    const [reviewCount, setReviewCount] = useState(initialReviewCount || 0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (workerId) {
            fetchReviews();
        } else {
            setIsLoading(false);
        }
    }, [workerId]);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetWorkerReviews/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
                setAverageRating(data.averageRating?.toString() || "0.0");
                setReviewCount(data.reviewCount || 0);
            } else {
                console.error("Failed to fetch reviews");
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStars = (rating) => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Icon
                    key={i}
                    name={i <= Math.round(rating) ? "star" : "star-outline"}
                    size={18}
                    color={i <= Math.round(rating) ? "#FFD700" : "#E0E0E0"}
                />
            );
        }
        return stars;
    };

    const renderHeaderStars = (rating) => {
        let stars = [];
        const roundedRating = Math.round(parseFloat(rating));
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Icon key={i} name={i <= roundedRating ? "star" : "star-outline"} size={30} color={i <= roundedRating ? "#FFD700" : "#E0E0E0"} />
            );
        }
        return stars;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header bar matching other screens */}
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Rating & Reviews</Text>
                </View>
                <View style={styles.logoBox}>
                    <Image
                        source={require('../../images/logo.png')}
                        style={styles.logoImage}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#1E75EB" />
                    <Text style={styles.loaderText}>Loading reviews...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Overall Rating Header Card */}
                    <View style={styles.headerCard}>
                        <Text style={styles.cardHeaderTitle}>Overall Rating</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.bigRating}>{averageRating}</Text>
                            <View style={styles.headerStars}>
                                {renderHeaderStars(averageRating)}
                            </View>
                        </View>
                        <Text style={styles.reviewCount}>({reviewCount} Reviews)</Text>
                    </View>

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                        reviews.map((item) => (
                            <View key={item.id} style={styles.reviewCard}>
                                <View style={styles.cardTop}>
                                    <View>
                                        {/* <Text style={styles.reviewerName}>{item.name}</Text> */}
                                        <TouchableOpacity
                                            onPress={() => {
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
                                            <Text style={styles.reviewerName}>{item.name}</Text>
                                        </TouchableOpacity>
                                        <View style={styles.dateRow}>
                                            <Icon name="calendar-range" size={14} color="#888" />
                                            <Text style={styles.employerDuration}>{item.date}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.starRow}>
                                        {renderStars(item.rating)}
                                    </View>
                                </View>
                                <Text style={styles.commentText}>"{item.comment}"</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Icon name="message-draw" size={50} color="#DDD" />
                            <Text style={styles.emptyText}>No reviews available yet.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
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
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bigRating: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1E4A84',
        marginRight: 15,
    },
    headerStars: {
        flexDirection: 'row',
    },
    reviewCount: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    employerDuration: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
    starRow: {
        flexDirection: 'row',
    },
    commentText: {
        fontSize: 13,
        color: '#555',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        color: '#1E75EB',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
        fontStyle: 'italic',
    },
});

export default RatingAndReviewsScreen;