import type * as RocketChatSdk from '@rocket.chat/sdk';

export interface IDdpFrame {
	msg: string;
	id?: string;
	name?: string;
	method?: string;
	params?: unknown[];
}

export interface IFrameMatcher {
	msg?: string;
	method?: string;
	name?: string;
	id?: string;
}

const connectingState = 0;
const openState = 1;
const closedState = 3;

function matchesFrame(frame: IDdpFrame, matcher: IFrameMatcher): boolean {
	return Object.entries(matcher).every(([key, value]) => frame[key as keyof IDdpFrame] === value);
}

function describeMatcher(matcher: IFrameMatcher): string {
	return JSON.stringify(matcher);
}

export class FakeConnection {
	readyState = connectingState;
	frames: IDdpFrame[] = [];
	onopen: ((event?: unknown) => void) | null = null;
	onmessage: ((event: { data: string }) => void) | null = null;
	onerror: ((event?: unknown) => void) | null = null;
	onclose: ((event?: { code?: number; reason?: string }) => void) | null = null;

	constructor(private readonly transport: TransportFake) {}

	send(data: string): void {
		const frame = JSON.parse(data) as IDdpFrame;
		this.frames.push(frame);
		this.transport.recordFrame(this, frame);
	}

	close(code?: number): void {
		if (this.readyState === closedState) return;
		this.readyState = closedState;
		this.onclose?.({ code });
	}
}

interface IFrameWaiter {
	matcher: IFrameMatcher;
	connection?: FakeConnection;
	resolve(frame: IDdpFrame): void;
}

interface IConnectionWaiter {
	index: number;
	resolve(connection: FakeConnection): void;
}

export class TransportFake {
	connections: FakeConnection[] = [];
	loginResult: { id: string; token: string } = { id: 'user-id', token: 'auth-token' };
	private withheld: IFrameMatcher[] = [];
	private frameWaiters: IFrameWaiter[] = [];
	private connectionWaiters: IConnectionWaiter[] = [];

	createConnection = (): FakeConnection => {
		const connection = new FakeConnection(this);
		this.connections.push(connection);
		const index = this.connections.length - 1;
		this.connectionWaiters = this.connectionWaiters.filter(waiter => {
			if (waiter.index !== index) return true;
			waiter.resolve(connection);
			return false;
		});
		return connection;
	};

	reset(): void {
		this.connections = [];
		this.withheld = [];
		this.frameWaiters = [];
		this.connectionWaiters = [];
		this.loginResult = { id: 'user-id', token: 'auth-token' };
	}

	get latestConnection(): FakeConnection {
		return this.connections[this.connections.length - 1];
	}

	awaitConnection(index = 0): Promise<FakeConnection> {
		const existing = this.connections[index];
		if (existing) return Promise.resolve(existing);
		return new Promise(resolve => this.connectionWaiters.push({ index, resolve }));
	}

	awaitFrame(matcher: IFrameMatcher, connection?: FakeConnection): Promise<IDdpFrame> {
		const existing = this.frames(matcher, connection);
		if (existing.length) return Promise.resolve(existing[existing.length - 1]);
		return new Promise(resolve => this.frameWaiters.push({ matcher, connection, resolve }));
	}

	frames(matcher: IFrameMatcher = {}, connection?: FakeConnection): IDdpFrame[] {
		const sources = connection ? [connection] : this.connections;
		return sources.flatMap(source => source.frames).filter(frame => matchesFrame(frame, matcher));
	}

	requireFrame(matcher: IFrameMatcher, connection?: FakeConnection): IDdpFrame {
		const found = this.frames(matcher, connection);
		if (!found.length) throw new Error(`[transport fake] no frame matching ${describeMatcher(matcher)} was sent`);
		return found[found.length - 1];
	}

	open(connection: FakeConnection = this.latestConnection): void {
		connection.readyState = openState;
		connection.onopen?.();
	}

	closeTransport(connection: FakeConnection = this.latestConnection, code = 1006): void {
		connection.readyState = closedState;
		connection.onclose?.({ code });
	}

	deliver(frame: Record<string, unknown>, connection: FakeConnection = this.latestConnection): void {
		connection.onmessage?.({ data: JSON.stringify(frame) });
	}

	respond(request: IDdpFrame, result: unknown, connection: FakeConnection = this.latestConnection): void {
		this.deliver({ msg: 'result', id: request.id, result }, connection);
	}

	withhold(matcher: IFrameMatcher): void {
		this.withheld.push(matcher);
	}

	recordFrame(connection: FakeConnection, frame: IDdpFrame): void {
		this.frameWaiters = this.frameWaiters.filter(waiter => {
			if (waiter.connection && waiter.connection !== connection) return true;
			if (!matchesFrame(frame, waiter.matcher)) return true;
			waiter.resolve(frame);
			return false;
		});
		if (this.withheld.some(matcher => matchesFrame(frame, matcher))) return;
		const response = this.automaticResponse(frame);
		if (response) Promise.resolve().then(() => this.deliver(response, connection));
	}

	private automaticResponse(frame: IDdpFrame): Record<string, unknown> | undefined {
		if (frame.msg === 'connect') return { msg: 'connected', session: 'session-id' };
		if (frame.msg === 'ping') return { msg: 'pong' };
		if (frame.msg === 'sub') return { msg: 'ready', subs: [frame.id] };
		if (frame.msg === 'unsub') return { msg: 'nosub', id: frame.id };
		if (frame.msg === 'method' && frame.method === 'login') {
			return { msg: 'result', id: frame.id, result: this.loginResult };
		}
		return undefined;
	}
}

export function createTransportFake(): TransportFake {
	return new TransportFake();
}

export const silentLogger = { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() };

export type RealSdkClient = InstanceType<typeof RocketChatSdk.Rocketchat>;

export function createSdkClient(host = 'localhost:3000'): RealSdkClient {
	const { Rocketchat } = jest.requireActual<typeof RocketChatSdk>('@rocket.chat/sdk');
	return new Rocketchat({ host, logger: silentLogger });
}

export async function connectAuthenticatedSdk(
	transport: TransportFake,
	{ host, token }: { host?: string; token?: string } = {}
): Promise<RealSdkClient> {
	const client = createSdkClient(host);
	const connecting = client.connect();
	transport.open(await transport.awaitConnection());
	await connecting;
	await client.resume({ token: token ?? 'resume-token' });
	return client;
}

export async function subscribeMediaStreams(client: RealSdkClient): Promise<void> {
	await client.subscribeNotifyUser();
}
