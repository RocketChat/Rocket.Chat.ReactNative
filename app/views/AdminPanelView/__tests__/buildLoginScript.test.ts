import { buildLoginScript } from '../buildLoginScript';

const run = (token?: string) => {
	new Function(buildLoginScript(token))();
};

describe('buildLoginScript', () => {
	let loginWithToken: jest.Mock;

	beforeEach(() => {
		jest.useFakeTimers();
		loginWithToken = jest.fn();
		delete (globalThis as any).Meteor;
	});

	afterEach(() => {
		jest.useRealTimers();
		delete (globalThis as any).Meteor;
	});

	it('logs in immediately when Meteor is already available', () => {
		(globalThis as any).Meteor = { loginWithToken };
		run('token-abc');
		expect(loginWithToken).toHaveBeenCalledTimes(1);
		expect(loginWithToken.mock.calls[0][0]).toBe('token-abc');
	});

	it('waits for Meteor when the page bundle has not evaluated yet', () => {
		run('token-abc');
		expect(loginWithToken).not.toHaveBeenCalled();

		jest.advanceTimersByTime(500);
		expect(loginWithToken).not.toHaveBeenCalled();

		(globalThis as any).Meteor = { loginWithToken };
		jest.advanceTimersByTime(100);
		expect(loginWithToken).toHaveBeenCalledTimes(1);
		expect(loginWithToken.mock.calls[0][0]).toBe('token-abc');
	});

	it('stops polling instead of looping forever when Meteor never appears', () => {
		run('token-abc');
		jest.advanceTimersByTime(60000);
		expect(jest.getTimerCount()).toBe(0);
		expect(loginWithToken).not.toHaveBeenCalled();
	});

	it('escapes the token so it cannot break out of the script literal', () => {
		(globalThis as any).Meteor = { loginWithToken };
		run('it\'s"\n');
		expect(loginWithToken.mock.calls[0][0]).toBe('it\'s"\n');
	});
});
