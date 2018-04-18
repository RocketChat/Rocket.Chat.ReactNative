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
import database from '../../lib/realm';

const hasServers = () => {
	const db = database.databases.serversDB.objects('servers');
	return db.length > 0;
};

const ServerStack = StackNavigator({
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

const LoginStack = StackNavigator({
	Login: {
		screen: LoginView,
		navigationOptions: {
			header: null
		}
	},
	ForgotPassword: {
		screen: ForgotPasswordView,
		navigationOptions: {
			title: 'Forgot my password',
			headerTintColor: '#292E35'
		}
	}
}, {
	headerMode: 'screen'
});

const RegisterStack = StackNavigator({
	Register: {
		screen: RegisterView,
		navigationOptions: {
			header: null
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
	}
}, {
	headerMode: 'screen'
});

const PublicRoutes = StackNavigator(
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
