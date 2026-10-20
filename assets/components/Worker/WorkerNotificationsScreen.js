import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, AppState, FlatList, SafeAreaView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getWorkerNotifications, getWorkerNotificationDestination,
  markAllWorkerNotificationsRead, markWorkerNotificationRead,
} from '../helpers/workerNotificationsApi';

const PAGE_SIZE = 30;
const KINDS = {
  interview: { label: 'Interview', icon: 'account-voice', color: '#1E64D3', background: '#EBF3FF' },
  job: { label: 'Job', icon: 'briefcase-outline', color: '#047857', background: '#ECFDF5' },
  termination: { label: 'Termination', icon: 'file-cancel-outline', color: '#DC2626', background: '#FEF2F2' },
};

function receivedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function WorkerNotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [openingKey, setOpeningKey] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const active = useRef(false);
  const requestVersion = useRef(0);
  const moreBusy = useRef(false);
  const actionBusy = useRef(false);
  const actionEpoch = useRef(0);
  const page = useRef({ skip: 0, hasMore: false, snapshotAtUtc: null });

  const loadFirst = useCallback(async (showSpinner = false) => {
    if (actionBusy.current) return;
    const version = ++requestVersion.current;
    moreBusy.current = false;
    setLoadingMore(false);
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setLoadError('');
    setActionError('');
    try {
      const data = await getWorkerNotifications({ take: PAGE_SIZE });
      if (!active.current || requestVersion.current !== version) return;
      setItems(data.items);
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      page.current = { skip: data.items.length, hasMore: data.hasMore, snapshotAtUtc: data.snapshotAtUtc };
    } catch (error) {
      if (!active.current || requestVersion.current !== version) return;
      setLoadError(error.message);
      if (error.status === 401) navigation.replace('Login');
    } finally {
      if (active.current && requestVersion.current === version) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    actionEpoch.current++;
    actionBusy.current = false;
    setOpeningKey(null);
    setMarkingAll(false);
    loadFirst(true); // Refetch after returning from an action/detail screen.
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') loadFirst(false);
    });
    return () => {
      active.current = false;
      requestVersion.current++;
      actionEpoch.current++;
      subscription.remove();
    };
  }, [loadFirst]));

  const loadMore = async () => {
    if (moreBusy.current || actionBusy.current || loading || refreshing || !page.current.hasMore) return;
    const version = requestVersion.current;
    moreBusy.current = true;
    setLoadingMore(true);
    try {
      const data = await getWorkerNotifications({ skip: page.current.skip, take: PAGE_SIZE, snapshotAtUtc: page.current.snapshotAtUtc });
      if (!active.current || requestVersion.current !== version) return;
      setItems(previous => [...new Map([...previous, ...data.items].map(item => [item.key, item])).values()]);
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      page.current = { ...page.current, skip: page.current.skip + data.items.length, hasMore: data.hasMore };
      setLoadError('');
    } catch (error) {
      if (active.current && requestVersion.current === version) {
        setLoadError(error.message);
        if (error.status === 401) navigation.replace('Login');
      }
    } finally {
      moreBusy.current = false;
      if (active.current) setLoadingMore(false);
    }
  };

  const openNotification = async item => {
    if (actionBusy.current || moreBusy.current || refreshing) return;
    const epoch = actionEpoch.current;
    actionBusy.current = true;
    setOpeningKey(item.key);
    setActionError('');
    try {
      // Saving read state is independent of accepting/rejecting a job/interview.
      const data = await markWorkerNotificationRead(item.key);
      if (!active.current || actionEpoch.current !== epoch) return;
      setItems(previous => previous.map(n => n.key === item.key ? { ...n, isRead: true, readAtUtc: data.readAtUtc } : n));
      setUnreadCount(data.unreadCount);
      const destination = getWorkerNotificationDestination(item);
      if (destination) navigation.navigate(destination.screen, destination.params);
      else setActionError('This notification has no available linked screen. It remains in your history.');
    } catch (error) {
      if (active.current && actionEpoch.current === epoch) {
        setActionError(error.message);
        if (error.status === 401) navigation.replace('Login');
      }
    } finally {
      if (actionEpoch.current === epoch) {
        actionBusy.current = false;
        if (active.current) setOpeningKey(null);
      }
    }
  };

  const markAllRead = async () => {
    if (actionBusy.current || moreBusy.current || refreshing || !page.current.snapshotAtUtc) return;
    const epoch = actionEpoch.current;
    actionBusy.current = true;
    setMarkingAll(true);
    setActionError('');
    try {
      const data = await markAllWorkerNotificationsRead(page.current.snapshotAtUtc);
      if (!active.current || actionEpoch.current !== epoch) return;
      setItems(previous => previous.map(n => ({ ...n, isRead: true, readAtUtc: n.readAtUtc || data.readAtUtc })));
      setUnreadCount(data.unreadCount);
    } catch (error) {
      if (active.current && actionEpoch.current === epoch) {
        setActionError(error.message);
        if (error.status === 401) navigation.replace('Login');
      }
    } finally {
      if (actionEpoch.current === epoch) {
        actionBusy.current = false;
        if (active.current) setMarkingAll(false);
      }
    }
  };

  const renderItem = ({ item }) => {
    const kind = KINDS[item.type] || { label: 'Notification', icon: 'bell-outline', color: '#475569', background: '#F1F5F9' };
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => openNotification(item)}
        disabled={openingKey !== null || markingAll || refreshing || loadingMore}
        accessibilityRole="button"
        accessibilityLabel={`${item.isRead ? 'Read' : 'Unread'} ${kind.label}: ${item.title}. ${item.message}`}
        testID={`notification-${item.key}`}
        activeOpacity={0.8}
      >
        <View style={[styles.icon, { backgroundColor: kind.background }]}>
          <Icon name={kind.icon} size={23} color={kind.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.kind, { color: kind.color }]}>{kind.label}</Text>
            {!item.isRead ? <View style={styles.unreadDot} /> : <Text style={styles.readLabel}>Read</Text>}
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
          <Text style={styles.date}>{receivedDate(item.createdAtUtc)}</Text>
        </View>
        {openingKey === item.key ? <ActivityIndicator size="small" color="#1E64D3" /> : <Icon name="chevron-right" size={20} color="#94A3B8" />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.heading}>Notifications</Text>
          <Text style={styles.subtitle}>{unreadCount === null ? 'Interviews, jobs & terminations' : `${unreadCount} unread · Interviews, jobs & terminations`}</Text>
        </View>
      </View>
      <View style={styles.toolbar}>
        <Text style={styles.historyLabel}>All notifications</Text>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === null || unreadCount === 0 || loading || refreshing || loadingMore || markingAll || openingKey !== null} accessibilityRole="button" testID="mark-all-notifications-read">
          <Text style={[styles.markAll, (unreadCount === null || unreadCount === 0 || loading || refreshing || markingAll) && styles.muted]}>{markingAll ? 'Saving…' : 'Mark all read'}</Text>
        </TouchableOpacity>
      </View>
      {loadError || actionError ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{actionError || loadError}</Text>
          {loadError ? <TouchableOpacity onPress={() => loadFirst(false)} accessibilityRole="button"><Text style={styles.retry}>Retry</Text></TouchableOpacity> : null}
        </View>
      ) : null}
      {loading ? <ActivityIndicator style={styles.loading} size="large" color="#1E64D3" /> : (
        <FlatList
          data={items}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
          refreshing={refreshing}
          onRefresh={() => loadFirst(false)}
          ListEmptyComponent={!loadError ? (
            <View style={styles.empty}>
              <Icon name="bell-check-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptyText}>Interview requests, job updates and termination notices will appear here. Read notifications stay in your history.</Text>
            </View>
          ) : null}
          ListFooterComponent={hasMore ? (
            <TouchableOpacity onPress={loadMore} disabled={loadingMore || refreshing} style={styles.more} accessibilityRole="button" testID="load-more-notifications">
              {loadingMore ? <ActivityIndicator color="#1E64D3" /> : <Text style={styles.markAll}>Load more</Text>}
            </TouchableOpacity>
          ) : <Text style={styles.footer}>Opening a notification marks it read, not accepted or rejected.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FC' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  back: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  heading: { fontSize: 23, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 11, lineHeight: 16, color: '#64748B', marginTop: 3 },
  content: { flex: 1, minWidth: 0 },
  toolbar: { paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyLabel: { color: '#475569', fontSize: 13, fontWeight: '600' },
  markAll: { color: '#1E64D3', fontSize: 13, fontWeight: '700', paddingVertical: 6 },
  muted: { color: '#94A3B8' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12 },
  unreadCard: { backgroundColor: '#F8FBFF', borderColor: '#BFD6F6' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  kind: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E64D3' },
  readLabel: { fontSize: 10, color: '#94A3B8' },
  title: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: '#0F172A' },
  message: { fontSize: 12, lineHeight: 18, color: '#475569', marginTop: 4 },
  date: { fontSize: 10, color: '#94A3B8', marginTop: 8 },
  loading: { marginTop: 64 },
  error: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 18 },
  retry: { color: '#1E64D3', fontSize: 13, fontWeight: '700', marginTop: 8 },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 14 },
  emptyText: { fontSize: 13, lineHeight: 21, textAlign: 'center', color: '#64748B', marginTop: 8 },
  more: { alignItems: 'center', padding: 14 },
  footer: { color: '#94A3B8', fontSize: 11, lineHeight: 17, textAlign: 'center', marginVertical: 16 },
});
