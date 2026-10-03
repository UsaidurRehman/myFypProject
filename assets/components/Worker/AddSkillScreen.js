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

// Utility to pick appropriate category icons
const getIconName = (name) => {
  const norm = name?.toLowerCase().trim() || '';
  if (norm.includes('clean')) return 'broom';
  if (norm.includes('driv')) return 'car';
  if (norm.includes('cook')) return 'chef-hat';
  return 'briefcase-outline';
};

const AddSkillsScreen = ({ navigation, route }) => {
  const [dbCategories, setDbCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Category Selections
  const [primary, setPrimary] = useState(null);
  const [secondaryCategories, setSecondaryCategories] = useState([]);

  // Sub-skills per category: object { [categoryId]: [ { id, name } ] }
  const [subSkillsMap, setSubSkillsMap] = useState({});
  const [loadingSkillsForCat, setLoadingSkillsForCat] = useState({});

  // Selected sub-skills array: [{ CategoryId: number, SkillsId: number }]
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Experience state (completely separate box & list)
  const [experienceList, setExperienceList] = useState([]);
  const [workAt, setWorkAt] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateText, setDateText] = useState('Select Date');

  // Load Categories on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/GetCategories`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load schema categories.");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map(c => ({
            id: Number(c.categoryId ?? c.id ?? c.category_ID),
            name: c.categoryName ?? c.name ?? c.category_Name
          }));
          setDbCategories(formatted);
        }
        setCategoriesLoading(false);
      })
      .catch(err => {
        console.error("Categories fetch error:", err);
        setCategoriesLoading(false);
      });
  }, []);

  // Fetch Sub-Skills when a category becomes active
  const fetchSubSkillsForCategory = (catId) => {
    if (!catId || subSkillsMap[catId] || loadingSkillsForCat[catId]) return;

    setLoadingSkillsForCat(prev => ({ ...prev, [catId]: true }));
    fetch(`${API_BASE_URL}/GetSkillsByCategory?categoryId=${catId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map((item, index) => ({
            id: Number(item.skillsId ?? item.id ?? item.SkillsId ?? index + 1),
            name: item.skillName ?? item.name ?? item.SkillName ?? "Skill"
          }));
          setSubSkillsMap(prev => ({ ...prev, [catId]: formatted }));
        }
      })
      .catch(err => console.error(`Error loading skills for cat ${catId}:`, err))
      .finally(() => {
        setLoadingSkillsForCat(prev => ({ ...prev, [catId]: false }));
      });
  };

  // Pre-fill existing data from route parameters if available
  useEffect(() => {
    if (dbCategories.length === 0) return;

    // Pre-fill existing experiences
    if (Array.isArray(route.params?.existingExperiences)) {
      const exps = route.params.existingExperiences.map(e => ({
        ExperienceId: e.ExperienceId || e.experienceId || 0,
        WorkAt: e.WorkAt || e.workAt || '',
        ExpDetail: e.ExpDetail || e.expDetail || '',
        Duration: e.Duration || e.duration || ''
      })).filter(e => e.WorkAt.trim().length > 0 || e.ExpDetail.trim().length > 0);
      setExperienceList(exps);
    }

    // Pre-fill existing skills/worker categories junction if passed
    if (Array.isArray(route.params?.existingSkills)) {
      const skills = route.params.existingSkills.map(s => ({
        CategoryId: Number(s.CategoryId ?? s.categoryId),
        SkillsId: Number(s.SkillsId ?? s.skillsId)
      })).filter(s => s.CategoryId > 0 && s.SkillsId > 0);

      setSelectedSkills(skills);

      const catIds = [...new Set(skills.map(s => s.CategoryId))];
      if (catIds.length > 0) {
        const primCat = dbCategories.find(c => c.id === catIds[0]);
        const secCats = dbCategories.filter(c => catIds.slice(1).includes(c.id));
        if (primCat) setPrimary(primCat);
        setSecondaryCategories(secCats);

        catIds.forEach(id => fetchSubSkillsForCategory(id));
      }
    }
  }, [dbCategories, route.params?.existingExperiences, route.params?.existingSkills]);

  // Handle Primary Selection
  const selectPrimary = (cat) => {
    setPrimary(cat);
    setSecondaryCategories(current => current.filter(item => item.id !== cat.id));
    fetchSubSkillsForCategory(cat.id);
  };

  // Handle Secondary Selection
  const toggleSecondary = (cat) => {
    if (secondaryCategories.some(item => item.id === cat.id)) {
      setSecondaryCategories(current => current.filter(item => item.id !== cat.id));
      // Optionally remove selected skills under this category
      setSelectedSkills(prev => prev.filter(s => s.CategoryId !== cat.id));
    } else {
      setSecondaryCategories(current => [...current, cat]);
      fetchSubSkillsForCategory(cat.id);
    }
  };

  // Handle Skill Chip Toggle
  const toggleSkillChip = (categoryId, skillId) => {
    const exists = selectedSkills.some(s => s.CategoryId === categoryId && s.SkillsId === skillId);
    if (exists) {
      setSelectedSkills(prev => prev.filter(s => !(s.CategoryId === categoryId && s.SkillsId === skillId)));
    } else {
      setSelectedSkills(prev => [...prev, { CategoryId: categoryId, SkillsId: skillId }]);
    }
  };

  // Calculate Duration helper
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

  // Experience addition handler
  const handleAddExperience = () => {
    if (!workAt.trim() || !description.trim() || dateText === 'Select Date') {
      NotificationHelper.showError("Please fill all experience fields (Workplace, Role, and Date).");
      return;
    }

    const newExp = {
      WorkAt: workAt.trim(),
      ExpDetail: description.trim(),
      Duration: calculateDuration(date)
    };

    setExperienceList(prev => [...prev, newExp]);

    // Reset inputs
    setWorkAt('');
    setDescription('');
    setDateText('Select Date');
    NotificationHelper.showSuccess("Experience added to your list.");
  };

  // Experience remove handler
  const removeExperience = (index) => {
    setExperienceList(prev => prev.filter((_, i) => i !== index));
  };

  // Final Save Handler
  const handleFinalSave = () => {
    if (!primary) {
      NotificationHelper.showError("Please select a Primary Category.");
      return;
    }

    if (selectedSkills.length === 0) {
      NotificationHelper.showError("Please select at least one sub-skill chip to proceed.");
      return;
    }

    navigation.navigate('Signup', {
      ...route.params,
      ...(route.params?.signupDraft || {}),
      skillsCompleted: true,
      categoryId: primary.id,
      skillsJson: JSON.stringify(selectedSkills),
      experiencesJson: JSON.stringify(experienceList)
    });
  };

  const activeCategories = [primary, ...secondaryCategories].filter(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Skills & Experience</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {categoriesLoading ? (
          <ActivityIndicator size="large" color="#1E64D3" style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* BOX 1: CATEGORY & SUB-SKILLS SELECTION */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Icon name="shape-outline" size={22} color="#1E64D3" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Select Categories & Sub-Skills</Text>
              </View>

              <Text style={styles.subHeading}>Primary Category (Select 1)</Text>
              <View style={styles.skillRow}>
                {dbCategories.map(cat => (
                  <SkillBox
                    key={`primary-${cat.id}`}
                    icon={getIconName(cat.name)}
                    label={cat.name}
                    selected={primary?.id === cat.id}
                    onPress={() => selectPrimary(cat)}
                  />
                ))}
              </View>

              <Text style={styles.subHeading}>Secondary Categories <Text style={styles.optional}>(Optional)</Text></Text>
              <View style={styles.skillRow}>
                {dbCategories.map(cat => (
                  <SkillBox
                    key={`secondary-${cat.id}`}
                    icon={getIconName(cat.name)}
                    label={cat.name}
                    selected={secondaryCategories.some(item => item.id === cat.id)}
                    disabled={primary?.id === cat.id}
                    onPress={() => toggleSecondary(cat)}
                  />
                ))}
              </View>

              {/* Sub-Skills Chips for Active Categories */}
              {activeCategories.length > 0 && (
                <View style={styles.subSkillsContainer}>
                  <Text style={styles.subHeading}>Select Sub-Skills (Tap chips)</Text>
                  {activeCategories.map(cat => {
                    const skillsList = subSkillsMap[cat.id] || [];
                    const isLoading = loadingSkillsForCat[cat.id];

                    return (
                      <View key={`subskills-${cat.id}`} style={styles.categorySubSkillsBox}>
                        <Text style={styles.categoryBadgeText}>{cat.name} Sub-Skills:</Text>
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#1E64D3" style={{ marginVertical: 8 }} />
                        ) : (
                          <View style={styles.chipContainer}>
                            {skillsList.map(skill => {
                              const isSelected = selectedSkills.some(
                                s => s.CategoryId === cat.id && s.SkillsId === skill.id
                              );
                              return (
                                <TouchableOpacity
                                  key={`skill-${cat.id}-${skill.id}`}
                                  style={[styles.chip, isSelected && styles.selectedChip]}
                                  onPress={() => toggleSkillChip(cat.id, skill.id)}
                                >
                                  <Icon
                                    name={isSelected ? "check-circle" : "plus-circle-outline"}
                                    size={14}
                                    color={isSelected ? "#FFF" : "#555"}
                                    style={{ marginRight: 5 }}
                                  />
                                  <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                                    {skill.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* BOX 2: WORK EXPERIENCE ENTRY (COMPLETELY SEPARATE) */}
            <View style={[styles.sectionCard, { marginTop: 15 }]}>
              <View style={styles.cardHeader}>
                <Icon name="briefcase-outline" size={22} color="#1E64D3" style={{ marginRight: 8 }} />
                <Text style={styles.cardHeaderTitle}>Work Experience <Text style={styles.optional}>(Optional)</Text></Text>
              </View>

              {/* Added Experiences List */}
              {experienceList.length > 0 && (
                <View style={styles.existingSection}>
                  <Text style={styles.existingHeading}>ADDED EXPERIENCES ({experienceList.length})</Text>
                  {experienceList.map((exp, index) => (
                    <View key={`exp-item-${index}`} style={styles.existingCard}>
                      <View style={styles.existingCardIcon}>
                        <Icon name="briefcase-check-outline" size={20} color="#1565C0" />
                      </View>
                      <View style={styles.existingCardCopy}>
                        <Text style={styles.existingWorkAt}>{exp.WorkAt}</Text>
                        <Text style={styles.existingMeta}>{exp.Duration}</Text>
                        {exp.ExpDetail ? (
                          <Text style={styles.existingDescription}>{exp.ExpDetail}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={styles.removeExperienceButton}
                        onPress={() => removeExperience(index)}
                      >
                        <Icon name="close" size={17} color="#C62828" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.subLabel}>WORKING SINCE</Text>
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.flexInput, { color: dateText === 'Select Date' ? '#999' : '#333' }]}>
                  {dateText}
                </Text>
                <Icon name="calendar-month-outline" size={22} color="#333" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                      setDateText(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}

              <Text style={styles.subLabel}>WORKPLACE / COMPANY</Text>
              <View style={styles.inputRow}>
                <Icon name="office-building-marker-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.flexInput}
                  placeholder="Where did you work? (e.g. PC Hotel)"
                  placeholderTextColor="#999"
                  value={workAt}
                  onChangeText={setWorkAt}
                />
              </View>

              <Text style={styles.subLabel}>ROLE DESCRIPTION</Text>
              <View style={styles.inputRow}>
                <Icon name="text-box-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.flexInput}
                  placeholder="Describe your role and tasks"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <TouchableOpacity style={styles.submitExpBtn} onPress={handleAddExperience}>
                <Text style={styles.submitExpText}>+ Add Experience</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleFinalSave}>
              <Text style={styles.saveBtnText}>Save and Continue</Text>
            </TouchableOpacity>
          </>
        )}
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
      <Icon name={icon} size={28} color={selected ? "#FFF" : "#333"} />
    </View>
    <Text style={[styles.skillLabel, selected && styles.selectedSkillLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FF' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E6EDF9' },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#0E1B4D' },
  backBtn: { padding: 8, backgroundColor: '#F0F4FA', borderRadius: 20 },
  scrollContent: { padding: 16 },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E6EDF9', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#F0F4FA' },
  cardHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#0E1B4D' },
  subHeading: { fontSize: 14, fontWeight: 'bold', marginVertical: 10, color: '#334155' },
  optional: { fontWeight: 'normal', color: '#94A3B8', fontSize: 12 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  skillBox: { width: '30%', height: 95, backgroundColor: '#F8FAFC', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginRight: '3%', marginBottom: 10 },
  selectedSkillBox: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
  skillIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  selectedIconCircle: { backgroundColor: 'rgba(255,255,255,0.25)' },
  skillLabel: { fontWeight: 'bold', fontSize: 12, textAlign: 'center', color: '#334155' },
  selectedSkillLabel: { color: '#FFF' },
  subSkillsContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#F0F4FA' },
  categorySubSkillsBox: { marginBottom: 12, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#1E64D3', marginBottom: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  selectedChip: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
  chipText: { fontSize: 12, color: '#475569' },
  selectedChipText: { color: '#FFF', fontWeight: 'bold' },
  existingSection: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 14 },
  existingHeading: { color: '#1E64D3', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 8 },
  existingCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#E2E8F0' },
  existingCardIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E0EDFF', alignItems: 'center', justifyContent: 'center' },
  existingCardCopy: { flex: 1, marginLeft: 10 },
  existingWorkAt: { color: '#0F172A', fontWeight: 'bold', fontSize: 13 },
  existingMeta: { color: '#1E64D3', fontSize: 11, marginTop: 2 },
  existingDescription: { color: '#64748B', fontSize: 11, marginTop: 3 },
  removeExperienceButton: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  subLabel: { fontSize: 11, color: '#64748B', fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  flexInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  submitExpBtn: { alignSelf: 'flex-end', backgroundColor: '#1E64D3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 10 },
  submitExpText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { backgroundColor: '#1E64D3', height: 52, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 30, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default AddSkillsScreen;