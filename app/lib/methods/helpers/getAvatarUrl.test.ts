import { formatUrl } from './getAvatarUrl';

jest.mock('react-native', () => ({ PixelRatio: { get: () => 1 } }));

describe('formatUrl function', () => {
	test('formats the default URL to get the user avatar', () => {
		const url = 'https://mobile.rocket.chat/avatar/reinaldoneto';
		const size = 30;
		const query = '&extraparam=true';
		const expected = 'https://mobile.rocket.chat/avatar/reinaldoneto?format=png&size=30&extraparam=true';
		const result = formatUrl(url, size, query);
		expect(result).toEqual(expected);
	});

	test('formats an external provider URI to get the user avatar', () => {
		const url = 'https://open.rocket.chat/avatar/reinaldoneto';
		const size = 30;
		const query = undefined;
		const expected = 'https://open.rocket.chat/avatar/reinaldoneto?format=png&size=30';
		const result = formatUrl(url, size, query);
		expect(result).toEqual(expected);
	});

	test('formats an external provider URI that already includes a query to get the user avatar', () => {
		const url = 'https://open.rocket.chat/avatar?rcusername=reinaldoneto';
		const size = 30;
		const query = undefined;
		const expected = 'https://open.rocket.chat/avatar?rcusername=reinaldoneto&format=png&size=30';
		const result = formatUrl(url, size, query);
		expect(result).toEqual(expected);
	});
});
