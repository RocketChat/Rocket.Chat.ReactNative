import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextInput, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as actions from '../actions';
import RocketChat from '../lib/rocketchat';
import KeyboardView from '../components/KeyboardView';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch',
		backgroundColor: '#fff'
	},
	input: {
		height: 40,
		borderColor: '#aaa',
		marginLeft: 20,
		marginRight: 20,
		marginTop: 10,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f6f6f6'
	},
	error: {
		textAlign: 'center',
		color: 'red',
		paddingTop: 5
	}
});

@connect(state => ({
	server: state.server,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder
}), dispatch => ({
	actions: bindActionCreators(actions, dispatch)
}))
export default class LoginView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		server: PropTypes.string.isRequired,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string
	}

	static navigationOptions = () => ({
		title: 'Login'
	});

	constructor(props) {
		super(props);

		this.state = {
			username: '',
			password: ''
		};

		this.props.navigator.setTitle({
			title: 'Login'
		});
	}

	componentWillReceiveProps(nextProps) {
		this.props.navigator.setSubTitle({
			subtitle: nextProps.server
		});
	}

	submit = () => {
		this.setState({
			error: undefined
		});

		const credentials = {
			username: this.state.username,
			password: this.state.password,
			code: this.state.code
		}

		RocketChat.loginWithPassword(credentials, (error) => {
			if (error) {
				if (error.error === 'totp-required') {
					this.setState({ totp: true });
					this.codeInput.focus();
				} else {
					this.setState({
						error: error.reason
					});
				}
			} else {
				this.props.navigator.dismissModal();
			}
		});
	}

	renderTOTP = () => {
		if (this.state.totp) {
			return (
				<TextInput
					ref={ref => this.codeInput = ref}
					style={styles.input}
					onChangeText={code => this.setState({ code })}
					keyboardType='numeric'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					placeholder='Code'
				/>
			);
		}
	}

	render() {
		return (
			<KeyboardView style={styles.view}>
				<TextInput
					style={styles.input}
					onChangeText={username => this.setState({ username })}
					keyboardType='email-address'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					autoFocus
					onSubmitEditing={this.submit}
					placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email or username'}
				/>
				<TextInput
					style={styles.input}
					onChangeText={password => this.setState({ password })}
					secureTextEntry
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
				/>
				{this.renderTOTP()}
				<Text style={styles.error}>{this.state.error}</Text>
			</KeyboardView>
		);
	}
}
