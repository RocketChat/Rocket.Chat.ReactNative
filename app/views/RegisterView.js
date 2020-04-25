import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, StyleSheet, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import RNPickerSelect from 'react-native-picker-select';

import log from '../utils/log';
import sharedStyles from './Styles';
import Button from '../containers/Button';
import I18n from '../i18n';
import { LegalButton } from '../containers/HeaderButton';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import TextInput from '../containers/TextInput';
import isValidEmail from '../utils/isValidEmail';
import { showErrorAlert } from '../utils/info';
import RocketChat from '../lib/rocketchat';
import { loginRequest as loginRequestAction } from '../actions/login';
import openLink from '../utils/openLink';
import LoginServices from '../containers/LoginServices';
import { getShowLoginButton } from '../selectors/login';

const styles = StyleSheet.create({
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
		marginBottom: 32,
		marginHorizontal: 30
	},
	bottomContainerText: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	bottomContainerTextBold: {
		...sharedStyles.textSemibold,
		fontSize: 13
	},
	registerButton: {
		marginTop: 16,
		marginBottom: 32
	}
});

class RegisterView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			...themedHeader(screenProps.theme),
			title,
			headerRight: <LegalButton navigation={navigation} />
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		Accounts_CustomFields: PropTypes.string,
		Accounts_EmailVerification: PropTypes.bool,
    Accounts_Password_Policy_Enabled: PropTypes.bool,
		Accounts_Password_Policy_AtLeastOneLowercase: PropTypes.bool,
		Accounts_Password_Policy_AtLeastOneNumber: PropTypes.bool,
		Accounts_Password_Policy_AtLeastOneUppercase: PropTypes.bool,
		Accounts_Password_Policy_AtLeastOneSpecialCharacter: PropTypes.bool,
		Accounts_Password_Policy_ForbidRepeatingCharacters: PropTypes.bool,
		Accounts_Password_Policy_MaxLength: PropTypes.number,
		Accounts_Password_Policy_MinLength: PropTypes.number,
		Accounts_Password_Policy_ForbidRepeatingCharactersCount: PropTypes.number,
		theme: PropTypes.string,
    Site_Name: PropTypes.string,
		loginRequest: PropTypes.func,
    Accounts_ManuallyApproveNewUsers: PropTypes.bool,
		showLoginButton: PropTypes.bool
 }

	constructor(props) {
		super(props);
		const customFields = {};
		this.parsedCustomFields = {};
		if (props.Accounts_CustomFields) {
			try {
				this.parsedCustomFields = JSON.parse(props.Accounts_CustomFields);
			} catch (e) {
				log(e);
			}
		}
		Object.keys(this.parsedCustomFields).forEach((key) => {
			if (this.parsedCustomFields[key].defaultValue) {
				customFields[key] = this.parsedCustomFields[key].defaultValue;
			}
		});
		this.state = {
			name: '',
			email: '',
			password: '',
			username: '',
			saving: false,
			customFields
		};
	}

	login = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('LoginView', { title: Site_Name });
	}

	valid = () => {
		const {
			name, email, password, username, customFields
		} = this.state;
		const {
			Accounts_Password_Policy_Enabled,
			Accounts_Password_Policy_AtLeastOneLowercase,
			Accounts_Password_Policy_AtLeastOneUppercase,
			Accounts_Password_Policy_MaxLength,
			Accounts_Password_Policy_MinLength,
			Accounts_Password_Policy_AtLeastOneNumber,
			Accounts_Password_Policy_AtLeastOneSpecialCharacter,
			Accounts_Password_Policy_ForbidRepeatingCharacters,
			Accounts_Password_Policy_ForbidRepeatingCharactersCount
		} = this.props;
		let requiredCheck = true;
		Object.keys(this.parsedCustomFields).forEach((key) => {
			if (this.parsedCustomFields[key].required) {
				requiredCheck = requiredCheck && customFields[key] && Boolean(customFields[key].trim());
			}
		});
		if (Accounts_Password_Policy_Enabled) {
			if (password.trim().length < Accounts_Password_Policy_MinLength) {
				return false;
			} else if (password.trim().length > Accounts_Password_Policy_MaxLength) {
				return false;
			} else if (Accounts_Password_Policy_AtLeastOneLowercase && !((/[a-z]/).test(password))) {
				return false;
			} else if (Accounts_Password_Policy_AtLeastOneUppercase && !((/[A-Z]/).test(password))) {
				return false;
			} else if (Accounts_Password_Policy_AtLeastOneNumber && !((/[0 - 9]/).test(password))) {
				return false;
			} else if (Accounts_Password_Policy_AtLeastOneSpecialCharacter && !((/[^A-Za-z0-9 ]/).test(password))) {
				return false;
			} else if (Accounts_Password_Policy_ForbidRepeatingCharacters && !((`(.)\\1{${ Accounts_Password_Policy_ForbidRepeatingCharactersCount },}`).test(password))) {
				return false;
			} else {
				return true;
			}
		}
		return name.trim() && email.trim() && password.trim() && username.trim() && isValidEmail(email) && requiredCheck;
	}

	submit = async() => {
		if (!this.valid()) {
			return;
		}
		this.setState({ saving: true });
		Keyboard.dismiss();

		const {
			name, email, password, username, customFields
		} = this.state;

		const {
			loginRequest,
			Accounts_EmailVerification,
			navigation,
			Accounts_ManuallyApproveNewUsers
		} = this.props;


		try {
			await RocketChat.register({
				name, email, pass: password, username, ...customFields
			});

			if (Accounts_EmailVerification) {
				await navigation.goBack();
				showErrorAlert(I18n.t('Verify_email_desc'), I18n.t('Registration_Succeeded'));
			} else if (Accounts_ManuallyApproveNewUsers) {
				await navigation.goBack();
				showErrorAlert(I18n.t('Wait_activation_warning'), I18n.t('Registration_Succeeded'));
			} else {
				await loginRequest({ user: email, password });
			}
		} catch (e) {
			if (e.data && e.data.errorType === 'username-invalid') {
				return loginRequest({ user: email, password });
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-minLength]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-minLength'), I18n.t('Oops'));
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-maxLength]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-maxLength'), I18n.t('Oops'));
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-oneLowercase]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-oneLowercase'), I18n.t('Oops'));
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-oneUppercase]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-oneUppercase'), I18n.t('Oops'));
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-oneNumber]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-oneNumber'), I18n.t('Oops'));
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-oneSpecial]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-oneSpecial'), I18n.t('Oops'));
			} else if (e.data && e.data.error.includes('[error-password-policy-not-met-repeatingCharacters]')) {
				showErrorAlert(I18n.t('error-password-policy-not-met-repeatingCharacters'), I18n.t('Oops'));
			} else {
				showErrorAlert(e.data.error, I18n.t('Oops'));
			}
		}
		this.setState({ saving: false });
	}

	openContract = (route) => {
		const { server, theme } = this.props;
		if (!server) {
			return;
		}
		openLink(`${ server }/${ route }`, theme);
	}

	renderCustomFields = () => {
		const { customFields } = this.state;
		const { Accounts_CustomFields, theme } = this.props;
		if (!Accounts_CustomFields) {
			return null;
		}
		try {
			return Object.keys(this.parsedCustomFields).map((key, index, array) => {
				if (this.parsedCustomFields[key].type === 'select') {
					const options = this.parsedCustomFields[key].options.map(option => ({ label: option, value: option }));
					return (
						<RNPickerSelect
							key={key}
							items={options}
							onValueChange={(value) => {
								const newValue = {};
								newValue[key] = value;
								this.setState({ customFields: { ...customFields, ...newValue } });
							}}
							value={customFields[key]}
						>
							<TextInput
								inputRef={(e) => { this[key] = e; }}
								placeholder={key}
								value={customFields[key]}
								testID='register-view-custom-picker'
								theme={theme}
							/>
						</RNPickerSelect>
					);
				}

				return (
					<TextInput
						inputRef={(e) => { this[key] = e; }}
						key={key}
						label={key}
						placeholder={key}
						value={customFields[key]}
						onChangeText={(value) => {
							const newValue = {};
							newValue[key] = value;
							this.setState({ customFields: { ...customFields, ...newValue } });
						}}
						onSubmitEditing={() => {
							if (array.length - 1 > index) {
								return this[array[index + 1]].focus();
							}
							this.avatarUrl.focus();
						}}
						containerStyle={styles.inputContainer}
						theme={theme}
					/>
				);
			});
		} catch (error) {
			return null;
		}
	}

	render() {
		const { saving } = this.state;
		const { theme, showLoginButton } = this.props;
		return (
			<FormContainer theme={theme}>
				<FormContainerInner>
					<LoginServices />
					<Text style={[styles.title, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Sign_Up')}</Text>
					<TextInput
						label='Name'
						containerStyle={styles.inputContainer}
						placeholder={I18n.t('Name')}
						returnKeyType='next'
						onChangeText={name => this.setState({ name })}
						onSubmitEditing={() => { this.usernameInput.focus(); }}
						testID='register-view-name'
						theme={theme}
					/>
					<TextInput
						label='Username'
						containerStyle={styles.inputContainer}
						inputRef={(e) => { this.usernameInput = e; }}
						placeholder={I18n.t('Username')}
						returnKeyType='next'
						onChangeText={username => this.setState({ username })}
						onSubmitEditing={() => { this.emailInput.focus(); }}
						testID='register-view-username'
						theme={theme}
					/>
					<TextInput
						label='Email'
						containerStyle={styles.inputContainer}
						inputRef={(e) => { this.emailInput = e; }}
						placeholder={I18n.t('Email')}
						returnKeyType='next'
						keyboardType='email-address'
						onChangeText={email => this.setState({ email })}
						onSubmitEditing={() => { this.passwordInput.focus(); }}
						testID='register-view-email'
						theme={theme}
					/>
					<TextInput
						label='Password'
						containerStyle={styles.inputContainer}
						inputRef={(e) => { this.passwordInput = e; }}
						placeholder={I18n.t('Password')}
						returnKeyType='send'
						secureTextEntry
						onChangeText={value => this.setState({ password: value })}
						onSubmitEditing={this.submit}
						testID='register-view-password'
						theme={theme}
					/>

					{this.renderCustomFields()}

					<Button
						title={I18n.t('Register')}
						type='primary'
						onPress={this.submit}
						testID='register-view-submit'
						disabled={!this.valid()}
						loading={saving}
						theme={theme}
						style={styles.registerButton}
					/>

					<View style={styles.bottomContainer}>
						<Text style={[styles.bottomContainerText, { color: themes[theme].auxiliaryText }]}>
							{`${ I18n.t('Onboarding_agree_terms') }\n`}
							<Text
								style={[styles.bottomContainerTextBold, { color: themes[theme].actionTintColor }]}
								onPress={() => this.openContract('terms-of-service')}
							>{I18n.t('Terms_of_Service')}
							</Text> {I18n.t('and')}
							<Text
								style={[styles.bottomContainerTextBold, { color: themes[theme].actionTintColor }]}
								onPress={() => this.openContract('privacy-policy')}
							> {I18n.t('Privacy_Policy')}
							</Text>
						</Text>
					</View>

					{showLoginButton
						? (
							<View style={styles.bottomContainer}>
								<Text style={[styles.bottomContainerText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Do_you_have_an_account')}</Text>
								<Text
									style={[styles.bottomContainerTextBold, { color: themes[theme].actionTintColor }]}
									onPress={this.login}
								>{I18n.t('Login')}
								</Text>
							</View>
						) : null}
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name,
	Gitlab_URL: state.settings.API_Gitlab_URL,
	CAS_enabled: state.settings.CAS_enabled,
	CAS_login_url: state.settings.CAS_login_url,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	Accounts_EmailVerification: state.settings.Accounts_EmailVerification,
  Accounts_Password_Policy_Enabled: state.settings.Accounts_Password_Policy_Enabled,
	Accounts_Password_Policy_MinLength: state.settings.Accounts_Password_Policy_MinLength,
	Accounts_Password_Policy_MaxLength: state.settings.Accounts_Password_Policy_MaxLength,
	Accounts_Password_Policy_ForbidRepeatingCharacters: state.settings.Accounts_Password_Policy_ForbidRepeatingCharacters,
	Accounts_Password_Policy_ForbidRepeatingCharactersCount: state.settings.Accounts_Password_Policy_ForbidRepeatingCharactersCount,
	Accounts_Password_Policy_AtLeastOneLowercase: state.settings.Accounts_Password_Policy_AtLeastOneLowercase,
	Accounts_Password_Policy_AtLeastOneUppercase: state.settings.Accounts_Password_Policy_AtLeastOneUppercase,
	Accounts_Password_Policy_AtLeastOneSpecialCharacter: state.settings.Accounts_Password_Policy_AtLeastOneSpecialCharacter,
	Accounts_Password_Policy_AtLeastOneNumber: state.settings.Accounts_Password_Policy_AtLeastOneNumber
	Accounts_ManuallyApproveNewUsers: state.settings.Accounts_ManuallyApproveNewUsers,
	showLoginButton: getShowLoginButton(state)
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RegisterView));
