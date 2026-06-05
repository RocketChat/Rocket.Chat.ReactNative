import { parseSamlOrCasRedirect } from './parseSamlOrCasRedirect';

describe('parseSamlOrCasRedirect', () => {
	describe('SAML', () => {
		it('returns a saml match when authType is saml and the URL has saml_idp_credentialToken', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_saml/callback?saml_idp_credentialToken=abc123', 'saml')).toEqual({
				kind: 'saml',
				payload: { credentialToken: 'abc123', saml: true }
			});
		});

		it('uses the URL token even when an ssoToken is also provided', () => {
			expect(
				parseSamlOrCasRedirect('https://server.example/_saml/callback?saml_idp_credentialToken=abc123', 'saml', 'fallback')
			).toEqual({
				kind: 'saml',
				payload: { credentialToken: 'abc123', saml: true }
			});
		});

		it('returns null when authType is saml but the URL has no saml_idp_credentialToken', () => {
			expect(parseSamlOrCasRedirect('https://server.example/login', 'saml')).toBeNull();
		});

		it('returns null when authType is saml and the URL only has a CAS-style ticket', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_cas/callback?ticket=ST-123', 'saml')).toBeNull();
		});
	});

	describe('CAS', () => {
		it('returns a cas match when authType is cas and the URL pathname includes validate', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_cas/validate/xyz', 'cas', 'sso-token')).toEqual({
				kind: 'cas',
				payload: { cas: { credentialToken: 'sso-token' } }
			});
		});

		it('returns a cas match when authType is cas and the URL has a ticket query param', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_cas/callback?ticket=ST-123', 'cas', 'sso-token')).toEqual({
				kind: 'cas',
				payload: { cas: { credentialToken: 'sso-token' } }
			});
		});

		it('returns null when authType is cas but the URL has neither validate nor a ticket', () => {
			expect(parseSamlOrCasRedirect('https://server.example/login', 'cas', 'sso-token')).toBeNull();
		});

		it('passes credentialToken through as undefined when ssoToken is not provided', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_cas/validate/xyz', 'cas')).toEqual({
				kind: 'cas',
				payload: { cas: { credentialToken: undefined } }
			});
		});

		it('returns null when authType is cas and the URL only has a SAML-style token', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_saml/callback?saml_idp_credentialToken=abc', 'cas')).toBeNull();
		});
	});

	describe('other auth types', () => {
		it('returns null for oauth', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_saml/callback?saml_idp_credentialToken=abc', 'oauth')).toBeNull();
		});

		it('returns null for iframe', () => {
			expect(parseSamlOrCasRedirect('https://server.example/_cas/validate/xyz', 'iframe', 'sso-token')).toBeNull();
		});
	});
});
