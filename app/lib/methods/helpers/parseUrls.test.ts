import { type IUrl, type IUrlFromServer } from '~/definitions/IUrl';
import parseUrls from './parseUrls';

const tmpImageValidLink = {
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
} as { urls: IUrlFromServer[]; expectedResult: IUrl[] };

const tmpImagePointingToAnAsset = {
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
} as unknown as { urls: IUrlFromServer[]; expectedResult: IUrl[] };

const tmpImagePointingToAnAssetThatStartsWithSlashWithoutParsedUrl = {
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
} as unknown as { urls: IUrlFromServer[]; expectedResult: IUrl[] };

const tmpImagePointingToAnAssetThatStartsWithSlashWithParsedUrl = {
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
} as unknown as { urls: IUrlFromServer[]; expectedResult: IUrl[] };

const tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithParsedUrl = {
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
} as unknown as { urls: IUrlFromServer[]; expectedResult: IUrl[] };

const tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithoutParsedUrl = {
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
} as unknown as { urls: IUrlFromServer[]; expectedResult: IUrl[] };

describe('parseUrls function', () => {
	it('test when a tmp.image is a valid link', () => {
		const result = parseUrls(tmpImageValidLink.urls);
		expect(result).toEqual(tmpImageValidLink.expectedResult);
	});

	it('test when a tmp.image is assets/favicon_512.png', () => {
		const result = parseUrls(tmpImagePointingToAnAsset.urls);
		expect(result).toEqual(tmpImagePointingToAnAsset.expectedResult);
	});

	it('test when a tmp.image is /assets/favicon_512.png and url with parsedUrl, parsedUrl.protocol and parsedUrl.host', () => {
		const result = parseUrls(tmpImagePointingToAnAssetThatStartsWithSlashWithParsedUrl.urls);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithSlashWithParsedUrl.expectedResult);
	});

	it('test when a tmp.image is /assets/favicon_512.png and url without parsedUrl', () => {
		const result = parseUrls(tmpImagePointingToAnAssetThatStartsWithSlashWithoutParsedUrl.urls);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithSlashWithoutParsedUrl.expectedResult);
	});

	it('test when a tmp.image is //assets/favicon_512.png and url with parsedUrl', () => {
		const result = parseUrls(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithParsedUrl.urls);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithParsedUrl.expectedResult);
	});

	it('test when a tmp.image is //assets/favicon_512.png and url without parsedUrl', () => {
		const result = parseUrls(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithoutParsedUrl.urls);
		expect(result).toEqual(tmpImagePointingToAnAssetThatStartsWithDoubleSlashWithoutParsedUrl.expectedResult);
	});

	it('keeps og image dimensions when the og image is the preview image', () => {
		const [url] = parseUrls([
			{
				url: 'https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7707',
				meta: { ogImage: 'https://opengraph.githubassets.com/pr.png', ogImageWidth: '1200', ogImageHeight: '600' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url).toMatchObject({ image: 'https://opengraph.githubassets.com/pr.png', imageWidth: 1200, imageHeight: 600 });
	});

	it('drops og image dimensions when the preview image comes from another tag', () => {
		const [url] = parseUrls([
			{
				url: 'https://rocket.chat',
				meta: { twitterImage: 'https://rocket.chat/twitter.png', ogImageWidth: '1200', ogImageHeight: '600' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url.imageWidth).toBeUndefined();
		expect(url.imageHeight).toBeUndefined();
	});

	it('drops og image dimensions that are not positive numbers', () => {
		const [url] = parseUrls([
			{
				url: 'https://rocket.chat',
				meta: { ogImage: 'https://rocket.chat/og.png', ogImageWidth: 'auto', ogImageHeight: '0' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url.imageWidth).toBeUndefined();
		expect(url.imageHeight).toBeUndefined();
	});

	it('shows the post text and author of a rich oEmbed preview such as an X post', () => {
		const [url] = parseUrls([
			{
				url: 'https://x.com/reactnative/status/1578332414145105921',
				meta: {
					oembedUrl: 'https://x.com/reactnative/status/1578332414145105921',
					oembedAuthorName: 'React Native',
					oembedAuthorUrl: 'https://x.com/reactnative',
					oembedHtml:
						'<blockquote class="twitter-tweet"><p lang="en" dir="ltr">We&#39;re happy to share that our website <a href="https://t.co/Msd34gULf5">https://t.co/Msd34gULf5</a> is now fully bilingual: Java &amp; <a href="https://x.com/hashtag/Kotlin?src=hash&amp;ref_src=twsrc%5Etfw">#Kotlin</a> 🚀<br><br>You will find snippets and examples in both languages side by side!<br><br>Kotlin makes for a more concise and more elegant experience when writing your native modules &amp; components.</p>&mdash; React Native (@reactnative) <a href="https://x.com/reactnative/status/1578332414145105921?ref_src=twsrc%5Etfw">October 7, 2022</a></blockquote>\n<script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>\n\n',
					oembedType: 'rich',
					oembedProviderName: 'X',
					oembedProviderUrl: 'https://x.com'
				}
			}
		] as unknown as IUrlFromServer[]);
		expect(url.title).toBe('React Native');
		expect(url.description).toBe(
			"We're happy to share that our website https://t.co/Msd34gULf5 is now fully bilingual: Java & #Kotlin 🚀 You will find snippets and examples in both languages side by side! Kotlin makes for a more concise and more elegant experience when writing your native modules & components."
		);
	});

	it('decodes quote, angle bracket and hex entities in the oEmbed html text', () => {
		const [url] = parseUrls([
			{
				url: 'https://reactnative.dev/blog',
				meta: { oembedTitle: 'React Native Blog', oembedHtml: '<p>&quot;New Architecture&quot; &lt;3 &#x1F680;</p>' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url.description).toBe('"New Architecture" <3 🚀');
	});

	it('uses the text of the whole oEmbed html when it has no paragraph', () => {
		const [url] = parseUrls([
			{
				url: 'https://reactnative.dev/blog',
				meta: { oembedTitle: 'React Native Blog', oembedHtml: '<div><b>Hello</b> world</div>' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url.description).toBe('Hello world');
	});

	it('keeps the author as description when the oEmbed html carries no text', () => {
		const [url] = parseUrls([
			{
				url: 'https://www.youtube.com/watch?v=0ckOUBiuxVY',
				meta: {
					oembedTitle: 'React Conf 2024 Day 2',
					oembedAuthorName: 'React Conf',
					oembedHtml:
						'<iframe style="max-width: 100%;width:400px;height:225px" width="200" height="113" src="https://www.youtube.com/embed/0ckOUBiuxVY?feature=oembed" frameborder="0" allowfullscreen title="React Conf 2024 Day 2"></iframe>'
				}
			}
		] as unknown as IUrlFromServer[]);
		expect(url).toMatchObject({ title: 'React Conf 2024 Day 2', description: 'React Conf' });
	});

	it('does not repeat the author as description when it is already the title', () => {
		const [url] = parseUrls([
			{
				url: 'https://x.com/reactnative/status/1578332414145105921',
				meta: { oembedAuthorName: 'React Native' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url).toMatchObject({ title: 'React Native', description: '' });
	});

	it('prefers og description over the oEmbed html text', () => {
		const [url] = parseUrls([
			{
				url: 'https://reactnative.dev',
				meta: { ogTitle: 'React Native', ogDescription: 'From og', oembedHtml: '<p>From oEmbed</p>' }
			}
		] as unknown as IUrlFromServer[]);
		expect(url.description).toBe('From og');
	});
});
