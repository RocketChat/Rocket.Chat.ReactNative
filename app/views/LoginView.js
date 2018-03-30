import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, ScrollView, TouchableOpacity, SafeAreaView, WebView, Platform, LayoutAnimation } from 'react-native';
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
import random from '../utils/random';

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
			showPassword: false,
			oAuthUrl: ''
		};
		this.redirectRegex = new RegExp(`(?=.*(${ this.props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
	}

	componentDidMount() {
		this.props.open();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.services !== nextProps.services) {
			LayoutAnimation.easeInEaseOut();
		}
	}

	componentWillUnmount() {
		this.props.close();
	}

	onPressFacebook = () => {
		const { appId } = this.props.services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ this.props.server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ appId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGithub = () => {
		const { clientId } = this.props.services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ this.props.server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth(`${ endpoint }${ encodeURIComponent(params) }`);
	}

	onPressGitlab = () => {
		const { clientId } = this.props.services.gitlab;
		const endpoint = 'https://gitlab.com/oauth/authorize';
		const redirect_uri = `${ this.props.server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { clientId } = this.props.services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ this.props.server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressLinkedin = () => {
		const { clientId } = this.props.services.linkedin;
		const endpoint = 'https://www.linkedin.com/uas/oauth2/authorization';
		const redirect_uri = `${ this.props.server }/_oauth/linkedin?close`;
		const scope = 'r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressMeteor = () => {
		const { clientId } = this.props.services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ this.props.server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressTwitter = () => {
		const state = this.getOAuthState();
		const url = `${ this.props.server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth(url);
	}

	getOAuthState = () => {
		const credentialToken = random(43);
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
								<View style={styles.passInput}>
									<TextInput
										ref={(e) => { this.password = e; }}
										style={styles.input_white}
										onChangeText={password => this.setState({ password })}
										secureTextEntry={!this.state.showPassword}
										autoCorrect={false}
										returnKeyType='done'
										autoCapitalize='none'
										underlineColorAndroid='transparent'
										onSubmitEditing={this.submit}
										placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
									/>
									<Icon name='eye' style={styles.passIcon} size={20} onPress={() => { this.setState({ showPassword: !this.state.showPassword }); }}/>
								</View>
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

								<View style={styles.loginOAuthButtons} key='services'>
									{this.props.Accounts_OAuth_Facebook && this.props.services.facebook &&
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
									{this.props.Accounts_OAuth_Gitlab && this.props.services.gitlab &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.gitlabButton]}
											onPress={this.onPressGitlab}
										>
											<Icon name='gitlab' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Google && this.props.services.google &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.googleButton]}
											onPress={this.onPressGoogle}
										>
											<Icon name='google' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Linkedin && this.props.services.linkedin &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.linkedinButton]}
											onPress={this.onPressLinkedin}
										>
											<Icon name='linkedin' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Meteor && this.props.services['meteor-developer'] &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.meteorButton]}
											onPress={this.onPressMeteor}
										>
											<MaterialCommunityIcons name='meteor' size={25} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Twitter && this.props.services.twitter &&
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
						userAgent={Platform.OS === 'ios' ? 'UserAgent' : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'}
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
