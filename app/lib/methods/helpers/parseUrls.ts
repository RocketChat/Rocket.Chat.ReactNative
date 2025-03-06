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
				tmp.image = buildImageURL(url.url, tmp.image);
			}
			tmp.url = url.url;
			return tmp;
		});
