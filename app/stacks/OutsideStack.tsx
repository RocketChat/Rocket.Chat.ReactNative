import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { connect } from 'react-redux';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
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
const Outside = createNativeStackNavigator<OutsideParamList>();
const _OutsideStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			{/* @ts-ignore */}
			<Outside.Screen name='NewServerView' component={NewServerView} options={NewServerView.navigationOptions} />
			<Outside.Screen name='WorkspaceView' component={WorkspaceView} />

			<Outside.Screen name='LoginView' component={LoginView} />
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
const OutsideModal = createNativeStackNavigator<OutsideModalParamList>();
const OutsideStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<OutsideModal.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), presentation: 'containedTransparentModal' }}>
			<OutsideModal.Screen name='OutsideStack' component={OutsideStack} options={{ headerShown: false }} />
			<OutsideModal.Screen name='AuthenticationWebView' component={AuthenticationWebView} />
		</OutsideModal.Navigator>
	);
};

export default OutsideStackModal;
