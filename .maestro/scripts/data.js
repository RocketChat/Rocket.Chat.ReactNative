const data = {
	server: 'http://10.0.2.2:3000',
	alternateServer: 'https://stable.rocket.chat',
	adminUser: 'admin@admin.com',
	adminPassword: 'secretpassword123',
    accounts: [],
	channels: {
		detoxpublic: {
			name: 'detox-public'
		},
		detoxpublicprotected: {
			name: 'detox-public-protected',
			joinCode: '123'
		}
	},
	e2eePassword: 'Password1@abcdefghijklmnopqrst'
};

output.data = data;