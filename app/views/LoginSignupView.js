import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, ScrollView, TouchableOpacity, LayoutAnimation, Image, StyleSheet, SafeAreaView
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Base64 } from 'js-base64';

import { open as openAction, close as closeAction } from '../actions/login';
import LoggedView from './View';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import random from '../utils/random';
import Button from '../containers/Button';
import Loading from '../containers/Loading';
import I18n from '../i18n';
import store from '../lib/createStore';

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	header: {
		fontSize: 20
	},
	servicesContainer: {
		backgroundColor: '#F7F8FA',
		width: '100%',
		borderRadius: 2,
		padding: 16,
		paddingTop: 20,
		marginBottom: 40
	},
	servicesTitle: {
		color: '#292E35',
		textAlign: 'left',
		fontWeight: '700'
	},
	planetImage: {
		width: 210,
		height: 171,
		marginVertical: 20
	}
});

let OAuthView = null;
let LoginView = null;
let RegisterView = null;

@connect(state => ({
	server: state.server.server,
	isFetching: state.login.isFetching,
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
	open: () => dispatch(openAction()),
	close: () => dispatch(closeAction())
}))
/** @extends React.Component */
export default class LoginSignupView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		open: PropTypes.func.isRequired,
		close: PropTypes.func.isRequired,
		isFetching: PropTypes.bool,
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

	constructor(props) {
		super('LoginSignupView', props);
	}

	componentDidMount() {
		const { open } = this.props;
		open();
	}

	componentWillReceiveProps(nextProps) {
		const { services } = this.props;
		if (services !== nextProps.services) {
			LayoutAnimation.easeInEaseOut();
		}
	}

	componentWillUnmount() {
		const { close } = this.props;
		close();
	}

	onPressFacebook = () => {
		const { services, server } = this.props;
		const { appId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ appId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGithub = () => {
		const { services, server } = this.props;
		const { clientId } = services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth(`${ endpoint }${ encodeURIComponent(params) }`);
	}

	onPressGitlab = () => {
		const { services, server } = this.props;
		const { clientId } = services.gitlab;
		const endpoint = 'https://gitlab.com/oauth/authorize';
		const redirect_uri = `${ server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { services, server } = this.props;
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressLinkedin = () => {
		const { services, server } = this.props;
		const { clientId } = services.linkedin;
		const endpoint = 'https://www.linkedin.com/uas/oauth2/authorization';
		const redirect_uri = `${ server }/_oauth/linkedin?close`;
		const scope = 'r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressMeteor = () => {
		const { services, server } = this.props;
		const { clientId } = services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressTwitter = () => {
		const { server } = this.props;
		const state = this.getOAuthState();
		const url = `${ server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth(url);
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = (oAuthUrl) => {
		if (OAuthView == null) {
			OAuthView = require('./OAuthView').default;
			Navigation.registerComponent('OAuthView', () => OAuthView, store, Provider);
		}

		const { navigator } = this.props;
		navigator.showModal({
			screen: 'OAuthView',
			title: 'OAuth',
			passProps: {
				oAuthUrl
			}
		});
	}

	login = () => {
		if (LoginView == null) {
			LoginView = require('./LoginView').default;
			Navigation.registerComponent('LoginView', () => LoginView, store, Provider);
		}

		const { navigator, server } = this.props;
		navigator.push({
			screen: 'LoginView',
			title: server,
			backButtonTitle: ''
		});
	}

	register = () => {
		if (RegisterView == null) {
			RegisterView = require('./RegisterView').default;
			Navigation.registerComponent('RegisterView', () => RegisterView, store, Provider);
		}

		const { navigator, server } = this.props;
		navigator.push({
			screen: 'RegisterView',
			title: server,
			backButtonTitle: ''
		});
	}

	renderServices = () => {
		const {
			services, Accounts_OAuth_Facebook, Accounts_OAuth_Github, Accounts_OAuth_Gitlab, Accounts_OAuth_Google, Accounts_OAuth_Linkedin, Accounts_OAuth_Meteor, Accounts_OAuth_Twitter
		} = this.props;

		if (!Object.keys(services).length) {
			return null;
		}

		return (
			<View style={styles.servicesContainer}>
				<Text style={styles.servicesTitle}>
					{I18n.t('Or_continue_using_social_accounts')}
				</Text>
				<View style={sharedStyles.loginOAuthButtons} key='services'>
					{Accounts_OAuth_Facebook && services.facebook
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.facebookButton]}
								onPress={this.onPressFacebook}
							>
								<Icon name='facebook' size={20} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
					{Accounts_OAuth_Github && services.github
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.githubButton]}
								onPress={this.onPressGithub}
							>
								<Icon name='github' size={20} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
					{Accounts_OAuth_Gitlab && services.gitlab
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.gitlabButton]}
								onPress={this.onPressGitlab}
							>
								<Icon name='gitlab' size={20} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
					{Accounts_OAuth_Google && services.google
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.googleButton]}
								onPress={this.onPressGoogle}
							>
								<Icon name='google' size={20} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
					{Accounts_OAuth_Linkedin && services.linkedin
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.linkedinButton]}
								onPress={this.onPressLinkedin}
							>
								<Icon name='linkedin' size={20} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
					{Accounts_OAuth_Meteor && services['meteor-developer']
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.meteorButton]}
								onPress={this.onPressMeteor}
							>
								<MaterialCommunityIcons name='meteor' size={25} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
					{Accounts_OAuth_Twitter && services.twitter
						? (
							<TouchableOpacity
								style={[sharedStyles.oauthButton, sharedStyles.twitterButton]}
								onPress={this.onPressTwitter}
							>
								<Icon name='twitter' size={20} color='#ffffff' />
							</TouchableOpacity>
						)
						: null
					}
				</View>
			</View>
		);
	}

	render() {
		const { isFetching } = this.props;

		return (
			<ScrollView
				style={[sharedStyles.container, sharedStyles.containerScrollView]}
				{...scrollPersistTaps}
			>
				<SafeAreaView style={sharedStyles.container} testID='welcome-view'>
					<View style={styles.container}>
						<Text style={[sharedStyles.loginText, styles.header, { color: '#81848A' }]}>{I18n.t('Welcome_title_pt_1')}</Text>
						<Text style={[sharedStyles.loginText, styles.header]}>{I18n.t('Welcome_title_pt_2')}</Text>
						<Image style={styles.planetImage} source={{ uri: 'new_server' }} />
						<Button
							title={I18n.t('I_have_an_account')}
							type='primary'
							onPress={() => this.login()}
							testID='welcome-view-login'
						/>
						<Button
							title={I18n.t('Create_account')}
							type='secondary'
							onPress={() => this.register()}
							testID='welcome-view-register'
						/>
						{this.renderServices()}
					</View>
					<Loading visible={isFetching} />
				</SafeAreaView>
			</ScrollView>
		);
	}
}
