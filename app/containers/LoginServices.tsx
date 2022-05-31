import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { shallowEqual } from 'react-redux';
import { Base64 } from 'js-base64';
import * as AppleAuthentication from 'expo-apple-authentication';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../theme';
import sharedStyles from '../views/Styles';
import Button from './Button';
import OrSeparator from './OrSeparator';
import Touch from '../utils/touch';
import I18n from '../i18n';
import random from '../utils/random';
import { events, logEvent } from '../utils/log';
import { CustomIcon, TIconsName } from './CustomIcon';
import { IServices } from '../selectors/login';
import { OutsideParamList } from '../stacks/types';
import { Services } from '../lib/services';
import { useAppSelector } from '../lib/hooks';

const BUTTON_HEIGHT = 48;
const SERVICE_HEIGHT = 58;
const BORDER_RADIUS = 2;
const SERVICES_COLLAPSED_HEIGHT = 174;

const LOGIN_STYPE_POPUP = 'popup';
const LOGIN_STYPE_REDIRECT = 'redirect';

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

interface IOpenOAuth {
	url: string;
	ssoToken?: string;
	authType?: string;
}

interface IItemService {
	name: string;
	service: string;
	authType: string;
	buttonColor: string;
	buttonLabelColor: string;
	clientConfig: { provider: string };
	serverURL: string;
	authorizePath: string;
	clientId: string;
	scope: string;
}

interface IOauthProvider {
	[key: string]: () => void;
	facebook: () => void;
	github: () => void;
	gitlab: () => void;
	google: () => void;
	linkedin: () => void;
	'meteor-developer': () => void;
	twitter: () => void;
	wordpress: () => void;
}

const LoginServices = ({ separator }: { separator: boolean }): React.ReactElement => {
	const [collapsed, setCollapsed] = useState(true);

	const navigation = useNavigation<StackNavigationProp<OutsideParamList>>();
	const { theme, colors } = useTheme();

	const { Gitlab_URL, CAS_enabled, CAS_login_url } = useAppSelector(
		state => ({
			Gitlab_URL: state.settings.API_Gitlab_URL as string,
			CAS_enabled: state.settings.CAS_enabled as boolean,
			CAS_login_url: state.settings.CAS_login_url as string
		}),
		shallowEqual
	);
	const server = useAppSelector(state => state.server.server);
	const services = useAppSelector(state => state.login.services as IServices);
	const { length } = Object.values(services);

	const heightButtons = useSharedValue(SERVICES_COLLAPSED_HEIGHT);

	const animatedStyle = useAnimatedStyle(() => ({
		overflow: 'hidden',
		height: withTiming(heightButtons.value, { duration: 300, easing: Easing.inOut(Easing.quad) })
	}));

	const onPressFacebook = () => {
		logEvent(events.ENTER_WITH_FACEBOOK);
		const { clientId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${server}/_oauth/facebook?close`;
		const scope = 'email';
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&display=touch`;
		openOAuth({ url: `${endpoint}${params}` });
	};

	const onPressGithub = () => {
		logEvent(events.ENTER_WITH_GITHUB);
		const { clientId } = services.github;
		const endpoint = `https://github.com/login?client_id=${clientId}&return_to=${encodeURIComponent('/login/oauth/authorize')}`;
		const redirect_uri = `${server}/_oauth/github?close`;
		const scope = 'user:email';
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
		openOAuth({ url: `${endpoint}${encodeURIComponent(params)}` });
	};

	const onPressGitlab = () => {
		logEvent(events.ENTER_WITH_GITLAB);
		const { clientId } = services.gitlab;
		const baseURL = Gitlab_URL ? Gitlab_URL.trim().replace(/\/*$/, '') : 'https://gitlab.com';
		const endpoint = `${baseURL}/oauth/authorize`;
		const redirect_uri = `${server}/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
		openOAuth({ url: `${endpoint}${params}` });
	};

	const onPressGoogle = () => {
		logEvent(events.ENTER_WITH_GOOGLE);
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${server}/_oauth/google?close`;
		const scope = 'email';
		const state = getOAuthState(LOGIN_STYPE_REDIRECT);
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
		Linking.openURL(`${endpoint}${params}`);
	};

	const onPressLinkedin = () => {
		logEvent(events.ENTER_WITH_LINKEDIN);
		const { clientId } = services.linkedin;
		const endpoint = 'https://www.linkedin.com/oauth/v2/authorization';
		const redirect_uri = `${server}/_oauth/linkedin?close`;
		const scope = 'r_liteprofile,r_emailaddress';
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
		openOAuth({ url: `${endpoint}${params}` });
	};

	const onPressMeteor = () => {
		logEvent(events.ENTER_WITH_METEOR);
		const { clientId } = services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${server}/_oauth/meteor-developer`;
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&state=${state}&response_type=code`;
		openOAuth({ url: `${endpoint}${params}` });
	};

	const onPressTwitter = () => {
		logEvent(events.ENTER_WITH_TWITTER);
		const state = getOAuthState();
		const url = `${server}/_oauth/twitter/?requestTokenAndRedirect=true&state=${state}`;
		openOAuth({ url });
	};

	const onPressWordpress = () => {
		logEvent(events.ENTER_WITH_WORDPRESS);
		const { clientId, serverURL } = services.wordpress;
		const endpoint = `${serverURL}/oauth/authorize`;
		const redirect_uri = `${server}/_oauth/wordpress?close`;
		const scope = 'openid';
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
		openOAuth({ url: `${endpoint}${params}` });
	};

	const onPressCustomOAuth = (loginService: IItemService) => {
		logEvent(events.ENTER_WITH_CUSTOM_OAUTH);
		const { serverURL, authorizePath, clientId, scope, service } = loginService;
		const redirectUri = `${server}/_oauth/${service}`;
		const state = getOAuthState();
		const params = `?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${scope}`;
		const domain = `${serverURL}`;
		const absolutePath = `${authorizePath}${params}`;
		const url = absolutePath.includes(domain) ? absolutePath : domain + absolutePath;
		openOAuth({ url });
	};

	const onPressSaml = (loginService: IItemService) => {
		logEvent(events.ENTER_WITH_SAML);
		const { clientConfig } = loginService;
		const { provider } = clientConfig;
		const ssoToken = random(17);
		const url = `${server}/_saml/authorize/${provider}/${ssoToken}`;
		openOAuth({ url, ssoToken, authType: 'saml' });
	};

	const onPressCas = () => {
		logEvent(events.ENTER_WITH_CAS);
		const ssoToken = random(17);
		const url = `${CAS_login_url}?service=${server}/_cas/${ssoToken}`;
		openOAuth({ url, ssoToken, authType: 'cas' });
	};

	const onPressAppleLogin = async () => {
		logEvent(events.ENTER_WITH_APPLE);
		try {
			const { fullName, email, identityToken } = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL
				]
			});
			await Services.loginOAuthOrSso({ fullName, email, identityToken });
		} catch {
			logEvent(events.ENTER_WITH_APPLE_F);
		}
	};

	const getOAuthState = (loginStyle = LOGIN_STYPE_POPUP) => {
		const credentialToken = random(43);
		let obj: {
			loginStyle: string;
			credentialToken: string;
			isCordova: boolean;
			redirectUrl?: string;
		} = { loginStyle, credentialToken, isCordova: true };
		if (loginStyle === LOGIN_STYPE_REDIRECT) {
			obj = {
				...obj,
				redirectUrl: 'rocketchat://auth'
			};
		}
		return Base64.encodeURI(JSON.stringify(obj));
	};

	const openOAuth = ({ url, ssoToken, authType = 'oauth' }: IOpenOAuth) => {
		navigation.navigate('AuthenticationWebView', { url, authType, ssoToken });
	};

	const getSocialOauthProvider = (name: string) => {
		const oauthProviders: IOauthProvider = {
			facebook: onPressFacebook,
			github: onPressGithub,
			gitlab: onPressGitlab,
			google: onPressGoogle,
			linkedin: onPressLinkedin,
			'meteor-developer': onPressMeteor,
			twitter: onPressTwitter,
			wordpress: onPressWordpress
		};
		return oauthProviders[name];
	};

	const renderServicesSeparator = () => {
		const { length } = Object.values(services);

		if (length > 3 && separator) {
			return (
				<>
					<Button
						title={collapsed ? I18n.t('Onboarding_more_options') : I18n.t('Onboarding_less_options')}
						type='secondary'
						onPress={() => {
							heightButtons.value = collapsed ? SERVICE_HEIGHT * length : SERVICES_COLLAPSED_HEIGHT;
							setCollapsed(prevState => !prevState);
						}}
						style={styles.options}
						color={colors.actionTintColor}
					/>
					<OrSeparator theme={theme} />
				</>
			);
		}
		if (length > 0 && separator) {
			return <OrSeparator theme={theme} />;
		}
		return null;
	};

	const renderItem = (service: IItemService) => {
		let { name } = service;
		name = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `${name}-monochromatic` as TIconsName;
		const isSaml = service.service === 'saml';
		let onPress = () => {};

		switch (service.authType) {
			case 'oauth': {
				onPress = getSocialOauthProvider(service.name);
				break;
			}
			case 'oauth_custom': {
				onPress = () => onPressCustomOAuth(service);
				break;
			}
			case 'saml': {
				onPress = () => onPressSaml(service);
				break;
			}
			case 'cas': {
				onPress = () => onPressCas();
				break;
			}
			case 'apple': {
				onPress = () => onPressAppleLogin();
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

		const backgroundColor = isSaml && service.buttonColor ? service.buttonColor : colors.chatComponentBackground;

		return (
			<Touch
				key={service.name}
				onPress={onPress}
				style={[styles.serviceButton, { backgroundColor }]}
				theme={theme}
				activeOpacity={0.5}
				underlayColor={colors.buttonText}>
				<View style={styles.serviceButtonContainer}>
					{service.authType === 'oauth' || service.authType === 'apple' ? (
						<CustomIcon name={icon} size={24} color={colors.titleText} style={styles.serviceIcon} />
					) : null}
					<Text style={[styles.serviceText, { color: colors.titleText }]}>{buttonText}</Text>
				</View>
			</Touch>
		);
	};

	if (length > 3 && separator) {
		return (
			<>
				<Animated.View style={animatedStyle}>
					{Object.values(services).map((service: IItemService) => renderItem(service))}
				</Animated.View>
				{renderServicesSeparator()}
			</>
		);
	}
	return (
		<>
			{Object.values(services).map((service: IItemService) => renderItem(service))}
			{renderServicesSeparator()}
		</>
	);
};

export default LoginServices;
