import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';

import ListServerView from '../../views/ListServerView';
import NewServerView from '../../views/NewServerView';
import LoginSignupView from '../../views/LoginSignupView';
import LoginView from '../../views/LoginView';
import RegisterView from '../../views/RegisterView';

import TermsServiceView from '../../views/TermsServiceView';
import PrivacyPolicyView from '../../views/PrivacyPolicyView';
import ForgotPasswordView from '../../views/ForgotPasswordView';
import database from '../../lib/realm';
import I18n from '../../i18n';

const hasServers = () => {
	const db = database.databases.serversDB.objects('servers');
	return db.length > 0;
};

const ServerStack = createStackNavigator({
	ListServer: {
		screen: ListServerView,
		navigationOptions({ navigation }) {
			return {
				title: I18n.t('Servers'),
				headerRight: (
					<TouchableOpacity
						onPress={() => navigation.navigate({ key: 'AddServer', routeName: 'AddServer' })}
						style={{ width: 50, alignItems: 'center' }}
						accessibilityLabel={I18n.t('Add_Server')}
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
			header: null
		}
	},
	LoginSignup: {
		screen: LoginSignupView,
		navigationOptions: {
			header: null
		}
	}
}, {
	headerMode: 'screen',
	initialRouteName: hasServers() ? 'ListServer' : 'AddServer'
});

const LoginStack = createStackNavigator({
	Login: {
		screen: LoginView,
		navigationOptions: {
			header: null
		}
	},
	ForgotPassword: {
		screen: ForgotPasswordView,
		navigationOptions: {
			title: I18n.t('Forgot_my_password'),
			headerTintColor: '#292E35'
		}
	}
}, {
	headerMode: 'screen'
});

const RegisterStack = createStackNavigator({
	Register: {
		screen: RegisterView,
		navigationOptions: {
			header: null
		}
	},
	TermsService: {
		screen: TermsServiceView,
		navigationOptions: {
			title: I18n.t('Terms_of_Service'),
			headerTintColor: '#292E35'
		}
	},
	PrivacyPolicy: {
		screen: PrivacyPolicyView,
		navigationOptions: {
			title: I18n.t('Privacy_Policy'),
			headerTintColor: '#292E35'
		}
	}
}, {
	headerMode: 'screen'
});

const PublicRoutes = createStackNavigator(
	{
		Server: {
			screen: ServerStack
		},
		Login: {
			screen: LoginStack
		},
		Register: {
			screen: RegisterStack
		}
	},
	{
		mode: 'modal',
		headerMode: 'none'
	}
);

export default PublicRoutes;
