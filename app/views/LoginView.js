import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, ScrollView, TouchableOpacity, SafeAreaView, WebView } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Base64 } from 'js-base64';
import Modal from 'react-native-modal';

import { loginSubmit, open, close } from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';

import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { showToast } from '../utils/info';

@connect(state => ({
	server: state.server.server,
	login: state.login,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	Accounts_OAuth_Facebook: state.settings.Accounts_OAuth_Facebook,
	Accounts_OAuth_Github: state.settings.Accounts_OAuth_Github,
	Accounts_OAuth_Gitlab: state.settings.Accounts_OAuth_Gitlab,
	Accounts_OAuth_Google: state.settings.Accounts_OAuth_Google,
	Accounts_OAuth_Linkedin: state.settings.Accounts_OAuth_Linkedin,
	Accounts_OAuth_Meteor: state.settings.Accounts_OAuth_Meteor,
	Accounts_OAuth_Twitter: state.settings.Accounts_OAuth_Twitter,
	services: state.login.services
}), dispatch => ({
	loginSubmit: params => dispatch(loginSubmit(params)),
	open: () => dispatch(open()),
	close: () => dispatch(close())
}))
export default class LoginView extends React.Component {
	static propTypes = {
		loginSubmit: PropTypes.func.isRequired,
		open: PropTypes.func.isRequired,
		close: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		login: PropTypes.object,
		server: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.bool,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_OAuth_Facebook: PropTypes.bool,
		Accounts_OAuth_Github: PropTypes.bool,
		Accounts_OAuth_Gitlab: PropTypes.bool,
		Accounts_OAuth_Google: PropTypes.bool,
		Accounts_OAuth_Linkedin: PropTypes.bool,
		Accounts_OAuth_Meteor: PropTypes.bool,
		Accounts_OAuth_Twitter: PropTypes.bool,
		services: PropTypes.object
	}

	static navigationOptions = () => ({
		title: 'Login'
	});

	constructor(props) {
		super(props);

		this.state = {
			username: '',
			password: '',
			modalVisible: false,
			oAuthUrl: ''
		};
		this.redirectRegex = new RegExp(`(?=.*(${ this.props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
	}

	componentWillMount() {
		this.props.open();
	}

	componentWillUnmount() {
		this.props.close();
	}

	onPressOAuth = () => {
		alert('OAuth here :)')
	}

	onPressFacebook = () => {
		const { appId } = this.props.services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ this.props.server }/_oauth/facebook?close`;
		const state = this.getOAuthState();
		const params = `?client_id=${ appId }&redirect_uri=${ redirect_uri }&display=touch&scope=email&state=${ state }`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { clientId } = this.props.services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ this.props.server }/_oauth/google?close`;
		const state = this.getOAuthState();
		const params = `?response_type=code&client_id=${ clientId }&scope=email&redirect_uri=${ redirect_uri }&state=${ state }`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressTwitter = () => {
		const state = this.getOAuthState();
		const url = `${ this.props.server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth(url);
	}

	onPressGithub = () => {
		const { clientId } = this.props.services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ this.props.server }/_oauth/github/close`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=user:email&state=${ state }`;
		const url = `${ endpoint }${ encodeURIComponent(params) }`;
		this.openOAuth(url);
	}

	getOAuthState = () => {
		const credentialToken = 'VxSCiW7wBOTPA9p-6UPmXD21OlJCD6Dnaauy_7Ut_NK';
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = (oAuthUrl) => {
		this.setState({ oAuthUrl, modalVisible: true });
	}

	submit = () => {
		const {	username, password, code } = this.state;
		if (username.trim() === '' || password.trim() === '') {
			showToast('Email or password field is empty');
			return;
		}

		this.props.loginSubmit({ username, password, code });
		Keyboard.dismiss();
	}

	submitOAuth = (code, credentialToken) => {
		this.props.loginSubmit({ code, credentialToken });
	}

	register = () => {
		this.props.navigation.navigate('Register');
	}

	termsService = () => {
		this.props.navigation.navigate('TermsService');
	}

	privacyPolicy = () => {
		this.props.navigation.navigate('PrivacyPolicy');
	}

	forgotPassword = () => {
		this.props.navigation.navigate('ForgotPassword');
	}

	closeOAuth = () => {
		this.setState({ modalVisible: false });
	}

	renderTOTP = () => {
		if (/totp/ig.test(this.props.login.error.error)) {
			return (
				<TextInput
					ref={ref => this.codeInput = ref}
					style={styles.input_white}
					onChangeText={code => this.setState({ code })}
					keyboardType='numeric'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					placeholder='Code'
					underlineColorAndroid='transparent'
				/>
			);
		}
		return null;
	}

	render() {
		return (
			[
				<KeyboardView
					contentContainerStyle={styles.container}
					keyboardVerticalOffset={128}
					key='login-view'
				>
					<ScrollView
						style={styles.loginView}
						{...scrollPersistTaps}
					>
						<SafeAreaView>
							<View style={styles.formContainer}>
								<TextInput
									style={styles.input_white}
									onChangeText={username => this.setState({ username })}
									keyboardType='email-address'
									autoCorrect={false}
									returnKeyType='next'
									autoCapitalize='none'
									underlineColorAndroid='transparent'
									onSubmitEditing={() => { this.password.focus(); }}
									placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email or username'}
								/>
								<TextInput
									ref={(e) => { this.password = e; }}
									style={styles.input_white}
									onChangeText={password => this.setState({ password })}
									secureTextEntry
									autoCorrect={false}
									returnKeyType='done'
									autoCapitalize='none'
									underlineColorAndroid='transparent'
									onSubmitEditing={this.submit}
									placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
								/>

								{this.renderTOTP()}

								<TouchableOpacity
									style={styles.buttonContainer}
									onPress={this.submit}
								>
									<Text style={styles.button} accessibilityTraits='button'>LOGIN</Text>
								</TouchableOpacity>

								<View style={styles.loginSecondaryButtons}>
									<TouchableOpacity style={styles.buttonContainer_inverted} onPress={this.register}>
										<Text style={styles.button_inverted} accessibilityTraits='button'>REGISTER</Text>
									</TouchableOpacity>

									<TouchableOpacity style={styles.buttonContainer_inverted} onPress={this.forgotPassword}>
										<Text style={styles.button_inverted} accessibilityTraits='button'>FORGOT MY PASSWORD</Text>
									</TouchableOpacity>
								</View>

								<View style={styles.loginOAuthButtons}>
									{this.props.Accounts_OAuth_Facebook &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.facebookButton]}
											onPress={this.onPressFacebook}
										>
											<Icon name='facebook' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Github && this.props.services.github &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.githubButton]}
											onPress={this.onPressGithub}
										>
											<Icon name='github' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Gitlab &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.gitlabButton]}
											onPress={this.onPressOAuth}
										>
											<Icon name='gitlab' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Google &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.googleButton]}
											onPress={this.onPressGoogle}
										>
											<Icon name='google' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Linkedin &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.linkedinButton]}
											onPress={this.onPressOAuth}
										>
											<Icon name='linkedin' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Meteor &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.meteorButton]}
											onPress={this.onPressOAuth}
										>
											<MaterialCommunityIcons name='meteor' size={25} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Twitter &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.twitterButton]}
											onPress={this.onPressTwitter}
										>
											<Icon name='twitter' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
								</View>

								<TouchableOpacity>
									<Text style={styles.loginTermsText} accessibilityTraits='button'>
										By proceeding you are agreeing to our
										<Text style={styles.link} onPress={this.termsService}> Terms of Service </Text>
										and
										<Text style={styles.link} onPress={this.privacyPolicy}> Privacy Policy</Text>
									</Text>
								</TouchableOpacity>
								{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
							</View>
							<Spinner visible={this.props.login.isFetching} textContent='Loading...' textStyle={{ color: '#FFF' }} />
						</SafeAreaView>
					</ScrollView>
				</KeyboardView>,
				<Modal
					key='modal-oauth'
					visible={this.state.modalVisible}
					animationType='slide'
					style={styles.oAuthModal}
					onBackButtonPress={this.closeOAuth}
					useNativeDriver
				>
					<WebView
						source={{ uri: this.state.oAuthUrl }}
						userAgent='UserAgent'
						onNavigationStateChange={(webViewState) => {
							const url = decodeURIComponent(webViewState.url);
							if (this.redirectRegex.test(url)) {
								const parts = url.split('#');
								const credentials = JSON.parse(parts[1]);
								this.props.loginSubmit({ oauth: { ...credentials } });
								this.setState({ modalVisible: false });
							}
						}}
					/>
					<Icon name='close' size={30} style={styles.closeOAuth} onPress={this.closeOAuth} />
				</Modal>
			]
		);
	}
}
