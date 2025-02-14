import * as AppleAuthentication from 'expo-apple-authentication';
import { Linking } from 'react-native';
import { Base64 } from 'js-base64';

import { Services } from '../../lib/services';
import Navigation from '../../lib/navigation/appNavigation';
import { IItemService, IOpenOAuth, IServiceLogin } from './interfaces';
import { random } from '../../lib/methods/helpers';
import { events, logEvent } from '../../lib/methods/helpers/log';

type TLoginStyle = 'popup' | 'redirect';

export const onPressFacebook = ({ service, server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_FACEBOOK);
	const { clientId } = service;
	const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
	const redirect_uri = `${server}/_oauth/facebook?close`;
	const scope = 'email';
	const state = getOAuthState();
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&display=touch`;
	openOAuth({ url: `${endpoint}${params}` });
};

export const onPressGithub = ({ service, server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_GITHUB);
	const { clientId } = service;
	const endpoint = `https://github.com/login?client_id=${clientId}&return_to=${encodeURIComponent('/login/oauth/authorize')}`;
	const redirect_uri = `${server}/_oauth/github?close`;
	const scope = 'user:email';
	const state = getOAuthState();
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
	openOAuth({ url: `${endpoint}${encodeURIComponent(params)}` });
};

export const onPressGitlab = ({ service, server, urlOption }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_GITLAB);
	const { clientId } = service;
	const baseURL = urlOption ? urlOption.trim().replace(/\/*$/, '') : 'https://gitlab.com';
	const endpoint = `${baseURL}/oauth/authorize`;
	const redirect_uri = `${server}/_oauth/gitlab?close`;
	const scope = 'read_user';
	const state = getOAuthState();
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
	openOAuth({ url: `${endpoint}${params}` });
};

export const onPressGoogle = ({ service, server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_GOOGLE);
	const { clientId } = service;
	const endpoint = 'https://accounts.google.com/o/oauth2/auth';
	const redirect_uri = `${server}/_oauth/google?close`;
	const scope = 'email';
	const state = getOAuthState('redirect');
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
	Linking.openURL(`${endpoint}${params}`);
};

export const onPressLinkedin = ({ service, server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_LINKEDIN);
	const { clientId } = service;
	const endpoint = 'https://www.linkedin.com/oauth/v2/authorization';
	const redirect_uri = `${server}/_oauth/linkedin?close`;
	const scope = 'r_liteprofile,r_emailaddress';
	const state = getOAuthState();
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
	openOAuth({ url: `${endpoint}${params}` });
};

export const onPressMeteor = ({ service, server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_METEOR);
	const { clientId } = service;
	const endpoint = 'https://www.meteor.com/oauth2/authorize';
	const redirect_uri = `${server}/_oauth/meteor-developer`;
	const state = getOAuthState();
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&state=${state}&response_type=code`;
	openOAuth({ url: `${endpoint}${params}` });
};

export const onPressTwitter = ({ server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_TWITTER);
	const state = getOAuthState();
	const url = `${server}/_oauth/twitter/?requestTokenAndRedirect=true&state=${state}`;
	openOAuth({ url });
};

export const onPressWordpress = ({ service, server }: IServiceLogin) => {
	logEvent(events.ENTER_WITH_WORDPRESS);
	const { clientId, serverURL } = service;
	const endpoint = `${serverURL}/oauth/authorize`;
	const redirect_uri = `${server}/_oauth/wordpress?close`;
	const scope = 'openid';
	const state = getOAuthState();
	const params = `?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&response_type=code`;
	openOAuth({ url: `${endpoint}${params}` });
};

export const onPressCustomOAuth = ({ loginService, server }: { loginService: IItemService; server: string }) => {
	logEvent(events.ENTER_WITH_CUSTOM_OAUTH);
	const { serverURL, authorizePath, clientId, scope, service } = loginService;
	const redirectUri = `${server}/_oauth/${service}`;
	const state = getOAuthState();
	const separator = authorizePath.indexOf('?') !== -1 ? '&' : '?';
	const params = `${separator}client_id=${clientId}&redirect_uri=${encodeURIComponent(
		redirectUri
	)}&response_type=code&state=${state}&scope=${encodeURIComponent(scope)}`;
	const domain = `${serverURL}`;
	const absolutePath = `${authorizePath}${params}`;
	const url = absolutePath.includes(domain) ? absolutePath : domain + absolutePath;
	openOAuth({ url });
};

export const onPressSaml = ({ loginService, server }: { loginService: IItemService; server: string }) => {
	logEvent(events.ENTER_WITH_SAML);
	const { clientConfig } = loginService;
	const { provider } = clientConfig;
	const ssoToken = random(17);
	const url = `${server}/_saml/authorize/${provider}/${ssoToken}`;
	openOAuth({ url, ssoToken, authType: 'saml' });
};

export const onPressCas = ({ casLoginUrl, server }: { casLoginUrl: string; server: string }) => {
	logEvent(events.ENTER_WITH_CAS);
	const ssoToken = random(17);
	const url = `${casLoginUrl}?service=${server}/_cas/${ssoToken}`;
	openOAuth({ url, ssoToken, authType: 'cas' });
};

export const onPressAppleLogin = async () => {
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

const getOAuthState = (loginStyle: TLoginStyle = 'popup') => {
	const credentialToken = random(43);
	let obj: {
		loginStyle: string;
		credentialToken: string;
		isCordova: boolean;
		redirectUrl?: string;
	} = { loginStyle, credentialToken, isCordova: true };
	if (loginStyle === 'redirect') {
		obj = {
			...obj,
			redirectUrl: 'rocketchat://auth'
		};
	}
	return Base64.encodeURI(JSON.stringify(obj));
};

const openOAuth = ({ url, ssoToken, authType = 'oauth' }: IOpenOAuth) => {
	Navigation.navigate('AuthenticationWebView', { url, authType, ssoToken });
};
