import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  Alert,
  Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
//import apiClient from '../../api/client';

// 임시 데이터 (나중에 백엔드에서 가져올 데이터)
const CITIES = [
  { id: '1', name: '서울', image: require('../../images/cities/seoul.jpg') },
  { id: '2', name: '부산', image: require('../../images/cities/busan.jpg') },
  { id: '3', name: '대구', image: require('../../images/cities/daegu.jpg') },
  { id: '4', name: '인천', image: require('../../images/cities/incheon.jpg') },
  { id: '5', name: '광주', image: require('../../images/cities/gwangjiu.jpg') },
  { id: '6', name: '대전', image: require('../../images/cities/daejeon.jpg') },
  { id: '7', name: '울산', image: require('../../images/cities/ulsan.jpg') },
  { id: '8', name: '춘천', image: require('../../images/cities/chuncheon.jpg') },
  { id: '9', name: '경주', image: require('../../images/cities/gyeongju.jpg') },
  { id: '10', name: '전주', image: require('../../images/cities/jeonju.jpg') },
  { id: '11', name: '가평', image: require('../../images/cities/gapyeong.jpg') },
  { id: '12', name: '강릉', image: require('../../images/cities/gangneung.jpg') },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState(CITIES);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  // TODO: 백엔드에서 도시 목록 가져오기
  // useEffect(() => {
  //   const fetchCities = async () => {
  //     try {
  //       const response = await apiClient.get('/api/cities'); // 예시 API 엔드포인트
  //       setCities(response.data);
  //     } catch (error) {
  //       Alert.alert("오류", "도시 목록을 불러오는 데 실패했습니다.");
  //     }
  //   };
  //   fetchCities();
  // }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert("알림", "검색어를 입력해주세요.");
      return;
    }
    setSelectedCity({ name: searchQuery });
    setModalVisible(true);
  };

  const handleCityPress = (city) => {
    setSelectedCity(city);
    setModalVisible(true);
  };

  const handleCreateSchedule = () => {
    if (!selectedCity) return;
    setModalVisible(false);
    // Navigate to new step-by-step flow
    navigation.navigate('Step1Destination', { destination: selectedCity.name });
  };

  const renderCity = ({ item }) => (
    <TouchableOpacity style={styles.cityButton} onPress={() => handleCityPress(item)}>
      <Image 
        source={item.image} 
        style={styles.cityImage}
        onError={(error) => console.log('Image loading error for', item.name, error)}
      />
      <View style={styles.cityOverlay}>
        <Text style={styles.cityButtonText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Mate</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="여행하고 싶은 도시를 검색해보세요"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={cities}
        renderItem={renderCity}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.cityGrid}
        ListHeaderComponent={<Text style={styles.gridTitle}>추천 도시</Text>}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCity?.name}</Text>
            <Text style={styles.modalText}>
              선택하신 '{selectedCity?.name}'(으)로 여행 일정을 만들어 볼까요?
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateSchedule}>
              <Text style={styles.modalButtonText}>일정 생성하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9faff' },
  header: { padding: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 , marginTop:20},
  searchContainer: { flexDirection: 'row' },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  gridTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  cityGrid: { paddingBottom: 20 },
  cityButton: {
    flex: 1,
    margin: 8,
    height: 120,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cityButtonText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 24 },
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
  },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalCloseButton: { marginTop: 15 },
  modalCloseButtonText: { color: '#6c757d', fontSize: 16 },
  cityImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;