import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

const { width, height } = Dimensions.get('window');

// Build the full-page Leaflet HTML with OSM tiles
const getLeafletHTML = (lat, lng, workers) => {
    const workersJson = JSON.stringify(workers || []);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>OSM Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true })
               .setView([${lat}, ${lng}], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Client marker (blue, movable)
    var clientIcon = L.divIcon({
      html: '<div style="background:#1E64D3;width:18px;height:18px;border-radius:50%;border:3px solid #FFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: ''
    });

    var clientMarker = L.marker([${lat}, ${lng}], {
      icon: clientIcon,
      draggable: true,
      title: 'Your Location'
    }).addTo(map).bindPopup('Your Location<br><small>Drag to adjust</small>');

    // Notify RN whenever marker moves
    function sendPosition(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'position', lat: lat, lng: lng }));
    }

    clientMarker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendPosition(pos.lat, pos.lng);
    });

    // Tap on map moves the client marker
    map.on('click', function(e) {
      clientMarker.setLatLng(e.latlng);
      sendPosition(e.latlng.lat, e.latlng.lng);
    });

    // Worker markers (orange)
    var workers = ${workersJson};
    var workerIcon = L.divIcon({
      html: '<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:2px solid #FFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: ''
    });

    workers.forEach(function(w) {
      var wLat = parseFloat(w.latitude);
      var wLng = parseFloat(w.longitude);
      if (!isNaN(wLat) && !isNaN(wLng)) {
        L.marker([wLat, wLng], { icon: workerIcon })
          .addTo(map)
          .bindPopup('<b>' + (w.name || 'Worker') + '</b><br>' + (w.role || 'Service Worker'));
      }
    });
  </script>
</body>
</html>
`;
};

const MapScreen = ({ navigation, route }) => {
    const { latitude, longitude, workers = [], requireLocationSave } = route.params || {};

    const webViewRef = useRef(null);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [clientPosition, setClientPosition] = useState(
        (latitude && longitude && !isNaN(parseFloat(latitude)))
            ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
            : null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(!clientPosition);
    const [mapHtml, setMapHtml] = useState(null);

    useEffect(() => {
        if (clientPosition) {
            // Already have coords — build map immediately
            setMapHtml(getLeafletHTML(clientPosition.latitude, clientPosition.longitude, workers));
            setIsLoadingLocation(false);
        } else {
            // Try to get device GPS
            Geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setClientPosition(coords);
                    setMapHtml(getLeafletHTML(coords.latitude, coords.longitude, workers));
                    setIsLoadingLocation(false);
                },
                () => {
                    // GPS failed — fallback to Islamabad
                    const fallback = { latitude: 33.6844, longitude: 73.0479 };
                    setClientPosition(fallback);
                    setMapHtml(getLeafletHTML(fallback.latitude, fallback.longitude, workers));
                    setIsLoadingLocation(false);
                },
                { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
            );
        }
    }, []);

    // Receive messages from the Leaflet WebView
    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'position') {
                setClientPosition({ latitude: data.lat, longitude: data.lng });
            }
        } catch (e) {
            console.warn('WebView message parse error:', e);
        }
    };

    const saveLocation = async () => {
        if (!clientPosition) return;
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const clientIdStr = await AsyncStorage.getItem('clientId');
            if (clientIdStr && token) {
                const response = await fetch(`${API_DASHBOARD}/update-location`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ClientId: parseInt(clientIdStr, 10),
                        Latitude: clientPosition.latitude,
                        Longitude: clientPosition.longitude
                    })
                });
                if (response.ok) {
                    await AsyncStorage.setItem('clientLatitude', clientPosition.latitude.toString());
                    await AsyncStorage.setItem('clientLongitude', clientPosition.longitude.toString());
                    NotificationHelper.showSuccess('Location saved successfully!');
                    if (requireLocationSave) {
                        navigation.replace('FindServiceScreen');
                    }
                } else {
                    NotificationHelper.showError('Failed to save location on server.');
                }
            } else {
                NotificationHelper.showError('Session expired. Please login again.');
            }
        } catch (error) {
            console.error('saveLocation error:', error);
            NotificationHelper.showError('Network error while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const extractCity = (address) => {
        if (!address || address === 'N/A') return 'N/A';
        const parts = address.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
    };

    const getWorkerImageUri = (picture) => {
        if (!picture) return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        if (picture.startsWith('http')) return picture;
        return `${SERVER_BASE}${picture.startsWith('/') ? '' : '/'}${picture}`;
    };

    if (isLoadingLocation || !mapHtml) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />
                <ActivityIndicator size="large" color="#1E64D3" />
                <Text style={styles.loadingText}>Detecting your location...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Leaflet Map via WebView */}
            <WebView
                ref={webViewRef}
                style={styles.map}
                source={{ html: mapHtml }}
                originWhitelist={['*']}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.webViewLoader}>
                        <ActivityIndicator size="large" color="#1E64D3" />
                    </View>
                )}
            />

            {/* Floating Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Nearby Workers Map</Text>
                    <Text style={styles.headerSubtitle}>{workers.length} workers nearby</Text>
                </View>
            </View>

            {/* Save Location Button */}
            {clientPosition && (
                <View style={styles.saveBtnContainer}>
                    <View style={styles.coordsChip}>
                        <Icon name="crosshairs-gps" size={13} color="#1E64D3" />
                        <Text style={styles.coordsText}>
                            {clientPosition.latitude.toFixed(5)}, {clientPosition.longitude.toFixed(5)}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.saveLocationBtn} onPress={saveLocation} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Icon name="content-save-check" size={20} color="#FFF" />
                                <Text style={styles.saveLocationBtnText}>Save Location</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Tap the map or drag the blue dot to adjust</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    map: { flex: 1 },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F7F9FC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { fontSize: 15, color: '#5F6368', marginTop: 14 },
    webViewLoader: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
    },

    // Floating header
    header: {
        position: 'absolute',
        top: 10,
        left: 16,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    backBtn: { padding: 5, marginRight: 10 },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    headerSubtitle: { fontSize: 12, color: '#666' },

    // Save button area at bottom
    saveBtnContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        alignItems: 'center',
        gap: 10,
    },
    coordsChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF4FF',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 5,
    },
    coordsText: { fontSize: 12, color: '#1E64D3', fontWeight: '600' },
    saveLocationBtn: {
        width: '100%',
        backgroundColor: '#00B14F',
        borderRadius: 16,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#00B14F',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        gap: 10,
    },
    saveLocationBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    hintText: { fontSize: 12, color: '#999', textAlign: 'center' },
});

export default MapScreen;