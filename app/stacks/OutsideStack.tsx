import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { connect } from 'react-redux';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
// Outside Stack
// import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';
import { type OutsideModalParamList, type OutsideParamList } from './types';

// Outside
const Outside = createNativeStackNavigator<OutsideParamList>();
const OutsideStackComponent = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={themedHeader(theme)}>
			{/* @ts-ignore */}
			{/* <Outside.Screen name='NewServerView' component={NewServerView} options={NewServerView.navigationOptions} /> */}
			<Outside.Screen name='WorkspaceView' component={WorkspaceView} options={defaultHeader} />

			<Outside.Screen name='LoginView' component={LoginView} options={defaultHeader} />
			<Outside.Screen name='ForgotPasswordView' component={ForgotPasswordView} options={defaultHeader} />
			<Outside.Screen name='SendEmailConfirmationView' component={SendEmailConfirmationView} options={defaultHeader} />
			{/* @ts-ignore */}
			<Outside.Screen name='RegisterView' component={RegisterView} options={defaultHeader} />
			{/* @ts-ignore */}
			<Outside.Screen name='LegalView' component={LegalView} options={defaultHeader} />
		</Outside.Navigator>
	);
};

const mapStateToProps = (state: any) => ({
	root: state.app.root
});

const OutsideStack = connect(mapStateToProps)(OutsideStackComponent);

// OutsideStackModal
const OutsideModal = createNativeStackNavigator<OutsideModalParamList>();
const OutsideStackModal = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);

	return (
		<OutsideModal.Navigator screenOptions={{ ...themedHeader(theme), presentation: 'containedTransparentModal' }}>
			<OutsideModal.Screen name='OutsideStack' component={OutsideStack} options={{ headerShown: false, ...defaultHeader }} />
			<OutsideModal.Screen name='AuthenticationWebView' component={AuthenticationWebView} options={defaultHeader} />
		</OutsideModal.Navigator>
	);
};

export default OutsideStackModal;
