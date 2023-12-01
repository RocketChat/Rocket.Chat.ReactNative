import { IUrl, IUrlFromServer } from '../../../definitions';
import { buildImageURL } from './buildImageURL';

export default (urls: IUrlFromServer[]): IUrl[] =>
	urls
		.filter((url: IUrlFromServer) => url.meta && !url.ignoreParse)
		.map((url: IUrlFromServer, index) => {
			const tmp: IUrl = {} as any;
			const { meta } = url;
			tmp._id = index;
			tmp.title = meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle;
			tmp.description = meta.ogDescription || meta.twitterDescription || meta.description || meta.oembedAuthorName;
			let decodedOgImage;
			if (meta.ogImage) {
				decodedOgImage = meta.ogImage.replace(/&amp;/g, '&');
			}
			tmp.image = decodedOgImage || meta.twitterImage || meta.oembedThumbnailUrl;
			if (tmp.image) {
				if (tmp.image.indexOf('//') === 0) {
					// Remotion of parsedUrl from backend 6.5.0
					// https://github.com/RocketChat/Rocket.Chat/pull/30228/files#diff-8ecc318b8b5558571ba9388a01e4949a93aca12d03cfdd9c789aa7c00ab32cafL98-L114
					if (url.parsedUrl?.protocol) {
						tmp.image = `${url.parsedUrl.protocol}${tmp.image}`;
					} else {
						tmp.image = buildImageURL(url.url, tmp.image);
					}
				} else if (tmp.image.indexOf('/') === 0) {
					if (url.parsedUrl && url.parsedUrl?.host && url.parsedUrl?.protocol) {
						tmp.image = `${url.parsedUrl.protocol}//${url.parsedUrl.host}${tmp.image}`;
					} else {
						tmp.image = buildImageURL(url.url, tmp.image);
					}
				}
			}
			tmp.url = url.url;
			return tmp;
		});
