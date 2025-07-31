import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (token && savedUser) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          // 토큰이 만료되었는지 체크
          if (decoded.exp < currentTime) {
            console.log('Token expired, attempting refresh...');
            // 토큰이 만료되었으면 자동으로 갱신 시도
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              try {
                const response = await client.post('/api/auth/refresh', {
                  refreshToken: refreshToken
                });
                
                const { accessToken, newRefreshToken } = response.data;
                await AsyncStorage.setItem('token', accessToken);
                if (newRefreshToken) {
                  await AsyncStorage.setItem('refreshToken', newRefreshToken);
                }
                
                const newDecoded = jwtDecode(accessToken);
                const parsedUser = JSON.parse(savedUser);
                setUser({ token: accessToken, ...newDecoded, ...parsedUser });
                client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                return;
              } catch (refreshError) {
                console.error('Token refresh failed during initialization:', refreshError);
                // 갱신 실패 시 로그아웃
                await logout();
                return;
              }
            } else {
              // refresh token이 없으면 로그아웃
              await logout();
              return;
            }
          }
          
          const parsedUser = JSON.parse(savedUser);
          setUser({ token, ...decoded, ...parsedUser });
          client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Invalid token or user data:', error);
          await logout();
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (token, userData, refreshToken = null) => {
    try {
      const decoded = jwtDecode(token);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token, ...decoded, ...userData });
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken'); // 혹시 모를 이전 토큰 삭제
      delete client.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // 토큰 만료 시간 체크 함수
  const isTokenExpired = () => {
    if (!user?.token) return true;
    
    try {
      const decoded = jwtDecode(user.token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // 토큰 만료까지 남은 시간 (분 단위)
  const getTokenExpiryMinutes = () => {
    if (!user?.token) return 0;
    
    try {
      const decoded = jwtDecode(user.token);
      const currentTime = Date.now() / 1000;
      return Math.max(0, Math.floor((decoded.exp - currentTime) / 60));
    } catch (error) {
      return 0;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isTokenExpired, 
      getTokenExpiryMinutes 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
