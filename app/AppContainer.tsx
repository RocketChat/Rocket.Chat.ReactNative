import React, { useContext, memo, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { connect } from 'react-redux';

import { SetUsernameStackParamList, StackParamList } from './definitions/navigationTypes';
import Navigation from './lib/navigation/appNavigation';
import { defaultHeader, getActiveRouteName, navigationTheme } from './lib/methods/helpers/navigation';
import { RootEnum } from './definitions';
// Stacks
import AuthLoadingView from './views/AuthLoadingView';
// SetUsername Stack
import SetUsernameView from './views/SetUsernameView';
import OutsideStack from './stacks/OutsideStack';
import InsideStack from './stacks/InsideStack';
import MasterDetailStack from './stacks/MasterDetailStack';
import ShareExtensionStack from './stacks/ShareExtensionStack';
import { ThemeContext } from './theme';
import { setCurrentScreen } from './lib/methods/helpers/log';
import { themes } from './lib/constants';

const createStackNavigator = createNativeStackNavigator;

// SetUsernameStack
const SetUsername = createStackNavigator<SetUsernameStackParamList>();
const SetUsernameStack = () => (
	<SetUsername.Navigator screenOptions={defaultHeader}>
		<SetUsername.Screen name='SetUsernameView' component={SetUsernameView} />
	</SetUsername.Navigator>
);

// App
const Stack = createStackNavigator<StackParamList>();
const App = memo(({ root, isMasterDetail }: { root: string; isMasterDetail: boolean }) => {
	const { theme } = useContext(ThemeContext);
	useEffect(() => {
		if (root) {
			const state = Navigation.navigationRef.current?.getRootState();
			const currentRouteName = getActiveRouteName(state);
			Navigation.routeNameRef.current = currentRouteName;
			setCurrentScreen(currentRouteName);
		}
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
					setCurrentScreen(currentRouteName);
				}
				Navigation.routeNameRef.current = currentRouteName;
			}}>
			<Stack.Navigator screenOptions={{ headerShown: false, animation: 'none', navigationBarColor: themes[theme].surfaceLight }}>
				{root === RootEnum.ROOT_LOADING || root === RootEnum.ROOT_LOADING_SHARE_EXTENSION ? (
					<Stack.Screen name='AuthLoading' component={AuthLoadingView} />
				) : null}
				{root === RootEnum.ROOT_OUTSIDE ? <Stack.Screen name='OutsideStack' component={OutsideStack} /> : null}
				{root === RootEnum.ROOT_INSIDE && isMasterDetail ? (
					<Stack.Screen name='MasterDetailStack' component={MasterDetailStack} />
				) : null}
				{root === RootEnum.ROOT_INSIDE && !isMasterDetail ? <Stack.Screen name='InsideStack' component={InsideStack} /> : null}
				{root === RootEnum.ROOT_SET_USERNAME ? <Stack.Screen name='SetUsernameStack' component={SetUsernameStack} /> : null}
				{root === RootEnum.ROOT_SHARE_EXTENSION ? (
					<Stack.Screen name='ShareExtensionStack' component={ShareExtensionStack} />
				) : null}
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
