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
import { AICreateImageParamList} from './types';
import AICreateImageView from '../views/AICreateImageView';
const AICreateImage= createStackNavigator<AICreateImageParamList>();
const _AICreateImageStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<AICreateImage.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}>
			<AICreateImage.Screen name='AICreateImageMainView' component={AICreateImageView} />
		</AICreateImage.Navigator>
	);
};

const mapStateToProps = (state: any) => ({

});

const AICreateImageStack = connect(mapStateToProps)(_AICreateImageStack);

export default AICreateImageStack;
