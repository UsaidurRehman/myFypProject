import React, { useCallback, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getWorkerUnreadCount } from './workerNotificationsApi';

export default function WorkerNotificationBell({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    let busy = false;
    let timer;
    let appState = AppState.currentState || 'active';
    const refresh = async () => {
      if (!active || busy || appState !== 'active') return;
      busy = true;
      try {
        const data = await getWorkerUnreadCount();
        if (active) {
          setUnreadCount(data.unreadCount);
          setRefreshFailed(false);
        }
      } catch (error) {
        if (!active) return;
        setRefreshFailed(true); // Keep a previously loaded count; never pretend an error is zero.
        if (error.status === 401) navigation.replace('Login');
      } finally {
        busy = false;
      }
    };
    const start = () => {
      clearInterval(timer);
      refresh();
      if (appState === 'active') timer = setInterval(refresh, 30000);
    };
    const subscription = AppState.addEventListener('change', nextState => {
      appState = nextState;
      start();
    });
    start();
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [navigation]));

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('WorkerNotificationsScreen')}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unreadCount === null ? '' : `, ${unreadCount} unread`}${refreshFailed ? '. Could not refresh' : ''}`}
      accessibilityHint="Opens interview, job, and termination notifications"
      testID="worker-notification-bell"
      activeOpacity={0.75}
    >
      <Icon name={refreshFailed ? 'bell-alert-outline' : 'bell-outline'} size={23} color={refreshFailed ? '#B45309' : '#1E64D3'} />
      {unreadCount > 0 ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
});
