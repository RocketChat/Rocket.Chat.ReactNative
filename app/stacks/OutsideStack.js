import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { defaultHeader, themedHeader } from '../utils/navigation';

// Outside Stack
import OnboardingView from '../views/OnboardingView';
import NewServerView from '../views/NewServerView';
import LoginSignupView from '../views/LoginSignupView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';

// Outside
const Outside = createStackNavigator();
const OutsideStack = () => (
	<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader('light') }}>
		<Outside.Screen
			name='OnboardingView'
			component={OnboardingView}
			options={{ headerShown: false }}
		/>
		<Outside.Screen
			name='NewServerView'
			component={NewServerView}
			options={{ headerShown: false }}
		/>
		<Outside.Screen
			name='LoginSignupView'
			component={LoginSignupView}
			options={LoginSignupView.navigationOptions}
		/>
		<Outside.Screen
			name='LoginView'
			component={LoginView}
			options={LoginView.navigationOptions}
		/>
		<Outside.Screen
			name='ForgotPasswordView'
			component={ForgotPasswordView}
			options={ForgotPasswordView.navigationOptions}
		/>
		<Outside.Screen
			name='RegisterView'
			component={RegisterView}
			options={RegisterView.navigationOptions}
		/>
		<Outside.Screen
			name='LegalView'
			component={LegalView}
			options={LegalView.navigationOptions}
		/>
	</Outside.Navigator>
);

// OutsideStackModal
const OutsideModal = createStackNavigator();
const OutsideStackModal = () => (
	<OutsideModal.Navigator mode='modal' screenOptions={{ ...defaultHeader, headerShown: false, ...themedHeader('light') }}>
		<OutsideModal.Screen
			name='OutsideStack'
			component={OutsideStack}
		/>
		<OutsideModal.Screen
			name='AuthenticationWebView'
			component={AuthenticationWebView}
			options={AuthenticationWebView.navigationOptions}
		/>
	</OutsideModal.Navigator>
);

export default OutsideStackModal;
