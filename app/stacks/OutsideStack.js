import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../utils/navigation';

// Outside Stack
import OnboardingView from '../views/OnboardingView';
import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';

// Outside
const Outside = createStackNavigator();
const OutsideStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<Outside.Screen
				name='OnboardingView'
				component={OnboardingView}
				// options={{ headerShown: false }}
			/>
			<Outside.Screen
				name='NewServerView'
				component={NewServerView}
				// options={{ headerShown: false }}
			/>
			<Outside.Screen
				name='WorkspaceView'
				component={WorkspaceView}
				// options={WorkspaceView.navigationOptions}
			/>
			<Outside.Screen
				name='LoginView'
				component={LoginView}
				// options={LoginView.navigationOptions}
			/>
			<Outside.Screen
				name='ForgotPasswordView'
				component={ForgotPasswordView}
				// options={ForgotPasswordView.navigationOptions}
			/>
			<Outside.Screen
				name='RegisterView'
				component={RegisterView}
				// options={RegisterView.navigationOptions}
			/>
			<Outside.Screen
				name='LegalView'
				component={LegalView}
				// options={LegalView.navigationOptions}
			/>
		</Outside.Navigator>
	);
};

// OutsideStackModal
const OutsideModal = createStackNavigator();
const OutsideStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<OutsideModal.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<OutsideModal.Screen
				name='OutsideStack'
				component={OutsideStack}
				options={{ headerShown: false }}
			/>
			<OutsideModal.Screen
				name='AuthenticationWebView'
				component={AuthenticationWebView}
				options={AuthenticationWebView.navigationOptions}
			/>
		</OutsideModal.Navigator>
	);
};

export default OutsideStackModal;
