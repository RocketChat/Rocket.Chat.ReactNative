const required = (name: string) => {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not set. See e2e/README.md.`);
	}
	return value;
};

export const data = {
	server: 'https://mobile.qa.rocket.chat',
	alternateServer: 'https://stable.rocket.chat',
	candidateServer: 'https://candidate.qa.rocket.chat',
	channels: {
		detoxpublic: { name: 'detox-public' },
		detoxpublicprotected: { name: 'detox-public-protected', joinCode: '123' }
	},
	e2eePassword: 'Password1@abcdefghijklmnopqrst'
};

export const account = {
	get adminUser() {
		return required('E2E_ADMIN_USER');
	},
	get adminPassword() {
		return required('E2E_ADMIN_PASSWORD');
	},
	saml: {
		get username() {
			return required('E2E_SAML_USERNAME');
		},
		get password() {
			return required('E2E_SAML_PASSWORD');
		}
	},
	cas: {
		get username() {
			return required('E2E_CAS_USERNAME');
		},
		get password() {
			return required('E2E_CAS_PASSWORD');
		}
	}
};
