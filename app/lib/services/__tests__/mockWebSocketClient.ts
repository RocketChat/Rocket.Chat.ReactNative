export interface MockConnection {
	send: jest.Mock;
	close: jest.Mock;
	readyState: number;
	onopen: () => void;
	onmessage: (event: { data: string }) => void;
	onerror: () => void;
	onclose: (event?: { code?: number }) => void;
}

export interface WireFrame {
	msg: string;
	id?: string;
	name?: string;
	method?: string;
	params?: unknown[];
}

export type FrameResponder = (frame: WireFrame) => Record<string, unknown> | undefined;

export const CLOSED = 3;

export const mockConnections: MockConnection[] = [];

export function latestConnection() {
	return mockConnections[mockConnections.length - 1];
}

export function resetConnections() {
	mockConnections.length = 0;
}

function defaultReply(frame: WireFrame) {
	if (frame.msg === 'connect') return { msg: 'connected', session: 'session-id' };
	if (frame.msg === 'ping') return { msg: 'pong' };
	if (frame.msg === 'sub') return { msg: 'ready', subs: [frame.id] };
	return undefined;
}

export function createWebSocketClientMock(respond?: FrameResponder) {
	return jest.fn().mockImplementation(() => {
		const connection: MockConnection = {
			send: jest.fn((data: string) => {
				const frame = JSON.parse(data) as WireFrame;
				const reply = respond?.(frame) ?? defaultReply(frame);
				if (reply) setImmediate(() => connection.onmessage({ data: JSON.stringify(reply) }));
			}),
			close: jest.fn(),
			readyState: 1,
			onopen: jest.fn(),
			onmessage: jest.fn(),
			onerror: jest.fn(),
			onclose: jest.fn()
		};
		mockConnections.push(connection);
		return connection;
	});
}

export function framesOn(connection: MockConnection, msg: string) {
	return connection.send.mock.calls.map(([data]: [string]) => JSON.parse(data) as WireFrame).filter(frame => frame.msg === msg);
}

export function stopAnsweringFrames(connection: MockConnection) {
	connection.send.mockImplementation(() => undefined);
}

export async function flush(microtaskRounds = 10) {
	for (let i = 0; i < microtaskRounds; i++) {
		await Promise.resolve();
		await jest.advanceTimersByTimeAsync(0);
	}
}
