
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import all screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import FindIdScreen from './src/screens/FindIdScreen';
import FindPasswordScreen from './src/screens/FindPasswordScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import PlannerSetupScreen from './src/screens/PlannerSetupScreen';
import ScheduleEditorScreen from './src/screens/ScheduleEditorScreen';
import ScheduleDetailScreen from './src/screens/ScheduleDetailScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MySchedulesScreen from './src/screens/tabs/MySchedulesScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth();
  return (
    <Stack.Navigator initialRouteName={user ? "Main" : "Login"}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }}/>
          <Stack.Screen name="PlannerSetup" component={PlannerSetupScreen} options={{ title: '여행 준비' }}/>
          <Stack.Screen name="ScheduleEditor" component={ScheduleEditorScreen} options={{ title: '일정 만들기' }}/>
          <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} options={{ title: '일정 상세' }}/>
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '프로필 수정' }}/>
          <Stack.Screen name="MySchedules" component={MySchedulesScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '회원가입' }}/>
          <Stack.Screen name="FindId" component={FindIdScreen} options={{ title: '아이디 찾기' }}/>
          <Stack.Screen name="FindPassword" component={FindPasswordScreen} options={{ title: '비밀번호 찾기' }}/>
        </>
      )}
    </Stack.Navigator>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default App;
