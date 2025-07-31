import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Alert, Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import TimePickerModal from '../components/TimePickerModal';

const Step3TimeSelectScreen = ({ route }) => {
  const navigation = useNavigation();
  const { departure, destination, startDate, endDate } = route.params;
  
  const [goTime, setGoTime] = useState('10:00');
  const [returnTime, setReturnTime] = useState('10:00');
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState('go');

  const openTimePicker = (target) => {
    setTimePickerTarget(target);
    setTimePickerVisible(true);
  };

  const handleTimeSelect = (time) => {
    if (timePickerTarget === 'go') {
      setGoTime(time);
    } else {
      setReturnTime(time);
    }
  };

  const handleNext = () => {
    navigation.navigate('Step4TransportSelect', {
      departure,
      destination,
      startDate,
      endDate,
      goTime,
      returnTime
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>시간 선택</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>여행 출발 시간 선택</Text>
        <Text style={styles.subtitle}>
          각 날짜별 출발 시간을 선택해 주세요.
        </Text>

        <View style={styles.form}>
          <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
              <Text style={styles.dateLabel}>
                {dayjs(startDate).format('YYYY. M. D.')} (가는 날)
              </Text>
              <Text style={styles.timeLabel}>출발시간</Text>
              <TouchableOpacity 
                style={styles.timeButton} 
                onPress={() => openTimePicker('go')}
              >
                <Text style={styles.timeButtonText}>{goTime}</Text>
                <Ionicons name="time-outline" size={20} color="#007BFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.dateLabel}>
                {dayjs(endDate).format('YYYY. M. D.')} (오는 날)
              </Text>
              <Text style={styles.timeLabel}>출발시간</Text>
              <TouchableOpacity 
                style={styles.timeButton} 
                onPress={() => openTimePicker('return')}
              >
                <Text style={styles.timeButtonText}>{returnTime}</Text>
                <Ionicons name="time-outline" size={20} color="#007BFF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TimePickerModal
        visible={isTimePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onSelect={handleTimeSelect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timeRow: {
    marginBottom: 25,
  },
  timeContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Step3TimeSelectScreen; 