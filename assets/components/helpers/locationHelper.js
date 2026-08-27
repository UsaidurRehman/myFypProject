import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD } from '../config';

export const detectAndUpdateLocation = async () => {
  try {
    console.log('📍 detectAndUpdateLocation called');
    // 1. Request Location Permission (Android)
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access Required',
          message: 'This app needs access to your location to show nearby services.',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ Location permission DENIED by user');
        return false;
      }
      console.log('✅ Location permission GRANTED');
    }

    // 2. Retrieve Client ID and User Token from AsyncStorage
    const clientIdStr = await AsyncStorage.getItem('clientId');
    const token = await AsyncStorage.getItem('userToken');

    if (!clientIdStr) {
      console.log('❌ Client ID not found in AsyncStorage');
      return false;
    }
    console.log('📍 Client ID retrieved:', clientIdStr);

    const clientId = parseInt(clientIdStr, 10);

    // 3. Get Current Position
    return new Promise((resolve) => {
      try {
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('📍 GPS position received:', { latitude, longitude });

            // Save coordinates locally for MapScreen and FindServiceScreen
            await AsyncStorage.setItem('clientLatitude', latitude.toString());
            await AsyncStorage.setItem('clientLongitude', longitude.toString());

            // 4. Send updated coordinates to Backend API
            try {
              const response = await fetch(`${API_DASHBOARD}/update-location`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ClientId: clientId,
                  Latitude: latitude,
                  Longitude: longitude,
                }),
              });

              const data = await response.json();
              if (response.ok) {
                console.log('✅ Location updated successfully:', { lat: latitude, lng: longitude, clientId });
                resolve(true);
              } else {
                console.log('❌ Location update failed:', data.message || 'Unknown error');
                resolve(false);
              }
            } catch (apiError) {
              console.error('Error posting location to server:', apiError);
              resolve(false);
            }
          },
          (error) => {
            console.log('❌ Geolocation Error:', error.code, error.message);
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (nativeCrashError) {
        // Native FusedLocationProviderClient error - return false gracefully
        console.error('❌ Geolocation native error caught:', nativeCrashError.message || nativeCrashError);
        resolve(false);
      }
    });
  } catch (error) {
    console.error('detectAndUpdateLocation Error:', error);
    return false;
  }
};