import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD } from '../../config';

const RatingAndReviewsScreen = ({ navigation, route }) => {
    const { workerId, initialRating, initialReviewCount } = route.params;
    
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(initialRating || "0.0");
    const [reviewCount, setReviewCount] = useState(initialReviewCount || 0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
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
                    name="star"
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
                <Icon key={i} name="star" size={30} color={i <= roundedRating ? "#FFD700" : "#E0E0E0"} />
            );
        }
        return stars;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#1E75EB" />
                    <Text style={styles.loaderText}>Loading your reviews...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Overall Rating Header Card */}
                    <View style={styles.headerCard}>
                        <Text style={styles.headerTitle}>Your Overall Rating</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.bigRating}>{averageRating}</Text>
                            <View style={styles.headerStars}>
                                {renderHeaderStars(averageRating)}
                            </View>
                        </View>
                        <Text style={styles.reviewCount}>Based on {reviewCount} Reviews</Text>
                    </View>

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                        reviews.map((item) => (
                            <View key={item.id} style={styles.reviewCard}>
                                <View style={styles.cardTop}>
                                    <View>
                                        <Text style={styles.reviewerName}>{item.name}</Text>
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
                            <Text style={styles.emptyText}>You don't have any reviews yet.</Text>
                        </View>
                    )}

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 18,
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
        borderColor: '#E0E0E0',
        elevation: 2,
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
        marginTop: 2,
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
    backBtn: {
        backgroundColor: '#1E75EB',
        borderRadius: 25,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 3,
    },
    backBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
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