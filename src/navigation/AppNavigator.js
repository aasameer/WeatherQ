import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen     from '../screens/HomeScreen';
import SearchScreen   from '../screens/SearchScreen';
import ShareScreen    from '../screens/ShareScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen    from '../screens/AboutScreen';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown:  false,
        cardStyle:    { backgroundColor: 'transparent' },
        presentation: 'card',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Home"     component={HomeScreen} />
      <Stack.Screen name="Search"   component={SearchScreen} />
      <Stack.Screen name="Share"    component={ShareScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About"    component={AboutScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
