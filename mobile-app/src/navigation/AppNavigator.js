import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import DoctorsScreen from '../screens/doctors/DoctorsScreen';
import DoctorDetailScreen from '../screens/doctors/DoctorDetailScreen';
import VisitsScreen from '../screens/visits/VisitsScreen';
import VisitFormScreen from '../screens/visits/VisitFormScreen';
import VisitDetailScreen from '../screens/visits/VisitDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CoverageScreen from '../screens/coverage/CoverageScreen';
import SalesScreen from '../screens/sales/SalesScreen';
import AddSalesScreen from '../screens/sales/AddSalesScreen';
import AddSchemeScreen from '../screens/sales/AddSchemeScreen';
import SalesHistoryScreen from '../screens/sales/SalesHistoryScreen';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Doctors') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Visits') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Coverage') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Sales') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Visits" component={VisitsScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Coverage" component={CoverageScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="DoctorDetail"
            component={DoctorDetailScreen}
            options={{ headerShown: true, title: 'Doctor Details' }}
          />
          <Stack.Screen
            name="VisitForm"
            component={VisitFormScreen}
            options={{ headerShown: true, title: 'Log Visit' }}
          />
          <Stack.Screen
            name="VisitDetail"
            component={VisitDetailScreen}
            options={{ headerShown: true, title: 'Visit Details' }}
          />
          <Stack.Screen
            name="AddSales"
            component={AddSalesScreen}
            options={{ headerShown: true, title: 'Add Sales Entry' }}
          />
          <Stack.Screen
            name="AddScheme"
            component={AddSchemeScreen}
            options={{ headerShown: true, title: 'Add Scheme' }}
          />
          <Stack.Screen
            name="SalesHistory"
            component={SalesHistoryScreen}
            options={{ headerShown: true, title: 'My Sales' }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
