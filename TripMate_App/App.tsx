
import React, { useRef } from 'react';
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

import ScheduleEditorScreen from './src/screens/ScheduleEditorScreen';
import ScheduleDetailScreen from './src/screens/ScheduleDetailScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MySchedulesScreen from './src/screens/tabs/MySchedulesScreen';
import Step1DestinationScreen from './src/screens/Step1DestinationScreen';
import Step2DateSelectScreen from './src/screens/Step2DateSelectScreen';
import Step3TimeSelectScreen from './src/screens/Step3TimeSelectScreen';
import Step4TransportSelectScreen from './src/screens/Step4TransportSelectScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator initialRouteName={user ? "Main" : "Login"} >
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }}/>

          <Stack.Screen name="Step1Destination" component={Step1DestinationScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="Step2DateSelect" component={Step2DateSelectScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="Step3TimeSelect" component={Step3TimeSelectScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="Step4TransportSelect" component={Step4TransportSelectScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="ScheduleEditor" component={ScheduleEditorScreen} options={{ title: '일정 만들기' }}/>
          <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} options={{ title: '일정 상세' }}/>
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '프로필 수정' }}/>
          <Stack.Screen name="MySchedules" component={MySchedulesScreen} options={{ headerShown: false }}/>
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="FindId" component={FindIdScreen} />
          <Stack.Screen name="FindPassword" component={FindPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

function App() {
  const navigationRef = useRef(null);

  React.useEffect(() => {
    global.navigationRef = navigationRef;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default App;
