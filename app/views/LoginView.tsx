import { dequal } from 'dequal';
import React from 'react';
import { Alert, Keyboard, StyleSheet, Text, View, TextInput as RNTextInput } from 'react-native';
import { connect } from 'react-redux';

import { loginRequest } from '../actions/login';
import { themes } from '../lib/constants';
import Button from '../containers/Button';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import * as HeaderButton from '../containers/HeaderButton';
import LoginServices from '../containers/LoginServices';
import { FormTextInput } from '../containers/TextInput';
import { IApplicationState, IBaseScreen } from '../definitions';
import I18n from '../i18n';
import { OutsideParamList } from '../stacks/types';
import { withTheme } from '../theme';
import sharedStyles from './Styles';
import UGCRules from '../containers/UserGeneratedContentRules';

const styles = StyleSheet.create({
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
		alignItems: 'center'
	},
	bottomContainerText: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	bottomContainerTextBold: {
		...sharedStyles.textSemibold,
		fontSize: 13
	},
	loginButton: {
		marginTop: 16
	},
	ugcContainer: {
		marginTop: 32
	}
});

interface ILoginViewProps extends IBaseScreen<OutsideParamList, 'LoginView'> {
	Site_Name: string;
	Accounts_RegistrationForm: string;
	Accounts_RegistrationForm_LinkReplacementText: string;
	Accounts_EmailOrUsernamePlaceholder: string;
	Accounts_PasswordPlaceholder: string;
	Accounts_PasswordReset: boolean;
	Accounts_ShowFormLogin: boolean;
	isFetching: boolean;
	error: {
		error: string;
	};
	failure: boolean;
	loginRequest: Function;
	inviteLinkToken: string;
}

interface ILoginViewState {
	user: string;
	password: string;
}

class LoginView extends React.Component<ILoginViewProps, ILoginViewState> {
	private passwordInput: RNTextInput | null | undefined;

	static navigationOptions = ({ route, navigation }: ILoginViewProps) => ({
		title: route?.params?.title ?? 'Rocket.Chat',
		headerRight: () => <HeaderButton.Legal testID='login-view-more' navigation={navigation} />
	});

	constructor(props: ILoginViewProps) {
		super(props);
		this.state = {
			user: props.route.params?.username ?? '',
			password: ''
		};
	}

	UNSAFE_componentWillReceiveProps(nextProps: ILoginViewProps) {
		const { error } = this.props;
		if (nextProps.failure && !dequal(error, nextProps.error)) {
			if (nextProps.error?.error === 'error-invalid-email') {
				this.resendEmailConfirmation();
			} else {
				Alert.alert(I18n.t('Oops'), I18n.t('Login_error'));
			}
		}
	}

	get showRegistrationButton() {
		const { Accounts_RegistrationForm, inviteLinkToken } = this.props;
		return Accounts_RegistrationForm === 'Public' || (Accounts_RegistrationForm === 'Secret URL' && inviteLinkToken?.length);
	}

	login = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('LoginView', { title: Site_Name });
	};

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	};

	forgotPassword = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('ForgotPasswordView', { title: Site_Name });
	};

	resendEmailConfirmation = () => {
		const { user } = this.state;
		const { navigation } = this.props;
		navigation.navigate('SendEmailConfirmationView', { user });
	};

	valid = () => {
		const { user, password } = this.state;
		return user.trim() && password.trim();
	};

	submit = () => {
		if (!this.valid()) {
			return;
		}

		const { user, password } = this.state;
		const { dispatch } = this.props;
		Keyboard.dismiss();
		dispatch(loginRequest({ user, password }));
	};

	renderUserForm = () => {
		const { user } = this.state;
		const {
			Accounts_EmailOrUsernamePlaceholder,
			Accounts_PasswordPlaceholder,
			Accounts_PasswordReset,
			Accounts_RegistrationForm_LinkReplacementText,
			isFetching,
			theme,
			Accounts_ShowFormLogin
		} = this.props;

		if (!Accounts_ShowFormLogin) {
			return null;
		}

		return (
			<>
				<Text style={[styles.title, sharedStyles.textBold, { color: themes[theme!].titleText }]}>{I18n.t('Login')}</Text>
				<FormTextInput
					label={I18n.t('Username_or_email')}
					containerStyle={styles.inputContainer}
					placeholder={Accounts_EmailOrUsernamePlaceholder || I18n.t('Username_or_email')}
					keyboardType='email-address'
					returnKeyType='next'
					onChangeText={(value: string) => this.setState({ user: value })}
					onSubmitEditing={() => {
						this.passwordInput?.focus();
					}}
					testID='login-view-email'
					textContentType='username'
					autoComplete='username'
					value={user}
				/>
				<FormTextInput
					label={I18n.t('Password')}
					containerStyle={styles.inputContainer}
					inputRef={e => {
						this.passwordInput = e;
					}}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='send'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={(value: string) => this.setState({ password: value })}
					testID='login-view-password'
					textContentType='password'
					autoComplete='password'
				/>
				<Button
					title={I18n.t('Login')}
					type='primary'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
					style={styles.loginButton}
				/>
				{Accounts_PasswordReset && (
					<Button
						title={I18n.t('Forgot_password')}
						type='secondary'
						onPress={this.forgotPassword}
						testID='login-view-forgot-password'
						color={themes[theme!].auxiliaryText}
						fontSize={14}
					/>
				)}
				{this.showRegistrationButton ? (
					<View style={styles.bottomContainer}>
						<Text style={[styles.bottomContainerText, { color: themes[theme!].auxiliaryText }]}>
							{I18n.t('Dont_Have_An_Account')}
						</Text>
						<Text
							style={[styles.bottomContainerTextBold, { color: themes[theme!].actionTintColor }]}
							onPress={this.register}
							testID='login-view-register'
						>
							{I18n.t('Create_account')}
						</Text>
					</View>
				) : (
					<Text style={[styles.registerDisabled, { color: themes[theme!].auxiliaryText }]}>
						{Accounts_RegistrationForm_LinkReplacementText}
					</Text>
				)}
				<UGCRules styleContainer={styles.ugcContainer} />
			</>
		);
	};

	render() {
		const { Accounts_ShowFormLogin } = this.props;

		return (
			<FormContainer testID='login-view'>
				<FormContainerInner>
					<LoginServices separator={Accounts_ShowFormLogin} />
					{this.renderUserForm()}
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name as string,
	Accounts_ShowFormLogin: state.settings.Accounts_ShowFormLogin as boolean,
	Accounts_RegistrationForm: state.settings.Accounts_RegistrationForm as string,
	Accounts_RegistrationForm_LinkReplacementText: state.settings.Accounts_RegistrationForm_LinkReplacementText as string,
	isFetching: state.login.isFetching,
	failure: state.login.failure,
	error: state.login.error && state.login.error.data,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder as string,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder as string,
	Accounts_PasswordReset: state.settings.Accounts_PasswordReset as boolean,
	inviteLinkToken: state.inviteLinks.token
});

export default connect(mapStateToProps)(withTheme(LoginView));
