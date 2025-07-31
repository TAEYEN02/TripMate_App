
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client'; // ReferenceError 해결

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      Alert.alert('오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    try {
      const response = await client.post('/api/auth/login', { userId, password });
      const { token, user, refreshToken } = response.data;
      await login(token, user, refreshToken);
      // AppNavigator가 자동으로 Main 화면으로 전환
    } catch (error) {
      Alert.alert('로그인 실패', '아이디나 비밀번호를 확인해주세요.');
      console.error('Login error:', error.response?.data || error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>TripMate</Text>
          <TextInput
            style={styles.input}
            placeholder="아이디"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.buttonText}>회원가입</Text>
          </TouchableOpacity>
          <View style={styles.findLinksContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('FindId')}>
              <Text style={styles.findLinkText}>아이디 찾기</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>|</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FindPassword')}>
              <Text style={styles.findLinkText}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  findLinksContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  findLinkText: {
    color: '#495057',
    fontSize: 16,
  },
  separator: {
    color: '#adb5bd',
    marginHorizontal: 10,
  },
});

export default LoginScreen;
