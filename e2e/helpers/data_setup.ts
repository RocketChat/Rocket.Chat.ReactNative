import axios, { AxiosInstance } from 'axios';

import data from '../data';
import random from './random';

const TEAM_TYPE = {
	PUBLIC: 0,
	PRIVATE: 1
};

const { server } = data;

const rocketchat = axios.create({
	baseURL: `${server}/api/v1/`,
	headers: {
		'Content-Type': 'application/json;charset=UTF-8'
	}
});

export const login = async (username: string, password: string) => {
	console.log(`Logging in as user ${username}`);
	const response = await rocketchat.post('login', {
		user: username,
		password
	});
	const { authToken, userId } = response.data.data;
	rocketchat.defaults.headers.common['X-User-Id'] = userId;
	rocketchat.defaults.headers.common['X-Auth-Token'] = authToken;
	return { authToken, userId };
};

export interface ITestUser {
	username: string;
	password: string;
	name: string;
	email: string;
}

export const createRandomUser = async (customProps?: Object): Promise<ITestUser> => {
	try {
		await login(data.adminUser, data.adminPassword);
		const user = data.randomUser();
		console.log(`Creating user ${user.username}`);
		await rocketchat.post('users.create', {
			username: user.username,
			name: user.name,
			password: user.password,
			email: user.email,
			...(customProps || {})
		});
		console.log(`Created ${user.username} / ${user.password}`);
		return user;
	} catch (error) {
		console.log(JSON.stringify(error));
		throw new Error('Failed to create user');
	}
};

export const createRandomRoom = async (
	user: { username: string; password: string },
	type: 'p' | 'c' = 'c'
): Promise<{ _id: string; name: string }> => {
	try {
		await login(user.username, user.password);
		const room = `room${random()}`;
		console.log(`Creating room ${room}`);
		const result = await rocketchat.post(type === 'c' ? 'channels.create' : 'groups.create', {
			name: room
		});
		return {
			_id: type === 'c' ? result.data.channel._id : result.data.group._id,
			name: type === 'c' ? result.data.channel.name : result.data.group.name
		};
	} catch (e) {
		console.log(JSON.stringify(e));
		throw new Error('Failed to create room');
	}
};

export const createRandomTeam = async (user: { username: string; password: string }) => {
	try {
		await login(user.username, user.password);
		const team = `team${random()}`;
		console.log(`Creating team ${team}`);
		await rocketchat.post('teams.create', {
			name: team,
			type: TEAM_TYPE.PRIVATE
		});
		return team;
	} catch (e) {
		console.log(JSON.stringify(e));
		throw new Error('Failed create team');
	}
};

export const sendRandomMessage = async ({
	user,
	room,
	messageEnd,
	tmid
}: {
	user: { username: string; password: string };
	room: string;
	messageEnd: string;
	tmid?: string;
}) => {
	try {
		const msg = `${random()}${messageEnd}`;
		console.log(`Sending message ${msg} to ${room}`);
		await login(user.username, user.password);
		const response = await rocketchat.post('chat.postMessage', { channel: room, msg, tmid });
		return response.data;
	} catch (infoError) {
		console.log(JSON.stringify(infoError));
		throw new Error('Failed to find or create private group');
	}
};

export const sendMessage = async (user: { username: string; password: string }, channel: string, msg: string, tmid?: string) => {
	console.log(`Sending message to ${channel}`);
	try {
		await login(user.username, user.password);
		const response = await rocketchat.post('chat.postMessage', { channel, msg, tmid });
		return response.data;
	} catch (infoError) {
		console.log(JSON.stringify(infoError));
		throw new Error('Failed to find or create private group');
	}
};

export const get = (endpoint: string) => {
	console.log(`GET /${endpoint}`);
	return rocketchat.get(endpoint);
};

export const post = async (endpoint: string, body: any, user: ITestUser) => {
	await login(user.username, user.password);
	console.log(`POST /${endpoint} ${JSON.stringify(body)}`);
	return rocketchat.post(endpoint, body);
};

interface UserId {
	userId: string;
}

interface UserName {
	username: string;
}

export const getProfileInfo = async (param: UserId | UserName) => {
	let query = '';
	if ('userId' in param) {
		query += `userId=${param.userId}`;
	} else if ('username' in param) {
		query += `username=${param.username}`;
	}
	const result = await get(`users.info?${query}`);
	return result.data.user;
};

export interface IDeleteCreateUser {
	server: string;
	username: string;
}

const deleteCreatedUser = async ({ username: usernameToDelete }: IDeleteCreateUser) => {
	try {
		const api = await initApi(data.adminUser, data.adminPassword);
		const result = await api.get(`users.info?username=${usernameToDelete}`);
		const responsePost = await api.post('users.delete', { userId: result.data.user._id, confirmRelinquish: true });
		return responsePost.data;
	} catch (error) {
		console.log(JSON.stringify(error));
	}
};

// Delete created users to avoid use all the Seats Available on the server
export const deleteCreatedUsers = async (deleteUsersAfterAll: IDeleteCreateUser[]) => {
	if (deleteUsersAfterAll.length) {
		for await (const deleteUser of deleteUsersAfterAll) {
			await deleteCreatedUser(deleteUser);
		}
	}
};

export const initApi = async (user: string, password: string): Promise<AxiosInstance> => {
	const api = axios.create({
		baseURL: `${server}/api/v1/`,
		headers: {
			'Content-Type': 'application/json;charset=UTF-8'
		}
	});
	const response = await api.post('login', {
		user,
		password
	});
	const { authToken, userId } = response.data.data;
	api.defaults.headers.common['X-User-Id'] = userId;
	api.defaults.headers.common['X-Auth-Token'] = authToken;
	return api;
};
