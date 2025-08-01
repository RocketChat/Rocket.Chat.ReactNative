const data = {
	server: 'https://mobile.rocket.chat',
	alternateServer: 'https://stable.rocket.chat',
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
		const randomVal = random();
		return {
			username: `user${randomVal}`,
			name: `user${randomVal}`,
			password: `Password1@${randomVal}`,
			email: `mobile+${randomVal}@rocket.chat`
		};
	}
};

output.data = data;