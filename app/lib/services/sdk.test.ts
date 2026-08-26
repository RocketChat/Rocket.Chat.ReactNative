import sdk from './sdk';
import { TwoFactorCancelledError, isTwoFactorCancelled } from './twoFactor/twoFactorCancelled';

const mockInnerMethodCall = jest.fn();
const mockInnerPost = jest.fn();
const mockTwoFactor = jest.fn();

jest.mock('@rocket.chat/sdk', () => ({
	Rocketchat: jest.fn().mockImplementation(() => ({
		methodCall: (...args: unknown[]) => mockInnerMethodCall(...args),
		post: (...args: unknown[]) => mockInnerPost(...args)
	})),
	settings: { customHeaders: {} }
}));

jest.mock('./twoFactor/twoFactor', () => ({
	...jest.requireActual('./twoFactor/twoFactor'),
	twoFactor: (...args: unknown[]) => mockTwoFactor(...args)
}));

beforeEach(() => {
	jest.clearAllMocks();
	sdk.initialize('https://example.com');
});

describe('sdk.methodCall', () => {
	it('no 2FA in progress → exact args, no trailing junk', async () => {
		mockInnerMethodCall.mockResolvedValue('ok');

		const result = await sdk.methodCall('loadSurroundingMessages', { messageId: 'x' }, false);

		expect(result).toBe('ok');
		expect(mockInnerMethodCall).toHaveBeenCalledWith('loadSurroundingMessages', { messageId: 'x' }, false);
		expect(mockInnerMethodCall.mock.calls[0]).toHaveLength(3);
	});

	it('totp-required → prompt, retry with the code appended', async () => {
		const totpObject = { twoFactorCode: 'CODE', twoFactorMethod: 'totp' };
		mockInnerMethodCall.mockRejectedValueOnce({
			error: 'totp-required',
			details: { method: 'totp' }
		});
		mockInnerMethodCall.mockResolvedValueOnce('ok');
		mockTwoFactor.mockResolvedValue(totpObject);

		const result = await sdk.methodCall('someMethod', 'arg1');

		expect(result).toBe('ok');
		expect(mockTwoFactor).toHaveBeenCalledTimes(1);
		expect(mockTwoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false });
		// Second call should have the TOTP object appended
		expect(mockInnerMethodCall.mock.calls[1]).toEqual(['someMethod', 'arg1', totpObject]);
	});

	it('the code does not leak into the next call', async () => {
		const totpObject = { twoFactorCode: 'CODE', twoFactorMethod: 'totp' };
		// First call: rejection that prompts for 2FA
		mockInnerMethodCall.mockRejectedValueOnce({
			error: 'totp-required',
			details: { method: 'totp' }
		});
		// Retry with 2FA code
		mockInnerMethodCall.mockResolvedValueOnce('ok');
		// Second unrelated call
		mockInnerMethodCall.mockResolvedValueOnce('ok2');
		mockTwoFactor.mockResolvedValue(totpObject);

		// First call with 2FA prompt
		await sdk.methodCall('method1', 'a');

		// Second call should NOT have the code appended
		const result = await sdk.methodCall('other/method', 'a');

		expect(result).toBe('ok2');
		// Third call (the second method call after 2FA) should have exactly 2 args
		expect(mockInnerMethodCall.mock.calls[2]).toEqual(['other/method', 'a']);
		expect(mockInnerMethodCall.mock.calls[2]).toHaveLength(2);
	});

	it('twoFactor cancelled → rejects with TwoFactorCancelledError', async () => {
		mockInnerMethodCall.mockRejectedValue({
			error: 'totp-required',
			details: { method: 'totp' }
		});
		mockTwoFactor.mockRejectedValue(new TwoFactorCancelledError());

		const error = await sdk.methodCall('m').catch(e => e);

		expect(isTwoFactorCancelled(error)).toBe(true);
		expect(mockInnerMethodCall).toHaveBeenCalledTimes(1);
	});

	it('non-2FA error → rejects with the original error', async () => {
		const error = { error: 'error-not-allowed' };
		mockInnerMethodCall.mockRejectedValue(error);

		await expect(sdk.methodCall('m')).rejects.toBe(error);
		expect(mockTwoFactor).not.toHaveBeenCalled();
	});
});

describe('sdk.post', () => {
	it('twoFactor cancelled → rejects with TwoFactorCancelledError', async () => {
		mockInnerPost.mockRejectedValue({ data: { errorType: 'totp-required', details: { method: 'totp' } } });
		mockTwoFactor.mockRejectedValue(new TwoFactorCancelledError());

		const error = await sdk.post('chat.delete' as never, {} as never).catch(e => e);

		expect(isTwoFactorCancelled(error)).toBe(true);
		expect(mockInnerPost).toHaveBeenCalledTimes(1);
	});

	it('twoFactor submitted → retries and resolves', async () => {
		mockInnerPost.mockRejectedValueOnce({ data: { errorType: 'totp-required', details: { method: 'totp' } } });
		mockInnerPost.mockResolvedValueOnce({ success: true });
		mockTwoFactor.mockResolvedValue({ twoFactorCode: 'CODE', twoFactorMethod: 'totp' });

		await expect(sdk.post('chat.delete' as never, {} as never)).resolves.toEqual({ success: true });
		expect(mockInnerPost).toHaveBeenCalledTimes(2);
	});

	it('non-2FA error → rejects with the original error', async () => {
		const error = { data: { errorType: 'error-not-allowed' } };
		mockInnerPost.mockRejectedValue(error);

		await expect(sdk.post('chat.delete' as never, {} as never)).rejects.toBe(error);
		expect(mockTwoFactor).not.toHaveBeenCalled();
	});
});
