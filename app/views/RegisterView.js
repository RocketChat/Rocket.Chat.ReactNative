import React from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-native-loading-spinner-overlay';
import { Keyboard, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as loginActions from '../actions/login';
import TextInput from '../containers/TextInput';
import KeyboardView from '../presentation/KeyboardView';
import styles from './Styles';
import { showToast } from '../utils/info';
import CloseModalButton from '../containers/CloseModalButton';

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

	valid() {
		const {
			name, email, password, confirmPassword
		} = this.state;
		return name.trim() && email.trim() &&
			password && confirmPassword && password === confirmPassword;
	}
	invalidEmail() {
		return this.props.login.failure && /Email/.test(this.props.login.error.reason) ? this.props.login.error : {};
	}
	submit = () => {
		const {
			name, email, password, code
		} = this.state;
		if (!this.valid()) {
			showToast('Some field is invalid or empty');
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
			showToast('Username is empty');
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
			<View>
				<TextInput
					inputRef={(e) => { this.name = e; }}
					label={this.props.Accounts_NamePlaceholder || 'Name'}
					placeholder={this.props.Accounts_NamePlaceholder || 'Name'}
					returnKeyType='next'
					onChangeText={name => this.setState({ name })}
					onSubmitEditing={() => { this.email.focus(); }}
				/>
				<TextInput
					inputRef={(e) => { this.email = e; }}
					label={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email'}
					placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email'}
					returnKeyType='next'
					keyboardType='email-address'
					onChangeText={email => this.setState({ email })}
					onSubmitEditing={() => { this.password.focus(); }}
					error={this.invalidEmail()}
				/>
				<TextInput
					inputRef={(e) => { this.password = e; }}
					label={this.props.Accounts_PasswordPlaceholder || 'Password'}
					placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
					returnKeyType='next'
					secureTextEntry
					onChangeText={password => this.setState({ password })}
					onSubmitEditing={() => { this.confirmPassword.focus(); }}
				/>
				<TextInput
					inputRef={(e) => { this.confirmPassword = e; }}
					inputStyle={
						this.state.password &&
						this.state.confirmPassword &&
						this.state.confirmPassword !== this.state.password ? { borderColor: 'red' } : {}
					}
					label={this.props.Accounts_RepeatPasswordPlaceholder || 'Repeat Password'}
					placeholder={this.props.Accounts_RepeatPasswordPlaceholder || 'Repeat Password'}
					returnKeyType='done'
					secureTextEntry
					onChangeText={confirmPassword => this.setState({ confirmPassword })}
					onSubmitEditing={this.submit}
				/>

				<TouchableOpacity
					style={[styles.buttonContainer, styles.registerContainer]}
					onPress={this.submit}
				>
					<Text
						style={[styles.button, this.valid() ? {}
							: { color: placeholderTextColor }
						]}
						accessibilityTraits='button'
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
			<View>
				<TextInput
					inputRef={(e) => { this.username = e; }}
					label={this.props.Accounts_UsernamePlaceholder || 'Username'}
					placeholder={this.props.Accounts_UsernamePlaceholder || 'Username'}
					returnKeyType='done'
					onChangeText={username => this.setState({ username })}
					onSubmitEditing={() => { this.usernameSubmit(); }}
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
						<CloseModalButton navigation={this.props.navigation} />
						<Text style={[styles.loginText, styles.loginTitle]}>Sign Up</Text>
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
