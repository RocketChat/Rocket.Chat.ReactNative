import parse from 'url-parse';

import { type ICredentialsCasAPI, type ICredentialsSamlAPI } from '../../../definitions';

export type SamlOrCasRedirect =
	| { kind: 'saml'; payload: ICredentialsSamlAPI }
	| { kind: 'cas'; payload: ICredentialsCasAPI }
	| null;

export const parseSamlOrCasRedirect = (url: string, authType: string, ssoToken?: string): SamlOrCasRedirect => {
	const parsedUrl = parse(url, true);
	const samlCredentialToken = parsedUrl.query?.saml_idp_credentialToken;
	if (authType === 'saml' && samlCredentialToken) {
		return { kind: 'saml', payload: { credentialToken: samlCredentialToken, saml: true } };
	}
	if (authType === 'cas' && (parsedUrl.pathname?.includes('validate') || parsedUrl.query?.ticket)) {
		if (!ssoToken) {
			return null;
		}
		return { kind: 'cas', payload: { cas: { credentialToken: ssoToken } } };
	}
	return null;
};
