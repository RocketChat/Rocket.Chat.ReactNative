import { account, data } from './data';
import { random, randomTeamName, randomUser, type RandomUser } from './random';
import { delay } from './timing';

export interface Credentials {
	username: string;
	password: string;
}

interface Session {
	userId: string;
	authToken: string;
}

const createdUsers: Credentials[] = [];

export const adminCredentials = (): Credentials => ({ username: account.adminUser, password: account.adminPassword });

class HttpError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
	}
}

class RateLimitedError extends Error {
	constructor(
		message: string,
		readonly waitMs: number
	) {
		super(message);
	}
}

const rateLimitWait = (body: string) => {
	const seconds = Number(/wait (\d+) seconds/i.exec(body)?.[1] ?? 10);
	return (seconds + 1) * 1000;
};

const headersFor = (session?: Session) => ({
	'Content-Type': 'application/json',
	...(session ? { 'X-User-Id': session.userId, 'X-Auth-Token': session.authToken } : {})
});

type Method = 'GET' | 'POST';

const REQUEST_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 1_000;

const fetchOnce = async (method: Method, endpoint: string, body?: unknown, session?: Session) => {
	const response = await fetch(`${data.server}/api/v1/${endpoint}`, {
		method,
		headers: headersFor(session),
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	if (response.ok) {
		return response.json();
	}
	const responseText = await response.text();
	if (response.status === 429) {
		throw new RateLimitedError(`${method} ${endpoint}: HTTP 429`, rateLimitWait(responseText));
	}
	throw new HttpError(`${method} ${endpoint}: HTTP ${response.status} ${responseText}`, response.status);
};

const retryDelay = (method: Method, error: unknown, attempt: number) => {
	if (error instanceof RateLimitedError) {
		return error.waitMs;
	}
	if (method !== 'GET' || (error instanceof HttpError && error.status < 500)) {
		return undefined;
	}
	return RETRY_BASE_DELAY * 2 ** (attempt - 1);
};

const request = async (method: Method, endpoint: string, body?: unknown, session?: Session) => {
	for (let attempt = 1; ; attempt += 1) {
		try {
			return await fetchOnce(method, endpoint, body, session);
		} catch (error) {
			const wait = retryDelay(method, error, attempt);
			if (wait === undefined || attempt === REQUEST_ATTEMPTS) {
				throw error;
			}
			await delay(wait);
		}
	}
};

export const login = async ({ username, password }: Credentials): Promise<Session> => {
	const response = await request('POST', 'login', { user: username, password });
	return { userId: response.data.userId, authToken: response.data.authToken };
};

const sessions = new Map<string, Promise<Session>>();

const sessionKey = ({ username, password }: Credentials) => `${username}\n${password}`;

const sessionFor = (credentials: Credentials) => {
	const key = sessionKey(credentials);
	if (!sessions.has(key)) {
		sessions.set(
			key,
			login(credentials).catch(error => {
				sessions.delete(key);
				throw error;
			})
		);
	}
	return sessions.get(key)!;
};

const isUnauthorized = (error: unknown) => error instanceof HttpError && error.status === 401;

const requestAs = async (method: Method, endpoint: string, credentials: Credentials, body?: unknown) => {
	try {
		return await request(method, endpoint, body, await sessionFor(credentials));
	} catch (error) {
		if (!isUnauthorized(error)) {
			throw error;
		}
		sessions.delete(sessionKey(credentials));
		return request(method, endpoint, body, await sessionFor(credentials));
	}
};

const post = (endpoint: string, credentials: Credentials, body: unknown) => requestAs('POST', endpoint, credentials, body);

export const get = (endpoint: string, credentials: Credentials) => requestAs('GET', endpoint, credentials);

export const trackUserForCleanup = ({ username, password }: Credentials) => {
	createdUsers.push({ username, password });
};

export const createUser = async (customProps: Record<string, unknown> = {}): Promise<RandomUser> => {
	const user = randomUser();
	trackUserForCleanup(user);
	await post('users.create', adminCredentials(), { ...user, ...customProps });
	return user;
};

export const createUserWithPasswordChange = () => createUser({ requirePasswordChange: true });

export const deleteUserByUsername = async (username: string) => {
	const info = await get(`users.info?username=${username}`, adminCredentials());
	await post('users.delete', adminCredentials(), { userId: info.user._id, confirmRelinquish: true });
};

const deleteUser = async ({ username }: Credentials) => {
	try {
		await deleteUserByUsername(username);
	} catch (error) {
		console.log(`Could not delete ${username}: ${error}`);
	}
};

export const deleteCreatedUsers = async () => {
	const users = createdUsers.splice(0);
	await Promise.all(users.map(deleteUser));
};

export const createRandomTeam = async (credentials: Credentials) => {
	const name = randomTeamName();
	await post('teams.create', credentials, {
		name,
		members: [],
		type: 1,
		room: { readOnly: false, extraData: { topic: '', broadcast: false, encrypted: false } }
	});
	return name;
};

export const createRandomRoom = async (credentials: Credentials, type: 'c' | 'p' = 'c') => {
	const response = await post(type === 'c' ? 'channels.create' : 'groups.create', credentials, { name: `room${random()}` });
	const room = type === 'c' ? response.channel : response.group;
	return { _id: room._id as string, name: room.name as string };
};

export const sendMessage = (credentials: Credentials, channel: string, text: string, tmid?: string) =>
	post('chat.postMessage', credentials, { ...(tmid ? { roomId: channel } : { channel }), text, tmid });

export const getProfileInfo = async (userId: string) => (await get(`users.info?userId=${userId}`, adminCredentials())).user;

export const reactAsNewUsers = async (count: number, messageId: string, emoji: string) => {
	const reactors: RandomUser[] = [];
	for (let index = 0; index < count; index += 1) {
		const reactor = await createUser();
		await post('chat.react', reactor, { messageId, emoji, shouldReact: true });
		reactors.push(reactor);
	}
	return reactors;
};

export const createDM = (credentials: Credentials, otherUsername: string) =>
	post('im.create', credentials, { username: otherUsername });

export const groupMessageCount = async (credentials: Credentials, roomId: string) =>
	((await get(`groups.messages?roomId=${roomId}`, credentials)).count as number) || 0;

export const serverHost = (server: string) => server.replace(/^https?:\/\//, '');

export const getDeepLink = (method: 'auth' | 'room', server: string, params: Record<string, string>) => {
	const query = new URLSearchParams({ host: serverHost(server), ...params }).toString();
	return `rocketchat://${method}?${query}`;
};
