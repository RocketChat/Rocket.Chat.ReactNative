/* eslint-disable no-undef */

const data = {
	server: 'https://mobile.rocket.chat',
	alternateServer: 'https://stable.rocket.chat',
	adminUser: MAESTRO_ADMIN_USER,
	adminPassword: MAESTRO_ADMIN_PASSWORD,
	channels: {
		detoxpublic: {
			name: 'detox-public'
		},
		detoxpublicprotected: {
			name: 'detox-public-protected',
			joinCode: '123'
		}
	},
	randomUser: () => {
		const randomVal = output.helpers_random();
		return {
			username: `user${randomVal}`,
			name: `user${randomVal}`, // FIXME: apply a different name
			password: `Password1@${randomVal}`,
			email: `mobile+${randomVal}@rocket.chat`
		};
	}
};

output.data = data;
