import { buildImageURL } from './buildImageURL';

// https://github.com/RocketChat/Rocket.Chat/blob/5c145e3170f04e341be93a2a60f09b6cbdc46c73/apps/meteor/tests/unit/client/views/room/MessageList/lib/buildImageURL.spec.ts#L8
describe('buildImageURL', () => {
	const testCases = [
		[
			'https://open.rocket.chat/avatar/rocket.cat',
			'https://open.rocket.chat/avatar/rocket.cat',
			'https://open.rocket.chat/direct/NNNNnnnnNNNNnnnnfrocket.cat'
		],
		['https://open.rocket.chat/assets/favicon_512.png', 'assets/favicon_512.png', 'https://open.rocket.chat/channel/general'],
		['https://open.rocket.chat/assets/favicon_512.png', '/assets/favicon_512.png', 'https://open.rocket.chat/channel/general'],
		['https://open.rocket.chat/assets/favicon_512.png', '//assets/favicon_512.png', 'https://open.rocket.chat/channel/general/']
	] as const;
	it.each(testCases)('should return %s for %s', (expectedResult, metaImgUrl, linkUrl) => {
		const result = buildImageURL(linkUrl, metaImgUrl);

		expect(result).toBe(expectedResult);
	});
});
