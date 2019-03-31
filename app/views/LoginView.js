import React from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, Text, ScrollView, View, StyleSheet, Alert, LayoutAnimation
} from 'react-native';
import { connect } from 'react-redux';
import { Answers } from 'react-native-fabric';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import LoggedView from './View';
import I18n from '../i18n';
import { loginRequest as loginRequestAction } from '../actions/login';
import { LegalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { COLOR_PRIMARY } from '../constants/colors';

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
		...sharedStyles.textColorDescription,
		fontSize: 13
	},
	createAccount: {
		...sharedStyles.textSemibold,
		color: COLOR_PRIMARY,
		fontSize: 13
	},
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

@connect(state => ({
	isFetching: state.login.isFetching,
	failure: state.login.failure,
	error: state.login.error && state.login.error.data,
	Site_Name: state.settings.Site_Name,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder
}), dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
}))
/** @extends React.Component */
export default class LoginView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			title,
			headerRight: <LegalButton navigation={navigation} testID='login-view-more' />
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func.isRequired,
		error: PropTypes.object,
		Site_Name: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		isFetching: PropTypes.bool,
		failure: PropTypes.bool
	}

	constructor(props) {
		super('LoginView', props);
		this.state = {
			user: '',
			password: '',
			code: '',
			showTOTP: false
		};
		const { Site_Name } = this.props;
		this.setTitle(Site_Name);
	}

	componentDidMount() {
		this.timeout = setTimeout(() => {
			this.usernameInput.focus();
		}, 600);
	}

	componentWillReceiveProps(nextProps) {
		const { Site_Name, error } = this.props;
		if (nextProps.Site_Name && nextProps.Site_Name !== Site_Name) {
			this.setTitle(nextProps.Site_Name);
		} else if (nextProps.failure && !equal(error, nextProps.error)) {
			if (nextProps.error && nextProps.error.error === 'totp-required') {
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

	shouldComponentUpdate(nextProps, nextState) {
		const {
			user, password, code, showTOTP
		} = this.state;
		const {
			isFetching, failure, error, Site_Name, Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder
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
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.Accounts_EmailOrUsernamePlaceholder !== Accounts_EmailOrUsernamePlaceholder) {
			return true;
		}
		if (nextProps.Accounts_PasswordPlaceholder !== Accounts_PasswordPlaceholder) {
			return true;
		}
		if (!equal(nextProps.error, error)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
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
		Answers.logLogin('Email', true);
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
					iconLeft='at'
					onChangeText={value => this.setState({ user: value })}
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
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					{!showTOTP ? this.renderUserForm() : null}
					{showTOTP ? this.renderTOTP() : null}
				</ScrollView>
			</KeyboardView>
		);
	}
}
