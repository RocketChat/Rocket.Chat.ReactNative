import { formatUrl } from './getAvatarUrl';

jest.mock('react-native', () => ({ PixelRatio: { get: () => 1 } }));

describe('Test the formatURL', () => {
	it('format as default to get the avatar from an user', () => {
		const url = 'https://mobile.rocket.chat/avatar/reinaldoneto';
		const size = 30;
		const query = '&extraparam=true';
		const expectedResult = `https://mobile.rocket.chat/avatar/reinaldoneto?format=png&size=30&extraparam=true`;
		expect(formatUrl(url, size, query)).toBe(expectedResult);
	});
	it('format external provider uri to get the avatar from an user', () => {
		const url = 'https://open.rocket.chat/avatar/reinaldoneto';
		const size = 30;
		const query = undefined;
		const expectedResult = `https://open.rocket.chat/avatar/reinaldoneto?format=png&size=30`;
		expect(formatUrl(url, size, query)).toBe(expectedResult);
	});
	it('format external provider uri that already adds a query to get the avatar from an user', () => {
		const url = 'https://open.rocket.chat/avatar?rcusername=reinaldoneto';
		const size = 30;
		const query = undefined;
		const expectedResult = `https://open.rocket.chat/avatar?rcusername=reinaldoneto&format=png&size=30`;
		expect(formatUrl(url, size, query)).toBe(expectedResult);
	});
});
