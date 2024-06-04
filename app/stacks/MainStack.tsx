import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { connect } from 'react-redux';

import { ThemeContext } from '../theme';
import { ModalAnimation, StackAnimation, defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
// // Outside Stack
// import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import MainView from '../views/MainView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';
import { MainModalParamList, MainParamList, DrawerParamList} from './types';

const Main = createStackNavigator<MainParamList>();

const _MainStack = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<Main.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}>
			{/* @ts-ignore */}
			<Main.Screen name='MainView' component={MainView} />
		</Main.Navigator>
	);
};

const mapStateToProps = (state: any) => ({

});

const MainStack = connect(mapStateToProps)(_MainStack);

// MainStackModal
const MainModal = createStackNavigator<MainModalParamList>();
const MainStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<MainModal.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...ModalAnimation, presentation: 'transparentModal' }}
		>
			<MainModal.Screen name='MainStack' component={MainStack} options={{ headerShown: false }} />
		</MainModal.Navigator>
	);
};

export default MainStackModal;
