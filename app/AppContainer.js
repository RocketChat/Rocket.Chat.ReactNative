import React from 'react';
import PropTypes from 'prop-types';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { connect } from 'react-redux';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import Navigation from './lib/Navigation';
import { defaultHeader, getActiveRouteName } from './utils/navigation';
import {
	ROOT_LOADING, ROOT_OUTSIDE, ROOT_NEW_SERVER, ROOT_INSIDE, ROOT_SET_USERNAME, ROOT_BACKGROUND
} from './actions/app';
import ActionSheetProvider from './actionSheet';

// Stacks
import AuthLoadingView from './views/AuthLoadingView';

// SetUsername Stack
import SetUsernameView from './views/SetUsernameView';

import OutsideStack from './stacks/OutsideStack';
import InsideStack from './stacks/InsideStack';
import MasterDetailStack from './stacks/MasterDetailStack';
import { ThemeContext } from './theme';
import { themes } from './constants/colors';
import { setCurrentScreen } from './utils/log';

// SetUsernameStack
const SetUsername = createStackNavigator();
const SetUsernameStack = () => (
	<SetUsername.Navigator screenOptions={defaultHeader}>
		<SetUsername.Screen
			name='SetUsernameView'
			component={SetUsernameView}
		/>
	</SetUsername.Navigator>
);

// App
const Stack = createStackNavigator();
const App = React.memo(({ root, isMasterDetail }) => {
	if (!root || root === ROOT_BACKGROUND) {
		return null;
	}

	const { theme } = React.useContext(ThemeContext);
	const defaultNavTheme = theme === 'light' ? DefaultTheme : DarkTheme;

	const navigationTheme = {
		...defaultNavTheme,
		colors: {
			...defaultNavTheme.colors,
			background: 'transparent',
			border: themes[theme].borderColor
		}
	};

	React.useEffect(() => {
		const state = Navigation.navigationRef.current.getRootState();
		const currentRouteName = getActiveRouteName(state);
		Navigation.routeNameRef.current = currentRouteName;
		setCurrentScreen(currentRouteName);
	}, []);

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics}>
			<ActionSheetProvider>
				<NavigationContainer
					theme={navigationTheme}
					ref={Navigation.navigationRef}
					onStateChange={(state) => {
						const previousRouteName = Navigation.routeNameRef.current;
						const currentRouteName = getActiveRouteName(state);
						if (previousRouteName !== currentRouteName) {
							setCurrentScreen(currentRouteName);
						}
						Navigation.routeNameRef.current = currentRouteName;
					}}
				>
					<Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
						<>
							{root === ROOT_LOADING ? (
								<Stack.Screen
									name='AuthLoading'
									component={AuthLoadingView}
								/>
							) : null}
							{root === ROOT_OUTSIDE || root === ROOT_NEW_SERVER ? (
								<Stack.Screen
									name='OutsideStack'
									component={OutsideStack}
								/>
							) : null}
							{root === ROOT_INSIDE && isMasterDetail ? (
								<Stack.Screen
									name='MasterDetailStack'
									component={MasterDetailStack}
								/>
							) : null}
							{root === ROOT_INSIDE && !isMasterDetail ? (
								<Stack.Screen
									name='InsideStack'
									component={InsideStack}
								/>
							) : null}
							{root === ROOT_SET_USERNAME ? (
								<Stack.Screen
									name='SetUsernameStack'
									component={SetUsernameStack}
								/>
							) : null}
						</>
					</Stack.Navigator>
				</NavigationContainer>
			</ActionSheetProvider>
		</SafeAreaProvider>
	);
});
const mapStateToProps = state => ({
	root: state.app.root,
	isMasterDetail: state.app.isMasterDetail
});

App.propTypes = {
	root: PropTypes.string,
	isMasterDetail: PropTypes.bool
};

const AppContainer = connect(mapStateToProps)(App);
export default AppContainer;
