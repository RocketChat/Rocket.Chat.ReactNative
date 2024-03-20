/* eslint-disable no-undef */
const { server } = output.data;

const baseURL = `${server}/api/v1/`;

let headers = {
	'Content-Type': 'application/json;charset=UTF-8'
};

const login = (username, password) => {
	console.log(`Logging in as user ${username}`);
	const response = http.post(`${baseURL}login`, {
		headers: { ...headers },
		body: JSON.stringify({
			user: username,
			password
		})
	});

	const { authToken, userId } = json(response.body).data;
	headers = { ...headers, 'X-User-Id': userId, 'X-Auth-Token': authToken };
	return { authToken, userId };
};

const createRandomUser = () => {
	try {
		login(output.data.adminUser, output.data.adminPassword);
		const user = output.data.randomUser();
		console.log(`Creating user ${user.username}`);

		http.post(`${baseURL}users.create`, {
			headers: { ...headers },
			body: JSON.stringify({
				username: user.username,
				name: user.name,
				password: user.password,
				email: user.email
			})
		});
		return user;
	} catch (error) {
		console.log(JSON.stringify(error));
		throw new Error('Failed to create user');
	}
};

const sendMessage = (user, channel, msg, tmid) => {
	console.log(`Sending message to ${channel}`);
	try {
		login(user.username, user.password);
		const response = http.post(`${baseURL}chat.postMessage`, {
			headers: { ...headers },
			body: JSON.stringify({
				channel,
				msg,
				tmid
			})
		});
		return json(response.body).data;
	} catch (infoError) {
		console.log(JSON.stringify(infoError));
		throw new Error('Failed to find or create private group');
	}
};

output.helpers_data_setup = {
	login,
	createRandomUser,
	sendMessage
};
