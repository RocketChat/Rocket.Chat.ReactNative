import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet } from 'react-native';
import realm from './realm';
import { loginWithPassword } from './meteor';


const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch'
	},
	input: {
		height: 40,
		// flex: 1,
		borderColor: '#aaa',
		marginLeft: 20,
		marginRight: 20,
		marginTop: 10,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f6f6f6'
	}
});

export default class LoginView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = () => ({
		title: realm.objectForPrimaryKey('settings', 'Site_Name').value
	});

	constructor(props) {
		super(props);

		this.state = {
			username: 'rodrigo',
			password: 'rodrigo'
		};

		const { navigate } = this.props.navigation;

		this.submit = () => {
			loginWithPassword({ username: this.state.username }, this.state.password, () => {
				navigate('Rooms');
			});

			// let url = this.state.text.trim();
			// if (!url) {
			// 	url = defaultServer;
			// }

			// // TODO: validate URL

			// realm.write(() => {
			// 	realm.objects('servers').filtered('current = true').forEach(item => item.current = false);
			// 	realm.create('servers', {id: url, current: true}, true);
			// });

			// navigate('Login');
		};
	}

	render() {
		return (
			<View style={styles.view}>
				<TextInput
					style={styles.input}
					onChangeText={username => this.setState({ username })}
					keyboardType='email-address'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					autoFocus
					onSubmitEditing={this.submit}
					placeholder='Email or username'
				/>
				<TextInput
					style={styles.input}
					onChangeText={password => this.setState({ password })}
					secureTextEntry
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					placeholder='Password'
				/>
			</View>
		);
	}
}

// export class LoginView extends React.Component {
// 	renderRow(setting) {
// 		return (
// 			<Text>{setting._id}</Text>
// 		);
// 	}

// 	constructor(props) {
// 		super(props);
// 		connect();
// 		const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

// 		const getState = () => {
// 			return {
// 				dataSource: ds.cloneWithRows(realm.objects('settings'))
// 			};
// 		};

// 		realm.addListener('change', () => this.setState(getState()));

// 		this.state = getState();
// 	}

// 	render() {
// 		return (
// 			<View>
// 				<Text>Title</Text>
// 				<ListView
// 					dataSource={this.state.dataSource}
// 					renderRow={this.renderRow}
// 				/>
// 			</View>
// 		);
// 	}
// }
