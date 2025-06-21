// Helper to generate a random string
function random(length) {
	length = length || 10;
	var text = '';
	var possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// Config
var server = 'https://mobile.rocket.chat';
var adminUser = 'admin'; // Replace with actual admin username
var adminPassword = 'adminPassword'; // Replace with actual admin password

// Create random user object
function generateUser() {
	var suffix = random();
	return {
		username: 'user' + suffix,
		name: 'user' + suffix,
		password: 'Password1@' + suffix,
		email: 'mobile+' + suffix + '@rocket.chat'
	};
}

// HTTP POST request helper
function post(url, body, headers) {
	return http.post(url, {
		headers: headers,
		body: JSON.stringify(body)
	});
}

// Login and return token/userId
function login(username, password) {
	var res = post(
		server + '/api/v1/login',
		{
			user: username,
			password: password
		},
		{
			'Content-Type': 'application/json'
		}
	);

	console.log('Login response: ', res.body); // Log the entire response body

	var parsed;
	try {
		parsed = JSON.parse(res.body);
	} catch (error) {
		console.error('Failed to parse response JSON:', error);
		throw new Error('Failed to parse login response');
	}

	if (!parsed || !parsed.data) {
		console.log('Login failed for user: ' + username);
		console.log('Response body: ' + res.body);
		return null;
	}

	return {
		authToken: parsed.data.authToken,
		userId: parsed.data.userId
	};
}

// Create a user
function createUser(adminAuth, user) {
	post(
		server + '/api/v1/users.create',
		{
			username: user.username,
			name: user.name,
			password: user.password,
			email: user.email
		},
		{
			'Content-Type': 'application/json',
			'X-Auth-Token': adminAuth.authToken,
			'X-User-Id': adminAuth.userId
		}
	);
}

// Create a channel
function createRoom(userAuth, roomName) {
	var res = post(
		server + '/api/v1/channels.create',
		{ name: roomName },
		{
			'Content-Type': 'application/json',
			'X-Auth-Token': userAuth.authToken,
			'X-User-Id': userAuth.userId
		}
	);

	var parsed = JSON.parse(res.body);
	return parsed.channel;
}

// Create a team
function createTeam(userAuth, teamName) {
	var res = post(
		server + '/api/v1/teams.create',
		{
			name: teamName,
			type: 1 // Private
		},
		{
			'Content-Type': 'application/json',
			'X-Auth-Token': userAuth.authToken,
			'X-User-Id': userAuth.userId
		}
	);

	var parsed = JSON.parse(res.body);
	return parsed.team;
}

// Send message
function sendMessage(userAuth, roomId, message) {
	post(
		server + '/api/v1/chat.postMessage',
		{
			roomId: roomId,
			text: message
		},
		{
			'Content-Type': 'application/json',
			'X-Auth-Token': userAuth.authToken,
			'X-User-Id': userAuth.userId
		}
	);
}

// MAIN EXECUTION
var newUser = generateUser();
var adminAuth = login(adminUser, adminPassword);

if (!adminAuth) {
	throw new Error('Admin login failed');
}

createUser(adminAuth, newUser);

var userAuth = login(newUser.username, newUser.password);

if (!userAuth) {
	throw new Error('User login failed');
}

var room = createRoom(userAuth, 'room' + random());
var team = createTeam(userAuth, 'team' + random());
sendMessage(userAuth, room._id, 'Hello, this is a test message');

// Output for Maestro
output.user = newUser;
output.room = room;
output.team = team;
