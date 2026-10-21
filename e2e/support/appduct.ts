import { link, waitForSession, type AppClient, type AppductError } from 'appduct/client';

import { acceptOpenPrompt, type Fixtures } from './flows';
import { expectRoomTitle } from './header';
import { delay } from './timing';

const LIVENESS_TIMEOUT = 3_000;
const CLAIM_POLL_TIMEOUT = 3_000;
const LINK_CLAIM_TIMEOUT = 30_000;
const LINK_ATTEMPTS = 3;
const TOOL_REGISTRATION_TIMEOUT = 20_000;
const TOOL_REGISTRATION_POLL_INTERVAL = 200;

const errorType = (error: unknown) => (error as AppductError | null)?.type;

let session: AppClient | null = null;

const isSessionLive = async () => {
	if (!session) {
		return false;
	}
	try {
		await session.call('get_app_state', {}, { timeoutMs: LIVENESS_TIMEOUT });
		return true;
	} catch (error) {
		return errorType(error) === 'tool_not_found';
	}
};

const mintDeliveredLink = ({ platform }: Fixtures) =>
	link(
		platform === 'android'
			? {
					target: 'android',
					appId: 'chat.rocket.android',
					device: process.env.E2E_ANDROID_DEVICE,
					scheme: 'rocketchat'
				}
			: {
					target: 'ios-sim',
					device: process.env.E2E_IOS_DEVICE,
					scheme: 'rocketchat'
				}
	);

const waitForClaim = async (fixtures: Fixtures, sessionId: string) => {
	const deadline = Date.now() + LINK_CLAIM_TIMEOUT;
	while (Date.now() < deadline) {
		try {
			return await waitForSession(sessionId, { timeoutMs: CLAIM_POLL_TIMEOUT });
		} catch (error) {
			if (errorType(error) !== 'timeout') throw error;
		}
		if (fixtures.platform === 'ios') {
			await acceptOpenPrompt(fixtures);
		}
	}
	return null;
};

const connectAppduct = async (fixtures: Fixtures) => {
	if (await isSessionLive()) {
		return session!;
	}
	session?.close();
	session = null;
	for (let attempt = 1; attempt <= LINK_ATTEMPTS; attempt += 1) {
		const { sessionId } = await mintDeliveredLink(fixtures);
		session = await waitForClaim(fixtures, sessionId);
		if (session) {
			return session;
		}
	}
	throw new Error(`The app did not claim an Appduct session after ${LINK_ATTEMPTS} links`);
};

const waitForTool = async (app: AppClient, tool: string) => {
	const deadline = Date.now() + TOOL_REGISTRATION_TIMEOUT;
	while (Date.now() < deadline) {
		const tools = await app.tools();
		if (tools.some(({ name }) => name === tool)) {
			return;
		}
		await delay(TOOL_REGISTRATION_POLL_INTERVAL);
	}
	throw new Error(`Tool ${tool} was not registered within ${TOOL_REGISTRATION_TIMEOUT}ms of the app connecting`);
};

export const callAppTool = async (fixtures: Fixtures, tool: string, input: Record<string, unknown> = {}) => {
	const app = await connectAppduct(fixtures);
	try {
		return await app.call(tool, input);
	} catch (error) {
		if (errorType(error) !== 'tool_not_found') throw error;
		await waitForTool(app, tool);
		return app.call(tool, input);
	}
};

export const openRoom = async (fixtures: Fixtures, room: string) => {
	await callAppTool(fixtures, 'open_room', { name: room });
	await expectRoomTitle(fixtures, room);
};
