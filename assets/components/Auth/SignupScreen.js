import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_ACCOUNT } from '../../config';

const FormInput = ({ icon, placeholder, isPassword, secure, toggleSecure, value, onChangeText, keyboardType, isDropdown, isButton, onPress, leftIconColor }) => (
  <TouchableOpacity
    activeOpacity={isButton ? 0.7 : 1}
    onPress={isButton ? onPress : null}
    style={styles.inputWrapper}
  >
    <View style={[styles.iconCircle, leftIconColor && { backgroundColor: leftIconColor + '20' }]}>
      <Icon name={icon} size={20} color={leftIconColor || "#333"} />
    </View>
    {isButton ? (
      <Text style={[styles.input, { color: value ? '#333' : '#999', paddingTop: 15 }]}>{value || placeholder}</Text>
    ) : (
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={secure}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        editable={!isDropdown && !isButton}
      />
    )}
    {isPassword && (
      <TouchableOpacity onPress={toggleSecure}>
        <Icon name={secure ? "eye-off" : "eye"} size={22} color="#333" style={styles.eyeIcon} />
      </TouchableOpacity>
    )}
    {(isDropdown || isButton) && <Icon name={isButton ? "plus" : "chevron-down"} size={24} color="#333" />}
  </TouchableOpacity>
);

const SignupScreen = ({ navigation, route }) => {
  const [role, setRole] = useState('Client');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [salary, setSalary] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasAddedSkills, setHasAddedSkills] = useState(false);
  const [skillsData, setSkillsData] = useState([]);
  const [gender, setGender] = useState('Male'); 
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we are in Edit Mode
    if (route.params?.isEdit && route.params?.initialData && !hasAddedSkills) {
      const data = route.params.initialData;
      const targetRole = route.params.role || 'Worker';

      setRole(targetRole);
      setName(data.name || '');
      setPhone(data.phone || '');
      setAddress(data.location || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      const dbGender = data.gender ? data.gender.toLowerCase() : 'male';
      setGender(dbGender === 'female' ? 'Female' : 'Male');

      if (targetRole === 'Worker') {
        setAge(data.age?.toString() || '');
        setCnic(data.cnic || '');

        const rawSalary = data.salary ? data.salary.toString() : '0';
        setSalary(rawSalary.replace('Not Set', '0'));

        if (data.rawExperiences) {
          setSkillsData(data.rawExperiences);
          setHasAddedSkills(true);
        }
      }

      if (data.picture && typeof data.picture === 'string') {
        setSelectedImage({ uri: data.picture.startsWith('/') ? `${SERVER_BASE}${data.picture}` : data.picture });
      }
    }

    if (route.params?.skillsCompleted) {
      setHasAddedSkills(true);

      // Restore ALL state from params safely
      if (route.params.name !== undefined) setName(route.params.name);
      if (route.params.age !== undefined) setAge(route.params.age);
      if (route.params.phone !== undefined) setPhone(route.params.phone);
      if (route.params.cnic !== undefined) setCnic(route.params.cnic);
      if (route.params.salary !== undefined) setSalary(route.params.salary);
      if (route.params.email !== undefined) setEmail(route.params.email);
      if (route.params.address !== undefined) setAddress(route.params.address);
      if (route.params.password !== undefined) setPassword(route.params.password);
      if (route.params.confirmPassword !== undefined) setConfirmPassword(route.params.confirmPassword);
      if (route.params.selectedImage !== undefined) setSelectedImage(route.params.selectedImage);
      if (route.params.role !== undefined) setRole(route.params.role);
      if (route.params.gender !== undefined) setGender(route.params.gender);
      if (route.params.bio !== undefined) setBio(route.params.bio);
      
      if (route.params.experiencesJson) {
        try {
          setSkillsData(JSON.parse(route.params.experiencesJson));
        } catch(e) {
          console.error(e);
        }
      }

      setStep(2);
    }
  }, [route.params]);

  const goToSkills = () => {
    navigation.navigate('AddSkills', {
      ...route.params, 
      name, age, phone, cnic, salary, email, address, password, confirmPassword,
      role, step, selectedImage, gender, bio,
      existingExperiences: skillsData 
    });
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (!response.didCancel && response.assets) {
        setSelectedImage(response.assets[0]);
      }
    });
  };


const handleSignup = async () => {
  const isEdit = route.params?.isEdit;

  // 1. Validations
  if (!name || !phone || !address || !email) {
    NotificationHelper.showError("Please fill out all fundamental profile details.");
    return;
  }

  if (!isEdit && !password) {
    NotificationHelper.showError("Password field is required.");
    return;
  }

  if (password !== confirmPassword) {
    NotificationHelper.showError("Passwords do not match.");
    return;
  }

  if (!selectedImage) {
    NotificationHelper.showError("Please upload a profile picture.");
    return;
  }

  if (role === 'Worker' && skillsData.length === 0) {
    NotificationHelper.showError("Please add at least one primary skill to proceed.");
    return;
  }
  

  const API_BASE_URL = API_ACCOUNT;
  let endpoint = isEdit ? (role === 'Client' ? 'UpdateClient' : 'UpdateWorker') : (role === 'Client' ? 'SignupClient' : 'SignupWorker');
  const url = `${API_BASE_URL}/${endpoint}`;

  // 2. Prepare FormData Architecture
  const formData = new FormData();
  if (isEdit) {
    const initialId = route.params?.initialData?.id;
    if (!initialId) {
      NotificationHelper.showError("Session error: Missing profile tracking metadata.");
      return;
    }
    formData.append(role === 'Client' ? 'ClientId' : 'WorkerId', initialId);
  }

  formData.append('Name', name);
  formData.append('Phone', phone);
  formData.append('Address', address);
  formData.append('Password', password || ""); 
  formData.append('Email', email);

  if (role === 'Worker') {
    formData.append('Cnic', cnic);
    formData.append('Salary', salary || "0");
    formData.append('Age', age || "0");
    formData.append('Gender', gender);
    formData.append('Bio', bio);

    formData.append('experiencesJson', JSON.stringify(skillsData));
  }

  // 3. Handle Binary Image Attachment
  if (selectedImage && selectedImage.uri && !selectedImage.uri.startsWith('http')) {
    formData.append('PictureFile', {
      uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
      type: selectedImage.type || 'image/jpeg',
      name: selectedImage.fileName || 'profile.jpg',
    });
  }

  setIsLoading(true);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      // 1. Show the success notification cleanly without passing a callback function argument
      NotificationHelper.showSuccess(result.message || "Operation completed successfully!");

      // 2. Wrap your navigation inside a setTimeout to safely transition screens after a brief delay
      setTimeout(() => {
        if (isEdit) {
          navigation.navigate(role === 'Worker' ? 'WorkerDashboardScreen' : 'UserDashboardScreen');
        } else {
          navigation.replace('Login');
        }
      }, 1200); // 1.2 second delay gives the user time to read the message
    } else {
      NotificationHelper.showError(result.message || "Something went wrong during data validation.");
    }
  } catch (error) {
    console.error("Auth Action Error:", error);
    NotificationHelper.showError("Cannot reach backend server.");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backArrow}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{route.params?.isEdit ? 'Edit Profile' : 'Create Account'}</Text>
        <Image source={require('../../images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!route.params?.isEdit && (
          <>
            <Text style={styles.sectionLabel}>SELECT ROLE</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity style={[styles.roleButton, role === 'Client' && styles.activeRole]} onPress={() => { setRole('Client'); setStep(1); }}>
                <Icon name="account-outline" size={24} color={role === 'Client' ? "#1E64D3" : "#000"} />
                <Text style={styles.roleText}>Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, role === 'Worker' && styles.activeRole]} onPress={() => setRole('Worker')}>
                <Icon name="account-group-outline" size={24} color={role === 'Worker' ? "#1E64D3" : "#000"} />
                <Text style={styles.roleText}>Worker</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {((role === 'Client') || (role === 'Worker' && step === 1)) && (
          <>
            <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
              {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.fullAvatar} /> : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera-plus-outline" size={30} color="#999" />
                  <Text style={{ fontSize: 10, color: '#999' }}>Upload Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <FormInput icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
            {role === 'Worker' && (
              <>
                <FormInput icon="card-bulleted-outline" placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
                <FormInput icon="card-account-details-outline" placeholder="CNIC" value={cnic} onChangeText={setCnic} keyboardType="numeric" />
                <FormInput icon="currency-usd" placeholder="Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />
              </>
            )}
            <FormInput icon="phone-outline" placeholder="Phone no" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            {role === 'Worker' && (
              <FormInput icon="map-marker-outline" placeholder="Address" value={address} onChangeText={setAddress} />
            )}
            {role === 'Client' && (
              <>
                <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} />
                <FormInput icon="home-outline" placeholder="Address" value={address} onChangeText={setAddress} />
                <FormInput icon="lock-outline" placeholder="Password" isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
                <FormInput icon="lock-outline" placeholder="Confirm Password" isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />
              </>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => role === 'Client' ? handleSignup() : setStep(2)}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{role === 'Client' ? (route.params?.isEdit ? 'Update' : 'Signup') : 'Next'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {role === 'Worker' && step === 2 && (
          <>
            <Text style={styles.sectionLabel}>PROFESSIONAL DESCRIPTION</Text>
            <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start', paddingTop: 10 }]}>
              <View style={styles.iconCircle}>
                <Icon name="text-account" size={20} color="#333" />
              </View>
              <TextInput
                style={[styles.input, { height: 55, textAlignVertical: 'top' }]}
                placeholder="Briefly describe your work experience and skills..."
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={2}
                value={bio}
                onChangeText={setBio}
              />
            </View>

            <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} />

            <FormInput 
              icon={skillsData.length > 0 ? "check-circle" : "plus-circle-outline"} 
              leftIconColor={skillsData.length > 0 ? "#008000" : "#1E64D3"} 
              placeholder="Add Skills" 
              isButton={true} 
              value={skillsData.length > 0 ? `${skillsData.length} Skills Added` : ""} 
              onPress={goToSkills} 
            />

            <Text style={styles.sectionLabel}>SELECT GENDER</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderChip, gender === 'Male' && styles.activeGenderChip]}
                onPress={() => setGender('Male')}
              >
                <Icon name="gender-male" size={20} color={gender === 'Male' ? "#FFF" : "#333"} />
                <Text style={[styles.genderText, gender === 'Male' && styles.activeGenderText]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderChip, gender === 'Female' && styles.activeGenderChip]}
                onPress={() => setGender('Female')}
              >
                <Icon name="gender-female" size={20} color={gender === 'Female' ? "#FFF" : "#333"} />
                <Text style={[styles.genderText, gender === 'Female' && styles.activeGenderText]}>Female</Text>
              </TouchableOpacity>
            </View>

            <FormInput icon="lock-outline" placeholder={route.params?.isEdit ? "New Password (Optional)" : "Password"} isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
            <FormInput icon="lock-outline" placeholder={route.params?.isEdit ? "Confirm New Password" : "Confirm Password"} isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => setStep(1)}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={handleSignup}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{route.params?.isEdit ? 'Update Profile' : 'Submit'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, elevation: 4, backgroundColor: '#FFF' },
  backArrow: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerLogo: { width: 40, height: 40 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '48%', height: 60, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', elevation: 3, backgroundColor: '#FFF' },
  activeRole: { backgroundColor: '#E0DADA' },
  roleText: { marginLeft: 10, fontWeight: 'bold' },
  avatarPicker: { alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: '#F5F5F5', marginBottom: 20, elevation: 4, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  fullAvatar: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, height: 55, marginBottom: 15, paddingHorizontal: 15, elevation: 4 },
  iconCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionButton: { width: '47%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  blueBtn: { backgroundColor: '#1E64D3' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  eyeIcon: { backgroundColor: '#EEE', borderRadius: 15, padding: 4 },
  genderContainer: { flexDirection: 'row', marginBottom: 15 },
  genderChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  activeGenderChip: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
  genderText: { marginLeft: 8, fontWeight: 'bold', color: '#333' },
  activeGenderText: { color: '#FFF' },
});

export default SignupScreen;