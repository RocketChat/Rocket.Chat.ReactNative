function random(length) {
	length = length || 10;
	var text = '';
	var possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

var data = {
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
	randomUser: function () {
		var randomVal = random();
		return {
			username: 'user' + randomVal,
			name: 'user' + randomVal,
			password: 'Password1@' + randomVal,
			email: 'mobile+' + randomVal + '@rocket.chat'
		};
	}
};
var user = data.randomUser();
output.user = user;
output.server = data.server;