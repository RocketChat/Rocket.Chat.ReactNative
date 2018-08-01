import React from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Text, ScrollView, View, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import { Answers } from 'react-native-fabric';

import RocketChat from '../lib/rocketchat';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import Loading from '../containers/Loading';
import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { showToast } from '../utils/info';
import { COLOR_BUTTON_PRIMARY } from '../constants/colors';
import LoggedView from './View';
import I18n from '../i18n';

@connect(state => ({
	server: state.server.server,
	failure: state.login.failure,
	isFetching: state.login.isFetching,
	reason: state.login.error && state.login.error.reason,
	error: state.login.error && state.login.error.error
}), () => ({
	loginSubmit: params => RocketChat.loginWithPassword(params)
}))
/** @extends React.Component */
export default class LoginView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		loginSubmit: PropTypes.func.isRequired,
		login: PropTypes.object,
		server: PropTypes.string,
		error: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		failure: PropTypes.bool,
		isFetching: PropTypes.bool,
		reason: PropTypes.string
	}

	constructor(props) {
		super('LoginView', props);
		this.state = {
			username: '',
			password: ''
		};
	}

	submit = async() => {
		const {	username, password, code } = this.state;
		if (username.trim() === '' || password.trim() === '') {
			showToast(I18n.t('Email_or_password_field_is_empty'));
			return;
		}
		Keyboard.dismiss();

		try {
			await this.props.loginSubmit({ username, password, code });
			Answers.logLogin('Email', true, { server: this.props.server });
		} catch (error) {
			console.warn('LoginView submit', error);
		}
	}

	register = () => {
		this.props.navigator.push({
			screen: 'RegisterView',
			title: this.props.server,
			backButtonTitle: I18n.t('Login')
		});
	}

	forgotPassword = () => {
		this.props.navigator.push({
			screen: 'ForgotPasswordView',
			title: I18n.t('Forgot_Password'),
			backButtonTitle: I18n.t('Login')
		});
	}

	renderTOTP = () => {
		if (/totp/ig.test(this.props.error)) {
			return (
				<TextInput
					inputRef={ref => this.codeInput = ref}
					label={I18n.t('Code')}
					onChangeText={code => this.setState({ code })}
					placeholder={I18n.t('Code')}
					keyboardType='numeric'
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
				/>
			);
		}
		return null;
	}

	render() {
		return (
			<KeyboardView
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView style={styles.container} testID='login-view'>
						<Text style={[styles.loginText, styles.loginTitle]}>Login</Text>
						<TextInput
							label={I18n.t('Username')}
							placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || I18n.t('Username')}
							keyboardType='email-address'
							returnKeyType='next'
							iconLeft='at'
							onChangeText={username => this.setState({ username })}
							onSubmitEditing={() => { this.password.focus(); }}
							testID='login-view-email'
						/>

						<TextInput
							inputRef={(e) => { this.password = e; }}
							label={I18n.t('Password')}
							placeholder={this.props.Accounts_PasswordPlaceholder || I18n.t('Password')}
							returnKeyType='done'
							iconLeft='key-variant'
							secureTextEntry
							onSubmitEditing={this.submit}
							onChangeText={password => this.setState({ password })}
							testID='login-view-password'
						/>

						{this.renderTOTP()}

						<View style={styles.alignItemsFlexStart}>
							<Button
								title={I18n.t('Login')}
								type='primary'
								onPress={this.submit}
								testID='login-view-submit'
							/>
							<Text
								style={[styles.loginText, { marginTop: 10 }]}
								testID='login-view-register'
								onPress={() => this.register()}
							>{I18n.t('New_in_RocketChat_question_mark')} &nbsp;
								<Text style={{ color: COLOR_BUTTON_PRIMARY }}>{I18n.t('Sign_Up')}
								</Text>
							</Text>
							<Text
								style={[styles.loginText, { marginTop: 20, fontSize: 13 }]}
								onPress={() => this.forgotPassword()}
								testID='login-view-forgot-password'
							>{I18n.t('Forgot_password')}
							</Text>
						</View>

						{this.props.failure ? <Text style={styles.error}>{this.props.reason}</Text> : null}
						<Loading visible={this.props.isFetching} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
