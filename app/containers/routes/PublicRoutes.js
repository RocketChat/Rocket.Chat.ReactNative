import React from 'react';
import { TouchableOpacity } from 'react-native';
import { StackNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';

import ListServerView from '../../views/ListServerView';
import NewServerView from '../../views/NewServerView';
import LoginView from '../../views/LoginView';
import RegisterView from '../../views/RegisterView';

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
		}
	},
	{

	}
);

export default PublicRoutes;
