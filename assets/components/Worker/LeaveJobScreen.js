import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { getActiveResignationJob, submitResignation } from '../helpers/workerResignationsApi';

export default function LeaveJobScreen({ navigation }) {
  const [reason, setReason] = useState('');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const busy = useRef(false);
  const version = useRef(0);
  const requests = useRef(new Set());
  const pending = job?.isResignationPending === true;

  const load = async () => {
    const requestId = ++version.current;
    const controller = new AbortController();
    requests.current.add(controller);
    setLoading(true); setError('');
    try {
      const workerId = await AsyncStorage.getItem('workerId');
      const data = await getActiveResignationJob(workerId, controller.signal);
      if (!active.current || version.current !== requestId) return;
      setJob(data);
    } catch (e) {
      if (!active.current || version.current !== requestId) return;
      setError(e.message);
      if (e.status === 401) navigation.replace('Login');
    } finally {
      requests.current.delete(controller);
      if (active.current && version.current === requestId) setLoading(false);
    }
  };
  useEffect(() => {
    active.current = true; load();
    return () => {
      active.current = false; version.current++;
      requests.current.forEach(controller => controller.abort());
      requests.current.clear();
    };
  }, []);

  const submit = async () => {
    if (busy.current || pending || !job?.interviewId) return;
    if (!reason.trim()) { setError('Please provide a reason for resignation.'); return; }
    busy.current = true; setSubmitting(true); setError('');
    const requestId = version.current;
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      await submitResignation(job.interviewId, reason, controller.signal);
      if (!active.current || version.current !== requestId) return;
      NotificationHelper.showSuccess('Resignation submitted. You can review your client after acceptance.');
      setJob(prev => ({ ...prev, isResignationPending: true }));
      navigation.navigate('WorkerDashboardScreen');
    } catch (e) {
      if (!active.current || version.current !== requestId) return;
      setError(e.message);
      if (e.status === 401) navigation.replace('Login');
    } finally {
      requests.current.delete(controller);
      if (active.current && version.current === requestId) { busy.current = false; setSubmitting(false); }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back" style={styles.back}>
            <Icon name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Resign from Job</Text>
        </View>
        {loading ? <ActivityIndicator size="large" color="#1E64D3" /> : null}
        {!!error && <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          {!job && <TouchableOpacity onPress={load} testID="resignation-load-retry"><Text style={styles.link}>Retry</Text></TouchableOpacity>}
        </View>}
        {!loading && job && <>
          <View style={styles.card}>
            <Text style={styles.employer}>{job.employerName}</Text>
            <Text style={styles.muted}>{job.employerAddress}</Text>
            <View style={styles.noticeBadge}><Text style={styles.noticeText}>7-Day Notice</Text></View>
            <Text style={styles.muted}>Your notice starts when you submit. You stay on this job until the Client accepts your resignation or the seven days expire.</Text>
          </View>
          {pending ? <View style={styles.card}>
            <Text style={styles.pending}>Resignation already pending</Text>
            <Text style={styles.muted}>You are still working during the notice period. Your review becomes available after acceptance.</Text>
            {job.noticeEndsAtUtc ? <Text style={styles.muted}>Automatic acceptance: {new Date(job.noticeEndsAtUtc).toLocaleString()}</Text>
              : <Text style={styles.muted}>This older resignation requires the Client’s manual acceptance.</Text>}
          </View> : <>
            <Text style={styles.label}>Reason for Leaving</Text>
            <TextInput style={styles.input} placeholder="Please explain why you are leaving..." placeholderTextColor="#94A3B8"
              multiline maxLength={4000} value={reason} onChangeText={setReason} editable={!submitting} testID="resignation-reason" />
            <Text style={styles.muted}>No rating or review is required now. After acceptance, your notification bell will let you review your Client.</Text>
            <TouchableOpacity onPress={submit} disabled={submitting} testID="submit-resignation"
              style={[styles.button, submitting && styles.disabled]}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Submit Resignation</Text>}
            </TouchableOpacity>
          </>}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0 },
  content: { padding: 24, paddingBottom: 40 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  back: { padding: 6, marginRight: 10 }, title: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  card: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 20, marginBottom: 24, backgroundColor: '#F8FAFC' },
  employer: { fontSize: 20, fontWeight: '700', color: '#0F172A' }, muted: { color: '#64748B', fontSize: 13, lineHeight: 21, marginTop: 10 },
  noticeBadge: { backgroundColor: '#E3F2FD', borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, marginTop: 14 },
  noticeText: { color: '#1E64D3', fontSize: 12, fontWeight: '700' }, label: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 15, minHeight: 130, textAlignVertical: 'top', color: '#0F172A', fontSize: 15 },
  button: { borderRadius: 14, padding: 17, backgroundColor: '#E91E63', alignItems: 'center', marginTop: 22 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }, disabled: { opacity: 0.6 },
  error: { backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 18 }, errorText: { color: '#B91C1C', lineHeight: 20 },
  link: { color: '#1E64D3', fontWeight: '700', marginTop: 10 }, pending: { color: '#B45309', fontSize: 16, fontWeight: '700' },
});
