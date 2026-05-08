import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/login/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { AnalysisScreen } from '../screens/analysis/AnalysisScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import type { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'ホーム' }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'スキャン' }} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} options={{ title: '分析' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '設定' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
