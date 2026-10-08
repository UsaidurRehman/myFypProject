import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD } from '../../config';

/**
 * Renders the per-criterion star rows for a closing review.
 *
 * The list of criteria is fetched from the backend (GetReviewCriteria), which
 * resolves the worker's profession from Interview -> Worker -> Worker_Category
 * and returns the common set plus one group per category the worker holds.
 *
 * It is CONTROLLED: the parent owns the scores object and is told about every
 * change via onScoreChange(criteriaId, score) and about the total required
 * count via onLoaded(totalRequired), so the parent can validate before submit.
 */
const CriteriaReviewSection = ({ interviewId, scores, onScoreChange, onLoaded }) => {
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const res = await fetch(
                    `${API_DASHBOARD}/GetReviewCriteria?interviewId=${interviewId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (res.ok) {
                    const json = await res.json();
                    if (!cancelled) {
                        setData(json);
                        onLoaded && onLoaded(json.totalCriteria || 0);
                    }
                } else if (!cancelled) {
                    setFailed(true);
                }
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => { cancelled = true; };
    }, [interviewId]);

    const starRow = (c) => {
        const current = scores[c.criteriaId] || 0;
        return (
            <View style={styles.row} key={c.criteriaId}>
                <Text style={styles.critName} numberOfLines={2}>{c.name}</Text>
                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => onScoreChange(c.criteriaId, s)} activeOpacity={0.7}>
                            <Icon
                                name={s <= current ? 'star' : 'star-outline'}
                                size={24}
                                color={s <= current ? '#FFC107' : '#D0D5DD'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    if (failed) {
        return <Text style={styles.error}>Could not load the review criteria. Please go back and retry.</Text>;
    }
    if (!data) {
        return <ActivityIndicator color="#1E64D3" style={{ marginVertical: 18 }} />;
    }

    return (
        <View>
            <Text style={styles.heading}>Rate the following</Text>

            <Text style={styles.groupTitle}>Basics</Text>
            {data.common.map(starRow)}

            {data.professions.map((p) => (
                <View key={p.categoryId}>
                    <Text style={styles.groupTitle}>{p.categoryName}</Text>
                    {p.criteria.map(starRow)}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    heading: { fontSize: 15, fontWeight: '800', color: '#17203A', marginBottom: 4 },
    groupTitle: {
        marginTop: 12, marginBottom: 6, fontSize: 11, fontWeight: '800',
        letterSpacing: 0.6, color: '#1E64D3', textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12,
        paddingVertical: 8, marginBottom: 6, borderWidth: 1, borderColor: '#EDF1F7',
    },
    critName: { flex: 1, fontSize: 13, color: '#333', marginRight: 8 },
    stars: { flexDirection: 'row' },
    error: { color: '#C62828', fontSize: 13, marginVertical: 10 },
});

export default CriteriaReviewSection;
