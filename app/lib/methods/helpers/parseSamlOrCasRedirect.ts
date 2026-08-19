import parse from 'url-parse';

import { type ICredentialsCasAPI, type ICredentialsSamlAPI } from '../../../definitions';

export type SamlOrCasRedirect =
	| { kind: 'saml'; payload: ICredentialsSamlAPI }
	| { kind: 'cas'; payload: ICredentialsCasAPI }
	| null;

export const parseSamlOrCasRedirect = (url: string, authType: string, ssoToken?: string): SamlOrCasRedirect => {
	const parsedUrl = parse(url, true);
	if (authType === 'saml' && parsedUrl.query?.saml_idp_credentialToken) {
		const credentialToken = parsedUrl.query.saml_idp_credentialToken || ssoToken;
		if (!credentialToken) {
			return null;
		}
		return { kind: 'saml', payload: { credentialToken, saml: true } };
	}
	if (authType === 'cas' && (parsedUrl.pathname?.includes('validate') || parsedUrl.query?.ticket)) {
		if (!ssoToken) {
			return null;
		}
		return { kind: 'cas', payload: { cas: { credentialToken: ssoToken } } };
	}
	return null;
};
