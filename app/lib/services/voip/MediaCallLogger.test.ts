import { MediaCallLogger } from './MediaCallLogger';

describe('MediaCallLogger', () => {
	describe('log()', () => {
		it('writes to console.log when __DEV__ is true', () => {
			const originalDev = __DEV__;
			// @ts-expect-error __DEV__ is not writable but we need to test
			global.__DEV__ = true;
			const spy = jest.spyOn(console, 'log').mockImplementation();

			const logger = new MediaCallLogger();
			logger.log('test message');

			expect(spy).toHaveBeenCalledWith('[Media Call] ["test message"]');

			spy.mockRestore();
			// @ts-expect-error restoring
			global.__DEV__ = originalDev;
		});

		it('does NOT write to console.log when __DEV__ is false', () => {
			const originalDev = __DEV__;
			// @ts-expect-error __DEV__ is not writable but we need to test
			global.__DEV__ = false;
			const spy = jest.spyOn(console, 'log').mockImplementation();

			const logger = new MediaCallLogger();
			logger.log('sensitive data', { token: 'secret', callId: 'abc' });

			expect(spy).not.toHaveBeenCalledWith(expect.stringMatching(/^\[Media Call/));

			spy.mockRestore();
			// @ts-expect-error restoring
			global.__DEV__ = originalDev;
		});
	});

	describe('debug()', () => {
		it('writes to console.log when __DEV__ is true', () => {
			const originalDev = __DEV__;
			// @ts-expect-error __DEV__ is not writable but we need to test
			global.__DEV__ = true;
			const spy = jest.spyOn(console, 'log').mockImplementation();

			const logger = new MediaCallLogger();
			logger.debug('debug message');

			expect(spy).toHaveBeenCalledWith('[Media Call Debug] ["debug message"]');

			spy.mockRestore();
			// @ts-expect-error restoring
			global.__DEV__ = originalDev;
		});

		it('does NOT write to console.log when __DEV__ is false', () => {
			const originalDev = __DEV__;
			// @ts-expect-error __DEV__ is not writable but we need to test
			global.__DEV__ = false;
			const spy = jest.spyOn(console, 'log').mockImplementation();

			const logger = new MediaCallLogger();
			logger.debug('debug message');

			expect(spy).not.toHaveBeenCalledWith(expect.stringMatching(/^\[Media Call/));

			spy.mockRestore();
			// @ts-expect-error restoring
			global.__DEV__ = originalDev;
		});
	});

	describe('error()', () => {
		it('writes to console.error regardless of __DEV__', () => {
			const originalDev = __DEV__;
			// @ts-expect-error __DEV__ is not writable but we need to test
			global.__DEV__ = false;
			const spy = jest.spyOn(console, 'error').mockImplementation();

			const logger = new MediaCallLogger();
			logger.error('error message');

			expect(spy).toHaveBeenCalledWith('[Media Call Error] ["error message"]');

			spy.mockRestore();
			// @ts-expect-error restoring
			global.__DEV__ = originalDev;
		});
	});

	describe('warn()', () => {
		it('writes to console.warn regardless of __DEV__', () => {
			const originalDev = __DEV__;
			// @ts-expect-error __DEV__ is not writable but we need to test
			global.__DEV__ = false;
			const spy = jest.spyOn(console, 'warn').mockImplementation();

			const logger = new MediaCallLogger();
			logger.warn('warn message');

			expect(spy).toHaveBeenCalledWith('[Media Call Warning] ["warn message"]');

			spy.mockRestore();
			// @ts-expect-error restoring
			global.__DEV__ = originalDev;
		});
	});
});
