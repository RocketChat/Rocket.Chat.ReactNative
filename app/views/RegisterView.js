import React from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { registerSubmit, setUsernameSubmit } from '../actions/login';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import Loading from '../containers/Loading';
import KeyboardView from '../presentation/KeyboardView';
import styles from './Styles';
import { showToast } from '../utils/info';
import CloseModalButton from '../containers/CloseModalButton';
import scrollPersistTaps from '../utils/scrollPersistTaps';

@connect(state => ({
	server: state.server.server,
	Accounts_NamePlaceholder: state.settings.Accounts_NamePlaceholder,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	Accounts_RepeatPasswordPlaceholder: state.settings.Accounts_RepeatPasswordPlaceholder,
	login: state.login
}), dispatch => ({
	registerSubmit: params => dispatch(registerSubmit(params)),
	setUsernameSubmit: params => dispatch(setUsernameSubmit(params))
}))
export default class RegisterView extends React.Component {
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

	state = {
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		username: ''
	};

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

	termsService = () => {
		this.props.navigation.navigate({ key: 'TermsService', routeName: 'TermsService' });
	}

	privacyPolicy = () => {
		this.props.navigation.navigate({ key: 'PrivacyPolicy', routeName: 'PrivacyPolicy' });
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
					iconLeft='account'
					onChangeText={name => this.setState({ name })}
					onSubmitEditing={() => { this.email.focus(); }}
				/>
				<TextInput
					inputRef={(e) => { this.email = e; }}
					label={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email'}
					placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email'}
					returnKeyType='next'
					keyboardType='email-address'
					iconLeft='email'
					onChangeText={email => this.setState({ email })}
					onSubmitEditing={() => { this.password.focus(); }}
					error={this.invalidEmail()}
				/>
				<TextInput
					inputRef={(e) => { this.password = e; }}
					label={this.props.Accounts_PasswordPlaceholder || 'Password'}
					placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
					returnKeyType='next'
					iconLeft='key-variant'
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
					iconLeft='key-variant'
					secureTextEntry
					onChangeText={confirmPassword => this.setState({ confirmPassword })}
					onSubmitEditing={this.submit}
				/>

				<View style={styles.alignItemsFlexStart}>
					<Text style={styles.loginTermsText}>
						By proceeding you are agreeing to our
						<Text style={styles.link} onPress={this.termsService}> Terms of Service </Text>
						and
						<Text style={styles.link} onPress={this.privacyPolicy}> Privacy Policy</Text>
					</Text>
					<Button
						title='Register'
						type='primary'
						onPress={this.submit}
					/>
				</View>

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
					iconLeft='at'
					onChangeText={username => this.setState({ username })}
					onSubmitEditing={() => { this.usernameSubmit(); }}
				/>

				<View style={styles.alignItemsFlexStart}>
					<Button
						title='Register'
						type='primary'
						onPress={this.usernameSubmit}
					/>
				</View>

				{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
			</View>
		);
	}

	render() {
		return (
			<KeyboardView contentContainerStyle={styles.container}>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView>
						<CloseModalButton navigation={this.props.navigation} />
						<Text style={[styles.loginText, styles.loginTitle]}>Sign Up</Text>
						{this._renderRegister()}
						{this._renderUsername()}
						<Loading visible={this.props.login.isFetching} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
