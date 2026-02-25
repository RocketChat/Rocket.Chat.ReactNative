const data = {
	server: 'https://mobile.qa.rocket.chat',
	alternateServer: 'https://stable.rocket.chat',
	...output.account,
    accounts: [],
    rooms: [],
    teams: [],
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
