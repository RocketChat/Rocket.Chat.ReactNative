import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { connect } from 'react-redux';

import { ThemeContext } from '../theme';
import { ModalAnimation, StackAnimation, defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
// Outside Stack
import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';
import { OutsideModalParamList, OutsideParamList } from './types';

// Outside
const Outside = createStackNavigator<OutsideParamList>();
const _OutsideStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}>
			{/* @ts-ignore */}
			<Outside.Screen name='NewServerView' component={NewServerView} options={NewServerView.navigationOptions} />
			<Outside.Screen name='WorkspaceView' component={WorkspaceView} />
			{/* @ts-ignore */}
			<Outside.Screen name='LoginView' component={LoginView} options={LoginView.navigationOptions} />
			<Outside.Screen name='ForgotPasswordView' component={ForgotPasswordView} />
			{/* @ts-ignore */}
			<Outside.Screen name='SendEmailConfirmationView' component={SendEmailConfirmationView} />
			{/* @ts-ignore */}
			<Outside.Screen name='RegisterView' component={RegisterView} options={RegisterView.navigationOptions} />
			{/* @ts-ignore */}
			<Outside.Screen name='LegalView' component={LegalView} />
		</Outside.Navigator>
	);
};

const mapStateToProps = (state: any) => ({
	root: state.app.root
});

const OutsideStack = connect(mapStateToProps)(_OutsideStack);

// OutsideStackModal
const OutsideModal = createStackNavigator<OutsideModalParamList>();
const OutsideStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<OutsideModal.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...ModalAnimation, presentation: 'transparentModal' }}
		>
			<OutsideModal.Screen name='OutsideStack' component={OutsideStack} options={{ headerShown: false }} />
			<OutsideModal.Screen
				name='AuthenticationWebView'
				component={AuthenticationWebView}
				options={AuthenticationWebView.navigationOptions}
			/>
		</OutsideModal.Navigator>
	);
};

export default OutsideStackModal;
