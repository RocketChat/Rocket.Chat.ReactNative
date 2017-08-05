import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet } from 'react-native';
import realm from './realm';
import { connect } from './meteor';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	input: {
		height: 40,
		flex: 1,
		borderColor: '#aaa',
		margin: 20,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f8f8f8'
	}
});

const defaultServer = 'http://localhost:3000';

export default class NewServerView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		this.state = {
			text: ''
		};

		const { navigate } = this.props.navigation;

		this.submit = () => {
			let url = this.state.text.trim();
			if (!url) {
				url = defaultServer;
			}

			// TODO: validate URL

			realm.write(() => {
				realm.objects('servers').filtered('current = true').forEach(item => (item.current = false));
				realm.create('servers', { id: url, current: true }, true);
			});

			connect(() => {
				console.log('Site_Name', realm.objectForPrimaryKey('settings', 'Site_Name'));
				navigate('Login');
			});
		};
	}

	render() {
		return (
			<View style={styles.view}>
				<TextInput
					style={styles.input}
					onChangeText={text => this.setState({ text })}
					keyboardType='url'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					autoFocus
					onSubmitEditing={this.submit}
					placeholder={defaultServer}
				/>
			</View>
		);
	}
}

