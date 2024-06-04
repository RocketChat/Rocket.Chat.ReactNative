import React, { useContext, memo, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { connect } from 'react-redux';
import { connectToDefaultServer } from './actions/serverConnectionUtils';
import { SetUsernameStackParamList, StackParamList , TabParamList} from './definitions/navigationTypes';
import Navigation from './lib/navigation/appNavigation';
import { defaultHeader, getActiveRouteName, navigationTheme } from './lib/methods/helpers/navigation';
import { RootEnum } from './definitions';
// Stacks
import AuthLoadingView from './views/AuthLoadingView';
import LoginView from './views/LoginView';
import SplashScreen from './views/SplashScreen';
import ProfileView from './views/ProfileView';
// SetUsername Stack
import SetUsernameView from './views/SetUsernameView';
import MainStack from './stacks/MainStack';
import InsideStack from './stacks/InsideStack';
import MasterDetailStack from './stacks/MasterDetailStack';
import { ThemeContext } from './theme';
import { setCurrentScreen } from './lib/methods/helpers/log';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from './containers/BottomTapBar';
import AICreateImageStack from './stacks/AICreateImageStack';
// SetUsernameStack
const SetUsername = createStackNavigator<SetUsernameStackParamList>();

const SetUsernameStack = () => (
	<SetUsername.Navigator screenOptions={defaultHeader}>
		<SetUsername.Screen name='SetUsernameView' component={SetUsernameView} />
	</SetUsername.Navigator>
);

// App
const Stack = createStackNavigator<StackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const App = memo(({ root, isMasterDetail }: { root: string; isMasterDetail: boolean }) => {
	const { theme } = useContext(ThemeContext);
	useEffect(() => {
		if (root) {
			const state = Navigation.navigationRef.current?.getRootState();
			const currentRouteName = getActiveRouteName(state);
			Navigation.routeNameRef.current = currentRouteName;
			setCurrentScreen(currentRouteName);
		}
		const defaultServerUrl = 'https://chat.jujiaxi.com';
		connectToDefaultServer(defaultServerUrl);
	}, [root]);

	if (!root) {
		return null;
	}

	const navTheme = navigationTheme(theme);

	return (
		<NavigationContainer
			theme={navTheme}
			ref={Navigation.navigationRef}
			onStateChange={state => {
				const previousRouteName = Navigation.routeNameRef.current;
				const currentRouteName = getActiveRouteName(state);
				if (previousRouteName !== currentRouteName) {
					setCurrentScreen(currentRouteName); // Ensure setCurrentScreen is defined and used
				}
				Navigation.routeNameRef.current = currentRouteName;
			}}
		>
			<Stack.Navigator
				initialRouteName="SplashScreen"
				screenOptions={{ headerShown: false }}
			>
				<Stack.Screen name="SplashScreen" component={SplashScreen} />
				<Stack.Screen name="MainTabs">
					{() => (
						<Tab.Navigator
							tabBar={props => <BottomTabBar {...props} />}
							screenOptions={{ headerShown: false }}
						>
							<Tab.Screen name="首页" component={MainStack} />
							<Tab.Screen name="Ai作图"  component={AICreateImageStack} />
							<Tab.Screen name="Profile" component={ProfileView} />
						</Tab.Navigator>
					)}
				</Stack.Screen>
				
				<Stack.Screen name="LoginView" component={LoginView} />
			</Stack.Navigator>
		</NavigationContainer>
	);
});

const mapStateToProps = (state: any) => ({
	root: state.app.root,
	isMasterDetail: state.app.isMasterDetail
});

const AppContainer = connect(mapStateToProps)(App);
export default AppContainer;
