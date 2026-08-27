import type { AnyAction } from 'redux';

interface IActionWaiter {
	type: string;
	resolve(action: AnyAction): void;
}

export interface IActionRecorder {
	actions: AnyAction[];
	record(action: AnyAction): void;
	reset(): void;
	types(): string[];
	actionsOfType(type: string): AnyAction[];
	requireAction(type: string): AnyAction;
	awaitAction(type: string): Promise<AnyAction>;
}

export function createActionRecorder(): IActionRecorder {
	const actions: AnyAction[] = [];
	let waiters: IActionWaiter[] = [];
	const recorder: IActionRecorder = {
		actions,
		record(action: AnyAction) {
			actions.push(action);
			waiters = waiters.filter(waiter => {
				if (waiter.type !== action.type) return true;
				waiter.resolve(action);
				return false;
			});
		},
		reset() {
			actions.length = 0;
			waiters = [];
		},
		types() {
			return actions.map(action => action.type);
		},
		actionsOfType(type: string) {
			return actions.filter(action => action.type === type);
		},
		requireAction(type: string) {
			const found = recorder.actionsOfType(type);
			if (!found.length) throw new Error(`[action recorder] no "${type}" action was dispatched`);
			return found[found.length - 1];
		},
		awaitAction(type: string) {
			const existing = recorder.actionsOfType(type);
			if (existing.length) return Promise.resolve(existing[existing.length - 1]);
			return new Promise(resolve => waiters.push({ type, resolve }));
		}
	};
	return recorder;
}

interface ICallWaiter {
	count: number;
	resolve(args: unknown[]): void;
}

export interface ICallTracker {
	awaitCall(count?: number): Promise<unknown[]>;
}

export function trackCalls(mock: jest.Mock): ICallTracker {
	const implementation = mock.getMockImplementation();
	let waiters: ICallWaiter[] = [];
	mock.mockImplementation((...args: unknown[]) => {
		const result = implementation?.(...args);
		waiters = waiters.filter(waiter => {
			if (mock.mock.calls.length < waiter.count) return true;
			waiter.resolve(args);
			return false;
		});
		return result;
	});
	return {
		awaitCall(count = 1) {
			const calls = mock.mock.calls as unknown[][];
			if (calls.length >= count) return Promise.resolve(calls[count - 1]);
			return new Promise(resolve => waiters.push({ count, resolve }));
		}
	};
}

export interface IWaitUntilOptions {
	label: string;
	observed(): unknown;
	attempts?: number;
	advance?: () => Promise<unknown>;
}

const advanceScheduler = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

export async function waitUntil(
	isMet: () => boolean,
	{ label, observed, attempts = 50, advance = advanceScheduler }: IWaitUntilOptions
): Promise<void> {
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		if (isMet()) return;
		await advance();
	}
	if (isMet()) return;
	throw new Error(
		`[waitUntil] "${label}" was still false after ${attempts} scheduler advances. Observed: ${JSON.stringify(observed())}`
	);
}
