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
	}
});

@connect(state => ({
	isFetching: state.login.isFetching,
	Site_Name: state.settings.Site_Name,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder
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
		Site_Name: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		isFetching: PropTypes.bool
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
		const { componentId, Site_Name } = this.props;
		this.setTitle(componentId, Site_Name);
	}

	componentDidMount() {
		this.timeout = setTimeout(() => {
			this.usernameInput.focus();
		}, 600);
	}

	componentDidUpdate(prevProps) {
		const { componentId, Site_Name } = this.props;
		if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(componentId, Site_Name);
		}
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	setTitle = (componentId, title) => {
		Navigation.mergeOptions(componentId, {
			topBar: {
				title: {
					text: title
				}
			}
		});
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

	valid = () => {
		const {
			username, password, code, showTOTP
		} = this.state;
		if (showTOTP) {
			return code.trim();
		}
		return username.trim() && password.trim();
	}

	submit = async() => {
		if (!this.valid()) {
			return;
		}

		const {	username, password, code } = this.state;
		const { loginSubmit } = this.props;
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

		const { componentId, Site_Name } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'RegisterView',
				options: {
					topBar: {
						title: {
							text: Site_Name
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

		const { componentId, Site_Name } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'ForgotPasswordView',
				options: {
					topBar: {
						title: {
							text: Site_Name
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
				<Text style={[sharedStyles.loginSubtitle, sharedStyles.textRegular]}>{I18n.t('Whats_your_2fa')}</Text>
				<TextInput
					inputRef={ref => this.codeInput = ref}
					onChangeText={value => this.setState({ code: value })}
					keyboardType='numeric'
					returnKeyType='send'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					testID='login-view-totp'
					containerStyle={sharedStyles.inputLastChild}
				/>
				<Button
					title={I18n.t('Confirm')}
					type='primary'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
				/>
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
					onChangeText={value => this.setState({ username: value })}
					onSubmitEditing={() => { this.passwordInput.focus(); }}
					testID='login-view-email'
				/>
				<TextInput
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='send'
					iconLeft='key'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={value => this.setState({ password: value })}
					testID='login-view-password'
					containerStyle={sharedStyles.inputLastChild}
				/>
				<Button
					title={I18n.t('Login')}
					type='primary'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
				/>
				<Button
					title={I18n.t('Forgot_password')}
					type='secondary'
					onPress={this.forgotPassword}
					testID='login-view-forgot-password'
				/>
				<View style={styles.bottomContainer}>
					<Text style={styles.dontHaveAccount}>{I18n.t('Dont_Have_An_Account')}</Text>
					<Text
						style={styles.createAccount}
						onPress={this.register}
						testID='login-view-register'
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
