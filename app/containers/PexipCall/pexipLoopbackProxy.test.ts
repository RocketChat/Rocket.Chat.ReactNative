import { NativeModules } from 'react-native';

import { getHttpsOrigin, isTlsError, startPexipLoopbackProxy, stopPexipLoopbackProxy } from './pexipLoopbackProxy';

jest.mock('~/lib/methods/helpers/log', () => jest.fn());

const callUrl = 'https://conference.example.com//webapp/conference?conference=abc&join=1&name=Otavio+Stasiak';

describe('pexipLoopbackProxy', () => {
	const start = jest.fn();
	const stop = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		NativeModules.PexipProxy = { start, stop };
	});

	afterAll(() => {
		delete NativeModules.PexipProxy;
	});

	describe('isTlsError', () => {
		it('matches the NSURLError server certificate codes', () => {
			expect(isTlsError(-1200)).toBe(true);
			expect(isTlsError(-1202)).toBe(true);
			expect(isTlsError(-1204)).toBe(true);
		});

		it('ignores other failures', () => {
			expect(isTlsError(-1009)).toBe(false);
			expect(isTlsError(-1205)).toBe(false);
			expect(isTlsError(0)).toBe(false);
			expect(isTlsError(undefined)).toBe(false);
			expect(isTlsError('-1200')).toBe(false);
		});
	});

	describe('getHttpsOrigin', () => {
		it('extracts scheme, host and port', () => {
			expect(getHttpsOrigin('https://conference.example.com:8443/webapp/x?y=1')).toBe('https://conference.example.com:8443');
			expect(getHttpsOrigin(callUrl)).toBe('https://conference.example.com');
		});

		it('rejects non-https urls', () => {
			expect(getHttpsOrigin('http://conference.example.com/webapp')).toBeNull();
			expect(getHttpsOrigin('conference.example.com/webapp')).toBeNull();
		});
	});

	describe('startPexipLoopbackProxy', () => {
		it('rewrites the url onto the local origin and keeps the rest intact', async () => {
			start.mockResolvedValue('http://127.0.0.1:54321');
			await expect(startPexipLoopbackProxy(callUrl)).resolves.toBe(
				'http://127.0.0.1:54321//webapp/conference?conference=abc&join=1&name=Otavio+Stasiak'
			);
			expect(start).toHaveBeenCalledWith('https://conference.example.com');
		});

		it('returns null when the native module fails', async () => {
			start.mockRejectedValue(new Error('bind failed'));
			await expect(startPexipLoopbackProxy(callUrl)).resolves.toBeNull();
		});

		it('returns null for non-https urls without touching native', async () => {
			await expect(startPexipLoopbackProxy('http://conference.example.com/webapp')).resolves.toBeNull();
			expect(start).not.toHaveBeenCalled();
		});

		it('does nothing on android', async () => {
			let androidProxy:
				| { startPexipLoopbackProxy: typeof startPexipLoopbackProxy; stopPexipLoopbackProxy: typeof stopPexipLoopbackProxy }
				| undefined;
			jest.isolateModules(() => {
				jest.doMock('~/lib/methods/helpers', () => ({ isIOS: false }));
				androidProxy = jest.requireActual('./pexipLoopbackProxy');
			});
			await expect(androidProxy!.startPexipLoopbackProxy(callUrl)).resolves.toBeNull();
			androidProxy!.stopPexipLoopbackProxy();
			expect(start).not.toHaveBeenCalled();
			expect(stop).not.toHaveBeenCalled();
		});
	});

	it('stop forwards to native', () => {
		stopPexipLoopbackProxy();
		expect(stop).toHaveBeenCalledTimes(1);
	});
});
