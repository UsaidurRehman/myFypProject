// import React, { useState } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NotificationHelper from '../Notification/NotificationHelper';
// import { API_AUTH } from '../../config';

// const LOGO_IMG = require('../../images/logo.png');

// const LoginScreen = ({ navigation }) => {
//   const [role, setRole] = useState('Client');
//   const [emailOrCnic, setEmailOrCnic] = useState('');
//   const [password, setPassword] = useState('');
//   const [isPasswordVisible, setPasswordVisible] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const getIdentifierPlaceholder = () => {
//     switch (role) {
//       case 'Client': return 'Email';
//       case 'Worker': return 'CNIC e.g XXXXX-XXXXXXX-X';
//       case 'Company': return 'License Number';
//       case 'Police': return 'Badge ID / Service ID';
//       default: return 'Email';
//     }
//   };

//   const getIdentifierIcon = () => {
//     switch (role) {
//       case 'Client': return 'email-outline';
//       case 'Worker': return 'card-account-details-outline';
//       case 'Company': return 'domain';
//       case 'Police': return 'shield-account-outline';
//       default: return 'email-outline';
//     }
//   };

//   const getKeyboardType = () => {
//     if (role === 'Client') return 'email-address';
//     if (role === 'Worker') return 'numeric';
//     return 'default';
//   };

//   const handleLogin = async () => {
//     if (!emailOrCnic || !password) {
//       NotificationHelper.showError("Please enter your credentials.");
//       return;
//     }

//     setIsLoading(true);
//     const url = `${API_AUTH}/Login`;

//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         body: JSON.stringify({
//           Role: role,
//           EmailOrCnic: emailOrCnic,
//           Password: password
//         })
//       });

//       const result = await response.json();

//       if (response.ok) {
//         await AsyncStorage.setItem('userToken', result.token);
//         await AsyncStorage.setItem('userRole', result.role);
//         await AsyncStorage.setItem('userName', result.name || '');
//         await AsyncStorage.setItem('userPicture', result.picture || '');
//         await AsyncStorage.setItem('userAddress', result.address || '');
//         await AsyncStorage.setItem('userPhone', result.phone || '');

//         if (result.clientId) await AsyncStorage.setItem('clientId', result.clientId.toString());
//         if (result.workerId) await AsyncStorage.setItem('workerId', result.workerId.toString());
//         if (result.companyId) await AsyncStorage.setItem('companyId', result.companyId.toString());
//         if (result.policeId) await AsyncStorage.setItem('policeId', result.policeId.toString());
//         if (result.email) await AsyncStorage.setItem('userEmail', result.email);

//         NotificationHelper.showSuccess("Login Successful!");

//         if (result.role === 'Client') {
//           navigation.replace('FindServiceScreen');
//         } else if (result.role === 'Worker') {
//           navigation.replace('WorkerDashboardScreen');
//         }else if(result.role==="Company"){
//         navigation.replace('WorkerDirectoryScreen');
//         }else if(result.role==="Police"){
//           navigation.replace('PoliceVerificationPortal');
//         }
//          else {
//           NotificationHelper.showSuccess(`${result.role} account logged in successfully!`);
//         }
//       } else {
//         NotificationHelper.showError(result.message || "Invalid credentials.");
//       }
//     } catch (error) {
//       console.error(error);
//       NotificationHelper.showError("Cannot reach the server.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.innerContainer}
//       >
//         <View style={styles.circleTopLeft} />

//         <View style={styles.logoContainer}>
//           <View style={styles.logoCircle}>
//             <Image
//               source={LOGO_IMG}
//               style={styles.logoImage}
//               resizeMode="contain"
//             />
//           </View>
//           <Text style={styles.brandName}>Maid & Servant Online</Text>
//         </View>

//         <View style={styles.formContainer}>
//           <View style={styles.roleGrid}>
//             <TouchableOpacity
//               style={[styles.roleButton, role === 'Client' && styles.activeRole]}
//               onPress={() => { setRole('Client'); setEmailOrCnic(''); }}>
//               <Icon name="account-outline" size={22} color={role === 'Client' ? "#1E64D3" : "#000"} />
//               <Text style={styles.roleText}>Client</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.roleButton, role === 'Worker' && styles.activeRole]}
//               onPress={() => { setRole('Worker'); setEmailOrCnic(''); }}>
//               <Icon name="account-group-outline" size={22} color={role === 'Worker' ? "#1E64D3" : "#000"} />
//               <Text style={styles.roleText}>Worker</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.roleButton, role === 'Company' && styles.activeRole]}
//               onPress={() => { setRole('Company'); setEmailOrCnic(''); }}>
//               <Icon name="domain" size={22} color={role === 'Company' ? "#1E64D3" : "#000"} />
//               <Text style={styles.roleText}>Company</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.roleButton, role === 'Police' && styles.activeRole]}
//               onPress={() => { setRole('Police'); setEmailOrCnic(''); }}>
//               <Icon name="shield-check-outline" size={22} color={role === 'Police' ? "#1E64D3" : "#000"} />
//               <Text style={styles.roleText}>Police</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.inputWrapper}>
//             <View style={styles.iconBackground}>
//               <Icon name={getIdentifierIcon()} size={24} color="#1E64D3" />
//             </View>
//             <TextInput
//               style={styles.input}
//               placeholder={getIdentifierPlaceholder()}
//               placeholderTextColor="#999"
//               value={emailOrCnic}
//               onChangeText={setEmailOrCnic}
//               keyboardType={getKeyboardType()}
//               autoCapitalize="none"
//             />
//           </View>

//           <View style={[styles.inputWrapper, styles.marginTop]}>
//             <View style={styles.iconBackground}>
//               <Icon name="lock-outline" size={24} color="#1E64D3" />
//             </View>
//             <TextInput
//               style={styles.input}
//               placeholder="Password"
//               placeholderTextColor="#999"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry={!isPasswordVisible}
//             />
//             <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
//               <Icon
//                 name={isPasswordVisible ? "eye-off" : "eye"}
//                 size={22}
//                 color="#666"
//                 style={styles.eyeIcon}
//               />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.rowBetween}>
//             <TouchableOpacity
//               style={styles.checkboxRow}
//               onPress={() => setRememberMe(!rememberMe)}
//             >
//               <Icon
//                 name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
//                 size={22}
//                 color="#1E64D3"
//               />
//               <Text style={styles.rememberText}>Remember Me</Text>
//             </TouchableOpacity>
//             <TouchableOpacity>
//               <Text style={styles.forgotText}>Forgot Password?</Text>
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity
//             style={styles.signInButton}
//             onPress={handleLogin}
//             disabled={isLoading}
//           >
//             {isLoading ? (
//               <ActivityIndicator color="#1E64D3" />
//             ) : (
//               <Text style={styles.signInText}>Sign in</Text>
//             )}
//           </TouchableOpacity>

//           <Text style={styles.orText}>OR</Text>

//           <TouchableOpacity
//             style={styles.signupButton}
//             onPress={() => navigation.navigate('Signup')}
//           >
//             <Text style={styles.signupText}>Signup</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F8FBFF' },
//   innerContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
//   circleTopLeft: {
//     position: 'absolute',
//     top: -40,
//     left: -40,
//     width: 180,
//     height: 180,
//     borderRadius: 90,
//     backgroundColor: '#D6EAF8',
//     zIndex: -1,
//   },
//   logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
//   logoCircle: {
//     width: 120,
//     height: 120,
//     borderRadius: 25,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     overflow: 'hidden',
//   },
//   logoImage: { width: '90%', height: '90%', borderRadius: 25 },
//   brandName: { marginTop: 15, fontSize: 20, fontWeight: 'bold', color: '#2C437E' },
//   formContainer: { width: '100%' },
//   roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
//   roleButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: '48%',
//     height: 50,
//     borderRadius: 15,
//     borderWidth: 1,
//     borderColor: '#EEE',
//     elevation: 3,
//     backgroundColor: '#FFF',
//     marginBottom: 10,
//     paddingHorizontal: 8,
//   },
//   activeRole: { backgroundColor: '#E0DADA' },
//   roleText: { marginLeft: 8, fontWeight: 'bold', color: '#000', textAlign: 'center' },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFF',
//     borderRadius: 15,
//     paddingHorizontal: 15,
//     height: 60,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//   },
//   marginTop: { marginTop: 15 },
//   iconBackground: { marginRight: 12 },
//   input: { flex: 1, fontSize: 16, color: '#333' },
//   eyeIcon: { padding: 5 },
//   rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
//   checkboxRow: { flexDirection: 'row', alignItems: 'center' },
//   rememberText: { marginLeft: 8, color: '#555', fontSize: 14 },
//   forgotText: { color: '#1E64D3', fontSize: 14, fontWeight: '600' },
//   signInButton: {
//     backgroundColor: '#FFF',
//     height: 55,
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#1E64D3',
//     elevation: 3,
//   },
//   signInText: { color: '#1E64D3', fontSize: 18, fontWeight: 'bold' },
//   orText: { textAlign: 'center', marginVertical: 15, color: '#888', fontSize: 14 },
//   signupButton: {
//     backgroundColor: '#1E64D3',
//     height: 55,
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 5,
//   },
//   signupText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
// });

// export default LoginScreen;


import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_AUTH } from '../../config';
import { detectAndUpdateLocation } from '../helpers/locationHelper';

const LOGO_IMG = require('../../images/logo.png');

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState('Client');
  const [emailOrCnic, setEmailOrCnic] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleGoToMap = () => {
    setShowLocationModal(false);
    navigation.replace('MapScreen', { requireLocationSave: true });
  };

  const getIdentifierPlaceholder = () => {
    switch (role) {
      case 'Client': return 'Email';
      case 'Worker': return 'CNIC e.g XXXXX-XXXXXXX-X';
      case 'Company': return 'License Number';
      case 'Police': return 'Badge ID / Service ID';
      default: return 'Email';
    }
  };

  const getIdentifierIcon = () => {
    switch (role) {
      case 'Client': return 'email-outline';
      case 'Worker': return 'card-account-details-outline';
      case 'Company': return 'domain';
      case 'Police': return 'shield-account-outline';
      default: return 'email-outline';
    }
  };

  const getKeyboardType = () => {
    if (role === 'Client') return 'email-address';
    if (role === 'Worker') return 'numeric';
    return 'default';
  };

  const handleLogin = async () => {
    const trimmedIdentifier = emailOrCnic.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      NotificationHelper.showError("Please enter your credentials.");
      return;
    }

    setIsLoading(true);
    const url = `${API_AUTH}/Login`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Role: role,
          EmailOrCnic: trimmedIdentifier,
          Password: trimmedPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Login API Response (OK):', { role: result.role, token: result.token?.substring(0, 20) + '...', clientId: result.clientId });
        
        // 1. Prepare key-value pairs for atomic batch storage
        const storageItems = [
          ['userToken', result.token || ''],
          ['userRole', result.role || role],
          ['userName', result.name || ''],
          ['userPicture', result.picture || ''],
          ['userAddress', result.address || ''],
          ['userPhone', result.phone || ''],
          ['userEmail', result.email || (role === 'Client' ? trimmedIdentifier : '')],
        ];

        // 2. Add role-specific IDs safely if provided
        if (result.clientId != null) storageItems.push(['clientId', result.clientId.toString()]);
        if (result.workerId != null) storageItems.push(['workerId', result.workerId.toString()]);
        if (result.companyId != null) storageItems.push(['companyId', result.companyId.toString()]);
        if (result.policeId != null) storageItems.push(['policeId', result.policeId.toString()]);

        // Save everything to AsyncStorage
        await AsyncStorage.multiSet(storageItems);
        console.log('✅ AsyncStorage: Saved token, role, clientId, and user info');

        NotificationHelper.showSuccess("Login Successful!");

        // 3. Handle Navigation & GPS location detection
        const userRole = result.role || role;

        if (userRole === 'Client') {
          try {
            console.log('📍 Starting location detection for Client...');
            const locSuccess = await detectAndUpdateLocation();
            console.log('📍 Location detection result:', locSuccess);
          } catch (locErr) {
            console.warn('📍 Location detection failed/skipped during login:', locErr.message);
          }

          const savedLat = await AsyncStorage.getItem('clientLatitude');
          const savedLng = await AsyncStorage.getItem('clientLongitude');
          let hasDbLocation = (result.latitude != null && result.longitude != null && result.latitude != 0 && result.longitude != 0);
          let hasLocalLocation = (savedLat != null && savedLng != null && parseFloat(savedLat) !== 0 && parseFloat(savedLng) !== 0);

          if (!hasDbLocation && !hasLocalLocation) {
            console.log('⚠️ No valid coordinates found. Popping location enforcement modal.');
            setShowLocationModal(true);
          } else {
            console.log('🔄 Navigating to FindServiceScreen');
            navigation.replace('FindServiceScreen');
          }
        } else if (userRole === 'Worker') {
          navigation.replace('WorkerDashboardScreen');
        } else if (userRole === 'Company') {
          navigation.replace('WorkerDirectoryScreen');
        } else if (userRole === 'Police') {
          navigation.replace('PoliceVerificationPortal');
        } else {
          NotificationHelper.showSuccess(`${userRole} account logged in successfully!`);
        }
      } else {
        NotificationHelper.showError(result.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error('Login Error:', error);
      NotificationHelper.showError("Cannot reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <View style={styles.circleTopLeft} />

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={LOGO_IMG}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Maid & Servant Online</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.roleGrid}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'Client' && styles.activeRole]}
              onPress={() => { setRole('Client'); setEmailOrCnic(''); }}>
              <Icon name="account-outline" size={22} color={role === 'Client' ? "#1E64D3" : "#000"} />
              <Text style={styles.roleText}>Client</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'Worker' && styles.activeRole]}
              onPress={() => { setRole('Worker'); setEmailOrCnic(''); }}>
              <Icon name="account-group-outline" size={22} color={role === 'Worker' ? "#1E64D3" : "#000"} />
              <Text style={styles.roleText}>Worker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'Company' && styles.activeRole]}
              onPress={() => { setRole('Company'); setEmailOrCnic(''); }}>
              <Icon name="domain" size={22} color={role === 'Company' ? "#1E64D3" : "#000"} />
              <Text style={styles.roleText}>Company</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'Police' && styles.activeRole]}
              onPress={() => { setRole('Police'); setEmailOrCnic(''); }}>
              <Icon name="shield-check-outline" size={22} color={role === 'Police' ? "#1E64D3" : "#000"} />
              <Text style={styles.roleText}>Police</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.iconBackground}>
              <Icon name={getIdentifierIcon()} size={24} color="#1E64D3" />
            </View>
            <TextInput
              style={styles.input}
              placeholder={getIdentifierPlaceholder()}
              placeholderTextColor="#999"
              value={emailOrCnic}
              onChangeText={setEmailOrCnic}
              keyboardType={getKeyboardType()}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputWrapper, styles.marginTop]}>
            <View style={styles.iconBackground}>
              <Icon name="lock-outline" size={24} color="#1E64D3" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
              <Icon
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={22}
                color="#666"
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Icon
                name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
                size={22}
                color="#1E64D3"
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1E64D3" />
            ) : (
              <Text style={styles.signInText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupText}>Signup</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="map-marker-alert" size={50} color="#1E64D3" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Location Required</Text>
            <Text style={styles.modalText}>
              In order to connect you with nearby services, we need your location. Please drop a pin on the map to continue.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleGoToMap}>
              <Text style={styles.modalButtonText}>Go to Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  innerContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  circleTopLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D6EAF8',
    zIndex: -1,
  },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  logoImage: { width: '90%', height: '90%', borderRadius: 25 },
  brandName: { marginTop: 15, fontSize: 20, fontWeight: 'bold', color: '#2C437E' },
  formContainer: { width: '100%' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 3,
    backgroundColor: '#FFF',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  activeRole: { backgroundColor: '#E0DADA' },
  roleText: { marginLeft: 8, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  marginTop: { marginTop: 15 },
  iconBackground: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  eyeIcon: { padding: 5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { marginLeft: 8, color: '#555', fontSize: 14 },
  forgotText: { color: '#1E64D3', fontSize: 14, fontWeight: '600' },
  signInButton: {
    backgroundColor: '#FFF',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E64D3',
    elevation: 3,
  },
  signInText: { color: '#1E64D3', fontSize: 18, fontWeight: 'bold' },
  orText: { textAlign: 'center', marginVertical: 15, color: '#888', fontSize: 14 },
  signupButton: {
    backgroundColor: '#1E64D3',
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  signupText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 10 },
  modalText: { fontSize: 15, color: '#5F6368', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  modalButton: { backgroundColor: '#1E64D3', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 3 },
  modalButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default LoginScreen;