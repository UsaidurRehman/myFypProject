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
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_AUTH } from '../../config';

const LOGO_IMG = require('../../images/logo.png');

const LoginScreen = ({ navigation }) => {
  const [role, setRole] = useState('Client');
  const [emailOrCnic, setEmailOrCnic] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrCnic || !password) {
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
          EmailOrCnic: emailOrCnic,
          Password: password
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Save the token and role locally
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userRole', result.role);
        // Save name and picture for use across screens
        await AsyncStorage.setItem('userName', result.name || '');
        await AsyncStorage.setItem('userPicture', result.picture || '');
        await AsyncStorage.setItem('userAddress', result.address || '');
        await AsyncStorage.setItem('userPhone', result.phone || '');
        if (result.clientId) await AsyncStorage.setItem('clientId', result.clientId.toString());
        if (result.email) await AsyncStorage.setItem('userEmail', result.email);
        if (result.workerId) await AsyncStorage.setItem('workerId', result.workerId.toString());

        NotificationHelper.showSuccess("Login Successful!");

        // Navigate based on role — Client goes to FindService, Worker goes to Dashboard
        if (result.role === 'Client') {
          navigation.replace('FindServiceScreen');
        } else {
          navigation.replace('WorkerDashboardScreen');
        }
      } else {
        NotificationHelper.showError(result.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error(error);
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

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'Client' && styles.activeRole]}
              onPress={() => setRole('Client')}>
              <Icon name="account-outline" size={24} color={role === 'Client' ? "#1E64D3" : "#000"} />
              <Text style={styles.roleText}>Client</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'Worker' && styles.activeRole]}
              onPress={() => setRole('Worker')}>
              <Icon name="account-group-outline" size={24} color={role === 'Worker' ? "#1E64D3" : "#000"} />
              <Text style={styles.roleText}>Worker</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.iconBackground}>
              <Icon name={role === 'Client' ? "email-outline" : "card-account-details-outline"} size={24} color="#1E64D3" />
            </View>
            <TextInput
              style={styles.input}
              placeholder={role === 'Client' ? "Email" : "CNIC Without Dashes"}
              placeholderTextColor="#999"
              value={emailOrCnic}
              onChangeText={setEmailOrCnic}
              keyboardType={role === 'Client' ? "email-address" : "numeric"}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  innerContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  circleTopLeft: { position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: '#D6EAF8', zIndex: -1 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  logoCircle: { width: 120, height: 120, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6, overflow: 'hidden' },
  logoImage: { width: '90%', height: '90%', borderRadius: 25 },
  brandName: { marginTop: 15, fontSize: 20, fontWeight: 'bold', color: '#2C437E' },
  formContainer: { width: '100%' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '48%', height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', elevation: 3, backgroundColor: '#FFF' },
  activeRole: { backgroundColor: '#E0DADA' },
  roleText: { marginLeft: 10, fontWeight: 'bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 15, height: 60, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  marginTop: { marginTop: 15 },
  iconBackground: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  eyeIcon: { padding: 5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { marginLeft: 8, color: '#555', fontSize: 14 },
  forgotText: { color: '#1E64D3', fontSize: 14, fontWeight: '600' },
  signInButton: { backgroundColor: '#FFF', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E64D3', elevation: 3 },
  signInText: { color: '#1E64D3', fontSize: 18, fontWeight: 'bold' },
  orText: { textAlign: 'center', marginVertical: 15, color: '#888', fontSize: 14 },
  signupButton: { backgroundColor: '#1E64D3', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  signupText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;