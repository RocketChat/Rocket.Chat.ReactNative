import parse from 'url-parse';

import { type ICredentials } from '../../../definitions';

export type SamlOrCasRedirect = { kind: 'saml'; payload: ICredentials } | { kind: 'cas'; payload: ICredentials } | null;

export const parseSamlOrCasRedirect = (url: string, authType: string, ssoToken?: string): SamlOrCasRedirect => {
	const parsedUrl = parse(url, true);
	if (authType === 'saml' && parsedUrl.query?.saml_idp_credentialToken) {
		const token = parsedUrl.query.saml_idp_credentialToken || ssoToken;
		return { kind: 'saml', payload: { credentialToken: token, saml: true } };
	}
	if (authType === 'cas' && (parsedUrl.pathname?.includes('validate') || parsedUrl.query?.ticket)) {
		return { kind: 'cas', payload: { cas: { credentialToken: ssoToken } } };
	}
	return null;
};
