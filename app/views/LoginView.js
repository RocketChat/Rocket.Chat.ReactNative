import React from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, Text, ScrollView, View, StyleSheet, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import { analytics } from '../utils/log';

import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import { loginRequest as loginRequestAction } from '../actions/login';
import { LegalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { animateNextTransition } from '../utils/layoutAnimation';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import { isTablet } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	bottomContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginTop: 10
	},
	registerDisabled: {
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		fontSize: 13
	},
	dontHaveAccount: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	createAccount: {
		...sharedStyles.textSemibold,
		fontSize: 13
	},
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

class LoginView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			title,
			headerRight: <LegalButton navigation={navigation} testID='login-view-more' />,
			...themedHeader(screenProps.theme)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func.isRequired,
		error: PropTypes.object,
		Site_Name: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_PasswordReset: PropTypes.bool,
		Accounts_RegistrationForm: PropTypes.string,
		Accounts_RegistrationForm_LinkReplacementText: PropTypes.string,
		isFetching: PropTypes.bool,
		failure: PropTypes.bool,
		theme: PropTypes.string
	}

	static defaultProps = {
		Accounts_PasswordReset: true
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

	componentWillReceiveProps(nextProps) {
		const { Site_Name, error } = this.props;
		if (nextProps.Site_Name && nextProps.Site_Name !== Site_Name) {
			this.setTitle(nextProps.Site_Name);
		} else if (nextProps.failure && !equal(error, nextProps.error)) {
			if (nextProps.error && nextProps.error.error === 'totp-required') {
				animateNextTransition();
				this.setState({ showTOTP: true });
				return;
			}
			Alert.alert(I18n.t('Oops'), I18n.t('Login_error'));
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			user, password, code, showTOTP
		} = this.state;
		const {
			isFetching, failure, error, Site_Name, Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, theme
		} = this.props;
		if (nextState.user !== user) {
			return true;
		}
		if (nextState.password !== password) {
			return true;
		}
		if (nextState.code !== code) {
			return true;
		}
		if (nextState.showTOTP !== showTOTP) {
			return true;
		}
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (nextProps.failure !== failure) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.Accounts_EmailOrUsernamePlaceholder !== Accounts_EmailOrUsernamePlaceholder) {
			return true;
		}
		if (nextProps.Accounts_PasswordPlaceholder !== Accounts_PasswordPlaceholder) {
			return true;
		}
		if (nextProps.Accounts_RegistrationForm !== Accounts_RegistrationForm) {
			return true;
		}
		if (nextProps.Accounts_RegistrationForm_LinkReplacementText !== Accounts_RegistrationForm_LinkReplacementText) {
			return true;
		}
		if (!equal(nextProps.error, error)) {
			return true;
		}
		return false;
	}

	setTitle = (title) => {
		const { navigation } = this.props;
		navigation.setParams({ title });
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

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	}

	forgotPassword = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('ForgotPasswordView', { title: Site_Name });
	}

	renderTOTP = () => {
		const { isFetching, theme } = this.props;
		return (
			<SafeAreaView
				style={[
					sharedStyles.container,
					isTablet && sharedStyles.tabletScreenContent,
					{ backgroundColor: themes[theme].backgroundColor }
				]}
				testID='login-view'
				forceInset={{ vertical: 'never' }}
			>
				<Text
					style={[sharedStyles.loginTitle, sharedStyles.textBold, styles.loginTitle, { color: themes[theme].titleText }]}
				>
					{I18n.t('Two_Factor_Authentication')}
				</Text>
				<Text
					style={[sharedStyles.loginSubtitle, sharedStyles.textRegular, { color: themes[theme].titleText }]}
				>
					{I18n.t('Whats_your_2fa')}
				</Text>
				<TextInput
					inputRef={ref => this.codeInput = ref}
					autoFocus
					onChangeText={value => this.setState({ code: value })}
					keyboardType='numeric'
					returnKeyType='send'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					testID='login-view-totp'
					containerStyle={sharedStyles.inputLastChild}
					theme={theme}
				/>
				<Button
					title={I18n.t('Confirm')}
					type='primary'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
					theme={theme}
				/>
			</SafeAreaView>
		);
	}

	renderUserForm = () => {
		const {
			Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, Accounts_PasswordReset, Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, isFetching, theme
		} = this.props;
		return (
			<SafeAreaView
				style={[
					sharedStyles.container,
					isTablet && sharedStyles.tabletScreenContent,
					{ backgroundColor: themes[theme].backgroundColor }
				]}
				testID='login-view'
				forceInset={{ vertical: 'never' }}
			>
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Login')}</Text>
				<TextInput
					autoFocus
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
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='send'
					iconLeft='key'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={value => this.setState({ password: value })}
					testID='login-view-password'
					containerStyle={sharedStyles.inputLastChild}
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
				/>
				{Accounts_PasswordReset && (
					<Button
						title={I18n.t('Forgot_password')}
						type='secondary'
						onPress={this.forgotPassword}
						testID='login-view-forgot-password'
						theme={theme}
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
			</SafeAreaView>
		);
	}

	render() {
		const { showTOTP } = this.state;
		const { theme } = this.props;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<StatusBar theme={theme} />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					{!showTOTP ? this.renderUserForm() : null}
					{showTOTP ? this.renderTOTP() : null}
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	isFetching: state.login.isFetching,
	failure: state.login.failure,
	error: state.login.error && state.login.error.data,
	Site_Name: state.settings.Site_Name,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	Accounts_RegistrationForm: state.settings.Accounts_RegistrationForm,
	Accounts_RegistrationForm_LinkReplacementText: state.settings.Accounts_RegistrationForm_LinkReplacementText,
	Accounts_PasswordReset: state.settings.Accounts_PasswordReset
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LoginView));
