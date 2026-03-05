import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';

import FindFishingLureScreen from '../screens/FindFishingLureScreen';
import LogCatchScreen from '../screens/LogCatchScreen';
import StatsScreen from '../screens/StatsScreen';
import AnglerStoriesScreen from '../screens/AnglerStoriesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Loader" component={LoaderScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Not in tabs (opened from MainMenu) */}
      <Stack.Screen name="FindFishingLure" component={FindFishingLureScreen} />
      <Stack.Screen name="LogCatch" component={LogCatchScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="AnglerStories" component={AnglerStoriesScreen} />
    </Stack.Navigator>
  );
}