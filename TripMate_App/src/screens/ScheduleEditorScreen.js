import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Button,
  TouchableOpacity, ScrollView, Modal, FlatList, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList from 'react-native-draggable-flatlist';
import axios from 'axios';
import dayjs from 'dayjs';
import client from '../api/client';
import ScheduleMapComponent from '../components/map/ScheduleMapComponent';
import PlaceCard from '../components/schedule/PlaceCard';

const KAKAO_API_KEY = "1bf61ebd329fb75d565cfa8dcb9ab263";

const addTempId = (place) => ({ ...place, tempId: Math.random().toString() });

const ScheduleEditorScreen = ({ route, navigation }) => {
  const { plannerData, existingSchedule } = route.params;
  const isEditing = !!existingSchedule;
  const insets = useSafeAreaInsets(); // 🚀 [추가] 안전 영역 insets 가져오기

  const [schedule, setSchedule] = useState({ dailyPlan: {} });
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [isRecommendModalVisible, setRecommendModalVisible] = useState(false);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [searchedPlaces, setSearchedPlaces] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateTabs, setDateTabs] = useState([]);



  useEffect(() => {
    if (isEditing && existingSchedule) {
      const dailyPlanWithTempIds = {};
      for (const date in existingSchedule.dailyPlan) {
        dailyPlanWithTempIds[date] = existingSchedule.dailyPlan[date].map(addTempId);
      }
      setSchedule({ ...existingSchedule, dailyPlan: dailyPlanWithTempIds });
      
      // 기존 일정의 경우 출발지와 도착지 정보를 사용해서 제목 설정
      if (existingSchedule.departure && existingSchedule.arrival) {
        setScheduleTitle(`${existingSchedule.departure} → ${existingSchedule.arrival} 여행`);
      } else {
        setScheduleTitle(existingSchedule.title);
      }
      
      const sortedDates = Object.keys(existingSchedule.dailyPlan).sort();
      setDateTabs(sortedDates);
      setSelectedDate(sortedDates[0]);
    } else if (plannerData) {
      const dailyPlan = {};
      const dates = [];
      const start = dayjs(plannerData.startDate);
      for (let i = 0; i < plannerData.days; i++) {
        const date = start.add(i, 'day').format('YYYY-MM-DD');
        dailyPlan[date] = [];
        dates.push(date);
      }
      setSchedule({ dailyPlan });
      setScheduleTitle(`${plannerData.departure} → ${plannerData.destination} 여행`);
      setDateTabs(dates);
      setSelectedDate(plannerData.startDate);
    }
  }, [plannerData, existingSchedule, isEditing]);

  const handleGenerateSchedule = async () => {
    if (isEditing) return;
    setLoading(true);
    try {
      const response = await client.post('/api/schedule/generate-multi', {
        departure: plannerData.departure,
        arrival: plannerData.destination,
        date: plannerData.startDate,
        days: plannerData.days,
      });
      if (response.data && Object.keys(response.data.dailyPlan).length > 0) {
        const newDailyPlan = {};
        for (const date in response.data.dailyPlan) {
          newDailyPlan[date] = response.data.dailyPlan[date].map(addTempId);
        }
        
        const sortedDates = Object.keys(newDailyPlan).sort();
        
        // 🚀 [수정] 상태 업데이트 순서를 명확히 하여 지도 갱신을 보장
        // 자동 일정 생성 후에도 목적지 정보를 유지하기 위해 plannerData 정보 추가
        setSchedule({ 
          ...response.data, 
          dailyPlan: newDailyPlan,
          arrival: plannerData.destination, // 목적지 정보 추가
          departure: plannerData.departure  // 출발지 정보 추가
        });
        setDateTabs(sortedDates);
        setSelectedDate(sortedDates[0]); // 가장 마지막에 업데이트하여 변경 감지를 유도
        
        // 지도 갱신을 위한 강제 리렌더링
        setTimeout(() => {
          setSelectedDate(sortedDates[0]);
        }, 100);

      }
    } catch (err) {
      Alert.alert('오류', '자동 일정 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendPlaces = async () => {
    // 목적지 정보 가져오기
    const destination = schedule?.arrival || plannerData?.destination;
    
    if (!destination) {
      Alert.alert('알림', '추천 장소를 검색할 목적지를 찾을 수 없습니다.');
      return;
    }

    setRecommendModalVisible(true);
    setRecommendLoading(true);
    
    try {
      const response = await client.get('/api/schedule/places/recommend', {
        params: { keyword: destination }
      });

      if (Array.isArray(response.data)) {
        setRecommendedPlaces(response.data.map(addTempId));
      } else {
        console.warn("API 응답이 배열이 아닙니다:", response.data);
        setRecommendedPlaces([]);
      }
    } catch (error) {
      console.error("장소 추천 API 호출 중 오류 발생:", error);
      Alert.alert('오류', '추천 장소를 불러오는 중 문제가 발생했습니다. 네트워크 상태를 확인해 주세요.');
      setRecommendedPlaces([]); // 실패 시에도 모달은 닫지 않고, 목록만 비웁니다.
    } finally {
      setRecommendLoading(false);
    }
  };

  const handleSearchPlaces = async (query) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const response = await axios.get("https://dapi.kakao.com/v2/local/search/keyword.json", {
        params: { query: query.trim(), size: 15 },
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      });
      setSearchedPlaces(response.data.documents);
    } catch (error) {
      Alert.alert('오류', '장소 검색에 실패했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddPlaceToSchedule = (place) => {
    if (!selectedDate) {
      Alert.alert('알림', '장소를 추가할 날짜를 먼저 선택해주세요.');
      return;
    }
    // 🚀 [수정] 불변성을 지키기 위해 새로운 객체와 배열로 상태 업데이트
    setSchedule(prev => {
      const newDailyPlan = { ...prev.dailyPlan };
      const currentPlaces = prev.dailyPlan[selectedDate] || [];
      newDailyPlan[selectedDate] = [...currentPlaces, addTempId(place)];
      return { ...prev, dailyPlan: newDailyPlan };
    });
    Alert.alert('성공', `${place.name}을(를) ${selectedDate} 일정에 추가했습니다.`);
  };

  const handleDeletePlace = (placeToDelete) => {
    Alert.alert(
      '장소 삭제',
      `${placeToDelete.name}을(를) 일정에서 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setSchedule(prev => {
              const newDailyPlan = { ...prev.dailyPlan };
              const currentPlaces = prev.dailyPlan[selectedDate] || [];
              newDailyPlan[selectedDate] = currentPlaces.filter(
                place => place.tempId !== placeToDelete.tempId
              );
              return { ...prev, dailyPlan: newDailyPlan };
            });
            Alert.alert('삭제 완료', `${placeToDelete.name}이(가) 일정에서 삭제되었습니다.`);
          },
        },
      ]
    );
  };

  const handleAddSearchedPlace = (place) => {
    const newPlace = {
      name: place.place_name,
      address: place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      category: place.category_group_name,
      photoUrl: place.place_url ? place.place_url.substring(0, 3000) : '', // URL 길이 제한
    };
    handleAddPlaceToSchedule(newPlace);
    setSearchModalVisible(false);
    setSearchedPlaces([]);
    setSearchQuery('');
  };

  const handleSaveSchedule = async () => {
    if (!schedule || !schedule.dailyPlan) return;
    const places = Object.entries(schedule.dailyPlan).flatMap(([date, placesOnDate]) =>
      placesOnDate.map(({ tempId, ...rest }) => ({ ...rest, date }))
    );

    let requestBody = {
      title: scheduleTitle,
      places: places,
    };

    try {
      if (isEditing) {
        requestBody.id = schedule.id;
        requestBody.departure = schedule.departure;
        requestBody.arrival = schedule.arrival;
        requestBody.startDate = schedule.startDate;  // 시작일 추가
        requestBody.endDate = schedule.endDate;      // 종료일 추가
        requestBody.date = schedule.startDate;
        requestBody.days = schedule.days;
        requestBody.startTime = schedule.startTime;
        requestBody.endTime = schedule.endTime;

        await client.put(`/api/schedule/${schedule.id}`, requestBody);
        Alert.alert('성공', '일정이 수정되었습니다!');
      } else {
        const goTime = plannerData.goTransport.split('|')[1];
        const returnTime = plannerData.returnTransport.split('|')[2];
        requestBody = {
          ...requestBody,
          departure: plannerData.departure,
          arrival: plannerData.destination,
          date: plannerData.startDate,
          days: plannerData.days,
          startTime: `${plannerData.startDate}T${goTime}:00`,
          endTime: `${plannerData.endDate}T${returnTime}:00`,
        };
        await client.post('/api/schedule', requestBody);
        Alert.alert('성공', '일정이 저장되었습니다!');
      }
      // 네비게이션 스택을 리셋하고 MySchedules로 이동
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MySchedules' }
        ],
      });
    } catch (error) {
      console.error('Schedule save error:', error);
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  };

  const onDragEnd = ({ data }) => {
    setSchedule(prev => {
      const newDailyPlan = { ...prev.dailyPlan };
      newDailyPlan[selectedDate] = data;
      return { ...prev, dailyPlan: newDailyPlan };
    });
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* 고정된 지도 영역 */}
        <View style={styles.mapContainer}>
          <ScheduleMapComponent 
            dailyPlan={schedule?.dailyPlan ?? {}} 
            selectedDate={selectedDate} 
            selectedPlace={selectedPlace} 
          />
        </View>

                  {/* FlatList로 전체 스크롤 담당 */}
          <FlatList
            data={[{ id: 'content' }]}
            renderItem={() => (
              <View style={styles.contentContainer}>
                <View style={styles.controlsContainer}>
                  <TextInput style={styles.titleInput} value={scheduleTitle} onChangeText={setScheduleTitle} />
                  <Text style={styles.dates}>
                    {isEditing
                      ? `${dayjs(schedule.startDate).format('YYYY.MM.DD')} ~ ${dayjs(schedule.endDate).format('YYYY.MM.DD')}`
                      : plannerData && plannerData.startDate && plannerData.endDate
                        ? `${plannerData.startDate} ~ ${plannerData.endDate}`
                        : '날짜를 선택해주세요'
                    }
                  </Text>
                  
                  {/* 개선된 버튼 디자인 */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.actionButton, isEditing && styles.disabledButton]} 
                      onPress={handleGenerateSchedule} 
                      disabled={isEditing}
                    >
                      <Text style={[styles.actionButtonText, isEditing && styles.disabledButtonText]}>
                        자동 일정 생성
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleRecommendPlaces}>
                      <Text style={styles.actionButtonText}>장소 추천</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={() => setSearchModalVisible(true)}>
                      <Text style={styles.actionButtonText}>위치 추가</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* 날짜 탭 */}
                <View style={styles.tabsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                    {dateTabs.map(date => (
                      <TouchableOpacity 
                        key={date} 
                        style={[styles.tabButton, selectedDate === date && styles.activeTab]} 
                        onPress={() => setSelectedDate(date)}
                      >
                        <Text style={[styles.tabText, selectedDate === date && styles.activeTabText]}>
                          {date.substring(5)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 장소 목록 */}
                <View style={styles.placesContainer}>
                  {loading ? (
                    <ActivityIndicator size="large" style={styles.loadingIndicator} />
                  ) : (
                    <>
                      {schedule.dailyPlan[selectedDate] && schedule.dailyPlan[selectedDate].length > 0 ? (
                        <>
                          <Text style={styles.dragHint}>길게 누르고 드래그하여 순서를 변경하세요</Text>
                          <View style={styles.placesListContainer}>
                            <DraggableFlatList
                              data={schedule.dailyPlan[selectedDate]}
                              keyExtractor={(item) => item.tempId}
                              onDragEnd={onDragEnd}
                              scrollEnabled={true}
                              nestedScrollEnabled={true}
                              dragItemOverflow={true}
                              contentContainerStyle={{ paddingBottom: 20 }}
                              showsVerticalScrollIndicator={true}
                              bounces={false}
                              overScrollMode="never"
                              renderItem={({ item, drag, isActive }) => (
                                <TouchableOpacity
                                  onLongPress={drag}
                                  disabled={isActive}
                                  delayLongPress={500}
                                  activeOpacity={1}
                                  style={[
                                    styles.draggableItem,
                                    isActive && styles.draggingItem
                                  ]}
                                >
                                  <PlaceCard 
                                    item={item} 
                                    onDelete={handleDeletePlace}
                                    showDeleteButton={true}
                                    isDragging={isActive}
                                  />
                                </TouchableOpacity>
                              )}
                            />
                          </View>
                        </>
                      ) : (
                        <Text style={styles.noDataText}>일정이 없습니다.</Text>
                      )}
                    </>
                  )}
                </View>
                
                {/* 저장 버튼 */}
                <View style={styles.saveButtonContainer}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveSchedule}>
                    <Text style={styles.saveButtonText}>일정 저장하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

      {/* 추천 장소 모달 */}
      {isRecommendModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SafeAreaView style={styles.modalSafeArea}>
              <Text style={styles.modalTitle}>추천 장소</Text>
              <View style={styles.modalWrapper}>
                {recommendLoading ? (
                  <ActivityIndicator size="large" />
                ) : (
                  <FlatList
                    data={recommendedPlaces}
                    keyExtractor={(item) => item.tempId}
                    renderItem={({ item }) => (
                      <View style={styles.recommendItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recommendName}>{item.name}</Text>
                          <Text style={styles.recommendAddress}>{item.address}</Text>
                        </View>
                        <TouchableOpacity style={styles.addButton} onPress={() => handleAddPlaceToSchedule(item)}>
                          <Text style={styles.addButtonText}>추가</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>추천 장소가 없습니다.</Text>}
                  />
                )}
              </View>
                             <TouchableOpacity style={styles.modalCloseButton} onPress={() => setRecommendModalVisible(false)}>
                 <Text style={styles.modalCloseButtonText}>닫기</Text>
               </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      )}
      {/* 위치 검색 모달 */}
      {isSearchModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SafeAreaView style={styles.modalSafeArea}>
              <Text style={styles.modalTitle}>위치 검색</Text>
              <View style={styles.searchBar}>
                <TextInput style={styles.searchInput} placeholder="장소, 주소 검색" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={() => handleSearchPlaces(searchQuery)} />
              </View>
              <View style={styles.modalWrapper}>
                {searchLoading ? <ActivityIndicator /> : (
                  <FlatList
                    data={searchedPlaces}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.searchItem} onPress={() => handleAddSearchedPlace(item)}>
                        <Text style={styles.recommendName}>{item.place_name}</Text>
                        <Text style={styles.recommendAddress}>{item.address_name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
                             <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSearchModalVisible(false)}>
                 <Text style={styles.modalCloseButtonText}>닫기</Text>
               </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  mapContainer: { height: '25%', backgroundColor: '#e9ecef' },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
     contentContainer: { 
     backgroundColor: 'white', 
     borderTopLeftRadius: 35, 
     borderTopRightRadius: 35, 
     marginTop: -20, 
     shadowColor: '#000', 
     shadowOffset: { width: 0, height: -4 }, 
     shadowOpacity: 0.15, 
     shadowRadius: 8, 
     elevation: 8,
     minHeight: '100%'
   },
   
   controlsContainer: { 
     padding: 20, 
     borderBottomWidth: 1, 
     borderBottomColor: '#f0f0f0' 
   },
  titleInput: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    padding: 15,
    color: '#333',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  dates: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 20, 
    paddingLeft: 5,
    fontWeight: '500'
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    shadowColor: '#e9ecef'
  },
  disabledButtonText: {
    color: '#6c757d'
  },
  tabsContainer: { 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  tabsScrollContent: { 
    paddingHorizontal: 20 
  },
  tabButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 18, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 18, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  activeTab: { 
    backgroundColor: '#007BFF',
    borderColor: '#007BFF'
  },
  tabText: { 
    color: '#666', 
    fontWeight: '600', 
    fontSize: 13 
  },
  activeTabText: { 
    color: 'white' 
  },
         placesContainer: { 
      paddingVertical: 15,
      flex: 1
    },
    loadingIndicator: { 
      marginTop: 40 
    },
    saveButtonContainer: { 
      padding: 20, 
      paddingBottom: 40,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0'
    },
    saveButton: {
      backgroundColor: '#28a745',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#28a745',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4
    },
    saveButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 15
    },
  noDataText: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: '#6c757d', 
    fontSize: 16 
  },
  draggableItem: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placesListContainer: {
    height: 600, // DraggableFlatList의 높이를 명확히 지정
  },
  draggableItem: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  draggingItem: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999
  },
  modalContent: { 
    width: '90%', 
    height: '70%', 
    backgroundColor: 'white', 
    borderRadius: 25, 
    overflow: 'hidden',
    zIndex: 10000,
    elevation: 10000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 25
  },
  modalSafeArea: { flex: 1, alignItems: 'center' },
  modalWrapper: { flex: 1, width: '100%', marginTop: 10 },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 20,
    color: '#333'
  },
  recommendItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0', 
    width: '100%' 
  },
  recommendName: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  recommendAddress: { 
    fontSize: 12, 
    color: '#666',
    maxWidth: '70%'
  },
  addButton: { 
    backgroundColor: '#28a745', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 15,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  addButtonText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 13
  },
  modalCloseButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 18,
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#6c757d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },
  searchBar: { 
    padding: 20,
    width: '100%'
  },
  searchInput: { 
    height: 55, 
    borderWidth: 2, 
    borderColor: '#e9ecef', 
    borderRadius: 28, 
    paddingHorizontal: 25,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchItem: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  dragHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },

});

export default ScheduleEditorScreen;