import React from 'react';
import {
	View, StyleSheet, Text, Animated, Easing
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Base64 } from 'js-base64';
import * as AppleAuthentication from 'expo-apple-authentication';

import { withTheme } from '../theme';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';
import Button from './Button';
import OrSeparator from './OrSeparator';
import Touch from '../utils/touch';
import I18n from '../i18n';
import random from '../utils/random';
import { logEvent, events } from '../utils/log';
import RocketChat from '../lib/rocketchat';
import { CustomIcon } from '../lib/Icons';

const BUTTON_HEIGHT = 48;
const SERVICE_HEIGHT = 58;
const BORDER_RADIUS = 2;
const SERVICES_COLLAPSED_HEIGHT = 174;

const styles = StyleSheet.create({
	serviceButton: {
		borderRadius: BORDER_RADIUS,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: BORDER_RADIUS,
		width: '100%',
		height: BUTTON_HEIGHT,
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
	options: {
		marginBottom: 0
	}
});

class LoginServices extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		services: PropTypes.object,
		Gitlab_URL: PropTypes.string,
		CAS_enabled: PropTypes.bool,
		CAS_login_url: PropTypes.string,
		separator: PropTypes.bool,
		theme: PropTypes.string
	}

	static defaultProps = {
		separator: true
	}

	state = {
		collapsed: true,
		servicesHeight: new Animated.Value(SERVICES_COLLAPSED_HEIGHT)
	}

	onPressFacebook = () => {
		logEvent(events.ENTER_WITH_FACEBOOK);
		const { services, server } = this.props;
		const { clientId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressGithub = () => {
		logEvent(events.ENTER_WITH_GITHUB);
		const { services, server } = this.props;
		const { clientId } = services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth({ url: `${ endpoint }${ encodeURIComponent(params) }` });
	}

	onPressGitlab = () => {
		logEvent(events.ENTER_WITH_GITLAB);
		const { services, server, Gitlab_URL } = this.props;
		const { clientId } = services.gitlab;
		const baseURL = Gitlab_URL ? Gitlab_URL.trim().replace(/\/*$/, '') : 'https://gitlab.com';
		const endpoint = `${ baseURL }/oauth/authorize`;
		const redirect_uri = `${ server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressGoogle = () => {
		logEvent(events.ENTER_WITH_GOOGLE);
		const { services, server } = this.props;
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressLinkedin = () => {
		logEvent(events.ENTER_WITH_LINKEDIN);
		const { services, server } = this.props;
		const { clientId } = services.linkedin;
		const endpoint = 'https://www.linkedin.com/oauth/v2/authorization';
		const redirect_uri = `${ server }/_oauth/linkedin?close`;
		const scope = 'r_liteprofile,r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressMeteor = () => {
		logEvent(events.ENTER_WITH_METEOR);
		const { services, server } = this.props;
		const { clientId } = services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressTwitter = () => {
		logEvent(events.ENTER_WITH_TWITTER);
		const { server } = this.props;
		const state = this.getOAuthState();
		const url = `${ server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth({ url });
	}

	onPressWordpress = () => {
		logEvent(events.ENTER_WITH_WORDPRESS);
		const { services, server } = this.props;
		const { clientId, serverURL } = services.wordpress;
		const endpoint = `${ serverURL }/oauth/authorize`;
		const redirect_uri = `${ server }/_oauth/wordpress?close`;
		const scope = 'openid';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressCustomOAuth = (loginService) => {
		logEvent(events.ENTER_WITH_CUSTOM_OAUTH);
		const { server } = this.props;
		const {
			serverURL, authorizePath, clientId, scope, service
		} = loginService;
		const redirectUri = `${ server }/_oauth/${ service }`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirectUri }&response_type=code&state=${ state }&scope=${ scope }`;
		const domain = `${ serverURL }`;
		const absolutePath = `${ authorizePath }${ params }`;
		const url = absolutePath.includes(domain) ? absolutePath : domain + absolutePath;
		this.openOAuth({ url });
	}

	onPressSaml = (loginService) => {
		logEvent(events.ENTER_WITH_SAML);
		const { server } = this.props;
		const {	clientConfig } = loginService;
		const {	provider } = clientConfig;
		const ssoToken = random(17);
		const url = `${ server }/_saml/authorize/${ provider }/${ ssoToken }`;
		this.openOAuth({ url, ssoToken, authType: 'saml' });
	}

	onPressCas = () => {
		logEvent(events.ENTER_WITH_CAS);
		const { server, CAS_login_url } = this.props;
		const ssoToken = random(17);
		const url = `${ CAS_login_url }?service=${ server }/_cas/${ ssoToken }`;
		this.openOAuth({ url, ssoToken, authType: 'cas' });
	}

	onPressAppleLogin = async() => {
		logEvent(events.ENTER_WITH_APPLE);
		try {
			const { fullName, email, identityToken } = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL
				]
			});

			await RocketChat.loginOAuthOrSso({ fullName, email, identityToken });
		} catch {
			logEvent(events.ENTER_WITH_APPLE_F);
		}
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = ({ url, ssoToken, authType = 'oauth' }) => {
		const { navigation } = this.props;
		navigation.navigate('AuthenticationWebView', { url, authType, ssoToken });
	}

	transitionServicesTo = (height) => {
		const { servicesHeight } = this.state;
		if (this._animation) {
			this._animation.stop();
		}
		this._animation = Animated.timing(servicesHeight, {
			toValue: height,
			duration: 300,
			easing: Easing.easeOutCubic
		}).start();
	}

	toggleServices = () => {
		const { collapsed } = this.state;
		const { services } = this.props;
		const { length } = Object.values(services);
		if (collapsed) {
			this.transitionServicesTo(SERVICE_HEIGHT * length);
		} else {
			this.transitionServicesTo(SERVICES_COLLAPSED_HEIGHT);
		}
		this.setState(prevState => ({ collapsed: !prevState.collapsed }));
	}

	getSocialOauthProvider = (name) => {
		const oauthProviders = {
			facebook: this.onPressFacebook,
			github: this.onPressGithub,
			gitlab: this.onPressGitlab,
			google: this.onPressGoogle,
			linkedin: this.onPressLinkedin,
			'meteor-developer': this.onPressMeteor,
			twitter: this.onPressTwitter,
			wordpress: this.onPressWordpress
		};
		return oauthProviders[name];
	}

	renderServicesSeparator = () => {
		const { collapsed } = this.state;
		const { services, separator, theme } = this.props;
		const { length } = Object.values(services);

		if (length > 3 && separator) {
			return (
				<>
					<Button
						title={collapsed ? I18n.t('Onboarding_more_options') : I18n.t('Onboarding_less_options')}
						type='secondary'
						onPress={this.toggleServices}
						theme={theme}
						style={styles.options}
						color={themes[theme].actionTintColor}
					/>
					<OrSeparator theme={theme} />
				</>
			);
		}
		if (length > 0 && separator) {
			return <OrSeparator theme={theme} />;
		}
		return null;
	}

	renderItem = (service) => {
		const { CAS_enabled, theme } = this.props;
		let { name } = service;
		name = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `${ name }-monochromatic`;
		const isSaml = service.service === 'saml';
		let onPress = () => {};

		switch (service.authType) {
			case 'oauth': {
				onPress = this.getSocialOauthProvider(service.name);
				break;
			}
			case 'oauth_custom': {
				onPress = () => this.onPressCustomOAuth(service);
				break;
			}
			case 'saml': {
				onPress = () => this.onPressSaml(service);
				break;
			}
			case 'cas': {
				onPress = () => this.onPressCas();
				break;
			}
			case 'apple': {
				onPress = () => this.onPressAppleLogin();
				break;
			}
			default:
				break;
		}

		name = name.charAt(0).toUpperCase() + name.slice(1);
		let buttonText;
		if (isSaml || (service.service === 'cas' && CAS_enabled)) {
			buttonText = <Text style={[styles.serviceName, isSaml && { color: service.buttonLabelColor }]}>{name}</Text>;
		} else {
			buttonText = (
				<>
					{I18n.t('Continue_with')} <Text style={styles.serviceName}>{name}</Text>
				</>
			);
		}

		const backgroundColor = isSaml && service.buttonColor ? service.buttonColor : themes[theme].chatComponentBackground;

		return (
			<Touch
				key={service.name}
				onPress={onPress}
				style={[styles.serviceButton, { backgroundColor }]}
				theme={theme}
				activeOpacity={0.5}
				underlayColor={themes[theme].buttonText}
			>
				<View style={styles.serviceButtonContainer}>
					{service.authType === 'oauth' || service.authType === 'apple' ? <CustomIcon name={icon} size={24} color={themes[theme].titleText} style={styles.serviceIcon} /> : null}
					<Text style={[styles.serviceText, { color: themes[theme].titleText }]}>{buttonText}</Text>
				</View>
			</Touch>
		);
	}

	render() {
		const { servicesHeight } = this.state;
		const { services, separator } = this.props;
		const { length } = Object.values(services);
		const style = {
			overflow: 'hidden',
			height: servicesHeight
		};

		if (length > 3 && separator) {
			return (
				<>
					<Animated.View style={style}>
						{Object.values(services).map(service => this.renderItem(service))}
					</Animated.View>
					{this.renderServicesSeparator()}
				</>
			);
		}
		return (
			<>
				{Object.values(services).map(service => this.renderItem(service))}
				{this.renderServicesSeparator()}
			</>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	Gitlab_URL: state.settings.API_Gitlab_URL,
	CAS_enabled: state.settings.CAS_enabled,
	CAS_login_url: state.settings.CAS_login_url,
	services: state.login.services
});

export default connect(mapStateToProps)(withTheme(LoginServices));
