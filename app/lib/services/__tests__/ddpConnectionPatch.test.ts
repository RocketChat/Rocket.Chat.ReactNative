/**
 * Behavioral tests for the hand-patched `ConnectionImpl` class shipped in
 * `patches/@rocket.chat+ddp-client+0.3.51.patch`.
 *
 * `sdk.test.ts` / `connect.test.ts` only assert delegation to a *mocked*
 * `connection.probe` / `forceReopen` / `checkAndReopen` — none of the real
 * patched logic runs under test. This file imports the real compiled
 * `ConnectionImpl` (the deep `dist/Connection` path, since it isn't part of
 * the package's public API surface) and drives it with a fake `WebSocket` and
 * the package's own `MinimalDDPClient`, so a future edit to the patch (or a
 * `ddp-client` version bump that silently drops it) is caught by a real
 * regression rather than a mock.
 *
 * Patched behaviors under test:
 *  - stale-`onclose` guard: `ws.onclose` bails out with `if (ws !== this.ws) return;`
 *    so a late close event from a socket that `forceReopen()` already replaced
 *    cannot clobber the live connection's status.
 *  - `forceReopen()` in-flight dedup: concurrent calls share one `reopenInFlight`
 *    promise instead of tearing the socket down twice.
 */
import { ConnectionImpl } from '@rocket.chat/ddp-client/dist/Connection';
import { MinimalDDPClient } from '@rocket.chat/ddp-client/dist/MinimalDDPClient';

// Minimal fake WebSocket. ConnectionImpl receives the constructor directly
// (`new this.WS(url)`) rather than reading a global, so no `global.WebSocket`
// stubbing is needed — we just pass this class in as the `WS` constructor arg.
class FakeWebSocket {
	static instances: FakeWebSocket[] = [];

	static readonly CONNECTING = 0;

	static readonly OPEN = 1;

	static readonly CLOSING = 2;

	static readonly CLOSED = 3;

	readonly CONNECTING = 0;

	readonly OPEN = 1;

	readonly CLOSING = 2;

	readonly CLOSED = 3;

	readyState = FakeWebSocket.CONNECTING;

	onopen?: () => void;

	onclose?: (ev: { code: number; reason: string }) => void;

	onmessage?: (ev: { data: string }) => void;

	onerror?: (ev: unknown) => void;

	constructor(public url: string) {
		FakeWebSocket.instances.push(this);
	}

	send = jest.fn();

	close = jest.fn(() => {
		this.readyState = FakeWebSocket.CLOSED;
	});

	// Test helper (not part of the WebSocket surface): simulate the transport
	// finishing its handshake and firing `onopen`.
	open() {
		this.readyState = FakeWebSocket.OPEN;
		this.onopen?.();
	}
}

// Test helper: simulate the server replying to the DDP `connect` message with
// `connected`, which is what makes `ConnectionImpl.connect()`'s promise
// resolve and its status flip to 'connected'. Must be called after `open()`
// since `onmessage` is only wired up inside the real `onopen` handler.
const completeHandshake = (ws: FakeWebSocket, session: string) => {
	ws.onmessage?.({ data: JSON.stringify({ msg: 'connected', session }) });
};

const buildConnection = () => {
	const client = new MinimalDDPClient();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const connection = new (ConnectionImpl as any)('wss://example.com', FakeWebSocket, client, {
		retryCount: 0,
		retryTime: 1000
	});
	return { client, connection };
};

describe('patched ConnectionImpl (patches/@rocket.chat+ddp-client+0.3.51.patch)', () => {
	beforeEach(() => {
		FakeWebSocket.instances = [];
	});

	it('ignores a stale onclose from a socket that forceReopen() already replaced', async () => {
		const { connection } = buildConnection();

		const connectPromise = connection.connect();
		const staleSocket = FakeWebSocket.instances[0];
		staleSocket.open();
		completeHandshake(staleSocket, 'session-1');
		await expect(connectPromise).resolves.toBe(true);
		expect(connection.status).toBe('connected');

		// Capture the stale socket's onclose handler *before* forceReopen (via
		// close()) severs it, to stand in for a close event that was already
		// in flight on the transport at the moment the socket got replaced —
		// the real-world race the `ws !== this.ws` guard defends against.
		const staleOnClose = staleSocket.onclose;
		expect(typeof staleOnClose).toBe('function');

		const reopenPromise = connection.forceReopen();
		expect(FakeWebSocket.instances).toHaveLength(2);
		const freshSocket = FakeWebSocket.instances[1];
		expect(freshSocket).not.toBe(staleSocket);

		freshSocket.open();
		completeHandshake(freshSocket, 'session-2');
		await expect(reopenPromise).resolves.toBe(true);
		expect(connection.status).toBe('connected');
		expect(connection.ws).toBe(freshSocket);

		// The stale socket's close event arrives late. Without the guard this
		// would set status to 'disconnected' and emit a 'disconnected' event
		// against what is, from the app's perspective, a perfectly live
		// connection.
		staleOnClose?.({ code: 1006, reason: 'late close' });

		expect(connection.status).toBe('connected');
		expect(connection.ws).toBe(freshSocket);
	});

	it('dedupes concurrent forceReopen() calls into a single in-flight reopen', async () => {
		const { connection } = buildConnection();

		const connectPromise = connection.connect();
		FakeWebSocket.instances[0].open();
		completeHandshake(FakeWebSocket.instances[0], 'session-1');
		await connectPromise;

		const first = connection.forceReopen();
		const second = connection.forceReopen();

		// The second call must return the exact same in-flight promise rather
		// than tearing the socket down again.
		expect(second).toBe(first);
		expect(FakeWebSocket.instances).toHaveLength(2);

		const freshSocket = FakeWebSocket.instances[1];
		freshSocket.open();
		completeHandshake(freshSocket, 'session-2');

		await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
		// Still only one extra socket was ever opened for the two concurrent calls.
		expect(FakeWebSocket.instances).toHaveLength(2);
	});
});
