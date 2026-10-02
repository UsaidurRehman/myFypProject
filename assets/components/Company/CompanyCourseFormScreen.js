import React, { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { courseApi, courseColors as C } from '../helpers/courseApi';
import NotificationHelper from '../Notification/NotificationHelper';

const toLocalDate = value => {
  if (!value) return new Date();
  const parts = String(value).split('-').map(Number);
  return parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : new Date(value);
};

const toApiDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = date => date.toLocaleDateString(undefined, {
  day: '2-digit', month: 'short', year: 'numeric',
});

const formatTime = date => date.toLocaleTimeString(undefined, {
  hour: '2-digit', minute: '2-digit', hour12: true,
});

const buildTime = (hour, minute) => {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value;
};

function TextArea({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline
      />
    </View>
  );
}

export default function CompanyCourseFormScreen({ navigation, route }) {
  const old = route.params?.course;
  const [courseName, setCourseName] = useState(old?.courseName || '');
  const [startDate, setStartDate] = useState(toLocalDate(old?.startDate));
  const [endDate, setEndDate] = useState(toLocalDate(old?.endDate));
  const [startTime, setStartTime] = useState(buildTime(9, 0));
  const [endTime, setEndTime] = useState(buildTime(17, 0));
  const [description, setDescription] = useState(old?.description || '');
  const [syllabus, setSyllabus] = useState(old?.syllabus || '');
  const [isPublished, setIsPublished] = useState(old?.isPublished ?? true);
  const [picker, setPicker] = useState(null);
  const [saving, setSaving] = useState(false);

  const classTimings = useMemo(
    () => `${formatTime(startTime)} - ${formatTime(endTime)}`,
    [startTime, endTime],
  );

  const pickerValue = picker === 'startDate' ? startDate
    : picker === 'endDate' ? endDate
      : picker === 'startTime' ? startTime : endTime;
  const pickerMode = picker?.includes('Time') ? 'time' : 'date';

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) return;
    if (picker === 'startDate') {
      setStartDate(selected);
      if (selected > endDate) setEndDate(selected);
    } else if (picker === 'endDate') setEndDate(selected);
    else if (picker === 'startTime') setStartTime(selected);
    else if (picker === 'endTime') setEndTime(selected);
  };

  const save = async () => {
    if (!courseName.trim()) {
      NotificationHelper.showError('Course name is required.');
      return;
    }
    if (endDate < startDate) {
      NotificationHelper.showError('End date cannot be before start date.');
      return;
    }
    if (endTime <= startTime) {
      NotificationHelper.showError('Class end time must be after start time.');
      return;
    }

    const body = {
      courseName: courseName.trim(),
      startDate: toApiDate(startDate),
      endDate: toApiDate(endDate),
      classTimings,
      description: description.trim() || null,
      syllabus: syllabus.trim() || null,
      isPublished,
    };

    try {
      setSaving(true);
      await courseApi(
        old ? `/api/company/courses/${old.courseId}` : '/api/company/courses',
        { method: old ? 'PUT' : 'POST', body: JSON.stringify(body) },
      );
      NotificationHelper.showSuccess(old ? 'Course updated.' : 'Course created.');
      navigation.goBack();
    } catch (error) {
      NotificationHelper.showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const PickerButton = ({ icon, label, value, type }) => (
    <View style={styles.pickerGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setPicker(type)}>
        <Icon name={icon} size={21} color={C.primary} />
        <Text style={styles.pickerValue}>{value}</Text>
        <Icon name="chevron-down" size={19} color={C.muted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.heading}>{old ? 'Edit Course' : 'Create Course'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Course information</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Course name *</Text>
            <TextInput
              style={styles.input}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="Professional Home Care"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TextArea
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Purpose, outcomes and course overview"
          />
          <TextArea
            label="Syllabus"
            value={syllabus}
            onChangeText={setSyllabus}
            placeholder="Modules, practical work and assessment"
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeadingRow}>
            <Icon name="calendar-clock" size={22} color={C.primary} />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>

          <View style={styles.twoColumns}>
            <PickerButton
              icon="calendar-start"
              label="Start date *"
              value={formatDate(startDate)}
              type="startDate"
            />
            <PickerButton
              icon="calendar-end"
              label="End date *"
              value={formatDate(endDate)}
              type="endDate"
            />
          </View>

          <View style={styles.twoColumns}>
            <PickerButton
              icon="clock-start"
              label="Class starts *"
              value={formatTime(startTime)}
              type="startTime"
            />
            <PickerButton
              icon="clock-end"
              label="Class ends *"
              value={formatTime(endTime)}
              type="endTime"
            />
          </View>

          <View style={styles.schedulePreview}>
            <Icon name="clock-check-outline" size={18} color={C.success} />
            <Text style={styles.schedulePreviewText}>{classTimings}</Text>
          </View>
        </View>

        <View style={styles.publishRow}>
          <View style={styles.publishCopy}>
            <Text style={styles.publishTitle}>Publish course</Text>
            <Text style={styles.help}>Workers can discover and enroll immediately.</Text>
          </View>
          <Switch
            value={isPublished}
            onValueChange={setIsPublished}
            trackColor={{ false: '#CBD5E1', true: C.primary }}
          />
        </View>

        <TouchableOpacity disabled={saving} style={styles.saveButton} onPress={save}>
          <Icon name="content-save-check-outline" size={20} color={C.white} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving…' : old ? 'Save changes' : 'Create course'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {picker && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
          <DateTimePicker
            value={pickerValue}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={picker === 'endDate' ? startDate : undefined}
            onChange={onPickerChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.iosDone} onPress={() => setPicker(null)}>
              <Text style={styles.iosDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: { color: C.white, fontSize: 20, fontWeight: '800', marginLeft: 14 },
  body: { padding: 16, paddingBottom: 45 },
  sectionCard: {
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  sectionTitle: { color: C.text, fontWeight: '800', fontSize: 16, marginBottom: 15, marginLeft: 7 },
  fieldGroup: { marginBottom: 15 },
  label: { color: C.text, fontWeight: '700', marginBottom: 7, fontSize: 12 },
  input: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 13,
    color: C.text,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  twoColumns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  pickerGroup: { flex: 1 },
  pickerButton: {
    minHeight: 51,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerValue: { flex: 1, color: C.text, fontSize: 12, fontWeight: '600', marginLeft: 7 },
  schedulePreview: {
    marginTop: 14,
    backgroundColor: '#E7F7F0',
    padding: 11,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schedulePreviewText: { color: C.success, fontWeight: '800', marginLeft: 7 },
  publishRow: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishCopy: { flex: 1 },
  publishTitle: { color: C.text, fontWeight: '800' },
  help: { color: C.muted, fontSize: 12, marginTop: 4 },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: 13,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  saveButtonText: { color: C.white, fontWeight: '800', marginLeft: 8 },
  iosPickerContainer: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 10,
  },
  iosDone: { alignSelf: 'flex-end', paddingHorizontal: 22, paddingVertical: 8 },
  iosDoneText: { color: C.primary, fontWeight: '800' },
});
