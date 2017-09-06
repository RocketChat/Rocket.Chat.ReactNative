import React from 'react';
import { Button } from 'react-native';
import { StackNavigator } from 'react-navigation';

import ListServerView from '../../views/ListServerView';
import NewServerView from '../../views/NewServerView';
import LoginView from '../../views/LoginView';

const PublicRoutes = StackNavigator(
	{
		ListServer: {
			screen: ListServerView,
			navigationOptions({ navigation }) {
				return {
					title: 'Servers',
					headerRight: (
						<Button
							title='Add'
							onPress={() => navigation.navigate('AddServer')}
						/>
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
		}
	},
	{

	}
);

export default PublicRoutes;
