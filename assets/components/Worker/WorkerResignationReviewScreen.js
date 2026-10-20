import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_BASE } from '../../config';
import ReviewEndReason from '../helpers/ReviewEndReason';
import { getWorkerResignationReview, submitWorkerClientReview } from '../helpers/workerResignationsApi';

export default function WorkerResignationReviewScreen({ navigation, route }) {
  const resignationId = route?.params?.resignationId;
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const active = useRef(false);
  const version = useRef(0);
  const busy = useRef(false);
  const actionEpoch = useRef(0);
  const requests = useRef(new Set());

  const load = useCallback(async (spinner = true) => {
    const request = ++version.current;
    const controller = new AbortController();
    requests.current.add(controller);
    if (spinner) setLoading(true);
    setError('');
    try {
      const result = await getWorkerResignationReview(resignationId, controller.signal);
      if (!active.current || version.current !== request) return;
      setData(result);
    } catch (e) {
      if (!active.current || version.current !== request) return;
      setError(e.message);
      if (e.status === 401) navigation.replace('Login');
    } finally {
      requests.current.delete(controller);
      if (active.current && version.current === request) setLoading(false);
    }
  }, [resignationId, navigation]);

  useFocusEffect(useCallback(() => {
    active.current = true; actionEpoch.current++;
    busy.current = false;
    setData(null); setRating(0); setComment(''); setSaved(false); setSaving(false);
    load();
    return () => {
      active.current = false; version.current++; actionEpoch.current++;
      requests.current.forEach(controller => controller.abort());
      requests.current.clear();
    };
  }, [load]));

  const submit = async () => {
    if (busy.current || !data?.canReview || data.workerReview) return;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Please choose a star rating from 1 to 5.'); return;
    }
    busy.current = true;
    setSaving(true); setError('');
    const current = version.current;
    const action = actionEpoch.current;
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      await submitWorkerClientReview(data.interviewId, rating, comment, controller.signal);
      if (!active.current || version.current !== current) return;
      setSaved(true);
      // The successful POST establishes these submitted values. Lock immediately,
      // even if the following detail refresh loses its network connection.
      setData(prev => ({ ...prev, canReview: false, workerReview: {
        rating, comment: comment.trim(), endReasonType: 'Resigned', endReason: prev.reason,
      } }));
      await load(false);
    } catch (e) {
      if (!active.current || version.current !== current) return;
      setError(e.message);
      if (e.status === 401) navigation.replace('Login');
    } finally {
      requests.current.delete(controller);
      if (active.current && actionEpoch.current === action) { busy.current = false; setSaving(false); }
    }
  };
  const review = data?.workerReview;
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back" style={styles.back}>
          <Icon name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Review Your Client</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator size="large" color="#1E64D3" /> : null}
        {!!error && <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} testID="resignation-review-retry"><Text style={styles.link}>Retry</Text></TouchableOpacity>
        </View>}
        {!loading && data && <>
          <View style={styles.card}>
            <Text style={styles.accepted}>{data.isAccepted
              ? data.acceptanceMode === 'Automatic' ? 'Resignation automatically accepted' : 'Resignation accepted'
              : 'Waiting for resignation acceptance'}</Text>
            <View style={styles.person}>
              {data.clientPicture ? <Image style={styles.avatar} source={{ uri: data.clientPicture.startsWith('/') ? `${SERVER_BASE}${data.clientPicture}` : data.clientPicture }} />
                : <Icon name="account-circle-outline" size={44} color="#64748B" />}
              <Text style={styles.name}>{data.clientName}</Text>
            </View>
            {data.acceptedAtUtc ? <Text style={styles.muted}>Job ended: {new Date(data.acceptedAtUtc).toLocaleString()}</Text> : null}
            <Text style={styles.reasonLabel}>Resignation reason</Text>
            <Text style={styles.reason}>{data.reason || 'Reason not provided.'}</Text>
          </View>
          {review ? <View style={styles.card} testID="saved-worker-client-review">
            <Text style={styles.heading}>Your saved review</Text>
            <View style={styles.stars}>{[1, 2, 3, 4, 5].map(star => <Icon key={star} name={star <= Number(review.rating) ? 'star' : 'star-outline'} size={27} color="#EAB308" />)}</View>
            {review.date ? <Text style={styles.muted}>{review.date}</Text> : null}
            <ReviewEndReason endType={review.endReasonType || 'Resigned'} reason={review.endReason || data.reason} />
            {!!review.comment && <Text style={styles.reason}>{review.comment}</Text>}
            {!!review.workedPeriod && <Text style={styles.muted}>Worked: {review.workedPeriod}</Text>}
            <Text style={styles.muted}>This review is saved and cannot be submitted again.</Text>
          </View> : data.canReview ? <View style={styles.card}>
            <Text style={styles.heading}>How was your experience?</Text>
            <Text style={styles.muted}>Your resignation is accepted. You can review now or return to this notification later.</Text>
            <View style={styles.stars}>{[1, 2, 3, 4, 5].map(star => <TouchableOpacity key={star} testID={`client-rating-${star}`} onPress={() => setRating(star)} disabled={saving} accessibilityLabel={`${star} stars`}>
              <Icon name={star <= rating ? 'star' : 'star-outline'} size={36} color="#EAB308" />
            </TouchableOpacity>)}</View>
            <TextInput style={styles.input} placeholder="Write your review (optional)" placeholderTextColor="#94A3B8"
              value={comment} onChangeText={setComment} multiline maxLength={4000} editable={!saving} testID="worker-client-review-comment" />
            <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={submit} disabled={saving} testID="submit-worker-client-review">
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Submit Review</Text>}
            </TouchableOpacity>
          </View> : <Text style={styles.muted}>You can submit your review only after this resignation is accepted.</Text>}
          {saved && <Text style={styles.accepted}>Your review has been saved.</Text>}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  back: { padding: 8, marginRight: 8 }, title: { fontSize: 21, fontWeight: '800', color: '#0F172A' },
  content: { padding: 18, paddingBottom: 40 }, card: { padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  person: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 }, avatar: { width: 44, height: 44, borderRadius: 22 },
  name: { flex: 1, marginLeft: 12, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  accepted: { color: '#047857', fontSize: 14, fontWeight: '700' }, heading: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  muted: { color: '#64748B', fontSize: 13, lineHeight: 20, marginTop: 8 }, reasonLabel: { fontSize: 12, color: '#64748B', marginTop: 14 },
  reason: { color: '#334155', fontSize: 14, lineHeight: 21, marginTop: 6 }, stars: { flexDirection: 'row', marginVertical: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, minHeight: 110, padding: 12, color: '#0F172A', textAlignVertical: 'top' },
  button: { backgroundColor: '#1E64D3', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 }, buttonText: { color: '#FFFFFF', fontWeight: '700' }, disabled: { opacity: 0.6 },
  error: { borderRadius: 12, padding: 14, backgroundColor: '#FEF2F2', marginBottom: 16 }, errorText: { color: '#B91C1C', lineHeight: 20 }, link: { color: '#1E64D3', fontWeight: '700', marginTop: 10 },
});
