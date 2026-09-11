import { buildConferenceBridgeScript, parseConferenceBridgeMessage } from './bridge';

type TFakeWindow = Record<string, unknown> & {
	localStorage: { setItem: (key: string, value: string) => void; getItem: (key: string) => string | null };
	ReactNativeWebView: { postMessage: (message: string) => void };
	videoCallWindow?: {
		close: () => void;
		openInMainWindow: (path: string) => void;
		requestScreenSharing: () => Promise<string | null>;
		getAuthCredentials: () => Promise<{ userId: string; authToken: string; serverUrl: string } | null>;
	};
};

const credentials = { userId: 'uid1', token: 'tok1', server: 'https://open.rocket.chat', bridgeToken: 'bridge1' };

const run = (script: string, { throwOnWrite = false } = {}) => {
	const stored: Record<string, string> = {};
	const posted: string[] = [];

	const fakeWindow: TFakeWindow = {
		localStorage: {
			setItem: (key, value) => {
				if (throwOnWrite) {
					throw new Error('storage disabled');
				}
				stored[key] = value;
			},
			getItem: key => stored[key] ?? null
		},
		ReactNativeWebView: { postMessage: message => posted.push(message) }
	};

	// eslint-disable-next-line no-new-func
	new Function('window', script)(fakeWindow);

	return { stored, posted, fakeWindow };
};

describe('buildConferenceBridgeScript', () => {
	test('seeds the session keys the web client reads', () => {
		const { stored } = run(buildConferenceBridgeScript(credentials));

		expect(stored['Meteor.userId']).toEqual('uid1');
		expect(stored['Meteor.loginToken']).toEqual('tok1');
	});

	test('seeds an expiry in the future', () => {
		const { stored } = run(buildConferenceBridgeScript(credentials));

		expect(new Date(stored['Meteor.loginTokenExpires']).getTime()).toBeGreaterThan(Date.now());
	});

	test('a token carrying quotes, backslashes and newlines round-trips intact', () => {
		const hostile = `a'b"c\\d\ne</script>`;

		const { stored } = run(buildConferenceBridgeScript({ ...credentials, token: hostile }));

		expect(stored['Meteor.loginToken']).toEqual(hostile);
	});

	test('a token that closes the statement cannot execute anything of its own', () => {
		const escape = `");window.pwned=true;("`;

		const { stored, fakeWindow } = run(buildConferenceBridgeScript({ ...credentials, token: escape }));

		expect((fakeWindow as Record<string, unknown>).pwned).toBeUndefined();
		expect(stored['Meteor.loginToken']).toEqual(escape);
	});

	test('installs the host bridge the conference page looks for', () => {
		const { fakeWindow } = run(buildConferenceBridgeScript(credentials));

		expect(typeof fakeWindow.videoCallWindow?.close).toEqual('function');
		expect(typeof fakeWindow.videoCallWindow?.openInMainWindow).toEqual('function');
		expect(typeof fakeWindow.videoCallWindow?.requestScreenSharing).toEqual('function');
		expect(typeof fakeWindow.videoCallWindow?.getAuthCredentials).toEqual('function');
	});

	test('close posts a close message', () => {
		const { fakeWindow, posted } = run(buildConferenceBridgeScript(credentials));

		fakeWindow.videoCallWindow?.close();

		expect(posted.map(m => parseConferenceBridgeMessage(m, 'bridge1'))).toEqual([{ type: 'close' }]);
	});

	test('openInMainWindow posts the path it was given', () => {
		const { fakeWindow, posted } = run(buildConferenceBridgeScript(credentials));

		fakeWindow.videoCallWindow?.openInMainWindow('/channel/general');

		expect(posted.map(m => parseConferenceBridgeMessage(m, 'bridge1'))).toEqual([
			{ type: 'openInMainWindow', path: '/channel/general' }
		]);
	});

	test('screen sharing resolves to nothing, because there is none', async () => {
		const { fakeWindow } = run(buildConferenceBridgeScript(credentials));

		await expect(fakeWindow.videoCallWindow?.requestScreenSharing()).resolves.toBeNull();
	});

	test('getAuthCredentials answers with the credentials it was built from', async () => {
		const { fakeWindow } = run(buildConferenceBridgeScript(credentials));

		await expect(fakeWindow.videoCallWindow?.getAuthCredentials()).resolves.toEqual({
			userId: 'uid1',
			authToken: 'tok1',
			serverUrl: 'https://open.rocket.chat'
		});
	});

	test('still installs the bridge when storage is unavailable', () => {
		const { fakeWindow } = run(buildConferenceBridgeScript(credentials), { throwOnWrite: true });

		expect(typeof fakeWindow.videoCallWindow?.close).toEqual('function');
	});
});

describe('parseConferenceBridgeMessage', () => {
	test('reads a close message', () => {
		expect(
			parseConferenceBridgeMessage(JSON.stringify({ source: 'rc-conference', bridge: 'bridge1', type: 'close' }), 'bridge1')
		).toEqual({ type: 'close' });
	});

	test('reads an openInMainWindow message', () => {
		expect(
			parseConferenceBridgeMessage(
				JSON.stringify({ source: 'rc-conference', bridge: 'bridge1', type: 'openInMainWindow', path: '/channel/general' }),
				'bridge1'
			)
		).toEqual({ type: 'openInMainWindow', path: '/channel/general' });
	});

	test('ignores a message from something other than the bridge', () => {
		expect(parseConferenceBridgeMessage(JSON.stringify({ type: 'close' }), 'bridge1')).toBeUndefined();
	});

	test('ignores a message with the wrong bridge token', () => {
		expect(
			parseConferenceBridgeMessage(JSON.stringify({ source: 'rc-conference', bridge: 'forged', type: 'close' }), 'bridge1')
		).toBeUndefined();
	});

	test('ignores a message missing the bridge token', () => {
		expect(parseConferenceBridgeMessage(JSON.stringify({ source: 'rc-conference', type: 'close' }), 'bridge1')).toBeUndefined();
	});

	test('ignores an unknown message type', () => {
		expect(
			parseConferenceBridgeMessage(
				JSON.stringify({ source: 'rc-conference', bridge: 'bridge1', type: 'launchMissiles' }),
				'bridge1'
			)
		).toBeUndefined();
	});

	test('ignores openInMainWindow without a path', () => {
		expect(
			parseConferenceBridgeMessage(
				JSON.stringify({ source: 'rc-conference', bridge: 'bridge1', type: 'openInMainWindow' }),
				'bridge1'
			)
		).toBeUndefined();
	});

	test('ignores anything that is not json', () => {
		expect(parseConferenceBridgeMessage('not json', 'bridge1')).toBeUndefined();
	});

	test('ignores json that is not an object', () => {
		expect(parseConferenceBridgeMessage('"rc-conference"', 'bridge1')).toBeUndefined();
	});
});
