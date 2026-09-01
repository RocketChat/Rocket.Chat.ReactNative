import { type IUrl, type IUrlFromServer } from '../../../definitions';
import parseUrls from './parseUrls';

interface IParseUrlsFixture {
	urls: {
		url: string;
		ignoreParse?: boolean;
		meta: Partial<IUrlFromServer['meta']> & {
			msapplicationTileImage?: string;
			msapplicationConfig?: string;
			appleMobileWebAppTitle?: string;
		};
		headers?: IUrlFromServer['headers'];
		parsedUrl?: Partial<NonNullable<IUrlFromServer['parsedUrl']>>;
	}[];
	expectedResult: {
		_id: number;
		title?: string;
		description?: string;
		image?: string;
		url: string;
	}[];
}

const parseFixture = (fixture: IParseUrlsFixture): IUrl[] => parseUrls(fixture.urls as IUrlFromServer[]);

const tmpImageValidLink: IParseUrlsFixture = {
	urls: [
		{
			url: 'https://meet.google.com/cbr-hysk-azn?pli=1&authuser=1',
			meta: {
				pageTitle: 'Meet',
				description:
					'Real-time meetings by Google. Using your browser, share your video, desktop, and presentations with teammates and customers.',
				twitterCard: 'summary',
				ogUrl: 'https://meet.google.com',
				ogType: 'website',
				ogTitle: 'Meet',
				ogDescription:
					'Real-time meetings by Google. Using your browser, share your video, desktop, and presentations with teammates and customers.',
				ogImage: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png'
			},
			headers: {
				contentType: 'text/html; charset=utf-8'
			},
			parsedUrl: {
				host: 'meet.google.com',
				hash: null,
				pathname: '/cbr-hysk-azn',
				protocol: 'https:',
				port: null,
				query: 'pli=1&authuser=1',
				search: '?pli=1&authuser=1',
				hostname: 'meet.google.com'
			}
		}
	],
	expectedResult: [
		{
			_id: 0,
			title: 'Meet',
			description:
				'Real-time meetings by Google. Using your browser, share your video, desktop, and presentations with teammates and customers.',
			image: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png',
			url: 'https://meet.google.com/cbr-hysk-azn?pli=1&authuser=1'
		}
	]
};

const tmpImagePointingToAnAsset: IParseUrlsFixture = {
	urls: [
		{
			url: 'https://open.rocket.chat/',
			meta: {
				pageTitle: 'Rocket.Chat',
				msapplicationTileImage: 'assets/tile_144.png',
				msapplicationConfig: 'images/browserconfig.xml',
				ogImage: 'assets/favicon_512.png',
				twitterImage: 'assets/favicon_512.png',
				appleMobileWebAppTitle: 'Rocket.Chat',
				fbAppId: '835103589938459'
			},
			headers: {
				contentType: 'text/html; charset=utf-8'
			}
		}
	],
	expectedResult: [
		{
			_id: 0,
			title: 'Rocket.Chat',
			image: 'https://open.rocket.chat/assets/favicon_512.png',
			url: 'https://open.rocket.chat/'
		}
	]
};

const tmpImagePointingToAnAssetThatStartsWithSlashWithoutParsedUrl: IParseUrlsFixture = {
	urls: [
		{
			url: 'https://open.rocket.chat/',
			meta: {
				pageTitle: 'Rocket.Chat',
				msapplicationTileImage: 'assets/tile_144.png',
				msapplicationConfig: 'images/browserconfig.xml',
				ogImage: '/assets/favicon_512.png',
				twitterImage: '/assets/favicon_512.png',
				appleMobileWebAppTitle: 'Rocket.Chat',
				fbAppId: '835103589938459'
			},
			headers: {
				contentType: 'text/html; charset=utf-8'
			}
		}
	],
	expectedResult: [
		{
			_id: 0,
			title: 'Rocket.Chat',
			image: 'https://open.rocket.chat/assets/favicon_512.png',
			url: 'https://open.rocket.chat/'
		}
	]
};

const tmpImagePointingToAnAssetThatStartsWithSlashWithParsedUrl: IParseUrlsFixture = {
	urls: [
		{
			url: 'https://open.rocket.chat/',
			meta: {
				pageTitle: 'Rocket.Chat',
				msapplicationTileImage: 'assets/tile_144.png',
				msapplicationConfig: 'images/browserconfig.xml',
				ogImage: '/assets/favicon_512.png',
				twitterImage: '/assets/favicon_512.png',
				appleMobileWebAppTitle: 'Rocket.Chat',
				fbAppId: '835103589938459'
			},
			headers: {
				contentType: 'text/html; charset=utf-8'
			},
			parsedUrl: {
				hash: '',
				host: 'open.rocket.chat',
				hostname: 'open.rocket.chat',
				pathname: '/',
				port: '',
				protocol: 'https:',
				search: '',
				query: 'pli=1&authuser=1'
			}
		}
	],
	expectedResult: [
		{
			_id: 0,
			title: 'Rocket.Chat',
			image: 'https://open.rocket.chat/assets/favicon_512.png',
			url: 'https://open.rocket.chat/'
		}
	]
};

const tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithParsedUrl: IParseUrlsFixture = {
	urls: [
		{
			url: 'https://open.rocket.chat/',
			meta: {
				pageTitle: 'Rocket.Chat',
				msapplicationTileImage: 'assets/tile_144.png',
				msapplicationConfig: 'images/browserconfig.xml',
				ogImage: '//assets/favicon_512.png',
				twitterImage: '//assets/favicon_512.png',
				appleMobileWebAppTitle: 'Rocket.Chat',
				fbAppId: '835103589938459'
			},
			headers: {
				contentType: 'text/html; charset=utf-8'
			},
			parsedUrl: {
				host: 'open.rocket.chat',
				hash: null,
				protocol: 'https:',
				port: null,
				hostname: 'open.rocket.chat'
			}
		}
	],
	expectedResult: [
		{
			_id: 0,
			title: 'Rocket.Chat',
			image: 'https://open.rocket.chat/assets/favicon_512.png',
			url: 'https://open.rocket.chat/'
		}
	]
};

const tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithoutParsedUrl: IParseUrlsFixture = {
	urls: [
		{
			url: 'https://open.rocket.chat/',
			meta: {
				pageTitle: 'Rocket.Chat',
				msapplicationTileImage: 'assets/tile_144.png',
				msapplicationConfig: 'images/browserconfig.xml',
				ogImage: '//assets/favicon_512.png',
				twitterImage: '//assets/favicon_512.png',
				appleMobileWebAppTitle: 'Rocket.Chat',
				fbAppId: '835103589938459'
			},
			headers: {
				contentType: 'text/html; charset=utf-8'
			}
		}
	],
	expectedResult: [
		{
			_id: 0,
			title: 'Rocket.Chat',
			image: 'https://open.rocket.chat/assets/favicon_512.png',
			url: 'https://open.rocket.chat/'
		}
	]
};

describe('parseUrls function', () => {
	it('test when a tmp.image is a valid link', () => {
		const result = parseFixture(tmpImageValidLink);
		expect(result).toEqual(tmpImageValidLink.expectedResult);
	});

	it('test when a tmp.image is assets/favicon_512.png', () => {
		const result = parseFixture(tmpImagePointingToAnAsset);
		expect(result).toEqual(tmpImagePointingToAnAsset.expectedResult);
	});

	it('test when a tmp.image is /assets/favicon_512.png and url with parsedUrl, parsedUrl.protocol and parsedUrl.host', () => {
		const result = parseFixture(tmpImagePointingToAnAssetThatStartsWithSlashWithParsedUrl);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithSlashWithParsedUrl.expectedResult);
	});

	it('test when a tmp.image is /assets/favicon_512.png and url without parsedUrl', () => {
		const result = parseFixture(tmpImagePointingToAnAssetThatStartsWithSlashWithoutParsedUrl);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithSlashWithoutParsedUrl.expectedResult);
	});

	it('test when a tmp.image is //assets/favicon_512.png and url with parsedUrl', () => {
		const result = parseFixture(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithParsedUrl);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithParsedUrl.expectedResult);
	});

	it('test when a tmp.image is //assets/favicon_512.png and url without parsedUrl', () => {
		const result = parseFixture(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithoutParsedUrl);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithoutParsedUrl.expectedResult);
	});
});
