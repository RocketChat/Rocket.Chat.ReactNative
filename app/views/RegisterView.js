import React from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, Text, View, ScrollView, SafeAreaView
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';

import { registerSubmit as registerSubmitAction, setUsernameSubmit as setUsernameSubmitAction } from '../actions/login';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import Loading from '../containers/Loading';
import KeyboardView from '../presentation/KeyboardView';
import styles from './Styles';
import { showToast } from '../utils/info';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import LoggedView from './View';
import I18n from '../i18n';
import store from '../lib/createStore';

let TermsServiceView = null;
let PrivacyPolicyView = null;

@connect(state => ({
	server: state.server.server,
	Accounts_NamePlaceholder: state.settings.Accounts_NamePlaceholder,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	Accounts_RepeatPasswordPlaceholder: state.settings.Accounts_RepeatPasswordPlaceholder,
	login: state.login
}), dispatch => ({
	registerSubmit: params => dispatch(registerSubmitAction(params)),
	setUsernameSubmit: params => dispatch(setUsernameSubmitAction(params))
}))
/** @extends React.Component */
export default class RegisterView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		server: PropTypes.string,
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
		super('RegisterView', props);
		this.state = {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
			username: ''
		};
	}

	valid = () => {
		const {
			name, email, password, confirmPassword
		} = this.state;
		return name.trim() && email.trim()
			&& password && confirmPassword && password === confirmPassword;
	}

	invalidEmail = () => {
		const { login } = this.props;
		return login.failure && /Email/.test(login.error && login.error.reason) ? login.error : {};
	}

	submit = () => {
		const {
			name, email, password, code
		} = this.state;
		const { registerSubmit } = this.props;

		if (!this.valid()) {
			showToast(I18n.t('Some_field_is_invalid_or_empty'));
			return;
		}

		registerSubmit({
			name, email, pass: password, code
		});
		Keyboard.dismiss();
	}

	usernameSubmit = () => {
		const { username } = this.state;
		const { setUsernameSubmit } = this.props;

		if (!username) {
			showToast(I18n.t('Username_is_empty'));
			return;
		}

		setUsernameSubmit({ username });
		Keyboard.dismiss();
	}

	termsService = () => {
		if (TermsServiceView == null) {
			TermsServiceView = require('./TermsServiceView').default;
			Navigation.registerComponent('TermsServiceView', () => TermsServiceView, store, Provider);
		}

		const { navigator } = this.props;
		navigator.push({
			screen: 'TermsServiceView',
			title: I18n.t('Terms_of_Service'),
			backButtonTitle: ''
		});
	}

	privacyPolicy = () => {
		if (PrivacyPolicyView == null) {
			PrivacyPolicyView = require('./PrivacyPolicyView').default;
			Navigation.registerComponent('PrivacyPolicyView', () => PrivacyPolicyView, store, Provider);
		}

		const { navigator } = this.props;
		navigator.push({
			screen: 'PrivacyPolicyView',
			title: I18n.t('Privacy_Policy'),
			backButtonTitle: ''
		});
	}

	_renderRegister() {
		const { password, confirmPassword } = this.state;
		const {
			login, Accounts_NamePlaceholder, Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, Accounts_RepeatPasswordPlaceholder
		} = this.props;

		if (login.token) {
			return null;
		}
		return (
			<View>
				<TextInput
					inputRef={(e) => { this.name = e; }}
					label={Accounts_NamePlaceholder || I18n.t('Name')}
					placeholder={Accounts_NamePlaceholder || I18n.t('Name')}
					returnKeyType='next'
					iconLeft='account'
					onChangeText={name => this.setState({ name })}
					onSubmitEditing={() => { this.email.focus(); }}
					testID='register-view-name'
				/>
				<TextInput
					inputRef={(e) => { this.email = e; }}
					label={Accounts_EmailOrUsernamePlaceholder || I18n.t('Email')}
					placeholder={Accounts_EmailOrUsernamePlaceholder || I18n.t('Email')}
					returnKeyType='next'
					keyboardType='email-address'
					iconLeft='email'
					onChangeText={email => this.setState({ email })}
					onSubmitEditing={() => { this.password.focus(); }}
					error={this.invalidEmail()}
					testID='register-view-email'
				/>
				<TextInput
					inputRef={(e) => { this.password = e; }}
					label={Accounts_PasswordPlaceholder || I18n.t('Password')}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='next'
					iconLeft='key-variant'
					secureTextEntry
					onChangeText={value => this.setState({ password: value })}
					onSubmitEditing={() => { this.confirmPassword.focus(); }}
					testID='register-view-password'
				/>
				<TextInput
					inputRef={(e) => { this.confirmPassword = e; }}
					inputStyle={
						password
						&& confirmPassword
						&& confirmPassword !== password ? { borderColor: 'red' } : {}
					}
					label={Accounts_RepeatPasswordPlaceholder || I18n.t('Repeat_Password')}
					placeholder={Accounts_RepeatPasswordPlaceholder || I18n.t('Repeat_Password')}
					returnKeyType='done'
					iconLeft='key-variant'
					secureTextEntry
					onChangeText={value => this.setState({ confirmPassword: value })}
					onSubmitEditing={this.submit}
					testID='register-view-repeat-password'
				/>

				<View style={styles.alignItemsFlexStart}>
					<Text style={styles.loginTermsText}>
						{I18n.t('By_proceeding_you_are_agreeing')}
						<Text style={styles.link} onPress={this.termsService}>{I18n.t('Terms_of_Service')}</Text>
						{I18n.t('and')}
						<Text style={styles.link} onPress={this.privacyPolicy}>{I18n.t('Privacy_Policy')}</Text>
					</Text>
					<Button
						title={I18n.t('Register')}
						type='primary'
						onPress={this.submit}
						testID='register-view-submit'
					/>
				</View>
			</View>
		);
	}

	_renderUsername() {
		const { login, Accounts_UsernamePlaceholder } = this.props;

		if (!login.token) {
			return null;
		}
		return (
			<View>
				<TextInput
					inputRef={(e) => { this.username = e; }}
					label={Accounts_UsernamePlaceholder || I18n.t('Username')}
					placeholder={Accounts_UsernamePlaceholder || I18n.t('Username')}
					returnKeyType='done'
					iconLeft='at'
					onChangeText={username => this.setState({ username })}
					onSubmitEditing={() => { this.usernameSubmit(); }}
					testID='register-view-username'
				/>

				<View style={styles.alignItemsFlexStart}>
					<Button
						title={I18n.t('Register')}
						type='primary'
						onPress={this.usernameSubmit}
						testID='register-view-submit-username'
					/>
				</View>
			</View>
		);
	}

	render() {
		const { login } = this.props;
		return (
			<KeyboardView contentContainerStyle={styles.container}>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView style={styles.container} testID='register-view'>
						<Text style={[styles.loginText, styles.loginTitle]}>{I18n.t('Sign_Up')}</Text>
						{this._renderRegister()}
						{this._renderUsername()}
						{login.failure
							? (
								<Text style={styles.error} testID='register-view-error'>
									{login.error.reason}
								</Text>
							)
							: null
						}
						<Loading visible={login.isFetching} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
