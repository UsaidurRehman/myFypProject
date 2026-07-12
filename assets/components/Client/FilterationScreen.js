import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ScrollView,
    SafeAreaView, StatusBar, TextInput, ActivityIndicator,
    Modal, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DASHBOARD } from '../../config';

const API_BASE = API_DASHBOARD;

const RECOMMENDED_CITIES = [
    'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 
    'Faisalabad', 'Peshawar', 'Multan', 'Quetta', 
    'Gujranwala', 'Sialkot'
];

const FilterationScreen = ({ navigation, route }) => {
    // States for dynamic data
    const [allCategories, setAllCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // States for various filters
    const [selectedGender, setSelectedGender] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]); // Array of Category IDs or names
    const [selectedCity, setSelectedCity] = useState('');
    const [cityModalVisible, setCityModalVisible] = useState(false);

    // State for sub-categories (Multi-select)
    // Key is category name, value is array of sub-skill names
    const [subFilters, setSubFilters] = useState({});

    // Initial load of categories
    useEffect(() => {
        fetchFilterData();
    }, []);

    // Sync initial filters when categories are loaded or when params change
    useEffect(() => {
        if (!isLoading && route.params?.initialFilters) {
            const { gender, city, categories, subSkills } = route.params.initialFilters;
            setSelectedGender(gender || '');
            setSelectedCity(city || '');
            setSelectedSkills((categories || []).map(item => item?.toString ? item.toString() : item));

            if (subSkills) {
                const syncedSubFilters = {};
                Object.keys(subSkills).forEach(key => {
                    syncedSubFilters[key] = Array.isArray(subSkills[key]) ? [...subSkills[key]] : [];
                });
                setSubFilters(syncedSubFilters);
            }
        }
    }, [isLoading, route.params?.initialFilters]);

    const fetchFilterData = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetFiltersData`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAllCategories(data);
                
                // Initialize subFilters state format if not already set by initialFilters
                if (Object.keys(subFilters).length === 0) {
                    const initialSubFilters = {};
                    data.forEach(cat => {
                        initialSubFilters[cat.categoryName] = [];
                    });
                    setSubFilters(initialSubFilters);
                }
            } else {
                console.error("Failed to fetch filter data");
            }
        } catch (error) {
            console.error("Network error fetching filter data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // const toggleSkillSelection = (skillName) => {
    //     if (selectedSkills.includes(skillName)) {
    //         setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    //     } else {
    //         setSelectedSkills([...selectedSkills, skillName]);
    //     }
    // };

    const toggleSkillSelection = (categoryId) => {
        const id = categoryId?.toString();
        const categoryName = getCategoryLabel(id);
        const isSelected = selectedSkills.some(item => {
            const itemName = getCategoryLabel(item);
            return item === id || item === categoryName || itemName === categoryName;
        });

        if (isSelected) {
            setSelectedSkills(selectedSkills.filter(item => {
                const itemName = getCategoryLabel(item);
                return item !== id && item !== categoryName && itemName !== categoryName;
            }));
        } else {
            setSelectedSkills([...selectedSkills, id]);
        }
    };

    const isCategorySelected = (cat) => {
        const idString = cat.categoryId?.toString();
        return selectedSkills.some(item => {
            const itemName = getCategoryLabel(item);
            return item === idString || item === cat.categoryName || itemName === cat.categoryName;
        });
    };

    const getCategoryLabel = (selection) => {
        const match = allCategories.find(cat => cat.categoryId?.toString() === selection || cat.categoryName === selection);
        return match ? match.categoryName : selection;
    };

    const toggleSubFilter = (category, value) => {
        let current = subFilters[category] ? [...subFilters[category]] : [];
        if (current.includes(value)) {
            current = current.filter(item => item !== value);
        } else {
            current.push(value);
        }
        setSubFilters({ ...subFilters, [category]: current });
    };

    const handleApply = () => {
        navigation.navigate('FindServiceScreen', {
            appliedFilters: {
                gender: selectedGender,
                city: selectedCity,
                categories: selectedSkills,
                subSkills: subFilters
            }
        });
    };

    const handleReset = () => {
        setSelectedGender('');
        setSelectedSkills([]);
        setSelectedCity('');
        const resetSubFilters = {};
        allCategories.forEach(cat => {
            resetSubFilters[cat.categoryName] = [];
        });
        setSubFilters(resetSubFilters);

        // Also update parent immediately if needed, or by passing back on goBack
        navigation.navigate('FindServiceScreen', {
            appliedFilters: {
                gender: '',
                city: '',
                categories: [],
                subSkills: resetSubFilters
            }
        });
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1E64D3" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* City Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={cityModalVisible}
                onRequestClose={() => setCityModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Recommended City</Text>
                            <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={RECOMMENDED_CITIES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.cityItem} 
                                    onPress={() => {
                                        setSelectedCity(item);
                                        setCityModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.cityText, selectedCity === item && styles.activeCityText]}>{item}</Text>
                                    {selectedCity === item && <Icon name="check" size={20} color="#1E64D3" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Icon name="arrow-left" size={20} color="#666" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FILTERATION</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Active Filter Tags at Top */}
                <View style={styles.activeTagsRow}>
                    {selectedGender ? <FilterTag label={selectedGender} onRemove={() => setSelectedGender('')} /> : null}
                    {selectedCity ? <FilterTag label={selectedCity} onRemove={() => setSelectedCity('')} /> : null}
                    {selectedSkills.map(s => (
                        <FilterTag key={`tag-${s}`} label={getCategoryLabel(s)} onRemove={() => toggleSkillSelection(s)} />
                    ))}
                </View>

                {/* Gender Selection */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Icon name="account-outline" size={22} color="#000" />
                        <Text style={styles.sectionTitle}>GENDER</Text>
                    </View>
                    <View style={styles.buttonGroup}>
                        {['Male', 'Female', 'Both'].map(g => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setSelectedGender(g)}
                                style={[styles.choiceBtn, selectedGender === g && styles.activeBtn]}
                            >
                                <Text style={[styles.choiceText, selectedGender === g && styles.activeText]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Dynamic Skills Selection (Categories) */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Icon name="account-group-outline" size={22} color="#000" />
                        <Text style={styles.sectionTitle}>SKILLS</Text>
                    </View>
                    <View style={styles.buttonGroup}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {/* {allCategories.map(cat => (
                                <TouchableOpacity
                                    key={cat.categoryId}
                                    onPress={() => toggleSkillSelection(cat.categoryName)}
                                    style={[styles.choiceBtn, { paddingHorizontal: 20, minWidth: 100 }, selectedSkills.includes(cat.categoryName) && styles.activeBtn]}
                                >
                                    <Text style={[styles.choiceText, selectedSkills.includes(cat.categoryName) && styles.activeText]}>{cat.categoryName}</Text>
                                </TouchableOpacity>
                            ))} */}
                            {allCategories.map(cat => (
                                <TouchableOpacity
                                    key={cat.categoryId}
                                    onPress={() => toggleSkillSelection(cat.categoryId)}
                                    style={[
                                        styles.choiceBtn,
                                        { paddingHorizontal: 20, minWidth: 100 },
                                        isCategorySelected(cat) && styles.activeBtn
                                    ]}
                                >
                                    <Text style={[styles.choiceText, isCategorySelected(cat) && styles.activeText]}>
                                        {cat.categoryName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Location Selection */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Icon name="map-marker-outline" size={22} color="#000" />
                        <Text style={styles.sectionTitle}>CITY</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.dropdown}
                        onPress={() => setCityModalVisible(true)}
                    >
                        <Text style={[styles.dropdownText, !selectedCity && { color: '#999' }]}>
                            {selectedCity || 'Select Recommended City'}
                        </Text>
                        <Icon name="chevron-down" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* Sub-Category Section (Dynamic) */}
                {selectedSkills.length > 0 && (
                    <View style={styles.subCategoryCard}>
                        <View style={styles.sectionHeader}>
                            <Icon name="reorder-horizontal" size={20} color="#000" />
                            <Text style={styles.sectionTitle}>Sub-Category</Text>
                        </View>

                        {allCategories
                            .filter(cat => isCategorySelected(cat))
                            .map(cat => (
                                <SubSection
                                    key={`sub-${cat.categoryId}`}
                                    title={cat.categoryName}
                                    options={cat.skills}
                                    selected={subFilters[cat.categoryName] || []}
                                    onToggle={(val) => toggleSubFilter(cat.categoryName, val)}
                                />
                            ))}
                    </View>
                )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Text style={styles.footerBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                    <Text style={styles.footerBtnText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Helper Components
const FilterTag = ({ label, onRemove }) => (
    <View style={styles.tag}>
        <Text style={styles.tagText}>{label}</Text>
        <TouchableOpacity onPress={onRemove}>
            <Icon name="close" size={16} color="#000" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
    </View>
);

const SubSection = ({ title, options, selected, onToggle, disabled }) => (
    <View style={styles.subSectionContainer}>
        <Text style={styles.subTitle}>{title}</Text>
        <View style={styles.chipRow}>
            {options.map(opt => (
                <TouchableOpacity
                    key={opt}
                    onPress={() => onToggle(opt)}
                    style={[
                        styles.chip,
                        selected.includes(opt) && styles.activeBtn,
                        disabled && { backgroundColor: '#E0E0E0' }
                    ]}
                >
                    <Text style={[styles.chipText, selected.includes(opt) && styles.activeText]}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, marginTop: 20, zIndex: 10 },
    backCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 5 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginRight: 35 },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },

    activeTagsRow: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap' },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D9D9D9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 8, marginBottom: 5 },
    tagText: { fontSize: 13, fontWeight: '500' },

    sectionCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },

    buttonGroup: { flexDirection: 'row', justifyContent: 'space-between' },
    choiceBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    activeBtn: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    choiceText: { fontWeight: 'bold', color: '#333' },
    activeText: { color: '#FFF' },

    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 15, height: 50 },
    dropdownText: { flex: 1, color: '#333', fontSize: 16 },

    subCategoryCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
    subSectionContainer: { marginBottom: 20 },
    subTitle: { fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline', marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8, marginBottom: 8 },
    chipText: { fontSize: 12, color: '#333' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, backgroundColor: '#FFF', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#EEE' },
    resetBtn: { backgroundColor: '#555', flex: 0.45, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    applyBtn: { backgroundColor: '#1E64D3', flex: 0.45, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    footerBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '70%', elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    cityText: { fontSize: 16, color: '#666' },
    activeCityText: { color: '#1E64D3', fontWeight: 'bold' }
});

export default FilterationScreen;