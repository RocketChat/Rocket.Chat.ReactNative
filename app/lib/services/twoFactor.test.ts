/* eslint-disable import/first */
jest.mock('../methods/helpers/events', () => ({
	__esModule: true,
	default: { emit: jest.fn() }
}));

jest.mock('../../containers/TwoFactor', () => ({
	TWO_FACTOR: 'TWO_FACTOR'
}));

import { twoFactor } from './twoFactor';
import EventEmitter from '../methods/helpers/events';

describe('twoFactor', () => {
	beforeEach(() => {
		(EventEmitter.emit as jest.Mock).mockReset();
	});

	it('emits a TWO_FACTOR event with method, invalid, params, submit, cancel', () => {
		twoFactor({ method: 'totp', invalid: false });
		expect(EventEmitter.emit).toHaveBeenCalledWith(
			'TWO_FACTOR',
			expect.objectContaining({
				method: 'totp',
				invalid: false,
				submit: expect.any(Function),
				cancel: expect.any(Function)
			})
		);
	});

	it('forwards params through the emitted event', () => {
		const params = { user: 'john', password: 'p' };
		twoFactor({ method: 'email', invalid: false, params });
		const emitted = (EventEmitter.emit as jest.Mock).mock.calls[0][1];
		expect(emitted.params).toBe(params);
	});

	it('resolves with { twoFactorCode, twoFactorMethod } when submit is called', async () => {
		const promise = twoFactor({ method: 'email', invalid: false });
		const emitted = (EventEmitter.emit as jest.Mock).mock.calls[0][1];
		emitted.submit('123456');
		await expect(promise).resolves.toEqual({ twoFactorCode: '123456', twoFactorMethod: 'email' });
	});

	it('preserves the method on the resolved value even when the prompt is for a different method', async () => {
		const promise = twoFactor({ method: 'totp', invalid: true });
		const emitted = (EventEmitter.emit as jest.Mock).mock.calls[0][1];
		emitted.submit('999999');
		await expect(promise).resolves.toEqual({ twoFactorCode: '999999', twoFactorMethod: 'totp' });
	});

	it('rejects (with no value) when cancel is called', async () => {
		const promise = twoFactor({ method: 'totp', invalid: false });
		const emitted = (EventEmitter.emit as jest.Mock).mock.calls[0][1];
		emitted.cancel();
		await expect(promise).rejects.toBeUndefined();
	});

	it('emits a fresh handler pair per call (concurrent prompts are independent)', async () => {
		const p1 = twoFactor({ method: 'totp', invalid: false });
		const p2 = twoFactor({ method: 'email', invalid: false });
		const e1 = (EventEmitter.emit as jest.Mock).mock.calls[0][1];
		const e2 = (EventEmitter.emit as jest.Mock).mock.calls[1][1];
		e1.submit('111111');
		e2.cancel();
		await expect(p1).resolves.toEqual({ twoFactorCode: '111111', twoFactorMethod: 'totp' });
		await expect(p2).rejects.toBeUndefined();
	});
});
