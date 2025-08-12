const data = {
	server: 'https://mobile.rocket.chat',
	alternateServer: 'https://stable.rocket.chat',
	...output.account,
   accounts: [],
	channels: {
		detoxpublic: {
			name: 'detox-public'
		},
		detoxpublicprotected: {
			name: 'detox-public-protected',
			joinCode: '123'
		}
	}
};

output.data = data;