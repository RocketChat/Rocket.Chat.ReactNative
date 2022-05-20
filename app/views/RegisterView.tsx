import React from 'react';
import { Keyboard, StyleSheet, Text, View, TextInput as RNTextInput } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';

import { loginRequest } from '../actions/login';
import { themes } from '../lib/constants';
import Button from '../containers/Button';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import * as HeaderButton from '../containers/HeaderButton';
import LoginServices from '../containers/LoginServices';
import FormTextInput from '../containers/TextInput/FormTextInput';
import { IApplicationState, IBaseScreen } from '../definitions';
import I18n from '../i18n';
import { getShowLoginButton } from '../selectors/login';
import { OutsideParamList } from '../stacks/types';
import { withTheme } from '../theme';
import { showErrorAlert } from '../utils/info';
import isValidEmail from '../utils/isValidEmail';
import log, { events, logEvent } from '../utils/log';
import openLink from '../utils/openLink';
import sharedStyles from './Styles';
import { Services } from '../lib/services';

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

interface IProps extends IBaseScreen<OutsideParamList, 'RegisterView'> {
	server: string;
	Site_Name: string;
	Gitlab_URL: string;
	CAS_enabled: boolean;
	CAS_login_url: string;
	Accounts_CustomFields: string;
	Accounts_EmailVerification: boolean;
	Accounts_ManuallyApproveNewUsers: boolean;
	showLoginButton: boolean;
}

class RegisterView extends React.Component<IProps, any> {
	private parsedCustomFields: any;
	private usernameInput?: RNTextInput | null;
	private passwordInput?: RNTextInput | null;
	private emailInput?: RNTextInput | null;
	private avatarUrl?: RNTextInput | null;

	static navigationOptions = ({ route, navigation }: IProps) => ({
		title: route?.params?.title ?? 'Rocket.Chat',
		headerRight: () => <HeaderButton.Legal testID='register-view-more' navigation={navigation} />
	});

	constructor(props: IProps) {
		super(props);
		const customFields: any = {};
		this.parsedCustomFields = {};
		if (props.Accounts_CustomFields) {
			try {
				this.parsedCustomFields = JSON.parse(props.Accounts_CustomFields);
			} catch (e) {
				log(e);
			}
		}
		Object.keys(this.parsedCustomFields).forEach((key: string) => {
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
	};

	valid = () => {
		const { name, email, password, username, customFields } = this.state;
		let requiredCheck = true;
		Object.keys(this.parsedCustomFields).forEach((key: string) => {
			if (this.parsedCustomFields[key].required) {
				requiredCheck = requiredCheck && customFields[key] && Boolean(customFields[key].trim());
			}
		});
		return name.trim() && email.trim() && password.trim() && username.trim() && isValidEmail(email) && requiredCheck;
	};

	submit = async () => {
		logEvent(events.REGISTER_DEFAULT_SIGN_UP);
		if (!this.valid()) {
			return;
		}
		this.setState({ saving: true });
		Keyboard.dismiss();

		const { name, email, password, username, customFields } = this.state;
		const { dispatch, Accounts_EmailVerification, navigation, Accounts_ManuallyApproveNewUsers } = this.props;

		try {
			await Services.register({
				name,
				email,
				pass: password,
				username,
				...customFields
			});

			if (Accounts_EmailVerification) {
				await navigation.goBack();
				showErrorAlert(I18n.t('Verify_email_desc'), I18n.t('Registration_Succeeded'));
			} else if (Accounts_ManuallyApproveNewUsers) {
				await navigation.goBack();
				showErrorAlert(I18n.t('Wait_activation_warning'), I18n.t('Registration_Succeeded'));
			} else {
				dispatch(loginRequest({ user: email, password }));
			}
		} catch (e: any) {
			if (e.data?.errorType === 'username-invalid') {
				return dispatch(loginRequest({ user: email, password }));
			}
			if (e.data?.error) {
				logEvent(events.REGISTER_DEFAULT_SIGN_UP_F);
				showErrorAlert(e.data.error, I18n.t('Oops'));
			}
		}
		this.setState({ saving: false });
	};

	openContract = (route: string) => {
		const { server, theme } = this.props;
		if (!server) {
			return;
		}
		openLink(`${server}/${route}`, theme);
	};

	renderCustomFields = () => {
		const { customFields } = this.state;
		const { Accounts_CustomFields, theme } = this.props;
		if (!Accounts_CustomFields) {
			return null;
		}
		try {
			return (
				<>
					{Object.keys(this.parsedCustomFields).map((key, index, array) => {
						if (this.parsedCustomFields[key].type === 'select') {
							const options = this.parsedCustomFields[key].options.map((option: string) => ({ label: option, value: option }));
							return (
								<RNPickerSelect
									key={key}
									items={options}
									onValueChange={value => {
										const newValue: { [key: string]: string | number } = {};
										newValue[key] = value;
										this.setState({ customFields: { ...customFields, ...newValue } });
									}}
									value={customFields[key]}>
									<FormTextInput
										inputRef={e => {
											// @ts-ignore
											this[key] = e;
										}}
										placeholder={key}
										value={customFields[key]}
										testID='register-view-custom-picker'
										theme={theme}
									/>
								</RNPickerSelect>
							);
						}

						return (
							<FormTextInput
								inputRef={e => {
									// @ts-ignore
									this[key] = e;
								}}
								key={key}
								label={key}
								placeholder={key}
								value={customFields[key]}
								onChangeText={(value: string) => {
									const newValue: { [key: string]: string | number } = {};
									newValue[key] = value;
									this.setState({ customFields: { ...customFields, ...newValue } });
								}}
								onSubmitEditing={() => {
									if (array.length - 1 > index) {
										// @ts-ignore
										return this[array[index + 1]].focus();
									}
									this.avatarUrl?.focus();
								}}
								containerStyle={styles.inputContainer}
								theme={theme}
							/>
						);
					})}
				</>
			);
		} catch (error) {
			return null;
		}
	};

	render() {
		const { saving } = this.state;
		const { theme, showLoginButton, navigation } = this.props;
		return (
			<FormContainer testID='register-view'>
				<FormContainerInner>
					<LoginServices navigation={navigation} theme={theme} separator />
					<Text style={[styles.title, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Sign_Up')}</Text>
					<FormTextInput
						label={I18n.t('Name')}
						containerStyle={styles.inputContainer}
						placeholder={I18n.t('Name')}
						returnKeyType='next'
						onChangeText={(name: string) => this.setState({ name })}
						onSubmitEditing={() => {
							this.usernameInput?.focus();
						}}
						testID='register-view-name'
						theme={theme}
					/>
					<FormTextInput
						label={I18n.t('Username')}
						containerStyle={styles.inputContainer}
						inputRef={e => {
							this.usernameInput = e;
						}}
						placeholder={I18n.t('Username')}
						returnKeyType='next'
						onChangeText={(username: string) => this.setState({ username })}
						onSubmitEditing={() => {
							this.emailInput?.focus();
						}}
						testID='register-view-username'
						theme={theme}
					/>
					<FormTextInput
						label={I18n.t('Email')}
						containerStyle={styles.inputContainer}
						inputRef={e => {
							this.emailInput = e;
						}}
						placeholder={I18n.t('Email')}
						returnKeyType='next'
						keyboardType='email-address'
						onChangeText={(email: string) => this.setState({ email })}
						onSubmitEditing={() => {
							this.passwordInput?.focus();
						}}
						testID='register-view-email'
						theme={theme}
					/>
					<FormTextInput
						label={I18n.t('Password')}
						containerStyle={styles.inputContainer}
						inputRef={e => {
							this.passwordInput = e;
						}}
						placeholder={I18n.t('Password')}
						returnKeyType='send'
						secureTextEntry
						onChangeText={(value: string) => this.setState({ password: value })}
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
							{`${I18n.t('Onboarding_agree_terms')}\n`}
							<Text
								style={[styles.bottomContainerTextBold, { color: themes[theme].actionTintColor }]}
								onPress={() => this.openContract('terms-of-service')}>
								{I18n.t('Terms_of_Service')}
							</Text>{' '}
							{I18n.t('and')}
							<Text
								style={[styles.bottomContainerTextBold, { color: themes[theme].actionTintColor }]}
								onPress={() => this.openContract('privacy-policy')}>
								{' '}
								{I18n.t('Privacy_Policy')}
							</Text>
						</Text>
					</View>

					{showLoginButton ? (
						<View style={styles.bottomContainer}>
							<Text style={[styles.bottomContainerText, { color: themes[theme].auxiliaryText }]}>
								{I18n.t('Do_you_have_an_account')}
							</Text>
							<Text style={[styles.bottomContainerTextBold, { color: themes[theme].actionTintColor }]} onPress={this.login}>
								{I18n.t('Login')}
							</Text>
						</View>
					) : null}
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name as string,
	Gitlab_URL: state.settings.API_Gitlab_URL as string,
	CAS_enabled: state.settings.CAS_enabled as boolean,
	CAS_login_url: state.settings.CAS_login_url as string,
	Accounts_CustomFields: state.settings.Accounts_CustomFields as string,
	Accounts_EmailVerification: state.settings.Accounts_EmailVerification as boolean,
	Accounts_ManuallyApproveNewUsers: state.settings.Accounts_ManuallyApproveNewUsers as boolean,
	showLoginButton: getShowLoginButton(state)
});

export default connect(mapStateToProps)(withTheme(RegisterView));
