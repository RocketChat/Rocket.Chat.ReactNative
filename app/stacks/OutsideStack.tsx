import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Image, View } from 'react-native';
import { connect } from 'react-redux';

import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import { ThemeContext } from '../theme';
// Outside Stack
import AuthenticationWebView from '../views/AuthenticationWebView';
import ForgotPasswordView from '../views/ForgotPasswordView';
import LegalView from '../views/LegalView';
import LoginView from '../views/LoginView';
import NewServerView from '../views/NewServerView';
import RegisterView from '../views/RegisterView';
import SendEmailConfirmationView from '../views/SendEmailConfirmationView';
import WorkspaceView from '../views/WorkspaceView';
import { type OutsideModalParamList, type OutsideParamList } from './types';

// Outside
const Outside = createNativeStackNavigator<OutsideParamList>();
export const RocketChat = 'rocketchat.golftec.com';
const OutsideStackComponent = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);

	return (
		<View
			style={{
				flex: 1,
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 9999,
				backgroundColor: '#1D74F5',
				justifyContent: 'center',
				alignItems: 'center',
				display: 'flex'
			}}>
			<Outside.Navigator screenOptions={themedHeader(theme)}>
				{/* @ts-ignore */}
				<Outside.Screen name='NewServerView' component={NewServerView} options={NewServerView.navigationOptions} />
				<Outside.Screen name='WorkspaceView' component={WorkspaceView} options={{ headerShown: false, ...defaultHeader }} />

				<Outside.Screen name='LoginView' component={LoginView} options={{ headerShown: false, ...defaultHeader }} />
				<Outside.Screen name='ForgotPasswordView' component={ForgotPasswordView} options={defaultHeader} />
				<Outside.Screen name='SendEmailConfirmationView' component={SendEmailConfirmationView} options={defaultHeader} />
				{/* @ts-ignore */}
				<Outside.Screen name='RegisterView' component={RegisterView} options={defaultHeader} />
				{/* @ts-ignore */}
				<Outside.Screen name='LegalView' component={LegalView} options={defaultHeader} />
			</Outside.Navigator>
			<Image
				source={require('../../android/app/src/experimental/res/drawable-xxxhdpi/bootsplash_logo.png')}
				style={{ width: 300, height: 300, position: 'absolute' }}
				resizeMode='contain'
			/>
		</View>
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
			<OutsideModal.Screen
				name='AuthenticationWebView'
				component={AuthenticationWebView}
				options={{ headerShown: false, ...defaultHeader }}
			/>
		</OutsideModal.Navigator>
	);
};

export default OutsideStackModal;
