import { buildImageURL } from './buildUrlImage';

// https://github.com/RocketChat/Rocket.Chat/blob/5c145e3170f04e341be93a2a60f09b6cbdc46c73/apps/meteor/tests/unit/client/views/room/MessageList/lib/buildImageURL.spec.ts#L8
describe('buildImageURL', () => {
	const testCases = [
		[
			'https://s2.glbimg.com/fXQKM_UZjF6I_3APIbPJzJTOUvw=/1200x/smart/filters:cover():strip_icc()/s04.video.glbimg.com/x720/11012523.jpg',
			'https://s2.glbimg.com/fXQKM_UZjF6I_3APIbPJzJTOUvw=/1200x/smart/filters:cover():strip_icc()/s04.video.glbimg.com/x720/11012523.jpg',
			'https://g1.globo.com/mundo/video/misseis-atingem-ponte-de-vidro-em-kiev-11012523.ghtml'
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
