import * as NativeWatchModuleModule from '~/lib/native/NativeWatchModule';
import { getQuickRepliesKey } from '../getQuickRepliesKey';

const server = 'https://open.rocket.chat';

describe('getQuickRepliesKey', () => {
	it('returns the key the native module builds for the server', () => {
		expect(getQuickRepliesKey(server)).toBe(`${server}-mock-watch-quick-replies`);
	});

	it('throws when the native module is not available', () => {
		const replaced = jest.replaceProperty(NativeWatchModuleModule, 'default', null);

		try {
			expect(() => getQuickRepliesKey(server)).toThrow('The watch module is not available on this platform');
		} finally {
			replaced.restore();
		}
	});
});
