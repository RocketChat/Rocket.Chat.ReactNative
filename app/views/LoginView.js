import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, ScrollView, TouchableOpacity, SafeAreaView, WebView } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Base64 } from 'js-base64';

import { loginSubmit } from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';

import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { showToast } from '../utils/info';


@connect(state => ({
	server: state.server.server,
	login: state.login,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	settings: state.settings
}), dispatch => ({
	loginSubmit: params => dispatch(loginSubmit(params))
}))
export default class LoginView extends React.Component {
	static propTypes = {
		loginSubmit: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		login: PropTypes.object,
		settings: PropTypes.object
	}

	static navigationOptions = () => ({
		title: 'Login'
	});

	constructor(props) {
		super(props);

		this.state = {
			username: '',
			password: ''
		};
	}

	submit = () => {
		const {	username, password, code } = this.state;
		if (username.trim() === '' || password.trim() === '') {
			showToast('Email or password field is empty');
			return;
		}

		this.props.loginSubmit({	username, password, code });
		Keyboard.dismiss();
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

	onPressOAuth() {
		alert('oauth!');
	}

	render() {
		return (
			[<Text>{Object.keys(this.props.settings).filter(setting => /Accounts_OAuth/.test(setting) && this.props.settings[setting]).join('\n')}</Text>,
				<WebView
					source={{ uri: 'https://github.com/login?client_id=886a7b2a1fb067b10d3a&return_to=%2Flogin%2Foauth%2Fauthorize%3Fclient_id%3D886a7b2a1fb067b10d3a%26redirect_uri%3Dhttps%253A%252F%252Fopen.rocket.chat%252F_oauth%252Fgithub%253Fclose%26scope%3Duser%253Aemail%26state%3deyJsb2dpblN0eWxlIjoicG9wdXAiLCJjcmVkZW50aWFsVG9rZW4iOiJ5YXJoWnpuZ1NHcUtIX2dKOUNPTkpzRHVFb2hhVFhpencyTDRSMHAwV3lVIiwiaXNDb3Jkb3ZhIjp0cnVlfQ%3d%3d' }}
					userAgent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'
					onNavigationStateChange={(webViewState) => {
						console.warn(webViewState.url);
					}}
				/>]
		);
	}

	// render() {
	// 	return (
	// 		<KeyboardView
	// 			contentContainerStyle={styles.container}
	// 			keyboardVerticalOffset={128}
	// 		>
	// 			<ScrollView
	// 				style={styles.loginView}
	// 				{...scrollPersistTaps}
	// 			>
	// 				<SafeAreaView>
	// 					<View style={styles.formContainer}>
	// 						<TextInput
	// 							style={styles.input_white}
	// 							onChangeText={username => this.setState({ username })}
	// 							keyboardType='email-address'
	// 							autoCorrect={false}
	// 							returnKeyType='next'
	// 							autoCapitalize='none'
	// 							underlineColorAndroid='transparent'
	// 							onSubmitEditing={() => { this.password.focus(); }}
	// 							placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email or username'}
	// 						/>
	// 						<TextInput
	// 							ref={(e) => { this.password = e; }}
	// 							style={styles.input_white}
	// 							onChangeText={password => this.setState({ password })}
	// 							secureTextEntry
	// 							autoCorrect={false}
	// 							returnKeyType='done'
	// 							autoCapitalize='none'
	// 							underlineColorAndroid='transparent'
	// 							onSubmitEditing={this.submit}
	// 							placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
	// 						/>

	// 						{this.renderTOTP()}

	// 						<TouchableOpacity
	// 							style={styles.buttonContainer}
	// 							onPress={this.submit}
	// 						>
	// 							<Text style={styles.button} accessibilityTraits='button'>LOGIN</Text>
	// 						</TouchableOpacity>

	// 						<View style={styles.loginSecondaryButtons}>
	// 							<TouchableOpacity style={styles.buttonContainer_inverted} onPress={this.register}>
	// 								<Text style={styles.button_inverted} accessibilityTraits='button'>REGISTER</Text>
	// 							</TouchableOpacity>

	// 							<TouchableOpacity style={styles.buttonContainer_inverted} onPress={this.forgotPassword}>
	// 								<Text style={styles.button_inverted} accessibilityTraits='button'>FORGOT MY PASSWORD</Text>
	// 							</TouchableOpacity>
	// 						</View>

	// 						<View style={styles.loginOAuthButtons}>
	// 							{this.props.Accounts_OAuth_Facebook &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.facebookButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<Icon name='facebook' size={20} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 							{this.props.Accounts_OAuth_Github &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.githubButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<Icon name='github' size={20} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 							{this.props.Accounts_OAuth_Gitlab &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.gitlabButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<Icon name='gitlab' size={20} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 							{this.props.Accounts_OAuth_Google &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.googleButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<Icon name='google' size={20} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 							{this.props.Accounts_OAuth_Linkedin &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.linkedinButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<Icon name='linkedin' size={20} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 							{this.props.Accounts_OAuth_Meteor &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.meteorButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<MaterialCommunityIcons name='meteor' size={25} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 							{this.props.Accounts_OAuth_Twitter &&
	// 								<TouchableOpacity
	// 									style={[styles.oauthButton, styles.twitterButton]}
	// 									onPress={this.onPressOAuth}
	// 								>
	// 									<Icon name='twitter' size={20} color='#ffffff' />
	// 								</TouchableOpacity>
	// 							}
	// 						</View>

	// 						<TouchableOpacity>
	// 							<Text style={styles.loginTermsText} accessibilityTraits='button'>
	// 								By proceeding you are agreeing to our
	// 								<Text style={styles.link} onPress={this.termsService}> Terms of Service </Text>
	// 								and
	// 								<Text style={styles.link} onPress={this.privacyPolicy}> Privacy Policy</Text>
	// 							</Text>
	// 						</TouchableOpacity>
	// 						{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
	// 					</View>
	// 					<Spinner visible={this.props.login.isFetching} textContent='Loading...' textStyle={{ color: '#FFF' }} />
	// 				</SafeAreaView>
	// 			</ScrollView>
	// 		</KeyboardView>
	// 	);
	// }
}
