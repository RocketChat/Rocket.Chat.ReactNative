import React from 'react';

import Spinner from 'react-native-loading-spinner-overlay';

import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as loginActions from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';

import styles from './Styles';

const placeholderTextColor = 'rgba(255,255,255,.2)';

class RegisterView extends React.Component {
	static propTypes = {
		registerSubmit: PropTypes.func.isRequired,
		setUsernameSubmit: PropTypes.func,
		Accounts_UsernamePlaceholder: PropTypes.string,
		Accounts_NamePlaceholder: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_RepeatPasswordPlaceholder: PropTypes.string,
		login: PropTypes.object
	}

	constructor(props) {
		super(props);

		this.state = {
			name: '',
			email: '',
			password: '',
			confirmPassword: ''
		};
	}

	_valid() {
		const {
			name, email, password, confirmPassword
		} = this.state;
		return name.trim() && email.trim() &&
			password && confirmPassword && password === confirmPassword;
	}
	_invalidEmail() {
		return this.props.login.failure && /Email/.test(this.props.login.error.reason);
	}
	submit = () => {
		const {
			name, email, password, code
		} = this.state;
		if (!this._valid()) {
			return;
		}

		this.props.registerSubmit({
			name, email, pass: password, code
		});
		Keyboard.dismiss();
	}
	usernameSubmit = () => {
		const { username } = this.state;
		if (!username) {
			return;
		}

		this.props.setUsernameSubmit({ username });
		Keyboard.dismiss();
	}

	_renderRegister() {
		if (this.props.login.token) {
			return null;
		}
		return (
			<View style={styles.formContainer}>
				<TextInput
					ref={(e) => { this.name = e; }}
					style={styles.input_white}
					onChangeText={name => this.setState({ name })}
					autoCorrect={false}
					autoFocus
					returnKeyType='next'
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					onSubmitEditing={() => { this.email.focus(); }}
					placeholder={this.props.Accounts_NamePlaceholder || 'Name'}
				/>

				<TextInput
					ref={(e) => { this.email = e; }}
					style={[styles.input_white, this._invalidEmail() ? { borderColor: 'red' } : {}]}
					onChangeText={email => this.setState({ email })}
					keyboardType='email-address'
					autoCorrect={false}
					returnKeyType='next'
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					onSubmitEditing={() => { this.password.focus(); }}
					placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email'}
				/>
				<TextInput
					ref={(e) => { this.password = e; }}
					style={styles.input_white}
					onChangeText={password => this.setState({ password })}
					secureTextEntry
					autoCorrect={false}
					returnKeyType='next'
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					onSubmitEditing={() => { this.confirmPassword.focus(); }}
					placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
				/>
				<TextInput
					ref={(e) => { this.confirmPassword = e; }}
					style={[styles.input_white, this.state.password && this.state.confirmPassword && this.state.confirmPassword !== this.state.password ? { borderColor: 'red' } : {}]}
					onChangeText={confirmPassword => this.setState({ confirmPassword })}
					secureTextEntry
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					onSubmitEditing={this.submit}
					placeholder={this.props.Accounts_RepeatPasswordPlaceholder || 'Repeat Password'}
				/>

				<TouchableOpacity
					style={[styles.buttonContainer, styles.registerContainer]}
					onPress={this.submit}
				>
					<Text
						style={[styles.button, this._valid() ? {}
							: { color: placeholderTextColor }
						]}
					>REGISTER
					</Text>
				</TouchableOpacity>

				{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
			</View>
		);
	}

	_renderUsername() {
		if (!this.props.login.token) {
			return null;
		}
		return (
			<View style={styles.formContainer}>
				<TextInput
					ref={(e) => { this.username = e; }}
					style={styles.input_white}
					onChangeText={username => this.setState({ username })}
					autoCorrect={false}
					returnKeyType='next'
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					onSubmitEditing={() => { this.usernameSubmit(); }}
					placeholder={this.props.Accounts_UsernamePlaceholder || 'Username'}
				/>

				<TouchableOpacity
					style={[styles.buttonContainer, styles.registerContainer]}
					onPress={this.usernameSubmit}
				>
					<Text style={styles.button}>REGISTER</Text>
				</TouchableOpacity>

				{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
			</View>
		);
	}

	render() {
		return (
			<KeyboardView contentContainerStyle={styles.container}>
				<SafeAreaView>
					<View style={styles.loginView}>
						{this._renderRegister()}
						{this._renderUsername()}
						<Spinner visible={this.props.login.isFetching} textContent='Loading...' textStyle={{ color: '#FFF' }} />
					</View>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

function mapStateToProps(state) {
	return {
		server: state.server.server,
		Accounts_NamePlaceholder: state.settings.Accounts_NamePlaceholder,
		Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
		Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
		Accounts_RepeatPasswordPlaceholder: state.settings.Accounts_RepeatPasswordPlaceholder,
		login: state.login
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(loginActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RegisterView);
