import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

import realm from '../lib/realm';
import { connect } from '../lib/meteor';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch'
	},
	input: {
		height: 40,
		borderColor: '#aaa',
		margin: 20,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f8f8f8'
	},
	text: {
		textAlign: 'center',
		color: '#888'
	}
});

export default class NewServerView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = () => ({
		title: 'New Server Connection'
	});

	constructor(props) {
		super(props);
		this.state = {
			defaultServer: 'https://demo.rocket.chat',
			text: ''
		};

		const { navigate } = this.props.navigation;

		this.submit = () => {
			let url = this.state.text.trim();
			if (!url) {
				url = this.state.defaultServer;
			}

			// TODO: validate URL
			if (url.indexOf('.') === -1) {
				url = `https://${ url }.rocket.chat`;
			}

			if (/^https?:\/\//.test(url) === false) {
				url = `https://${ url }`;
			}

			realm.write(() => {
				realm.objects('servers').filtered('current = true').forEach(item => (item.current = false));
				realm.create('servers', { id: url, current: true }, true);
			});

			connect(() => {
				navigate('ListServer', { newServer: url });
			});
		};
	}

	render() {
		return (
			<KeyboardAvoidingView style={styles.view} behavior={Platform.OS === 'ios' && 'padding'}>
				<TextInput
					style={styles.input}
					onChangeText={text => this.setState({ text })}
					keyboardType='url'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					autoFocus
					onSubmitEditing={this.submit}
					placeholder={this.state.defaultServer}
				/>
			</KeyboardAvoidingView>
		);
	}
}
