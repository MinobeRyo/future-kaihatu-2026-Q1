import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LoginScreen } from '../screens/login/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { AnalysisScreen } from '../screens/analysis/AnalysisScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import type { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, [IoniconName, IoniconName]> = {
  Home:     ['home',      'home-outline'],
  Scan:     ['scan',      'scan-outline'],
  Analysis: ['bar-chart', 'bar-chart-outline'],
  Settings: ['settings',  'settings-outline'],
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home:     'ホーム',
  Scan:     'スキャン',
  Analysis: '分析',
  Settings: '設定',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name as keyof MainTabParamList];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        title: TAB_LABELS[route.name as keyof MainTabParamList],
        tabBarActiveTintColor:   '#4A7F45',
        tabBarInactiveTintColor: '#B8967A',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: '#FFFBF0',
          borderTopWidth: 3,
          borderTopColor: '#7B4F2E',
          height: 70,
          paddingTop: 6,
          paddingBottom: 10,
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Scan"     component={ScanScreen} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer
      documentTitle={{ formatter: () => 'Receiplant' }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { width: '100%' } }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main"  component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
