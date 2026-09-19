// import React, { useState, useEffect, useRef } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView,
//   Image,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { launchImageLibrary } from 'react-native-image-picker';
// import NotificationHelper from '../Notification/NotificationHelper';
// import { SERVER_BASE, API_ACCOUNT } from '../../config';

// const FormInput = ({ icon, placeholder, isPassword, secure, toggleSecure, value, onChangeText, keyboardType, isDropdown, isButton, onPress, leftIconColor }) => (
//   <TouchableOpacity
//     activeOpacity={isButton ? 0.7 : 1}
//     onPress={isButton ? onPress : null}
//     style={styles.inputWrapper}
//   >
//     <View style={styles.iconCircle}>
//       <Icon name={icon} size={20} color={leftIconColor || '#333'} />
//     </View>
//     {isDropdown || isButton ? (
//       <Text style={[styles.input, { color: value ? '#333' : '#999', paddingTop: 16 }]}>
//         {value || placeholder}
//       </Text>
//     ) : (
//       <TextInput
//         style={styles.input}
//         placeholder={placeholder}
//         placeholderTextColor="#999"
//         value={value}
//         onChangeText={onChangeText}
//         keyboardType={keyboardType || 'default'}
//         secureTextEntry={isPassword ? secure : false}
//         autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
//       />
//     )}
//     {isPassword && (
//       <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon}>
//         <Icon name={secure ? 'eye-off' : 'eye'} size={20} color="#333" />
//       </TouchableOpacity>
//     )}
//   </TouchableOpacity>
// );

// const SignupScreen = ({ navigation, route }) => {
//   // Top-level Unconditional Hooks
//   const [role, setRole] = useState('Client');
//   const [step, setStep] = useState(1);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   // Client & Worker fields
//   const [name, setName] = useState('');
//   const [age, setAge] = useState('');
//   const [phone, setPhone] = useState('');
//   const [cnic, setCnic] = useState('');
//   const [salary, setSalary] = useState('');
//   const [email, setEmail] = useState('');
//   const [address, setAddress] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [hasAddedSkills, setHasAddedSkills] = useState(false);
//   const [skillsData, setSkillsData] = useState([]);
//   const [gender, setGender] = useState('Male');
//   const [bio, setBio] = useState('');

//   // Company fields
//   const [companyName, setCompanyName] = useState('');
//   const [licenseNumber, setLicenseNumber] = useState('');

//   const [isLoading, setIsLoading] = useState(false);

//   // ─── LOCATION (NEW) ────────────────────────────────────────────────────────
//   // Holds the pin the user dropped on MapScreen. Required for Client & Worker
//   // signups, and it is sent to the backend as part of the signup form-data.
//   const [pendingLocation, setPendingLocation] = useState(null);

//   // Keeps edit-mode stable even if the navigator replaces route params.
//   const [isEditMode, setIsEditMode] = useState(!!route.params?.isEdit);

//   // Guards so a single map round-trip can never submit twice.
//   const handledLocationRef = useRef(null);
//   // ───────────────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     setIsEditMode(!!route.params?.isEdit);
//   }, [route.params?.isEdit]);

//   useEffect(() => {
//     if (route.params?.isEdit && route.params?.initialData && !hasAddedSkills) {
//       const data = route.params.initialData;
//       const targetRole = route.params.role || 'Worker';

//       setRole(targetRole);
//       setName(data.name || '');
//       setPhone(data.phone || data.phoneNo || '');
//       setAddress(data.location || data.companyAddress || '');
//       setEmail(data.email || '');
//       setBio(data.bio || '');
//       const dbGender = data.gender ? data.gender.toLowerCase() : 'male';
//       setGender(dbGender === 'female' ? 'Female' : 'Male');

//       if (targetRole === 'Worker') {
//         setAge(data.age?.toString() || '');
//         setCnic(data.cnic || '');
//         const rawSalary = data.salary ? data.salary.toString() : '0';
//         setSalary(rawSalary.replace('Not Set', '0'));

//         if (data.rawExperiences) {
//           setSkillsData(data.rawExperiences);
//           setHasAddedSkills(true);
//         }
//       } else if (targetRole === 'Company') {
//         setCompanyName(data.companyName || '');
//         setLicenseNumber(data.licenseNumber || '');
//       }

//       if (data.picture && typeof data.picture === 'string') {
//         setSelectedImage({ uri: data.picture.startsWith('/') ? `${SERVER_BASE}${data.picture}` : data.picture });
//       }
//     }

//     if (route.params?.skillsCompleted) {
//       setHasAddedSkills(true);

//       if (route.params.name !== undefined) setName(route.params.name);
//       if (route.params.age !== undefined) setAge(route.params.age);
//       if (route.params.phone !== undefined) setPhone(route.params.phone);
//       if (route.params.cnic !== undefined) setCnic(route.params.cnic);
//       if (route.params.salary !== undefined) setSalary(route.params.salary);
//       if (route.params.email !== undefined) setEmail(route.params.email);
//       if (route.params.address !== undefined) setAddress(route.params.address);
//       if (route.params.password !== undefined) setPassword(route.params.password);
//       if (route.params.confirmPassword !== undefined) setConfirmPassword(route.params.confirmPassword);
//       if (route.params.selectedImage !== undefined) setSelectedImage(route.params.selectedImage);
//       if (route.params.role !== undefined) setRole(route.params.role);
//       if (route.params.gender !== undefined) setGender(route.params.gender);
//       if (route.params.bio !== undefined) setBio(route.params.bio);

//       if (route.params.experiencesJson) {
//         try {
//           setSkillsData(JSON.parse(route.params.experiencesJson));
//         } catch (e) {
//           console.error(e);
//         }
//       }

//       setStep(2);
//     }
//   }, [route.params]);

//   // ─── Snapshot of everything the signup API needs ───────────────────────────
//   // The map screen is pushed on top of this screen, so the form state is still
//   // alive when we come back. We still ship a snapshot through route params so
//   // the flow keeps working even if the navigator ever unmounts this screen.
//   const buildDraft = () => ({
//     role,
//     step,
//     name,
//     age,
//     phone,
//     cnic,
//     salary,
//     email,
//     address,
//     password,
//     confirmPassword,
//     selectedImage,
//     gender,
//     bio,
//     companyName,
//     licenseNumber,
//     hasAddedSkills,
//     skillsData,
//   });

//   const openMapForLocation = () => {
//     navigation.navigate('MapScreen', {
//       pickLocationForSignup: true,
//       userRole: role,
//       latitude: pendingLocation?.latitude ?? null,
//       longitude: pendingLocation?.longitude ?? null,
//       signupDraft: buildDraft(),
//     });
//   };

//   const goToSkills = () => {
//     navigation.navigate('AddSkills', {
//       ...route.params,
//       name, age, phone, cnic, salary, email, address, password, confirmPassword,
//       role, step, selectedImage, gender, bio,
//       existingExperiences: skillsData
//     });
//   };

//   const pickImage = () => {
//     launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
//       if (!response.didCancel && response.assets) {
//         setSelectedImage(response.assets[0]);
//       }
//     });
//   };

//   // ─── ACTUAL SUBMIT ────────────────────────────────────────────────────────
//   // Everything is passed in explicitly (data + location) so this can be called
//   // safely from either the button or the "returned from map" effect below.
//   const performSignup = async (data, location) => {
//     const {
//       role: dataRole, name: dName, age: dAge, phone: dPhone, cnic: dCnic, salary: dSalary,
//       email: dEmail, address: dAddress, password: dPassword, confirmPassword: dConfirmPassword,
//       selectedImage: dImage, gender: dGender, bio: dBio, companyName: dCompanyName,
//       licenseNumber: dLicenseNumber, skillsData: dSkills
//     } = data;

//     if (dataRole === 'Company') {
//       if (!dCompanyName || !dEmail || !dPhone || !dLicenseNumber || !dAddress) {
//         NotificationHelper.showError("Please fill out all company details.");
//         return;
//       }
//     } else {
//       if (!dName || !dPhone || !dAddress || !dEmail) {
//         NotificationHelper.showError("Please fill out all fundamental profile details.");
//         return;
//       }
//     }

//     if (!isEditMode && !dPassword) {
//       NotificationHelper.showError("Password field is required.");
//       return;
//     }

//     if (dPassword !== dConfirmPassword) {
//       NotificationHelper.showError("Passwords do not match.");
//       return;
//     }

//     if (!dImage && (dataRole === 'Client' || dataRole === 'Worker')) {
//       NotificationHelper.showError("Please upload a profile picture.");
//       return;
//     }

//     if (dataRole === 'Worker' && dSkills.length === 0) {
//       NotificationHelper.showError("Please add at least one primary skill to proceed.");
//       return;
//     }

//     // Location is mandatory for Client & Worker signups (not for edits/company)
//     const needsLocation = !isEditMode && (dataRole === 'Client' || dataRole === 'Worker');
//     if (needsLocation && !location) {
//       NotificationHelper.showError("Please pin your location on the map to continue.");
//       openMapForLocation();
//       return;
//     }

//     const API_BASE_URL = API_ACCOUNT;
//     let endpoint = '';
//     if (dataRole === 'Company') {
//       endpoint = isEditMode ? 'UpdateCompany' : 'SignupCompany';
//     } else if (dataRole === 'Client') {
//       endpoint = isEditMode ? 'UpdateClient' : 'SignupClient';
//     } else {
//       endpoint = isEditMode ? 'UpdateWorker' : 'SignupWorker';
//     }

//     const url = `${API_BASE_URL}/${endpoint}`;
//     const formData = new FormData();

//     if (isEditMode) {
//       const initialId = route.params?.initialData?.id;
//       if (!initialId) {
//         NotificationHelper.showError("Session error: Missing profile tracking metadata.");
//         return;
//       }
//       formData.append(
//         dataRole === 'Company' ? 'CompanyID' : (dataRole === 'Client' ? 'ClientId' : 'WorkerId'),
//         initialId
//       );
//     }

//     if (dataRole === 'Company') {
//       formData.append('CompanyName', dCompanyName);
//       formData.append('PhoneNo', dPhone);
//       formData.append('CompanyAddress', dAddress);
//       formData.append('LicenseNumber', dLicenseNumber);
//       formData.append('Email', dEmail);
//       formData.append('Password', dPassword || "");

//       if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
//         formData.append('LogoFile', {
//           uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
//           type: dImage.type || 'image/jpeg',
//           name: dImage.fileName || 'logo.jpg',
//         });
//       }
//     } else {
//       formData.append('Name', dName);
//       formData.append('Phone', dPhone);
//       formData.append('Address', dAddress);
//       formData.append('Password', dPassword || "");
//       formData.append('Email', dEmail);

//       if (dataRole === 'Worker') {
//         formData.append('Cnic', dCnic);
//         formData.append('Salary', dSalary || "0");
//         formData.append('Age', dAge || "0");
//         formData.append('Gender', dGender);
//         formData.append('Bio', dBio);
//         formData.append('experiencesJson', JSON.stringify(dSkills));
//       }

//       if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
//         formData.append('PictureFile', {
//           uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
//           type: dImage.type || 'image/jpeg',
//           name: dImage.fileName || 'profile.jpg',
//         });
//       }

//       // ─── LOCATION SENT WITH THE SIGNUP REQUEST (NEW) ───────────────────────
//       // Client.Latitude/Longitude (double?) and Worker.Latitude/Longitude
//       // (decimal?) bind straight from these form fields on SignupClient /
//       // SignupWorker, so no extra API call and no backend change is needed.
//       // toFixed() guarantees a dot decimal separator regardless of device locale.
//       if (needsLocation && location) {
//         formData.append('Latitude', Number(location.latitude).toFixed(6));
//         formData.append('Longitude', Number(location.longitude).toFixed(6));
//       }
//       // ───────────────────────────────────────────────────────────────────────
//     }

//     setIsLoading(true);
//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Accept': 'application/json' },
//         body: formData,
//       });

//       const result = await response.json();

//       if (response.ok) {
//         // Forget the pin so a later fresh signup on this screen starts clean.
//         setPendingLocation(null);
//         handledLocationRef.current = null;

//         NotificationHelper.showSuccess(result.message || "Operation completed successfully!");
//         setTimeout(() => {
//           if (isEditMode) {
//             navigation.navigate(role === 'Worker' ? 'WorkerDashboardScreen' : 'UserDashboardScreen');
//           } else {
//             navigation.replace('Login');
//           }
//         }, 1200);
//       } else {
//         NotificationHelper.showError(result.message || "Something went wrong during data validation.");
//       }
//     } catch (error) {
//       console.error("Auth Action Error:", error);
//       NotificationHelper.showError("Cannot reach backend server.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ─── BUTTON HANDLER ───────────────────────────────────────────────────────
//   // Validates first; if a Client/Worker has no pin yet, sends them to the map
//   // (carrying the whole form) and the submit happens on the way back.
//   const handleSignup = () => {
//     const data = buildDraft();

//     if (data.role === 'Company') {
//       if (!companyName || !email || !phone || !licenseNumber || !address) {
//         NotificationHelper.showError("Please fill out all company details.");
//         return;
//       }
//     } else if (!name || !phone || !address || !email) {
//       NotificationHelper.showError("Please fill out all fundamental profile details.");
//       return;
//     }

//     if (!isEditMode && !password) {
//       NotificationHelper.showError("Password field is required.");
//       return;
//     }

//     if (password !== confirmPassword) {
//       NotificationHelper.showError("Passwords do not match.");
//       return;
//     }

//     if (!selectedImage && (role === 'Client' || role === 'Worker')) {
//       NotificationHelper.showError("Please upload a profile picture.");
//       return;
//     }

//     if (role === 'Worker' && skillsData.length === 0) {
//       NotificationHelper.showError("Please add at least one primary skill to proceed.");
//       return;
//     }

//     // Mandatory location step: Client & Worker only, and never while editing.
//     if (!isEditMode && (role === 'Client' || role === 'Worker') && !pendingLocation) {
//       openMapForLocation();
//       return;
//     }

//     performSignup(data, pendingLocation);
//   };

//   // ─── RETURN FROM THE MAP ──────────────────────────────────────────────────
//   // MapScreen hands the pin back through route params. We submit exactly once
//   // per pin (guarded by pickedAt) and we submit with the params we were given,
//   // so this never depends on state-update timing.
//   useEffect(() => {
//     const params = route.params || {};
//     const picked = params.signupLocation;

//     if (!picked || typeof picked.latitude !== 'number' || typeof picked.longitude !== 'number') return;
//     if (handledLocationRef.current === picked.pickedAt) return;

//     handledLocationRef.current = picked.pickedAt;
//     setPendingLocation(picked);

//     // Restore the form from the snapshot the map echoed back, so the screen is
//     // correct even if it was remounted while the map was open.
//     const draft = params.signupDraft;
//     if (draft) {
//       if (draft.role !== undefined) setRole(draft.role);
//       if (draft.step !== undefined) setStep(draft.step);
//       if (draft.name !== undefined) setName(draft.name);
//       if (draft.age !== undefined) setAge(draft.age);
//       if (draft.phone !== undefined) setPhone(draft.phone);
//       if (draft.cnic !== undefined) setCnic(draft.cnic);
//       if (draft.salary !== undefined) setSalary(draft.salary);
//       if (draft.email !== undefined) setEmail(draft.email);
//       if (draft.address !== undefined) setAddress(draft.address);
//       if (draft.password !== undefined) setPassword(draft.password);
//       if (draft.confirmPassword !== undefined) setConfirmPassword(draft.confirmPassword);
//       if (draft.selectedImage !== undefined) setSelectedImage(draft.selectedImage);
//       if (draft.gender !== undefined) setGender(draft.gender);
//       if (draft.bio !== undefined) setBio(draft.bio);
//       if (draft.companyName !== undefined) setCompanyName(draft.companyName);
//       if (draft.licenseNumber !== undefined) setLicenseNumber(draft.licenseNumber);
//       if (draft.hasAddedSkills !== undefined) setHasAddedSkills(draft.hasAddedSkills);
//       if (draft.skillsData !== undefined) setSkillsData(draft.skillsData);

//       if (!route.params?.isEdit) {
//         performSignup(draft, picked);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [route.params]);

//   // Small reusable UI block that shows the captured pin + a Change action.
//   const renderLocationRow = () => {
//     if (isEditMode || (role !== 'Client' && role !== 'Worker')) return null;

//     return (
//       <View style={styles.locationCard}>
//         <View style={styles.iconCircle}>
//           <Icon
//             name={pendingLocation ? 'map-marker-check' : 'map-marker-question-outline'}
//             size={20}
//             color={pendingLocation ? '#008000' : '#999'}
//           />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.locationTitle}>
//             {pendingLocation ? 'Location Pinned' : 'Location Required'}
//           </Text>
//           <Text style={styles.locationSub}>
//             {pendingLocation
//               ? `${Number(pendingLocation.latitude).toFixed(5)}, ${Number(pendingLocation.longitude).toFixed(5)}`
//               : 'Drop a pin on the map after tapping the button below'}
//           </Text>
//         </View>
//         {pendingLocation && (
//           <TouchableOpacity onPress={openMapForLocation}>
//             <Text style={styles.locationChange}>Change</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backArrow}>
//           <Icon name="arrow-left" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{isEditMode ? 'Edit Profile' : 'Create Account'}</Text>
//         <Image source={require('../../images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
//       </View>

//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         {!isEditMode && (
//           <>
//             <Text style={styles.sectionLabel}>SELECT ROLE</Text>
//             <View style={styles.roleGrid}>
//               <TouchableOpacity style={[styles.roleButton, role === 'Client' && styles.activeRole]} onPress={() => { setRole('Client'); setStep(1); }}>
//                 <Icon name="account-outline" size={20} color={role === 'Client' ? "#1E64D3" : "#333"} />
//                 <Text style={[styles.roleText, role === 'Client' && styles.activeRoleText]}>Client</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.roleButton, role === 'Worker' && styles.activeRole]} onPress={() => { setRole('Worker'); setStep(1); }}>
//                 <Icon name="account-group-outline" size={20} color={role === 'Worker' ? "#1E64D3" : "#333"} />
//                 <Text style={[styles.roleText, role === 'Worker' && styles.activeRoleText]}>Worker</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.roleButton, role === 'Company' && styles.activeRole]} onPress={() => { setRole('Company'); setStep(1); }}>
//                 <Icon name="domain" size={20} color={role === 'Company' ? "#1E64D3" : "#333"} />
//                 <Text style={[styles.roleText, role === 'Company' && styles.activeRoleText]}>Company</Text>
//               </TouchableOpacity>
//             </View>
//           </>
//         )}

//         {/* COMPANY SIGNUP FORM */}
//         {role === 'Company' && (
//           <>
//             <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
//               {selectedImage ? (
//                 <Image source={{ uri: selectedImage.uri }} style={styles.fullAvatar} />
//               ) : (
//                 <View style={styles.imagePlaceholder}>
//                   <Icon name="domain" size={32} color="#999" />
//                   <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>Upload Company Logo</Text>
//                 </View>
//               )}
//             </TouchableOpacity>

//             <FormInput icon="domain" placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
//             <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
//             <FormInput icon="phone-outline" placeholder="Phone no" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
//             <FormInput icon="card-account-details-outline" placeholder="License/Registration Number" value={licenseNumber} onChangeText={setLicenseNumber} />
//             <FormInput icon="map-marker-outline" placeholder="Company Address" value={address} onChangeText={setAddress} />

//             <FormInput icon="lock-outline" placeholder="Password" isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
//             <FormInput icon="lock-outline" placeholder="Confirm Password" isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />

//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => navigation.goBack()}>
//                 <Text style={styles.buttonText}>Back</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => handleSignup()}>
//                 {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{isEditMode ? 'Update' : 'Signup'}</Text>}
//               </TouchableOpacity>
//             </View>
//           </>
//         )}

//         {/* CLIENT & WORKER STEP 1 FORM */}
//         {((role === 'Client') || (role === 'Worker' && step === 1)) && (
//           <>
//             <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
//               {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.fullAvatar} /> : (
//                 <View style={styles.imagePlaceholder}>
//                   <Icon name="camera-plus-outline" size={30} color="#999" />
//                   <Text style={{ fontSize: 10, color: '#999' }}>Upload Photo</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//             <FormInput icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
//             {role === 'Worker' && (
//               <>
//                 <FormInput icon="card-bulleted-outline" placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
//                 <FormInput icon="card-account-details-outline" placeholder="CNIC" value={cnic} onChangeText={setCnic} keyboardType="numeric" />
//                 <FormInput icon="currency-usd" placeholder="Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />
//               </>
//             )}
//             <FormInput icon="phone-outline" placeholder="Phone no" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
//             {role === 'Worker' && (
//               <FormInput icon="map-marker-outline" placeholder="Address" value={address} onChangeText={setAddress} />
//             )}
//             {role === 'Client' && (
//               <>
//                 <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} />
//                 <FormInput icon="home-outline" placeholder="Address" value={address} onChangeText={setAddress} />
//                 <FormInput icon="lock-outline" placeholder="Password" isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
//                 <FormInput icon="lock-outline" placeholder="Confirm Password" isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />
//               </>
//             )}

//             {renderLocationRow()}

//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => role === 'Client' ? handleSignup() : setStep(2)}>
//                 {isLoading ? (
//                   <ActivityIndicator color="#FFF" />
//                 ) : (
//                   <Text style={styles.buttonText}>{role === 'Client' ? (isEditMode ? 'Update' : 'Signup') : 'Next'}</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </>
//         )}

//         {/* WORKER STEP 2 FORM */}
//         {role === 'Worker' && step === 2 && (
//           <>
//             <Text style={styles.sectionLabel}>PROFESSIONAL DESCRIPTION</Text>
//             <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start', paddingTop: 10 }]}>
//               <View style={styles.iconCircle}>
//                 <Icon name="text-account" size={20} color="#333" />
//               </View>
//               <TextInput
//                 style={[styles.input, { height: 55, textAlignVertical: 'top' }]}
//                 placeholder="Briefly describe your work experience and skills..."
//                 placeholderTextColor="#999"
//                 multiline={true}
//                 numberOfLines={2}
//                 value={bio}
//                 onChangeText={setBio}
//               />
//             </View>

//             <FormInput icon="email-outline" placeholder="Email" value={email} onChangeText={setEmail} />

//             <FormInput
//               icon={skillsData.length > 0 ? "check-circle" : "plus-circle-outline"}
//               leftIconColor={skillsData.length > 0 ? "#008000" : "#1E64D3"}
//               placeholder="Add Skills"
//               isButton={true}
//               value={skillsData.length > 0 ? `${skillsData.length} Skills Added` : ""}
//               onPress={goToSkills}
//             />

//             <Text style={styles.sectionLabel}>SELECT GENDER</Text>
//             <View style={styles.genderContainer}>
//               <TouchableOpacity
//                 style={[styles.genderChip, gender === 'Male' && styles.activeGenderChip]}
//                 onPress={() => setGender('Male')}
//               >
//                 <Icon name="gender-male" size={20} color={gender === 'Male' ? "#FFF" : "#333"} />
//                 <Text style={[styles.genderText, gender === 'Male' && styles.activeGenderText]}>Male</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.genderChip, gender === 'Female' && styles.activeGenderChip]}
//                 onPress={() => setGender('Female')}
//               >
//                 <Icon name="gender-female" size={20} color={gender === 'Female' ? "#FFF" : "#333"} />
//                 <Text style={[styles.genderText, gender === 'Female' && styles.activeGenderText]}>Female</Text>
//               </TouchableOpacity>
//             </View>

//             <FormInput icon="lock-outline" placeholder={isEditMode ? "New Password (Optional)" : "Password"} isPassword secure={!showPassword} toggleSecure={() => setShowPassword(!showPassword)} value={password} onChangeText={setPassword} />
//             <FormInput icon="lock-outline" placeholder={isEditMode ? "Confirm New Password" : "Confirm Password"} isPassword secure={!showConfirmPassword} toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} value={confirmPassword} onChangeText={setConfirmPassword} />

//             {renderLocationRow()}

//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => setStep(1)}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
//               <TouchableOpacity style={[styles.actionButton, styles.blueBtn]} onPress={() => handleSignup()}>
//                 {isLoading ? (
//                   <ActivityIndicator color="#FFF" />
//                 ) : (
//                   <Text style={styles.buttonText}>{isEditMode ? 'Update Profile' : 'Submit'}</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFF' },
//   header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, elevation: 4, backgroundColor: '#FFF' },
//   backArrow: { padding: 8, backgroundColor: '#F0F0F0', borderRadius: 20 },
//   headerTitle: { fontSize: 22, fontWeight: 'bold' },
//   headerLogo: { width: 40, height: 40 },
//   scrollContent: { padding: 20, paddingBottom: 100 },
//   sectionLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
//   roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
//   roleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '31%', height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', elevation: 2, backgroundColor: '#F9F9F9', marginBottom: 10 },
//   activeRole: { backgroundColor: '#E0DADA', borderColor: '#1E64D3' },
//   roleText: { marginLeft: 8, fontWeight: '600', fontSize: 14, color: '#333' },
//   activeRoleText: { color: '#1E64D3', fontWeight: 'bold' },
//   avatarPicker: { alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: '#F5F5F5', marginBottom: 20, elevation: 4, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
//   fullAvatar: { width: '100%', height: '100%' },
//   imagePlaceholder: { alignItems: 'center' },
//   inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, height: 55, marginBottom: 15, paddingHorizontal: 15, elevation: 4 },
//   iconCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   input: { flex: 1, fontSize: 16 },
//   buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
//   actionButton: { width: '47%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
//   blueBtn: { backgroundColor: '#1E64D3' },
//   buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
//   eyeIcon: { backgroundColor: '#EEE', borderRadius: 15, padding: 4 },
//   genderContainer: { flexDirection: 'row', marginBottom: 15 },
//   genderChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
//   activeGenderChip: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
//   genderText: { marginLeft: 8, fontWeight: 'bold', color: '#333' },
//   activeGenderText: { color: '#FFF' },
//   // ─── location card (new) ───
//   locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F8FF', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 5, borderWidth: 1, borderColor: '#D6E7FF' },
//   locationTitle: { fontSize: 14, fontWeight: 'bold', color: '#123B7A' },
//   locationSub: { fontSize: 12, color: '#5B6B7F', marginTop: 2 },
//   locationChange: { fontSize: 13, fontWeight: 'bold', color: '#1E64D3', marginLeft: 8 },
// });

// export default SignupScreen;


import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_ACCOUNT } from '../../config';

// ─── Design tokens (prototype) ────────────────────────────────────────────────
const BG = '#F6F9FF';
const SURFACE = '#FFFFFF';
const BLUE = '#1E64D3';
const INK = '#0E1B4D';
const MUTED = '#9BA9C0';
const SUBTLE = '#7C8CA6';
const LINE = '#E6EDF9';
const SOFT_BLUE = '#EAF2FF';
const SOFT_BLUE_BORDER = '#D8E6FF';

const LOGO_MARK = require('../../images/logo.png');

const ROLES = [
  { key: 'Client', label: 'Client', icon: 'account-outline' },
  { key: 'Worker', label: 'Worker', icon: 'broom' },
  { key: 'Company', label: 'Company', icon: 'domain' },
];

// ─── Reusable card-styled input (prototype look) ──────────────────────────────
const Field = ({
  icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
  secure, onToggleSecure, multiline, style, iconColor,
}) => (
  <View style={[styles.field, style]}>
    <Icon name={icon} size={18} color={iconColor || MUTED} style={styles.fieldIcon} />
    <TextInput
      style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      placeholder={placeholder}
      placeholderTextColor={MUTED}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize || 'sentences'}
      secureTextEntry={!!secure}
      multiline={!!multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
    {onToggleSecure && (
      <TouchableOpacity onPress={onToggleSecure} hitSlop={10} style={styles.eyeBtn}>
        <Icon name={secure ? 'eye-off-outline' : 'eye-outline'} size={19} color={MUTED} />
      </TouchableOpacity>
    )}
  </View>
);

const SignupScreen = ({ navigation, route }) => {
  // ─── state (unchanged behaviour) ────────────────────────────────────────────
  const [role, setRole] = useState('Client');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Client & Worker fields
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

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // ─── LOCATION ───────────────────────────────────────────────────────────────
  // Pin dropped on MapScreen. Required for Client & Worker signups and sent to
  // the backend inside the signup form-data (no backend change needed).
  const [pendingLocation, setPendingLocation] = useState(null);

  // Keeps edit-mode stable even if the navigator replaces route params.
  const [isEditMode, setIsEditMode] = useState(!!route.params?.isEdit);

  // Guards so a single map round-trip can never submit twice.
  const handledLocationRef = useRef(null);
  // Guards against a double tap on Submit racing the auto-submit after the map.
  const submittingRef = useRef(false);

  useEffect(() => {
    setIsEditMode(!!route.params?.isEdit);
  }, [route.params?.isEdit]);

  // Restores edit-mode data + the Add-Skills round trip (unchanged behaviour)
  useEffect(() => {
    if (route.params?.isEdit && route.params?.initialData && !hasAddedSkills) {
      const data = route.params.initialData;
      const targetRole = route.params.role || 'Worker';

      setRole(targetRole);
      setName(data.name || '');
      setPhone(data.phone || data.phoneNo || '');
      setAddress(data.location || data.companyAddress || '');
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
      } else if (targetRole === 'Company') {
        setCompanyName(data.companyName || '');
        setLicenseNumber(data.licenseNumber || '');
      }

      if (data.picture && typeof data.picture === 'string') {
        setSelectedImage({ uri: data.picture.startsWith('/') ? `${SERVER_BASE}${data.picture}` : data.picture });
      }
    }

    if (route.params?.skillsCompleted) {
      setHasAddedSkills(true);

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
        } catch (e) {
          console.error(e);
        }
      }

      setStep(2);
    }
  }, [route.params]);

  // Snapshot of everything the signup API needs (survives the MapScreen trip)
  const buildDraft = () => ({
    role,
    step,
    name,
    age,
    phone,
    cnic,
    salary,
    email,
    address,
    password,
    confirmPassword,
    selectedImage,
    gender,
    bio,
    companyName,
    licenseNumber,
    hasAddedSkills,
    skillsData,
  });

  const openMapForLocation = () => {
    navigation.navigate('MapScreen', {
      pickLocationForSignup: true,
      userRole: role,
      latitude: pendingLocation?.latitude ?? null,
      longitude: pendingLocation?.longitude ?? null,
      signupDraft: buildDraft(),
    });
  };

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

  // ─── ACTUAL SUBMIT ──────────────────────────────────────────────────────────
  const performSignup = async (data, location) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const {
      role: dataRole, name: dName, age: dAge, phone: dPhone, cnic: dCnic, salary: dSalary,
      email: dEmail, address: dAddress, password: dPassword, confirmPassword: dConfirmPassword,
      selectedImage: dImage, gender: dGender, bio: dBio, companyName: dCompanyName,
      licenseNumber: dLicenseNumber, skillsData: dSkills
    } = data;

    if (dataRole === 'Company') {
      if (!dCompanyName || !dEmail || !dPhone || !dLicenseNumber || !dAddress) {
        NotificationHelper.showError("Please fill out all company details.");
        submittingRef.current = false;
        return;
      }
    } else {
      if (!dName || !dPhone || !dAddress || !dEmail) {
        NotificationHelper.showError("Please fill out all fundamental profile details.");
        submittingRef.current = false;
        return;
      }
    }

    if (!isEditMode && !dPassword) {
      NotificationHelper.showError("Password field is required.");
      submittingRef.current = false;
      return;
    }

    if (dPassword !== dConfirmPassword) {
      NotificationHelper.showError("Passwords do not match.");
      submittingRef.current = false;
      return;
    }

    if (!dImage && (dataRole === 'Client' || dataRole === 'Worker')) {
      NotificationHelper.showError("Please upload a profile picture.");
      submittingRef.current = false;
      return;
    }

    if (dataRole === 'Worker' && dSkills.length === 0) {
      NotificationHelper.showError("Please add at least one primary skill to proceed.");
      submittingRef.current = false;
      return;
    }

    // Location is mandatory for Client & Worker signups (not for edits/company)
    const needsLocation = !isEditMode && (dataRole === 'Client' || dataRole === 'Worker');
    if (needsLocation && !location) {
      NotificationHelper.showError("Please pin your location on the map to continue.");
      submittingRef.current = false;
      openMapForLocation();
      return;
    }

    const API_BASE_URL = API_ACCOUNT;
    let endpoint = '';
    if (dataRole === 'Company') {
      endpoint = isEditMode ? 'UpdateCompany' : 'SignupCompany';
    } else if (dataRole === 'Client') {
      endpoint = isEditMode ? 'UpdateClient' : 'SignupClient';
    } else {
      endpoint = isEditMode ? 'UpdateWorker' : 'SignupWorker';
    }

    const url = `${API_BASE_URL}/${endpoint}`;
    const formData = new FormData();

    if (isEditMode) {
      const initialId = route.params?.initialData?.id;
      if (!initialId) {
        NotificationHelper.showError("Session error: Missing profile tracking metadata.");
        submittingRef.current = false;
        return;
      }
      formData.append(
        dataRole === 'Company' ? 'CompanyID' : (dataRole === 'Client' ? 'ClientId' : 'WorkerId'),
        initialId
      );
    }

    if (dataRole === 'Company') {
      formData.append('CompanyName', dCompanyName);
      formData.append('PhoneNo', dPhone);
      formData.append('CompanyAddress', dAddress);
      formData.append('LicenseNumber', dLicenseNumber);
      formData.append('Email', dEmail);
      formData.append('Password', dPassword || "");

      if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
        formData.append('LogoFile', {
          uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
          type: dImage.type || 'image/jpeg',
          name: dImage.fileName || 'logo.jpg',
        });
      }
    } else {
      formData.append('Name', dName);
      formData.append('Phone', dPhone);
      formData.append('Address', dAddress);
      formData.append('Password', dPassword || "");
      formData.append('Email', dEmail);

      if (dataRole === 'Worker') {
        formData.append('Cnic', dCnic);
        formData.append('Salary', dSalary || "0");
        formData.append('Age', dAge || "0");
        formData.append('Gender', dGender);
        formData.append('Bio', dBio);
        formData.append('experiencesJson', JSON.stringify(dSkills));
      }

      if (dImage && dImage.uri && !dImage.uri.startsWith('http')) {
        formData.append('PictureFile', {
          uri: Platform.OS === 'android' ? dImage.uri : dImage.uri.replace('file://', ''),
          type: dImage.type || 'image/jpeg',
          name: dImage.fileName || 'profile.jpg',
        });
      }

      // ─── LOCATION SENT WITH THE SIGNUP REQUEST ──────────────────────────────
      // Client.Latitude/Longitude (double?) and Worker.Latitude/Longitude
      // (decimal?) bind straight from these form fields on SignupClient /
      // SignupWorker. toFixed() keeps a dot decimal separator on every locale.
      if (needsLocation && location) {
        formData.append('Latitude', Number(location.latitude).toFixed(6));
        formData.append('Longitude', Number(location.longitude).toFixed(6));
      }
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
        setPendingLocation(null);
        handledLocationRef.current = null;

        NotificationHelper.showSuccess(result.message || "Operation completed successfully!");
        setTimeout(() => {
          if (isEditMode) {
            navigation.navigate(role === 'Worker' ? 'WorkerDashboardScreen' : 'UserDashboardScreen');
          } else {
            navigation.replace('Login');
          }
        }, 1200);
      } else {
        NotificationHelper.showError(result.message || "Something went wrong during data validation.");
      }
    } catch (error) {
      console.error("Auth Action Error:", error);
      NotificationHelper.showError("Cannot reach backend server.");
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  // ─── BUTTON HANDLER ─────────────────────────────────────────────────────────
  const handleSignup = () => {
    const data = buildDraft();

    if (data.role === 'Company') {
      if (!companyName || !email || !phone || !licenseNumber || !address) {
        NotificationHelper.showError("Please fill out all company details.");
        return;
      }
    } else if (!name || !phone || !address || !email) {
      NotificationHelper.showError("Please fill out all fundamental profile details.");
      return;
    }

    if (!isEditMode && !password) {
      NotificationHelper.showError("Password field is required.");
      return;
    }

    if (password !== confirmPassword) {
      NotificationHelper.showError("Passwords do not match.");
      return;
    }

    if (!selectedImage && (role === 'Client' || role === 'Worker')) {
      NotificationHelper.showError("Please upload a profile picture.");
      return;
    }

    if (role === 'Worker' && skillsData.length === 0) {
      NotificationHelper.showError("Please add at least one primary skill to proceed.");
      return;
    }

    // Mandatory location step: Client & Worker only, and never while editing.
    if (!isEditMode && (role === 'Client' || role === 'Worker') && !pendingLocation) {
      openMapForLocation();
      return;
    }

    performSignup(data, pendingLocation);
  };

  // ─── RETURN FROM THE MAP ────────────────────────────────────────────────────
  useEffect(() => {
    const params = route.params || {};
    const picked = params.signupLocation;

    if (!picked || typeof picked.latitude !== 'number' || typeof picked.longitude !== 'number') return;
    if (handledLocationRef.current === picked.pickedAt) return;

    handledLocationRef.current = picked.pickedAt;
    setPendingLocation(picked);

    const draft = params.signupDraft;
    if (draft) {
      if (draft.role !== undefined) setRole(draft.role);
      if (draft.step !== undefined) setStep(draft.step);
      if (draft.name !== undefined) setName(draft.name);
      if (draft.age !== undefined) setAge(draft.age);
      if (draft.phone !== undefined) setPhone(draft.phone);
      if (draft.cnic !== undefined) setCnic(draft.cnic);
      if (draft.salary !== undefined) setSalary(draft.salary);
      if (draft.email !== undefined) setEmail(draft.email);
      if (draft.address !== undefined) setAddress(draft.address);
      if (draft.password !== undefined) setPassword(draft.password);
      if (draft.confirmPassword !== undefined) setConfirmPassword(draft.confirmPassword);
      if (draft.selectedImage !== undefined) setSelectedImage(draft.selectedImage);
      if (draft.gender !== undefined) setGender(draft.gender);
      if (draft.bio !== undefined) setBio(draft.bio);
      if (draft.companyName !== undefined) setCompanyName(draft.companyName);
      if (draft.licenseNumber !== undefined) setLicenseNumber(draft.licenseNumber);
      if (draft.hasAddedSkills !== undefined) setHasAddedSkills(draft.hasAddedSkills);
      if (draft.skillsData !== undefined) setSkillsData(draft.skillsData);

      if (!route.params?.isEdit) {
        performSignup(draft, picked);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  // ─── header helpers ─────────────────────────────────────────────────────────
  const showStepUi = !isEditMode && role === 'Worker';
  const headerTitle = isEditMode ? 'Edit Profile' : 'Create Account';
  const headerSubtitle = isEditMode ? 'Update your information' : 'Basic Information';

  const goBack = () => {
    if (showStepUi && step === 2) setStep(1);
    else navigation.goBack();
  };

  const submitLabel = isEditMode
    ? (role === 'Company' ? 'Update' : 'Update Profile')
    : (role === 'Worker' && step === 1 ? 'Next' : 'Sign Up');

  const submitHandler = () => {
    if (role === 'Worker' && step === 1 && !isEditMode) {
      setStep(2);
      return;
    }
    handleSignup();
  };

  // ─── location card ──────────────────────────────────────────────────────────
  const renderLocationCard = () => {
    if (isEditMode || (role !== 'Client' && role !== 'Worker')) return null;
    const pinned = !!pendingLocation;

    return (
      <TouchableOpacity activeOpacity={0.85} style={styles.locationCard} onPress={openMapForLocation}>
        <View style={[styles.locationIcon, pinned && styles.locationIconDone]}>
          <Icon
            name={pinned ? 'map-marker-check-outline' : 'map-marker-radius-outline'}
            size={20}
            color={pinned ? '#FFFFFF' : BLUE}
          />
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationTitle}>{pinned ? 'Location Pinned' : 'Location Required'}</Text>
          <Text style={styles.locationSub} numberOfLines={1}>
            {pinned
              ? `${Number(pendingLocation.latitude).toFixed(5)}, ${Number(pendingLocation.longitude).toFixed(5)} — tap to change`
              : 'Tap to pinpoint address on live map'}
          </Text>
        </View>
        <View style={[styles.toggleTrack, pinned && styles.toggleTrackOn]}>
          <View style={[styles.toggleKnob, pinned && styles.toggleKnobOn]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvatar = () => (
    <View style={styles.avatarWrap}>
      <TouchableOpacity style={styles.avatar} onPress={pickImage} activeOpacity={0.85}>
        {selectedImage?.uri ? (
          <Image source={{ uri: selectedImage.uri }} style={styles.avatarImg} />
        ) : (
          <>
            <Icon name="camera-outline" size={22} color={BLUE} />
            <Text style={styles.avatarText}>Photo</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.avatarBadge} onPress={pickImage} hitSlop={8}>
        <Icon name="plus" size={14} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // ─── form bodies ────────────────────────────────────────────────────────────
  const renderBody = () => {
    // COMPANY
    if (role === 'Company') {
      return (
        <>
          {renderAvatar()}
          <Field icon="domain" placeholder="Company Name" value={companyName} onChangeText={setCompanyName} />
          <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="home-outline" placeholder="Company Address" value={address} onChangeText={setAddress} />
          <Field icon="card-account-details-outline" placeholder="License / Registration Number" value={licenseNumber} onChangeText={setLicenseNumber} />
          <View style={styles.splitRow}>
            <Field
              icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword}
              secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} style={styles.half}
            />
            <Field
              icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword}
              secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.half}
            />
          </View>
        </>
      );
    }

    // WORKER — STEP 1
    if (role === 'Worker' && step === 1) {
      return (
        <>
          {renderAvatar()}
          <Field icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
          <View style={styles.splitRow}>
            <Field
              icon="card-bulleted-outline" placeholder="Age" value={age} onChangeText={setAge}
              keyboardType="numeric" style={styles.half}
            />
            <Field
              icon="card-account-details-outline" placeholder="CNIC" value={cnic} onChangeText={setCnic}
              keyboardType="numeric" style={styles.half}
            />
          </View>
          <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="currency-usd" placeholder="Expected Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />
          <Field icon="map-marker-outline" placeholder="Address or Street" value={address} onChangeText={setAddress} />
        </>
      );
    }

    // WORKER — STEP 2
    if (role === 'Worker' && step === 2) {
      return (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PROFESSIONAL DESCRIPTION</Text>
          </View>
          <Field
            icon="text-account" placeholder="Briefly describe your work experience and skills..."
            value={bio} onChangeText={setBio} multiline style={styles.bioField}
          />

          <Field
            icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
          />

          <TouchableOpacity style={styles.field} onPress={goToSkills} activeOpacity={0.85}>
            <Icon
              name={skillsData.length > 0 ? 'check-circle-outline' : 'plus-circle-outline'}
              size={18}
              color={skillsData.length > 0 ? '#16A34A' : BLUE}
              style={styles.fieldIcon}
            />
            <Text style={[styles.fieldInputText, skillsData.length > 0 && { color: INK }]}>
              {skillsData.length > 0 ? `${skillsData.length} Skills Added` : 'Add Skills'}
            </Text>
            <Icon name="chevron-right" size={20} color="#B9C6DB" />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>SELECT GENDER</Text>
          </View>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderChip, gender === 'Male' && styles.genderChipActive]}
              onPress={() => setGender('Male')}
              activeOpacity={0.85}
            >
              <Icon name="gender-male" size={18} color={gender === 'Male' ? '#FFF' : SUBTLE} />
              <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderChip, gender === 'Female' && styles.genderChipActive]}
              onPress={() => setGender('Female')}
              activeOpacity={0.85}
            >
              <Icon name="gender-female" size={18} color={gender === 'Female' ? '#FFF' : SUBTLE} />
              <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.splitRow}>
            <Field
              icon="lock-outline" placeholder={isEditMode ? 'New Password' : 'Password'} value={password} onChangeText={setPassword}
              secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} style={styles.half}
            />
            <Field
              icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword}
              secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.half}
            />
          </View>

          {renderLocationCard()}
        </>
      );
    }

    // CLIENT — single page
    return (
      <>
        {renderAvatar()}
        <Field icon="account-outline" placeholder="Full Name" value={name} onChangeText={setName} />
        <Field icon="phone-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field icon="email-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field icon="home-outline" placeholder="Address or Street" value={address} onChangeText={setAddress} />
        <View style={styles.splitRow}>
          <Field
            icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword}
            secure={!showPassword} onToggleSecure={() => setShowPassword(!showPassword)} style={styles.half}
          />
          <Field
            icon="lock-outline" placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword}
            secure={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.half}
          />
        </View>
        {renderLocationCard()}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Header: back arrow • title • logo (prototype) ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} hitSlop={8}>
          <Icon name="chevron-left" size={26} color={INK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {showStepUi ? `Step ${step} of 2 • ${headerSubtitle}` : headerSubtitle}
          </Text>
        </View>

        <View style={styles.logoCircle}>
          <Image source={LOGO_MARK} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>

      {/* Step progress — Worker only */}
      {showStepUi && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>
      )}

      {/* ─── Body: fits one screen, no scrolling in the normal case ─── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {!isEditMode && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SELECT ROLE</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>Required</Text>
              </View>
            </View>

            <View style={styles.segment}>
              {ROLES.map((r) => {
                const active = role === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    activeOpacity={0.85}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                    onPress={() => { setRole(r.key); setStep(1); }}
                  >
                    <Icon name={r.icon} size={17} color={active ? BLUE : SUBTLE} />
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {renderBody()}
      </ScrollView>

      {/* ─── Footer: Back + primary action, then Login link ─── */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnGhost} onPress={goBack} disabled={isLoading}>
            <Text style={styles.btnGhostText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={submitHandler} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
                <Icon name="arrow-right" size={17} color="#FFF" style={styles.btnArrow} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {!isEditMode && (
          <TouchableOpacity style={styles.haveAccount} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.haveAccountText}>
              Already have an account? <Text style={styles.haveAccountLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF3FF',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: 0.2 },
  headerSubtitle: { fontSize: 11.5, color: SUBTLE, marginTop: 1 },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EDF3FF',
  },
  logoImage: { width: 30, height: 30, borderRadius: 15 },

  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E3EBF9',
    marginHorizontal: 20,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: BLUE },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, flexGrow: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: SUBTLE },
  requiredBadge: { backgroundColor: '#E8F1FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  requiredBadgeText: { fontSize: 10, fontWeight: '800', color: BLUE },

  // Role segmented control
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E9EFFB',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: SURFACE,
    elevation: 3,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  segmentText: { fontSize: 12.5, fontWeight: '700', color: SUBTLE, marginLeft: 6 },
  segmentTextActive: { color: BLUE },

  // Avatar
  avatarWrap: { alignSelf: 'center', width: 78, height: 78, marginBottom: 14 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: '#B9CBE8',
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarText: { fontSize: 10.5, color: BLUE, marginTop: 2, fontWeight: '600' },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SURFACE,
  },

  // Fields
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 14.5, color: INK, paddingVertical: 0, height: '100%' },
  fieldInputText: { flex: 1, fontSize: 14.5, color: MUTED },
  fieldInputMultiline: { height: 70, paddingTop: 12 },
  bioField: { height: 88, alignItems: 'flex-start', paddingTop: 14 },
  eyeBtn: { paddingLeft: 8 },

  splitRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  // Location card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SOFT_BLUE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SOFT_BLUE_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIconDone: { backgroundColor: BLUE },
  locationTextWrap: { flex: 1, paddingRight: 8 },
  locationTitle: { fontSize: 13.5, fontWeight: '800', color: INK },
  locationSub: { fontSize: 11.5, color: SUBTLE, marginTop: 2 },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCE9FF',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 3,
  },
  toggleTrackOn: { backgroundColor: BLUE, alignItems: 'flex-start' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE },
  toggleKnobOn: { backgroundColor: '#FFFFFF' },

  // Gender chips
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  genderChip: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  genderChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  genderText: { fontSize: 14, fontWeight: '700', color: SUBTLE },
  genderTextActive: { color: '#FFFFFF' },

  // Footer
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: BG },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btnGhost: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E9EFFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: { fontSize: 15, fontWeight: '700', color: SUBTLE },
  btnPrimary: {
    flex: 1.7,
    height: 52,
    borderRadius: 16,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800', letterSpacing: 0.2 },
  btnArrow: { marginLeft: 8 },
  haveAccount: { alignSelf: 'center', marginTop: 8, padding: 4 },
  haveAccountText: { fontSize: 12.5, color: SUBTLE },
  haveAccountLink: { color: BLUE, fontWeight: '800' },
});

export default SignupScreen;
