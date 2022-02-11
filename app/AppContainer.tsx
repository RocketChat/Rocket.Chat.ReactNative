import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { connect } from 'react-redux';

import { SetUsernameStackParamList, StackParamList } from './definitions/navigationTypes';
import Navigation from './lib/Navigation';
import { defaultHeader, getActiveRouteName, navigationTheme } from './utils/navigation';
import { RootEnum } from './definitions';
// Stacks
import AuthLoadingView from './views/AuthLoadingView';
// SetUsername Stack
import SetUsernameView from './views/SetUsernameView';
import OutsideStack from './stacks/OutsideStack';
import InsideStack from './stacks/InsideStack';
import MasterDetailStack from './stacks/MasterDetailStack';
import { ThemeContext } from './theme';
import { setCurrentScreen } from './utils/log';

// SetUsernameStack
const SetUsername = createStackNavigator<SetUsernameStackParamList>();
const SetUsernameStack = () => (
	<SetUsername.Navigator screenOptions={defaultHeader}>
		<SetUsername.Screen name='SetUsernameView' component={SetUsernameView} />
	</SetUsername.Navigator>
);

// App
const Stack = createStackNavigator<StackParamList>();
const App = React.memo(({ root, isMasterDetail }: { root: string; isMasterDetail: boolean }) => {
	if (!root) {
		return null;
	}

	const { theme } = React.useContext(ThemeContext);
	const navTheme = navigationTheme(theme);

	React.useEffect(() => {
		const state = Navigation.navigationRef.current?.getRootState();
		const currentRouteName = getActiveRouteName(state);
		Navigation.routeNameRef.current = currentRouteName;
		setCurrentScreen(currentRouteName);
	}, []);

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
			<Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
				<>
					{root === RootEnum.ROOT_LOADING ? <Stack.Screen name='AuthLoading' component={AuthLoadingView} /> : null}
					{root === RootEnum.ROOT_OUTSIDE ? <Stack.Screen name='OutsideStack' component={OutsideStack} /> : null}
					{root === RootEnum.ROOT_INSIDE && isMasterDetail ? (
						<Stack.Screen name='MasterDetailStack' component={MasterDetailStack} />
					) : null}
					{root === RootEnum.ROOT_INSIDE && !isMasterDetail ? <Stack.Screen name='InsideStack' component={InsideStack} /> : null}
					{root === RootEnum.ROOT_SET_USERNAME ? <Stack.Screen name='SetUsernameStack' component={SetUsernameStack} /> : null}
				</>
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
