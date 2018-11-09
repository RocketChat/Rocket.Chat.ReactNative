import React from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, Text, ScrollView, View, StyleSheet, Alert, LayoutAnimation, Dimensions
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import { Answers } from 'react-native-fabric';
import SafeAreaView from 'react-native-safe-area-view';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import RocketChat from '../lib/rocketchat';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { showToast } from '../utils/info';
import LoggedView from './View';
import I18n from '../i18n';
import store from '../lib/createStore';
import { DARK_HEADER } from '../constants/headerOptions';

let RegisterView = null;
let ForgotPasswordView = null;
let LegalView = null;

const styles = StyleSheet.create({
	buttonsContainer: {
		flexDirection: 'column',
		marginTop: 5
	},
	bottomContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginTop: 10
	},
	dontHaveAccount: {
		...sharedStyles.textRegular,
		color: '#9ea2a8',
		fontSize: 13
	},
	createAccount: {
		...sharedStyles.textSemibold,
		color: '#1d74f5',
		fontSize: 13
	},
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	},
	loginSubtitle: {
		marginBottom: 15
	}
});

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
	static options() {
		return {
			...DARK_HEADER,
			topBar: {
				...DARK_HEADER.topBar,
				rightButtons: [{
					id: 'more',
					icon: { uri: 'more', scale: Dimensions.get('window').scale },
					testID: 'login-view-more'
				}]
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		loginSubmit: PropTypes.func.isRequired,
		login: PropTypes.object,
		server: PropTypes.string,
		error: PropTypes.any,
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
			password: '',
			code: '',
			showTOTP: false
		};
		Navigation.events().bindComponent(this);
	}

	componentDidMount() {
		setTimeout(() => {
			this.usernameInput.focus();
		}, 600);
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'more') {
			if (LegalView == null) {
				LegalView = require('./LegalView').default;
				Navigation.registerComponentWithRedux('LegalView', () => gestureHandlerRootHOC(LegalView), Provider, store);
			}

			Navigation.showModal({
				stack: {
					children: [{
						component: {
							name: 'LegalView'
						}
					}]
				}
			});
		}
	}

	submit = async() => {
		const {	username, password, code } = this.state;
		const { loginSubmit } = this.props;

		if (username.trim() === '' || password.trim() === '') {
			showToast(I18n.t('Email_or_password_field_is_empty'));
			return;
		}
		Keyboard.dismiss();

		try {
			await loginSubmit({ username, password, code });
			Answers.logLogin('Email', true);
		} catch (e) {
			if (e && e.error === 'totp-required') {
				LayoutAnimation.easeInEaseOut();
				this.setState({ showTOTP: true });
				setTimeout(() => {
					if (this.codeInput && this.codeInput.focus) {
						this.codeInput.focus();
					}
				}, 300);
				return;
			}
			Alert.alert(I18n.t('Oops'), I18n.t('Login_error'));
		}
	}

	register = () => {
		if (RegisterView == null) {
			RegisterView = require('./RegisterView').default;
			Navigation.registerComponentWithRedux('RegisterView', () => gestureHandlerRootHOC(RegisterView), Provider, store);
		}

		const { componentId, server } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'RegisterView',
				options: {
					topBar: {
						title: {
							text: server
						}
					}
				}
			}
		});
	}

	forgotPassword = () => {
		if (ForgotPasswordView == null) {
			ForgotPasswordView = require('./ForgotPasswordView').default;
			Navigation.registerComponentWithRedux('ForgotPasswordView', () => gestureHandlerRootHOC(ForgotPasswordView), Provider, store);
		}

		const { componentId } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'ForgotPasswordView',
				options: {
					topBar: {
						title: {
							text: I18n.t('Forgot_Password')
						}
					}
				}
			}
		});
	}

	renderTOTP = () => {
		const { isFetching } = this.props;
		return (
			<SafeAreaView style={sharedStyles.container} testID='login-view' forceInset={{ bottom: 'never' }}>
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, styles.loginTitle]}>{I18n.t('Two_Factor_Authentication')}</Text>
				<Text style={[sharedStyles.loginSubtitle, sharedStyles.textRegular, styles.loginSubtitle]}>{I18n.t('Whats_your_2fa')}</Text>
				<TextInput
					inputRef={ref => this.codeInput = ref}
					onChangeText={code => this.setState({ code })}
					keyboardType='numeric'
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
				/>
				<View style={styles.buttonsContainer}>
					<Button
						title={I18n.t('Confirm')}
						type='primary'
						onPress={this.submit}
						testID='login-view-submit'
						loading={isFetching}
					/>
				</View>
			</SafeAreaView>
		);
	}

	renderUserForm = () => {
		const {
			Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, isFetching
		} = this.props;
		return (
			<SafeAreaView style={sharedStyles.container} testID='login-view' forceInset={{ bottom: 'never' }}>
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold]}>{I18n.t('Login')}</Text>
				<TextInput
					inputRef={(e) => { this.usernameInput = e; }}
					placeholder={Accounts_EmailOrUsernamePlaceholder || I18n.t('Username_or_email')}
					keyboardType='email-address'
					returnKeyType='next'
					iconLeft='mention'
					onChangeText={username => this.setState({ username })}
					onSubmitEditing={() => { this.passwordInput.focus(); }}
					testID='login-view-email'
				/>
				<TextInput
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='done'
					iconLeft='key'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={password => this.setState({ password })}
					testID='login-view-password'
				/>
				<View style={styles.buttonsContainer}>
					<Button
						title={I18n.t('Login')}
						type='primary'
						onPress={this.submit}
						testID='login-view-submit'
						loading={isFetching}
					/>
					<Button
						title={I18n.t('Forgot_password')}
						type='secondary'
						onPress={this.forgotPassword}
						testID='welcome-view-register'
					/>
				</View>
				<View style={styles.bottomContainer}>
					<Text
						style={styles.dontHaveAccount}
						testID='login-view-register'
					>{I18n.t('Dont_Have_An_Account')}
					</Text>
					<Text
						style={styles.createAccount}
						onPress={this.register}
					>{I18n.t('Create_account')}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	render() {
		const { showTOTP } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					{!showTOTP ? this.renderUserForm() : null}
					{showTOTP ? this.renderTOTP() : null}
				</ScrollView>
			</KeyboardView>
		);
	}
}
