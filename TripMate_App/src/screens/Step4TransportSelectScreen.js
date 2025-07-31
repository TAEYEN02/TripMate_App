import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Alert, FlatList, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import client from '../api/client';

const Step4TransportSelectScreen = ({ route }) => {
  const navigation = useNavigation();
  const { departure, destination, startDate, endDate, goTime, returnTime } = route.params;
  
  const [currentStep, setCurrentStep] = useState('go'); // 'go' or 'return'
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportOptions, setTransportOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [goTransport, setGoTransport] = useState(null);
  const [returnTransport, setReturnTransport] = useState(null);
  const [transportType, setTransportType] = useState('train'); // 'train' 또는 'bus'

  useEffect(() => {
    loadTransportOptions();
  }, [currentStep, transportType]);

  const loadTransportOptions = async () => {
    setLoading(true);
    try {
      const currentDate = currentStep === 'go' ? startDate : endDate;
      const currentTime = currentStep === 'go' ? goTime : returnTime;
      const currentDeparture = currentStep === 'go' ? departure : destination;
      const currentArrival = currentStep === 'go' ? destination : departure;

      const response = await client.get('/api/transport/search', {
        params: {
          departure: currentDeparture,
          arrival: currentArrival,
          date: currentDate,
          time: currentTime,
          page: 0,
          size: 50 // 더 많은 결과를 한 번에 가져오기
        }
      });

      if (response.data && response.data.content) {
        // 선택된 타입에 따라 필터링
        const filteredOptions = response.data.content.filter(option => {
          if (transportType === 'train') {
            // 기차 타입 필터링 (KTX, ITX, SRT 등)
            return option.type && (
              option.type.includes('KTX') || 
              option.type.includes('ITX') || 
              option.type.includes('SRT') ||
              option.type.includes('기차')
            );
          } else {
            // 버스 타입 필터링 (고속버스, 시외버스 등)
            return option.type && (
              option.type.includes('버스') || 
              option.type.includes('고속') || 
              option.type.includes('시외')
            );
          }
        });
        setTransportOptions(filteredOptions);
      }
    } catch (error) {
      console.error('Transport search error:', error);
      // 에러 시 더미 데이터 사용
      const trainOptions = [
        {
          id: 1,
          type: 'KTX',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '10:23',
          arrivalTime: '13:35'
        },
        {
          id: 2,
          type: 'ITX-새마을',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '10:33',
          arrivalTime: '15:07'
        },
        {
          id: 3,
          type: 'KTX',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '11:15',
          arrivalTime: '14:27'
        },
        {
          id: 4,
          type: 'ITX-마음',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '12:45',
          arrivalTime: '16:12'
        },
        {
          id: 5,
          type: 'KTX',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '14:20',
          arrivalTime: '17:32'
        }
      ];

      const busOptions = [
        {
          id: 101,
          type: '고속버스',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '09:30',
          arrivalTime: '14:45'
        },
        {
          id: 102,
          type: '시외버스',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '10:00',
          arrivalTime: '15:30'
        },
        {
          id: 103,
          type: '고속버스',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '11:15',
          arrivalTime: '16:20'
        },
        {
          id: 104,
          type: '시외버스',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '12:30',
          arrivalTime: '17:45'
        },
        {
          id: 105,
          type: '고속버스',
          departure: currentStep === 'go' ? departure : destination,
          arrival: currentStep === 'go' ? destination : departure,
          departureTime: '13:45',
          arrivalTime: '18:50'
        }
      ];

      // 선택된 타입에 따라 옵션 설정
      if (transportType === 'train') {
        setTransportOptions(trainOptions);
      } else {
        setTransportOptions(busOptions);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransportSelect = (transport) => {
    setSelectedTransport(transport);
    
    if (currentStep === 'go') {
      setGoTransport(transport);
      setCurrentStep('return');
      setSelectedTransport(null);
      setCurrentPage(1);
    } else {
      setReturnTransport(transport);
      // 모든 단계 완료, 일정 편집 화면으로 이동
      const plannerData = {
        departure,
        destination,
        startDate,
        endDate,
        days: dayjs(endDate).diff(dayjs(startDate), 'day') + 1,
        goTransport: `${goTransport.type}|${goTransport.departureTime}|${goTransport.arrivalTime}`,
        returnTransport: `${transport.type}|${transport.departureTime}|${transport.arrivalTime}`,
      };
      
      navigation.navigate('ScheduleEditor', { plannerData });
    }
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleTransportTypeChange = (type) => {
    setTransportType(type);
  };

  const renderTransportItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transportItem}
      onPress={() => handleTransportSelect(item)}
    >
      <View style={styles.transportHeader}>
        <Text style={styles.transportType}>{item.type}</Text>
      </View>
      <View style={styles.transportDetails}>
        <Text style={styles.routeText}>
          {item.departure} → {item.arrival}
        </Text>
        <Text style={styles.timeText}>
          {item.departureTime} - {item.arrivalTime}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getCurrentStepInfo = () => {
    if (currentStep === 'go') {
      return {
        title: '가는날 교통편 선택',
        date: dayjs(startDate).format('YYYY. MM. DD.'),
        dayLabel: '(가는 날)',
        time: goTime
      };
    } else {
      return {
        title: '오는날 교통편 선택',
        date: dayjs(endDate).format('YYYY. MM. DD.'),
        dayLabel: '(오는 날)',
        time: returnTime
      };
    }
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>교통편 선택</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{stepInfo.title}</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.dateText}>
            {currentStep === 'go' ? '가는 날' : '오는 날'}: {stepInfo.date}{stepInfo.dayLabel}
          </Text>
          <Text style={styles.timeText}>출발시간: {stepInfo.time}</Text>
        </View>

        <View style={styles.transportTypeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, transportType === 'train' && styles.activeTypeButton]}
            onPress={() => handleTransportTypeChange('train')}
          >
            <Text style={transportType === 'train' ? styles.activeTypeButtonText : styles.typeButtonText}>기차</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, transportType === 'bus' && styles.activeTypeButton]}
            onPress={() => handleTransportTypeChange('bus')}
          >
            <Text style={transportType === 'bus' ? styles.activeTypeButtonText : styles.typeButtonText}>버스</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transportList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
            </View>
          ) : transportOptions.length > 0 ? (
            <FlatList
              data={transportOptions}
              renderItem={renderTransportItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              style={styles.transportFlatList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {transportType === 'train' ? '기차' : '버스'} 정보가 없습니다
              </Text>
              <Text style={styles.emptySubText}>
                다른 교통편을 선택해보세요
              </Text>
            </View>
          )}
        </View>
      </View>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
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
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  transportTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  activeTypeButton: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  activeTypeButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  transportList: {
    flex: 1,
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
  transportFlatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  transportHeader: {
    marginBottom: 8,
  },
  transportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default Step4TransportSelectScreen; 