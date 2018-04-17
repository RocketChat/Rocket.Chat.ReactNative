import React from 'react';
import { TouchableOpacity } from 'react-native';
import { StackNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';

import ListServerView from '../../views/ListServerView';
import NewServerView from '../../views/NewServerView';
import LoginSignupView from '../../views/LoginSignupView';
import LoginView from '../../views/LoginView';
import RegisterView from '../../views/RegisterView';

import TermsServiceView from '../../views/TermsServiceView';
import PrivacyPolicyView from '../../views/PrivacyPolicyView';
import ForgotPasswordView from '../../views/ForgotPasswordView';

const MainStack = StackNavigator({
	ListServer: {
		screen: ListServerView,
		navigationOptions({ navigation }) {
			return {
				title: 'Servers',
				headerRight: (
					<TouchableOpacity
						onPress={() => navigation.navigate({ key: 'AddServer', routeName: 'AddServer' })}
						style={{ width: 50, alignItems: 'center' }}
						accessibilityLabel='Add server'
						accessibilityTraits='button'
					>
						<Icon name='plus' size={16} />
					</TouchableOpacity>
				)
			};
		}
	},
	AddServer: {
		screen: NewServerView,
		navigationOptions: {
			title: 'New server',
			headerTintColor: '#292E35'
		}
	},
	LoginSignup: {
		screen: LoginSignupView,
		navigationOptions: {
			header: null
		}
	}
}, {
	headerMode: 'screen'
});

const PublicRoutes = StackNavigator(
	{
		Main: {
			screen: MainStack
		},
		Login: {
			screen: LoginView,
			navigationOptions: {
				title: 'Login',
				headerTintColor: '#292E35'
			}
		},
		Register: {
			screen: RegisterView,
			navigationOptions: {
				title: 'Register',
				headerTintColor: '#292E35'
			}
		},
		TermsService: {
			screen: TermsServiceView,
			navigationOptions: {
				title: 'Terms of service',
				headerTintColor: '#292E35'
			}
		},
		PrivacyPolicy: {
			screen: PrivacyPolicyView,
			navigationOptions: {
				title: 'Privacy policy',
				headerTintColor: '#292E35'
			}
		},
		ForgotPassword: {
			screen: ForgotPasswordView,
			navigationOptions: {
				title: 'Forgot my password',
				headerTintColor: '#292E35'
			}
		}
	},
	{
		mode: 'modal',
		headerMode: 'none'
	}
);

export default PublicRoutes;
