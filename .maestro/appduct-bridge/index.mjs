#!/usr/bin/env node
// Lets Maestro flows call the app's Appduct tools. Maestro scripts can only make HTTP requests,
// so this serves the appduct client on 127.0.0.1 for the length of a Maestro run.
//
//   POST /link  {}                 { live: true } while the session is up; otherwise mints a
//                                  bootstrap link, opens it on the device and replies { sessionId },
//                                  or { sessionId: null } while the appduct daemon is still starting
//   POST /wait  { sessionId }      { claimed } once the app claims the session, or after 3s
//   POST /call  { tool, input }    calls a tool on the session and replies with its result
//
// A JS reload or app launch ends the session: link again afterwards. reset_app drops it too,
// since the app has to be relaunched after it.
//
// Usage: node .maestro/appduct-bridge/index.mjs <android|ios> [port]
// APPDUCT_DEVICE picks the adb serial or simulator udid when more than one is running.
import { createServer } from 'node:http';

import { link, waitForSession } from 'appduct/client';

const [platform, port = '7701'] = process.argv.slice(2);

if (platform !== 'android' && platform !== 'ios') {
	console.error('Usage: appduct-bridge.mjs <android|ios> [port]');
	process.exit(2);
}

let app = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const isSessionLive = async () => {
	if (!app) {
		return false;
	}
	try {
		await app.call('get_app_state', {}, { timeoutMs: 3_000 });
		return true;
	} catch (error) {
		return error.type === 'tool_not_found';
	}
};

const dropSession = () => {
	app?.close();
	app = null;
};

const mintLink = () =>
	link(
		platform === 'android'
			? { target: 'android', appId: 'chat.rocket.android', device: process.env.APPDUCT_DEVICE, scheme: 'rocketchat' }
			: { target: 'ios-sim', device: process.env.APPDUCT_DEVICE, scheme: 'rocketchat' }
	);

const waitForTool = async tool => {
	const deadline = Date.now() + 20_000;
	while (Date.now() < deadline) {
		const tools = await app.tools();
		if (tools.some(({ name }) => name === tool)) {
			return;
		}
		await sleep(200);
	}
	throw new Error(`Tool ${tool} was not registered within 20s of the app connecting`);
};

const routes = {
	'/link': async () => {
		if (await isSessionLive()) {
			return { live: true };
		}
		dropSession();
		try {
			const { sessionId } = await mintLink();
			return { live: false, sessionId };
		} catch (error) {
			const daemonStillStarting = error.type === 'connection_error';
			if (!daemonStillStarting) {
				throw error;
			}
			return { live: false, sessionId: null };
		}
	},
	'/wait': async ({ sessionId }) => {
		if (!sessionId) {
			return { claimed: false };
		}
		try {
			app = await waitForSession(sessionId, { timeoutMs: 3_000 });
			return { claimed: true };
		} catch (error) {
			if (error.type !== 'timeout') {
				throw error;
			}
			return { claimed: false };
		}
	},
	'/call': async ({ tool, input = {} }) => {
		if (!app) {
			throw new Error('No Appduct session: run helpers/appduct-connect.yaml first');
		}
		let result;
		try {
			result = await app.call(tool, input);
		} catch (error) {
			if (error.type !== 'tool_not_found') {
				throw error;
			}
			await waitForTool(tool);
			result = await app.call(tool, input);
		}
		if (tool === 'reset_app') {
			dropSession();
		}
		return result;
	}
};

const readBody = request =>
	new Promise((resolve, reject) => {
		let body = '';
		request.on('data', chunk => (body += chunk));
		request.on('end', () => resolve(body ? JSON.parse(body) : {}));
		request.on('error', reject);
	});

const reply = (response, status, payload) => {
	response.writeHead(status, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(payload ?? {}));
};

createServer(async (request, response) => {
	const route = routes[request.url];
	if (request.method !== 'POST' || !route) {
		reply(response, 404, { error: `Unknown route ${request.method} ${request.url}` });
		return;
	}
	const startedAt = Date.now();
	let label = request.url;
	try {
		const body = await readBody(request);
		label = `${request.url} ${body.tool ?? ''}`.trim();
		const result = await route(body);
		console.log(`${label} ok ${Date.now() - startedAt}ms`);
		reply(response, 200, result);
	} catch (error) {
		console.log(`${label} failed ${Date.now() - startedAt}ms: ${error.type ?? ''} ${error.message}`);
		reply(response, 500, { error: error.message, type: error.type });
	}
}).listen(Number(port), '127.0.0.1', () => console.log(`appduct-bridge (${platform}) on 127.0.0.1:${port}`));
