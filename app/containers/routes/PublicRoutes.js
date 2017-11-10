import React from 'react';
import { TouchableOpacity } from 'react-native';
import { StackNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';

import ListServerView from '../../views/ListServerView';
import NewServerView from '../../views/NewServerView';
import LoginView from '../../views/LoginView';
import RegisterView from '../../views/RegisterView';

import TermsServiceView from '../../views/TermsServiceView';
import PrivacyPolicyView from '../../views/PrivacyPolicyView';
import ForgotPasswordView from '../../views/ForgotPasswordView';

const PublicRoutes = StackNavigator(
	{
		ListServer: {
			screen: ListServerView,
			navigationOptions({ navigation }) {
				return {
					title: 'Servers',
					headerRight: (
						<TouchableOpacity
							onPress={() => navigation.navigate('AddServer')}
							style={{ width: 50, alignItems: 'center' }}
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
				title: 'New server'
			}
		},
		Login: {
			screen: LoginView,
			navigationOptions: {
				title: 'Login'
			}
		},
		Register: {
			screen: RegisterView,
			navigationOptions: {
				title: 'Register'
			}
		},
		TermsService: {
			screen: TermsServiceView,
			navigationOptions: {
				title: 'Terms of service'
			}
		},
		PrivacyPolicy: {
			screen: PrivacyPolicyView,
			navigationOptions: {
				title: 'Privacy policy'
			}
		},
		ForgotPassword: {
			screen: ForgotPasswordView,
			navigationOptions: {
				title: 'Forgot my password'
			}
		}
	},
	{

	}
);

export default PublicRoutes;
