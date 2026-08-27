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
import RatingAndReviewsScreen from './assets/components/Client/RatingAndReviewsScreen.js';
import ResignationsScreen from './assets/components/Client/ResignationsScreen.js';
import ResignationScreen from './assets/components/Client/ResignationScreen.js';
import WorkerRatingAndReviewsScreen from './assets/components/Worker/RatingAndReviewsScreen.js';
import LeaveJobScreen from './assets/components/Worker/LeaveJobScreen.js';
import TerminateContractScreen from './assets/components/Client/TerminateContractScreen.js';
import WorkerTerminationScreen from './assets/components/Worker/WorkerTerminationScreen.js';
import WorkerDirectoryScreen from './assets/components/Company/WorkerDirectoryScreen'
import WorkerDetailsVerificationScreen from './assets/components/Company/WorkerDetailsVerificationScreen.js'
import WorkerCertificationDetail from './assets/components/Client/WorkerCertificationDetail.js'
import PoliceVerificationPortal from './assets/components/Police/PoliceVerificationPortal.js'
import FileCriminalRecordScreen from './assets/components/Police/FileCriminalRecordScreen.js'
import Map from './assets/components/Client/Map.js'
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
          <Stack.Screen name="RatingAndReviewsScreen" component={RatingAndReviewsScreen} />
          <Stack.Screen name="ResignationsScreen" component={ResignationsScreen} />
          <Stack.Screen name="ResignationScreen" component={ResignationScreen} />
          <Stack.Screen name="WorkerRatingAndReviewsScreen" component={WorkerRatingAndReviewsScreen} />
          <Stack.Screen name="LeaveJobScreen" component={LeaveJobScreen} />
          <Stack.Screen name="TerminateContractScreen" component={TerminateContractScreen} />
          <Stack.Screen name="WorkerTerminationScreen" component={WorkerTerminationScreen} />
          <Stack.Screen name="WorkerDirectoryScreen" component={WorkerDirectoryScreen} />
          <Stack.Screen name="WorkerDetailsVerificationScreen" component={WorkerDetailsVerificationScreen} />
          <Stack.Screen name="WorkerCertificationDetail" component={WorkerCertificationDetail} />
          <Stack.Screen name="PoliceVerificationPortal" component={PoliceVerificationPortal} />
          <Stack.Screen name="FileCriminalRecordScreen" component={FileCriminalRecordScreen} />
          <Stack.Screen name="MapScreen" component={Map} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  )
}