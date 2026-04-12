import 'react-native-gesture-handler';
import React from "react";
import LoginScreen from './assets/components/Auth/LoginScreen.js'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignupScreen from './assets/components/Auth/SignupScreen.js';
import AddSkillScreen from './assets/components/Worker/AddSkillScreen.js';
import UserDashboardScreen from './assets/components/Client/UserDashboardScreen.js';
import FindServiceScreen from './assets/components/Client/FindServiceScreen.js';
import FilterationScreen from './assets/components/Client/FilterationScreen.js';
import WorkerDetailScreen from './assets/components/Client/WorkerDetailScreen.js';
import WorkerDashboardScreen from './assets/components/Worker/WorkerDashboardScreen.js';
import InterviewSelectionScreen from './assets/components/Client/InterviewSelectionScreen.js';
import ActiveRequestsScreen from './assets/components/Worker/ActiveRequestsScreen.js';
import ActiveRequestScreen from './assets/components/Client/ActiveRequestScreen.js';
import AcceptedRequestScreen from './assets/components/Worker/AcceptedRequestScreen.js';
import JobConfirmationScreen from './assets/components/Worker/JobConfirmationScreen.js';
import WorkerDecisionScreen from './assets/components/Client/WorkerDecisionScreen.js';
import Toast from 'react-native-toast-message';

const Stack = createStackNavigator();
export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="AddSkills" component={AddSkillScreen} />
          <Stack.Screen name="UserDashboardScreen" component={UserDashboardScreen} />
          <Stack.Screen name="FindServiceScreen" component={FindServiceScreen} />
          <Stack.Screen name="FilterationScreen" component={FilterationScreen} />
          <Stack.Screen name="WorkerDetailScreen" component={WorkerDetailScreen} />
          <Stack.Screen name="WorkerDashboardScreen" component={WorkerDashboardScreen} />
          <Stack.Screen name="InterviewSelectionScreen" component={InterviewSelectionScreen} />
          <Stack.Screen name="ActiveRequestsScreen" component={ActiveRequestsScreen} />
          <Stack.Screen name="ActiveRequestScreen" component={ActiveRequestScreen} />
          <Stack.Screen name="AcceptedRequestScreen" component={AcceptedRequestScreen} />
          <Stack.Screen name="JobConfirmationScreen" component={JobConfirmationScreen} />
          <Stack.Screen name="WorkerDecisionScreen" component={WorkerDecisionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  )
}