import { buildImageURL } from './buildImageURL';

// https://github.com/RocketChat/Rocket.Chat/blob/5c145e3170f04e341be93a2a60f09b6cbdc46c73/apps/meteor/tests/unit/client/views/room/MessageList/lib/buildImageURL.spec.ts#L8
describe('buildImageURL', () => {
	const testCases = [
		[
			'https://chat.cortexflex.org/avatar/rocket.cat',
			'https://chat.cortexflex.org/avatar/rocket.cat',
			'https://chat.cortexflex.org/direct/NNNNnnnnNNNNnnnnfrocket.cat'
		],
		['https://chat.cortexflex.org/assets/favicon_512.png', 'assets/favicon_512.png', 'https://chat.cortexflex.org/channel/general'],
		['https://chat.cortexflex.org/assets/favicon_512.png', '/assets/favicon_512.png', 'https://chat.cortexflex.org/channel/general'],
		['https://chat.cortexflex.org/assets/favicon_512.png', '//assets/favicon_512.png', 'https://chat.cortexflex.org/channel/general/']
	] as const;
	it.each(testCases)('should return %s for %s', (expectedResult, metaImgUrl, linkUrl) => {
		const result = buildImageURL(linkUrl, metaImgUrl);

		expect(result).toBe(expectedResult);
	});
});
