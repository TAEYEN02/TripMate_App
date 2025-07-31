import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// TODO: 실제 배포 시에는 .env 파일 등으로 관리하는 것이 좋습니다.
const BASE_URL = 'http://192.168.3.11:5000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 180000, 
  headers: {
    'Content-Type': 'application/json',
  }
});

// 토큰 만료 체크 함수
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Token decode error:', error);
    return true;
  }
};

// 토큰 갱신 함수
const refreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken: refreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    await AsyncStorage.setItem('token', accessToken);
    if (newRefreshToken) {
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // 토큰 갱신 실패 시 로그아웃 처리
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    
    // 전역 이벤트 발생 (로그인 화면으로 이동하기 위해)
    if (global.navigationRef && global.navigationRef.current) {
      global.navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
    
    throw error;
  }
};

// 요청 인터셉터: 모든 요청에 인증 토큰을 추가하고 만료 체크
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token'); 
    
    if (token) {
      // 토큰 만료 체크
      if (isTokenExpired(token)) {
        try {
          const newToken = await refreshToken();
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // 토큰 갱신 실패 시 요청 취소
          return Promise.reject(new Error('Token refresh failed'));
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 토큰 갱신 시도
client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그인 화면으로 리다이렉트
        console.error('Token refresh failed in response interceptor:', refreshError);
        
        // 전역 이벤트 발생 (로그인 화면으로 이동하기 위해)
        if (global.navigationRef && global.navigationRef.current) {
          global.navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default client;