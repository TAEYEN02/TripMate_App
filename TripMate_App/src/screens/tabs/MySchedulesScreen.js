
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

import ScheduleCard from '../../components/ScheduleCard';
import AppHeader from '../../components/AppHeader';
import PrimaryButton from '../../components/PrimaryButton';

const MySchedulesScreen = () => {
  const navigation = useNavigation();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/schedule/my-schedules');
      // The DTO from backend should contain all necessary fields including isPublic
      const formattedSchedules = response.data.map(item => ({
        id: item.id,
        title: item.title || `${item.arrival} 여행`,
        destination: item.arrival,
        startDate: item.startDate,
        endDate: item.endDate,
        isPublic: item.isPublic, // Make sure backend sends this
      }));
      setSchedules(formattedSchedules);
    } catch (error) {
      console.error("Failed to fetch schedules:", error.response?.data || error.message);
      Alert.alert("오류", "일정 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  const handleShare = async (scheduleId, isPublic) => {
    try {
      await apiClient.put(`/api/schedule/${scheduleId}/share`, { isPublic });
      Alert.alert('성공', `일정이 ${isPublic ? '공개' : '비공개'} 처리되었습니다.`);
      fetchSchedules(); // Refresh the list
    } catch (error) {
      console.error("Failed to update share status:", error.response?.data || error.message);
      Alert.alert('오류', '공유 상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (scheduleId) => {
    Alert.alert('삭제 확인', '정말로 이 일정을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/schedule/${scheduleId}`);
            Alert.alert('성공', '일정이 삭제되었습니다.');
            fetchSchedules(); // Refresh the list
          } catch (error) {
            console.error("Failed to delete schedule:", error.response?.data || error.message);
            Alert.alert('오류', '일정 삭제에 실패했습니다.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 여행 일정</Text>
        <View style={styles.placeholder} />
      </View>
      {schedules.length === 0 && !loading && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>아직 생성된 일정이 없습니다.</Text>
          <PrimaryButton
            title="새 일정 만들기"
            onPress={() => navigation.navigate('Step1Destination')}
          />
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={schedules}
        renderItem={({ item }) => (
          <ScheduleCard 
            item={item} 
            onShare={handleShare}
            onDelete={handleDelete}
          />
        )}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchSchedules}
        refreshing={loading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  listContainer: { paddingHorizontal: 15, paddingBottom: 15 },
  emptyText: { fontSize: 18, color: '#868e96', marginBottom: 20 },
});

export default MySchedulesScreen;
