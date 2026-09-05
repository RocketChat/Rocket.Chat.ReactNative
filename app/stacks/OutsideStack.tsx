import { useContext } from 'react';
import { createNativeStackNavigator, createNativeStackScreen } from '@react-navigation/native-stack';
import { type StaticParamList } from '@react-navigation/native';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';
//test
const Outside = createNativeStackNavigator({
	screens: {
		NewServerView: createNativeStackScreen({ screen: NewServerView, options: defaultHeader }),
		WorkspaceView: createNativeStackScreen({ screen: WorkspaceView, options: defaultHeader }),
		LoginView: createNativeStackScreen({ screen: LoginView, options: defaultHeader }),
		ForgotPasswordView: createNativeStackScreen({ screen: ForgotPasswordView, options: defaultHeader }),
		SendEmailConfirmationView: createNativeStackScreen({ screen: SendEmailConfirmationView, options: defaultHeader }),
		RegisterView: createNativeStackScreen({ screen: RegisterView, options: defaultHeader }),
		LegalView: createNativeStackScreen({ screen: LegalView, options: defaultHeader })
	}
}).with(({ Navigator }) => {
	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

export type OutsideParamList = StaticParamList<typeof Outside>;

const OutsideModal = createNativeStackNavigator({
	screenOptions: { presentation: 'containedTransparentModal' },
	screens: {
		OutsideStack: createNativeStackScreen({
			screen: Outside,
			options: { headerShown: false, ...defaultHeader }
		}),
		AuthenticationWebView: createNativeStackScreen({ screen: AuthenticationWebView, options: defaultHeader })
	}
}).with(({ Navigator }) => {
	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

export type OutsideModalParamList = StaticParamList<typeof OutsideModal>;

export default OutsideModal;
