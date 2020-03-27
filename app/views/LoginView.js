import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, Image, StyleSheet, Animated, Easing, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import { Base64 } from 'js-base64';
import equal from 'deep-equal';

import { analytics } from '../utils/log';
import Touch from '../utils/touch';
import sharedStyles from './Styles';
import random from '../utils/random';
import Button from '../containers/Button';
import I18n from '../i18n';
import { LegalButton } from '../containers/HeaderButton';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import OnboardingSeparator from '../containers/OnboardingSeparator';
import TextInput from '../containers/TextInput';

import { loginRequest as loginRequestAction } from '../actions/login';
import LoginServices from '../containers/LoginServices';

const styles = StyleSheet.create({
	serviceButton: {
		borderRadius: 2,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: 2,
		width: '100%',
		height: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	serviceIcon: {
		position: 'absolute',
		left: 15,
		top: 12,
		width: 24,
		height: 24
	},
	serviceText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	serviceName: {
		...sharedStyles.textSemibold
	},
	registerDisabled: {
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		fontSize: 16
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 22
	},
	inputContainer: {
		marginVertical: 16
	},
	bottomContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginBottom: 32
	},
	dontHaveAccount: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	createAccount: {
		...sharedStyles.textSemibold,
		fontSize: 13
	}
});

class LoginView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			...themedHeader(screenProps.theme),
			title,
			headerRight: <LegalButton testID='welcome-view-more' navigation={navigation} />
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		Site_Name: PropTypes.string,
		Accounts_RegistrationForm: PropTypes.string,
		Accounts_RegistrationForm_LinkReplacementText: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_PasswordReset: PropTypes.bool,
		isFetching: PropTypes.bool,
		theme: PropTypes.string,
		loginRequest: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			user: '',
			password: '',
			code: '',
			showTOTP: false
		};
		const { Site_Name } = this.props;
		this.setTitle(Site_Name);
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const { collapsed, servicesHeight } = this.state;
	// 	const {
	// 		server, Site_Name, services, Accounts_ShowFormLogin, Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, theme
	// 	} = this.props;
	// 	if (nextState.collapsed !== collapsed) {
	// 		return true;
	// 	}
	// 	if (nextState.servicesHeight !== servicesHeight) {
	// 		return true;
	// 	}
	// 	if (nextProps.server !== server) {
	// 		return true;
	// 	}
	// 	if (nextProps.Site_Name !== Site_Name) {
	// 		return true;
	// 	}
	// 	if (nextProps.theme !== theme) {
	// 		return true;
	// 	}
	// 	if (nextProps.Accounts_ShowFormLogin !== Accounts_ShowFormLogin) {
	// 		return true;
	// 	}
	// 	if (nextProps.Accounts_RegistrationForm !== Accounts_RegistrationForm) {
	// 		return true;
	// 	}
	// 	if (nextProps.Accounts_RegistrationForm_LinkReplacementText !== Accounts_RegistrationForm_LinkReplacementText) {
	// 		return true;
	// 	}
	// 	if (!equal(nextProps.services, services)) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	componentDidUpdate(prevProps) {
		const { Site_Name } = this.props;
		if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(Site_Name);
		}
	}

	setTitle = (title) => {
		const { navigation } = this.props;
		navigation.setParams({ title });
	}

	login = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('LoginView', { title: Site_Name });
	}

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	}

	forgotPassword = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('ForgotPasswordView', { title: Site_Name });
	}

	valid = () => {
		const {
			user, password, code, showTOTP
		} = this.state;
		if (showTOTP) {
			return code.trim();
		}
		return user.trim() && password.trim();
	}

	submit = () => {
		if (!this.valid()) {
			return;
		}

		const { user, password, code } = this.state;
		const { loginRequest } = this.props;
		Keyboard.dismiss();
		loginRequest({ user, password, code });
		analytics().logEvent('login');
	}

	renderUserForm = () => {
		const {
			Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, Accounts_PasswordReset, Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, isFetching, theme, Accounts_ShowFormLogin
		} = this.props;

		if (!Accounts_ShowFormLogin) {
			return null;
		}

		return (
			<>
				<Text style={[styles.title, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Login')}</Text>
				<TextInput
					label='Email or username'
					containerStyle={styles.inputContainer}
					placeholder={Accounts_EmailOrUsernamePlaceholder || I18n.t('Username_or_email')}
					keyboardType='email-address'
					returnKeyType='next'
					iconLeft='at'
					onChangeText={value => this.setState({ user: value })}
					onSubmitEditing={() => { this.passwordInput.focus(); }}
					testID='login-view-email'
					textContentType='username'
					autoCompleteType='username'
					theme={theme}
				/>
				<TextInput
					label='Password'
					containerStyle={styles.inputContainer}
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='send'
					iconLeft='key'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={value => this.setState({ password: value })}
					testID='login-view-password'
					textContentType='password'
					autoCompleteType='password'
					theme={theme}
				/>
				<Button
					title={I18n.t('Login')}
					type='primary'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
					theme={theme}
					style={{ marginTop: 16 }}
				/>
				{Accounts_PasswordReset && (
					<Button
						title={I18n.t('Forgot_password')}
						type='secondary'
						onPress={this.forgotPassword}
						testID='login-view-forgot-password'
						theme={theme}
						color={themes[theme].auxiliaryText}
						fontSize={14}
					/>
				)}
				{Accounts_RegistrationForm === 'Public' ? (
					<View style={styles.bottomContainer}>
						<Text style={[styles.dontHaveAccount, { color: themes[theme].auxiliaryText }]}>{I18n.t('Dont_Have_An_Account')}</Text>
						<Text
							style={[styles.createAccount, { color: themes[theme].actionTintColor }]}
							onPress={this.register}
							testID='login-view-register'
						>{I18n.t('Create_account')}
						</Text>
					</View>
				) : (<Text style={[styles.registerDisabled, { color: themes[theme].auxiliaryText }]}>{Accounts_RegistrationForm_LinkReplacementText}</Text>)}
			</>
		);
	}

	render() {
		const { showTOTP } = this.state;
		const { theme } = this.props;
		return (
			<FormContainer theme={theme}>
				<FormContainerInner>
					{!showTOTP ? <LoginServices /> : null}
					{!showTOTP ? this.renderUserForm() : null}
					{showTOTP ? this.renderTOTP() : null}
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name,
	Accounts_ShowFormLogin: state.settings.Accounts_ShowFormLogin,
	Accounts_RegistrationForm: state.settings.Accounts_RegistrationForm,
	Accounts_RegistrationForm_LinkReplacementText: state.settings.Accounts_RegistrationForm_LinkReplacementText,
	isFetching: state.login.isFetching,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	Accounts_PasswordReset: state.settings.Accounts_PasswordReset
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LoginView));
