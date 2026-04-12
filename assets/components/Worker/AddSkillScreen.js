import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, TextInput, Platform, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_ACCOUNT } from '../../config';

const API_BASE_URL = API_ACCOUNT;

const ExpertiseSection = ({ title, icon, isActive, categoryId, onExperienceAdded }) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [dateText, setDateText] = useState('Select Date');
  const [workAt, setWorkAt] = useState('');
  const [description, setDescription] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubSkillIds, setSelectedSubSkillIds] = useState([]); // Array for multi-selection
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isActive && categoryId) {
      setIsFetching(true);
      // Fetching sub-skills for the selected category
      fetch(`${API_BASE_URL}/GetSkillsByCategory?categoryId=${categoryId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("API Response Data:", data);
          if (Array.isArray(data)) {
            const formattedData = data.map((item, index) => ({
              id: item.id ?? item.SkillsId ?? item.skillsId ?? `skill-${index}`,
              name: item.name ?? item.SkillName ?? item.skillName ?? "Missing Name"
            }));
            setSubCategories(formattedData);
          } else {
            console.error("Expected array from API but got:", data);
            setSubCategories([]);
          }
          setIsFetching(false);
        })
        .catch(err => {
          console.error("Error fetching skills:", err);
          setIsFetching(false);
        });
    }
  }, [isActive, categoryId]);

  const calculateDuration = (startDate) => {
    const start = new Date(startDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    if (months < 0) { years--; months += 12; }

    if (years > 0 && months > 0) return `${years} Years, ${months} Months`;
    if (years > 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
  };

  const toggleSkillSelection = (id) => {
    if (selectedSubSkillIds.includes(id)) {
      setSelectedSubSkillIds(selectedSubSkillIds.filter(item => item !== id));
    } else {
      setSelectedSubSkillIds([...selectedSubSkillIds, id]);
    }
  };

  const handleLocalAdd = () => {
    if (!workAt || !description || dateText === 'Select Date' || selectedSubSkillIds.length === 0) {
      NotificationHelper.showError("Please select at least one sub-category and fill all fields.");
      return;
    }

    // Create a unique experience entry for EVERY selected skill
    selectedSubSkillIds.forEach(skillId => {
      const newExp = {
        WorkAt: workAt,
        ExpDetail: description,
        Duration: calculateDuration(date),
        CategoryId: categoryId,
        SkillsId: skillId
      };
      onExperienceAdded(newExp);
    });

    // Reset fields for the next entry
    setWorkAt('');
    setDescription('');
    setDateText('Select Date');
    setSelectedSubSkillIds([]);
    NotificationHelper.showSuccess(`${selectedSubSkillIds.length} Experience(s) added to your submission list.`);
  };

  return (
    <View style={styles.expertiseCard}>
      <View style={styles.expertiseHeader}>
        <View style={[styles.headerIconCircle, styles.activeBlueCircle]}>
          <Icon name={icon} size={24} color="#1E64D3" />
        </View>
        <Text style={styles.expertiseTitle}>{title} Expertise</Text>
      </View>

      <Text style={styles.subLabel}>SUB CATEGORIES (Tap to select)</Text>
      <View style={styles.chipContainer}>
        {isFetching ? (
          <ActivityIndicator size="small" color="#1E64D3" />
        ) : (
          subCategories.map((skill) => (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.chip,
                selectedSubSkillIds.includes(skill.id) && { backgroundColor: '#1E64D3' }
              ]}
              onPress={() => toggleSkillSelection(skill.id)}
            >
              <Text style={[
                styles.chipText,
                selectedSubSkillIds.includes(skill.id) && { color: '#FFF', fontWeight: 'bold' }
              ]}>
                {skill.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={styles.subLabel}>WORKING SINCE</Text>
      <TouchableOpacity style={styles.inputRow} onPress={() => setShow(true)}>
        <Text style={[styles.flexInput, { color: dateText === 'Select Date' ? '#999' : '#333', paddingTop: 12 }]}>
          {dateText}
        </Text>
        <Icon name="calendar-month-outline" size={24} color="#333" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              setDate(selectedDate);
              setDateText(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      <View style={styles.inputRow}>
        <Icon name="office-building-marker-outline" size={20} color="#333" style={{ marginRight: 10 }} />
        <TextInput style={styles.flexInput} placeholder="Where did you work?" value={workAt} onChangeText={setWorkAt} />
      </View>
      <View style={styles.inputRow}>
        <Icon name="text-box-outline" size={20} color="#333" style={{ marginRight: 10 }} />
        <TextInput style={styles.flexInput} placeholder="Describe your role" value={description} onChangeText={setDescription} />
      </View>

      <TouchableOpacity style={styles.submitExpBtn} onPress={handleLocalAdd}>
        <Text style={styles.submitExpText}>+ Add Experience</Text>
      </TouchableOpacity>
    </View>
  );
};

const AddSkillsScreen = ({ navigation, route }) => {
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [experienceList, setExperienceList] = useState([]);

  const categoryMap = { 'Cleaning': 3, 'Cooking': 1, 'Driving': 2 };
  const reverseCategoryMap = { 3: 'Cleaning', 1: 'Cooking', 2: 'Driving' };

  useEffect(() => {
    if (route.params?.existingExperiences && experienceList.length === 0) {
      const exps = route.params.existingExperiences;
      setExperienceList(exps);

      // Auto-set primary category based on first experience match
      if (exps.length > 0) {
        const catId = exps[0].CategoryId || exps[0].categoryId;
        if (catId && reverseCategoryMap[catId]) {
          setPrimary(reverseCategoryMap[catId]);
        }
      }
    }
  }, [route.params]);

  const handleFinalSave = () => {
    if (experienceList.length === 0) {
      NotificationHelper.showError("Please add at least one experience before saving.");
      return;
    }

    // Navigating back to Signup with ALL previous state preserved
    navigation.navigate('Signup', {
      ...route.params, // Spread existing params to keep name, phone, bio, etc.
      skillsCompleted: true,
      categoryId: categoryMap[primary], // Explicitly pass the ID
      experiencesJson: JSON.stringify(experienceList)
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add Skills</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainHeading}>Select Your Primary Skills</Text>
        <View style={styles.skillRow}>
          <SkillBox icon="broom" label="Cleaning" selected={primary === 'Cleaning'} onPress={() => setPrimary('Cleaning')} />
          <SkillBox icon="chef-hat" label="Cooking" selected={primary === 'Cooking'} onPress={() => setPrimary('Cooking')} />
          <SkillBox icon="car" label="Driving" selected={primary === 'Driving'} onPress={() => setPrimary('Driving')} />
        </View>

        <Text style={styles.mainHeading}>Select Your Secondary Skills <Text style={styles.optional}>(Optional)</Text></Text>
        <View style={styles.skillRow}>
          <SkillBox icon="broom" label="Cleaning" selected={secondary === 'Cleaning'} disabled={primary === 'Cleaning'} onPress={() => setSecondary('Cleaning')} />
          <SkillBox icon="chef-hat" label="Cooking" selected={secondary === 'Cooking'} disabled={primary === 'Cooking'} onPress={() => setSecondary('Cooking')} />
          <SkillBox icon="car" label="Driving" selected={secondary === 'Driving'} disabled={primary === 'Driving'} onPress={() => setSecondary('Driving')} />
        </View>

        {primary && (
          <ExpertiseSection
            title={primary}
            icon={primary === 'Cooking' ? 'chef-hat' : primary === 'Driving' ? 'car' : 'broom'}
            isActive={true}
            categoryId={categoryMap[primary]}
            onExperienceAdded={(exp) => setExperienceList([...experienceList, exp])}
          />
        )}

        {secondary && (
          <ExpertiseSection
            title={secondary}
            icon={secondary === 'Cooking' ? 'chef-hat' : secondary === 'Driving' ? 'car' : 'broom'}
            isActive={true}
            categoryId={categoryMap[secondary]}
            onExperienceAdded={(exp) => setExperienceList([...experienceList, exp])}
          />
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleFinalSave}>
          <Text style={styles.saveBtnText}>Save and Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const SkillBox = ({ icon, label, selected, disabled, onPress }) => (
  <TouchableOpacity
    disabled={disabled}
    style={[styles.skillBox, selected && styles.selectedSkillBox, disabled && { opacity: 0.3 }]}
    onPress={onPress}
  >
    <View style={[styles.skillIconCircle, selected && styles.selectedIconCircle]}>
      <Icon name={icon} size={30} color={selected ? "#FFF" : "#333"} />
    </View>
    <Text style={[styles.skillLabel, selected && styles.selectedSkillLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#EEE', zIndex: 10 },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5, backgroundColor: '#F0F0F0', borderRadius: 20, zIndex: 10, elevation: 5 },
  scrollContent: { padding: 20 },
  mainHeading: { fontSize: 16, fontWeight: 'bold', marginVertical: 15, color: '#000' },
  optional: { fontWeight: 'normal', color: '#999', fontSize: 12 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  skillBox: { width: '30%', height: 100, backgroundColor: '#FFF', borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  selectedSkillBox: { backgroundColor: '#008000' },
  skillIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0EAF8', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  selectedIconCircle: { backgroundColor: 'rgba(255,255,255,0.2)' },
  skillLabel: { fontWeight: 'bold', fontSize: 13 },
  selectedSkillLabel: { color: '#FFF' },
  expertiseCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#EEE', elevation: 3 },
  expertiseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerIconCircle: { width: 45, height: 45, borderRadius: 22.5, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  activeBlueCircle: { backgroundColor: '#D7E6FF' },
  expertiseTitle: { fontSize: 16, fontWeight: 'bold' },
  subLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 45, marginBottom: 10, borderWidth: 1, borderColor: '#DDD' },
  flexInput: { flex: 1, fontSize: 14 },
  submitExpBtn: { alignSelf: 'flex-end', backgroundColor: '#1E64D3', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 15, marginTop: 10 },
  submitExpText: { color: '#FFF', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#1E64D3', height: 55, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 5, marginBottom: 30 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default AddSkillsScreen;