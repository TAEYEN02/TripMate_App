import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Alert, Modal
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

const Step2DateSelectScreen = ({ route }) => {
  const navigation = useNavigation();
  const { departure, destination } = route.params;
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  const onDayPress = (day) => {
    const selectedDate = day.dateString;

    if (!startDate || (startDate && endDate)) {
      // 새로운 선택 시작
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (selectedDate < startDate) {
      // 시작일보다 이전  시, 새로운 선택 시작
      setStartDate(selectedDate);
      setEndDate(null);
    } else {
      // 종료일 선택
      setEndDate(selectedDate);
    }
  };

  // startDate 또는 endDate가 변경될 때마다 markedDates를 다시 계산
  useEffect(() => {
    if (!startDate) {
      setMarkedDates({});
      return;
    }

    const newMarkedDates = {};
    const start = dayjs(startDate);
    
    // 시작일만 선택된 경우
    if (!endDate) {
      newMarkedDates[startDate] = { startingDay: true, color: '#007bff', textColor: 'white' };
      setMarkedDates(newMarkedDates);
      return;
    }

    // 시작일과 종료일이 모두 선택된 경우
    const end = dayjs(endDate);
    let current = start;

    while (current.isBefore(end) || current.isSame(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      
      if (dateStr === startDate && dateStr === endDate) {
        // 하루짜리 여행
        newMarkedDates[dateStr] = { startingDay: true, endingDay: true, color: '#007bff', textColor: 'white' };
      } else if (dateStr === startDate) {
        newMarkedDates[dateStr] = { startingDay: true, color: '#007bff', textColor: 'white' };
      } else if (dateStr === endDate) {
        newMarkedDates[dateStr] = { endingDay: true, color: '#007bff', textColor: 'white' };
      } else {
        newMarkedDates[dateStr] = { color: '#50a0ff', textColor: 'white' };
      }
      current = current.add(1, 'day');
    }
    setMarkedDates(newMarkedDates);
  }, [startDate, endDate]);

  const displayDate = () => {
    if (startDate && endDate) return `${dayjs(startDate).format('YYYY.MM.DD')} ~ ${dayjs(endDate).format('YYYY.MM.DD')}`;
    if (startDate) return `${dayjs(startDate).format('YYYY.MM.DD')} - (종료일 선택)`;
    return '날짜를 선택해주세요';
  };

  const handleNext = () => {
    if (!startDate || !endDate) {
      Alert.alert("알림", "여행 시작일과 종료일을 모두 선택해주세요.");
      return;
    }

    navigation.navigate('Step3TimeSelect', {
      departure,
      destination,
      startDate,
      endDate
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>날짜 선택</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>여행 기간이 어떻게 되시나요?</Text>
        <Text style={styles.subtitle}>
          여행 일자는 최대 10일까지 선택 가능합니다.
        </Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            출발지: {departure} → 도착지: {destination}
          </Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={styles.dateButtonText}>{displayDate()}</Text>
            <Ionicons name="calendar-outline" size={20} color="#007BFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.nextButton, (!startDate || !endDate) && styles.disabledButton]} 
            onPress={handleNext}
            disabled={!startDate || !endDate}
          >
            <Text style={styles.nextButtonText}>출발 시간 선택하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal 
        visible={isCalendarVisible} 
        onRequestClose={() => setCalendarVisible(false)} 
        animationType="slide"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.calendarContainer}>
            <Calendar 
              onDayPress={onDayPress} 
              markedDates={markedDates} 
              markingType={'period'}
              minDate={dayjs().format('YYYY-MM-DD')}
              maxDate={dayjs().add(1, 'year').format('YYYY-MM-DD')}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.confirmButton, (!startDate || !endDate) && styles.disabledConfirmButton]} 
              onPress={() => setCalendarVisible(false)}
              disabled={!startDate || !endDate}
            >
              <Text style={styles.confirmButtonText}>선택 완료</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
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
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarContainer: {
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  confirmButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledConfirmButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Step2DateSelectScreen; 