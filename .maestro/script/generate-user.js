// Random function that generates a random string
function random(length) {
	length = length || 10; // Default to 10 if length is not provided
	var text = '';
	var possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// Data object with server info and random user generation logic
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

	// Function to create a random user
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

// Generate random user
var user = data.randomUser();

// This will output the generated user object
output.user = user;

console.log('User created and .env file updated!');
console.log(user, 'user');
