import React from 'react';
import PropTypes from 'prop-types';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { connect } from 'react-redux';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { defaultHeader, onNavigationStateChange } from './utils/navigation';
import Navigation from './lib/Navigation';

// Stacks
import AuthLoadingView from './views/AuthLoadingView';

// SetUsername Stack
import SetUsernameView from './views/SetUsernameView';

import OutsideStack from './stacks/OutsideStack';
import InsideStack from './stacks/InsideStack';

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
const App = React.memo(({ root }) => {
	if (!root || root === 'background') {
		return null;
	}

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics}>
			<NavigationContainer
				ref={(navigatorRef) => {
					Navigation.setTopLevelNavigator(navigatorRef);
				}}
				onNavigationStateChange={onNavigationStateChange}
			>
				<Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
					<>
						{root === 'loading' ? (
							<Stack.Screen
								name='AuthLoading'
								component={AuthLoadingView}
							/>
						) : null}
						{root === 'outside' || root === 'newServer' ? (
							<Stack.Screen
								name='OutsideStack'
								component={OutsideStack}
							/>
						) : null}
						{root === 'inside' ? (
							<Stack.Screen
								name='InsideStack'
								component={InsideStack}
							/>
						) : null}
						{root === 'setUsername' ? (
							<Stack.Screen
								name='SetUsernameStack'
								component={SetUsernameStack}
							/>
						) : null}
					</>
				</Stack.Navigator>
			</NavigationContainer>
		</SafeAreaProvider>
	);
});
const mapStateToProps = state => ({
	root: state.app.root
});

App.propTypes = {
	root: PropTypes.string
};

const AppContainer = connect(mapStateToProps)(App);
export default AppContainer;
