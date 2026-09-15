import { useContext } from 'react';
import { createNativeStackNavigator, createNativeStackScreen } from '@react-navigation/native-stack';
import { type StaticParamList } from '@react-navigation/native';

import { ThemeContext } from '../theme';
import { nativeHeader } from '../lib/methods/helpers/navigation';
import NewServerView from '../views/NewServerView';
import WorkspaceView from '../views/WorkspaceView';
import LoginView from '../views/LoginView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import RegisterView from '../views/RegisterView';
import LegalView from '../views/LegalView';
import AuthenticationWebView from '../views/AuthenticationWebView';

const Outside = createNativeStackNavigator({
	screens: {
		NewServerView: createNativeStackScreen({ screen: NewServerView }),
		WorkspaceView: createNativeStackScreen({ screen: WorkspaceView }),
		LoginView: createNativeStackScreen({ screen: LoginView }),
		ForgotPasswordView: createNativeStackScreen({ screen: ForgotPasswordView }),
		SendEmailConfirmationView: createNativeStackScreen({ screen: SendEmailConfirmationView }),
		RegisterView: createNativeStackScreen({ screen: RegisterView }),
		LegalView: createNativeStackScreen({ screen: LegalView })
	}
}).with(({ Navigator }) => {
	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={nativeHeader(theme)} />;
});

export type OutsideParamList = StaticParamList<typeof Outside>;

const OutsideModal = createNativeStackNavigator({
	screenOptions: { presentation: 'containedTransparentModal' },
	screens: {
		OutsideStack: createNativeStackScreen({
			screen: Outside,
			options: { headerShown: false }
		}),
		AuthenticationWebView: createNativeStackScreen({ screen: AuthenticationWebView })
	}
}).with(({ Navigator }) => {
	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={nativeHeader(theme)} />;
});

export type OutsideModalParamList = StaticParamList<typeof OutsideModal>;

export default OutsideModal;
